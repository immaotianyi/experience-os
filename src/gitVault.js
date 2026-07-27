/**
 * GitVault — wraps Vault with automatic Git version control.
 *
 * Every save() triggers a git add + commit. Provides history() and revert()
 * for tracking and rolling back asset changes.
 *
 * Design decisions:
 * - Uses child_process.execFileSync to call git directly — no JS git dependency.
 * - Falls back gracefully if git is not installed (autoCommit disabled).
 * - Commit messages are structured: "[<kind>] <op>: <id>".
 * - .gitignore excludes vault-archive/ and any non-json temp files.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile, access, rm, stat, rename } from "node:fs/promises";
import path from "node:path";
import { Vault } from "./vault.js";

const GIT_BIN = "git";
const WRITE_LOCK_NAME = ".eos-write-lock";
const LOCK_WAIT_MS = 25;
const LOCK_TIMEOUT_MS = 15_000;
const STALE_LOCK_MS = 120_000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function git(args, cwd) {
  try {
    const output = execFileSync(GIT_BIN, args, {
      cwd,
      encoding: "utf8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"]
    });
    return output.trim();
  } catch (error) {
    if (error.status === 127 || /not found|command not found|ENOENT/i.test(error.message)) {
      throw new Error("git is not installed or not in PATH");
    }
    throw error;
  }
}

function gitAvailable(cwd) {
  try {
    execFileSync(GIT_BIN, ["--version"], { encoding: "utf8", timeout: 3000, stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

export class GitVault {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.vault = new Vault(rootDir);
    this.gitEnabled = false;
    this.writeLockDepth = 0;
    this.transaction = null;
  }

  async init() {
    return this.withWriteLock(async () => {
      await this.vault.init();

      if (!gitAvailable()) {
        console.warn("[GitVault] git not found — running in no-version-control mode");
        return;
      }

      const gitDir = path.join(this.rootDir, ".git");
      try {
        await access(gitDir);
        this.gitEnabled = true;
      } catch {
        // .git doesn't exist — initialize
        git(["init"], this.rootDir);

        // Write .gitignore
        const gitignorePath = path.join(this.rootDir, ".gitignore");
        await writeFile(
          gitignorePath,
          ["# Vault archive — not version controlled", "vault-archive/", "", "# OS files", ".DS_Store", "*.tmp", "*.log", `${WRITE_LOCK_NAME}/`, ""].join("\n"),
          "utf8"
        );

        // Set default git identity if not configured
        try {
          git(["config", "user.name"], this.rootDir);
        } catch {
          git(["config", "user.name", "Experience OS"], this.rootDir);
        }
        try {
          git(["config", "user.email"], this.rootDir);
        } catch {
          git(["config", "user.email", "system@experience-os.local"], this.rootDir);
        }

        // Initial commit
        git(["add", "-A"], this.rootDir);
        try {
          git(["commit", "-m", "Vault initialized"], this.rootDir);
        } catch {
          // Nothing to commit — empty vault
        }

        this.gitEnabled = true;
        console.log("[GitVault] Git repository initialized at", this.rootDir);
      }
    });
  }

  async withWriteLock(work, { timeoutMs = LOCK_TIMEOUT_MS } = {}) {
    if (typeof work !== "function") throw new Error("withWriteLock requires a function");
    if (this.writeLockDepth > 0) {
      this.writeLockDepth += 1;
      try {
        return await work();
      } finally {
        this.writeLockDepth -= 1;
      }
    }

    await mkdir(this.rootDir, { recursive: true });
    const lockDir = path.join(this.rootDir, WRITE_LOCK_NAME);
    const deadline = Date.now() + timeoutMs;
    while (true) {
      try {
        await mkdir(lockDir);
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        try {
          const lockStats = await stat(lockDir);
          if (Date.now() - lockStats.mtimeMs > STALE_LOCK_MS) {
            await rm(lockDir, { recursive: true, force: true });
            continue;
          }
        } catch (statError) {
          if (statError.code !== "ENOENT") throw statError;
          continue;
        }
        if (Date.now() >= deadline) {
          throw new Error(`Vault is busy: another writer holds ${WRITE_LOCK_NAME}`);
        }
        await delay(LOCK_WAIT_MS);
      }
    }

    this.writeLockDepth = 1;
    try {
      return await work();
    } finally {
      this.writeLockDepth = 0;
      await rm(lockDir, { recursive: true, force: true });
    }
  }

  async save(record) {
    return this.withWriteLock(() => this.saveUnlocked(record));
  }

  async saveUnlocked(record) {
    const filePath = this.vault.fileFor(record);
    if (this.transaction) {
      await this.snapshotTransactionFile(filePath);
      const savedPath = await this.vault.save(record);
      this.transaction.changedPaths.add(savedPath);
      return savedPath;
    }

    const savedPath = await this.vault.save(record);

    if (this.gitEnabled) {
      const relPath = path.relative(this.rootDir, savedPath);
      const op = record.createdAt === record.updatedAt ? "create" : "update";
      const message = `[${record.kind}] ${op}: ${record.id}`;
      try {
        git(["add", relPath], this.rootDir);
        git(["commit", "--no-gpg-sign", "-m", message], this.rootDir);
      } catch {
        // Commit may fail if nothing changed — that's fine
      }
    }

    return savedPath;
  }

  /**
   * Run a multi-record change under the existing cross-process write lock.
   * Files are snapshotted before their first mutation; a failed callback restores
   * them and leaves no Git commit. A successful callback becomes one commit.
   */
  async withTransaction(work, { message = "[Vault] transaction" } = {}) {
    if (typeof work !== "function") throw new Error("withTransaction requires a function");
    if (this.transaction) return work();

    return this.withWriteLock(async () => {
      this.transaction = { snapshots: new Map(), changedPaths: new Set() };
      try {
        const result = await work();
        await this.commitTransaction(message);
        return result;
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      } finally {
        this.transaction = null;
      }
    });
  }

  async snapshotTransactionFile(filePath) {
    if (this.transaction.snapshots.has(filePath)) return;
    try {
      this.transaction.snapshots.set(filePath, await readFile(filePath));
    } catch (error) {
      if (error.code === "ENOENT") {
        this.transaction.snapshots.set(filePath, null);
        return;
      }
      throw error;
    }
  }

  async rollbackTransaction() {
    const snapshots = [...this.transaction.snapshots.entries()].reverse();
    for (const [filePath, original] of snapshots) {
      if (original === null) {
        await rm(filePath, { force: true });
        continue;
      }
      await mkdir(path.dirname(filePath), { recursive: true });
      const tempPath = `${filePath}.rollback-${process.pid}-${Date.now()}`;
      await writeFile(tempPath, original);
      await rename(tempPath, filePath);
    }
  }

  async commitTransaction(message) {
    if (!this.gitEnabled || this.transaction.changedPaths.size === 0) return;
    const relPaths = [...this.transaction.changedPaths]
      .map((filePath) => path.relative(this.rootDir, filePath));
    try {
      git(["add", ...relPaths], this.rootDir);
      git(["commit", "--no-gpg-sign", "-m", message], this.rootDir);
    } catch (error) {
      // Only ignore "nothing to commit" (exit code 1 with that message); other errors are real
      const msg = String(error?.stderr || error?.message || "");
      if (/nothing to commit|no changes added to commit|nothing added to commit/i.test(msg)) {
        return; // Expected when transaction content is identical to HEAD
      }
      // Real git errors should not be silently swallowed
      console.error(`[GitVault] commit failed: ${msg}`);
    }
  }

  async load(kind, id) {
    return this.vault.load(kind, id);
  }

  async list(kind, options) {
    return this.vault.list(kind, options);
  }

  async listAll() {
    return this.vault.listAll();
  }

  async search(options) {
    return this.vault.search(options);
  }

  fileFor(record) {
    return this.vault.fileFor(record);
  }

  /**
   * Get commit history for a specific record.
   * Returns array of { hash, date, message, author } sorted newest first.
   */
  history(recordId) {
    if (!this.gitEnabled) return [];

    const dir = this.findCollectionDir(recordId);
    if (!dir) return [];

    const filePath = path.join(this.rootDir, dir, `${recordId}.json`);
    const relPath = path.relative(this.rootDir, filePath);

    try {
      const log = git(
        ["log", '--format=%H|%cI|%s|%cN', "--follow", "--", relPath],
        this.rootDir
      );
      if (!log) return [];

      return log
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, date, message, author] = line.split("|");
          return { hash, date, message, author };
        });
    } catch {
      return [];
    }
  }

  /**
   * Get the content of a record at a specific commit.
   */
  async loadAtCommit(recordId, commitHash) {
    if (!this.gitEnabled) return null;

    const dir = this.findCollectionDir(recordId);
    if (!dir) return null;

    const relPath = path.relative(this.rootDir, path.join(this.rootDir, dir, `${recordId}.json`));

    try {
      const content = git(["show", `${commitHash}:${relPath}`], this.rootDir);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Revert a record to its state at a specific commit.
   * Creates a new commit that restores the old content.
   */
  async revert(recordId, commitHash) {
    return this.withWriteLock(async () => {
      if (!this.gitEnabled) {
        throw new Error("Git is not enabled — cannot revert");
      }

      const oldRecord = await this.loadAtCommit(recordId, commitHash);
      if (!oldRecord) {
        throw new Error(`Record ${recordId} not found at commit ${commitHash}`);
      }

      // Save the old content back through vault, then create one explicit revert commit.
      await this.vault.save(oldRecord);

      const dir = this.findCollectionDir(recordId);
      const relPath = path.relative(this.rootDir, path.join(this.rootDir, dir, `${recordId}.json`));
      git(["add", relPath], this.rootDir);
      git(["commit", "--no-gpg-sign", "-m", `[${oldRecord.kind}] revert: ${recordId} -> ${commitHash.slice(0, 8)}`], this.rootDir);

      return oldRecord;
    });
  }

  /**
   * Get overall vault stats: total commits, last commit date, dirty status.
   */
  stats() {
    if (!this.gitEnabled) {
      return { enabled: false, totalCommits: 0, lastCommit: null, dirty: false };
    }

    let totalCommits = 0;
    let lastCommit = null;
    let dirty = false;

    try {
      const count = git(["rev-list", "--count", "HEAD"], this.rootDir);
      totalCommits = parseInt(count, 10) || 0;
    } catch {
      // No commits yet
    }

    try {
      lastCommit = git(["log", "-1", '--format=%cI|%s'], this.rootDir);
    } catch {
      // No commits
    }

    try {
      const status = git(["status", "--porcelain"], this.rootDir);
      dirty = status.length > 0;
    } catch {
      // ignore
    }

    return { enabled: true, totalCommits, lastCommit, dirty };
  }

  async commitAll(message) {
    return this.withWriteLock(async () => {
      if (!this.gitEnabled) return false;
      try {
        git(["add", "-A"], this.rootDir);
        git(["commit", "--no-gpg-sign", "-m", message], this.rootDir);
        return true;
      } catch {
        return false;
      }
    });
  }

  findCollectionDir(recordId) {
    // Search all collection dirs for the file
    const dirs = Object.values(COLLECTION_DIRS);
    // We can't easily do synchronous file exists across dirs,
    // so we return the first match. In practice, record IDs are unique.
    // For history(), git --follow handles the path resolution.
    // This is a best-effort approach — callers should provide the kind if known.
    return dirs[0]; // placeholder — overridden below
  }
}

// Build a mapping from record ID prefix to collection directory
const COLLECTION_DIRS = {
  Project: "projects",
  ConversationEvent: "events",
  ThoughtFragment: "thoughts",
  Artifact: "artifacts",
  Rule: "rules",
  Skill: "skills",
  WallHit: "wallhits",
  HumanEditLog: "human-edit-logs",
  SubgoalSegment: "subgoal-segments",
  WorkflowPattern: "workflow-patterns",
  PreferenceHypothesis: "preference-hypotheses",
  ReflectionMemory: "reflection-memories",
  MotherSkillTrajectory: "mother-skill-trajectories",
  ReuseContext: "reuse-contexts",
  SelfIterationRun: "self-iteration-runs",
  ReviewPacket: "review-packets",
  ReviewDecision: "review-decisions",
  MarketplaceListing: "marketplace-listings",
  Transaction: "transactions",
  SkillRating: "skill-ratings",
  EvidenceLink: "evidence-links",
  ExperienceReceipt: "experience-receipts",
  ExperienceReceiptDraft: "experience-receipt-drafts",
  DecisionReceipt: "decision-receipts",
  OutcomeRecord: "outcome-records",
  ExperienceAsset: "experience-assets",
  ExperienceReuseTrial: "experience-reuse-trials",
  BetaFeedback: "beta-feedback",
  WorkCheckpoint: "work-checkpoints"
};

// Override findCollectionDir to use ID prefix matching
GitVault.prototype.findCollectionDir = function (recordId) {
  const id = String(recordId);
  // IDs from older review flows and newer DecisionReceipts can both begin
  // with `decision.`. Prefer the real on-disk record over prefix heuristics.
  for (const dir of Object.values(COLLECTION_DIRS)) {
    if (existsSync(path.join(this.rootDir, dir, `${id}.json`))) return dir;
  }
  for (const [kind, dir] of Object.entries(COLLECTION_DIRS)) {
    const prefix = kind.toLowerCase() + ".";
    if (id.startsWith(prefix) || id.startsWith(kind.toLowerCase())) {
      return dir;
    }
  }
  // Fallback: try common ID patterns
  if (id.startsWith("skill.")) return "skills";
  if (id.startsWith("wallhit.")) return "wallhits";
  if (id.startsWith("rule.")) return "rules";
  if (id.startsWith("thought.")) return "thoughts";
  if (id.startsWith("reflection.")) return "reflection-memories";
  if (id.startsWith("artifact.")) return "artifacts";
  if (id.startsWith("event.")) return "events";
  if (id.startsWith("evidence.")) return "evidence-links";
  if (id.startsWith("receipt.")) return "experience-receipts";
  if (id.startsWith("receipt_draft.")) return "experience-receipt-drafts";
  if (id.startsWith("decision.")) return "review-decisions";
  if (id.startsWith("outcome.")) return "outcome-records";
  if (id.startsWith("experience_asset.")) return "experience-assets";
  if (id.startsWith("checkpoint.")) return "work-checkpoints";
  if (id.startsWith("edit.")) return "human-edit-logs";
  if (id.startsWith("subgoal.")) return "subgoal-segments";
  if (id.startsWith("workflow.")) return "workflow-patterns";
  if (id.startsWith("pref.")) return "preference-hypotheses";
  if (id.startsWith("trajectory.")) return "mother-skill-trajectories";
  if (id.startsWith("reuse.")) return "reuse-contexts";
  if (id.startsWith("self_iteration.")) return "self-iteration-runs";
  if (id.startsWith("review_packet.")) return "review-packets";
  if (id.startsWith("review_decision.")) return "review-decisions";
  // Legacy aliases for backward compatibility with older records
  if (id.startsWith("review.")) return "review-packets";
  if (id.startsWith("decision.")) return "review-decisions";
  if (id.startsWith("marketplace_listing.")) return "marketplace-listings";
  if (id.startsWith("transaction.")) return "transactions";
  if (id.startsWith("rating.")) return "skill-ratings";
  if (id.startsWith("project.")) return "projects";
  return null;
};
