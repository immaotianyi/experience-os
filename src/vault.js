import { mkdir, writeFile, readFile, readdir, rename } from "node:fs/promises";
import path from "node:path";

const COLLECTION_DIR = Object.freeze({
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
  WorkCheckpoint: "work-checkpoints"
});

const KIND_BY_COLLECTION = Object.fromEntries(
  Object.entries(COLLECTION_DIR).map(([kind, dir]) => [dir, kind])
);

// ID format whitelist — prevents path traversal (../, /, \, null bytes)
const SAFE_ID_RE = /^[a-zA-Z0-9._\-]+$/;

function validateId(id) {
  if (typeof id !== "string" || id.length === 0 || id.length > 512) {
    throw new Error(`Invalid record id: must be a non-empty string (max 512 chars)`);
  }
  if (!SAFE_ID_RE.test(id)) {
    throw new Error(`Invalid record id: contains forbidden characters (only [a-zA-Z0-9._-] allowed): ${id.slice(0, 40)}`);
  }
  if (id.includes("..")) {
    throw new Error(`Invalid record id: path traversal sequence detected: ${id.slice(0, 40)}`);
  }
}

export class Vault {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  async init() {
    await mkdir(this.rootDir, { recursive: true });
    await Promise.all(
      Object.values(COLLECTION_DIR).map((dir) => mkdir(path.join(this.rootDir, dir), { recursive: true }))
    );
  }

  fileFor(record) {
    const dir = COLLECTION_DIR[record.kind];
    if (!dir) throw new Error(`Unsupported record kind: ${record.kind}`);
    validateId(record.id);
    return path.join(this.rootDir, dir, `${record.id}.json`);
  }

  async save(record) {
    const filePath = this.fileFor(record);
    // Ensure the collection directory exists (atomic write still holds)
    await mkdir(path.dirname(filePath), { recursive: true });
    // Atomic write: write to .tmp then rename (POSIX rename is atomic)
    const tmpPath = filePath + ".tmp";
    await writeFile(tmpPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rename(tmpPath, filePath);
    return filePath;
  }

  async load(kind, id) {
    const dir = COLLECTION_DIR[kind];
    if (!dir) throw new Error(`Unsupported record kind: ${kind}`);
    validateId(id);
    const filePath = path.join(this.rootDir, dir, `${id}.json`);
    let content;
    try {
      content = await readFile(filePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Corrupt record file at ${filePath}: ${error.message}`);
    }
  }

  async list(kind, options = {}) {
    const dir = COLLECTION_DIR[kind];
    if (!dir) throw new Error(`Unsupported record kind: ${kind}`);
    const folder = path.join(this.rootDir, dir);
    const files = await readdir(folder).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const records = [];
    const skipped = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(folder, file);
      try {
        const content = await readFile(filePath, "utf8");
        records.push(JSON.parse(content));
      } catch (error) {
        // A single corrupt/unreadable file must not poison the whole collection.
        skipped.push({ file, error: error.code || error.name });
      }
    }
    if (options.collectSkipped) {
      return { records, skipped };
    }
    if (skipped.length > 0) {
      console.warn(`[Vault] ${skipped.length} corrupt/unreadable file(s) skipped in ${dir}`);
    }
    return records;
  }

  async listAll() {
    const collections = Object.values(COLLECTION_DIR);
    const records = [];
    for (const dir of collections) {
      const kind = KIND_BY_COLLECTION[dir];
      records.push(...(await this.list(kind)));
    }
    return records;
  }

  async search({ query, kinds = null, limit = 10 }) {
    const terms = tokenize(query);
    const validKinds = kinds ? kinds.filter((k) => COLLECTION_DIR[k]) : null;
    const records = validKinds
      ? (await Promise.all(validKinds.map((kind) => this.list(kind)))).flat()
      : await this.listAll();

    return records
      .map((record) => ({ record, score: scoreRecord(record, terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.record.id).localeCompare(String(b.record.id)))
      .slice(0, limit);
  }
}

function tokenize(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/g)
    .map((term) => term.trim())
    .filter(Boolean);
}

function scoreRecord(record, terms) {
  const text = JSON.stringify(record).toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}
