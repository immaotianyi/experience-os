import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const STORE_VERSION = 1;
const SCOPE_VERSION = 1;
const MAX_RUNS = 20;
const STALE_LOCK_MS = 5 * 60_000;

export function resolveHostDiscoveryFile() {
  return process.env.EOS_DISCOVERY_STORE
    ? path.resolve(process.env.EOS_DISCOVERY_STORE)
    : path.join(os.homedir(), ".experience-os", "host-discovery.json");
}

function emptyStore() {
  return {
    version: STORE_VERSION,
    updatedAt: null,
    grant: null,
    runs: []
  };
}

function fingerprintProject(project) {
  return createHash("sha256")
    .update(JSON.stringify({
      path: project.path,
      sourceHosts: [...(project.sourceHosts || [])].sort(),
      markers: [...(project.markers || [])].sort(),
      writable: project.writable,
      alreadyBootstrapped: project.alreadyBootstrapped
    }))
    .digest("hex")
    .slice(0, 24);
}

function compactProject(project) {
  return {
    id: project.id,
    path: project.path,
    name: project.name,
    sourceHosts: [...new Set(project.sourceHosts || [])],
    markers: [...new Set(project.markers || [])],
    confidence: project.confidence,
    writable: Boolean(project.writable),
    alreadyBootstrapped: Boolean(project.alreadyBootstrapped),
    lastModifiedAt: project.lastModifiedAt ?? null,
    fingerprint: fingerprintProject(project)
  };
}

function deltaBetween(previousProjects, nextProjects) {
  const previous = new Map((previousProjects || []).map((project) => [project.id, project]));
  const next = new Map(nextProjects.map((project) => [project.id, project]));
  const addedProjectIds = [];
  const removedProjectIds = [];
  const changedProjectIds = [];
  let unchangedCount = 0;

  for (const [id, project] of next) {
    const old = previous.get(id);
    if (!old) addedProjectIds.push(id);
    else if (old.fingerprint !== project.fingerprint) changedProjectIds.push(id);
    else unchangedCount += 1;
  }
  for (const id of previous.keys()) {
    if (!next.has(id)) removedProjectIds.push(id);
  }

  return {
    addedProjectIds,
    removedProjectIds,
    changedProjectIds,
    unchangedCount
  };
}

export function buildDiscoveryDigest({ selectedHosts, projects, delta, hostDiagnostics }) {
  const installedHosts = selectedHosts.join(", ") || "none";
  const readableSources = Object.values(hostDiagnostics || {})
    .reduce((sum, item) => sum + (item.readableSources || 0), 0);
  return [
    `hosts=${installedHosts}`,
    `projects=${projects.length}`,
    `delta=+${delta.addedProjectIds.length}/-${delta.removedProjectIds.length}/~${delta.changedProjectIds.length}`,
    `metadataSources=${readableSources}`,
    `bootstrapped=${projects.filter((project) => project.alreadyBootstrapped).length}`,
    `writable=${projects.filter((project) => project.writable).length}`
  ].join("; ");
}

export class HostDiscoveryStore {
  constructor(file = resolveHostDiscoveryFile()) {
    this.file = path.resolve(file);
    this.lockDir = `${this.file}.lock`;
  }

  async read() {
    try {
      const value = JSON.parse(await readFile(this.file, "utf8"));
      if (value?.version !== STORE_VERSION || !Array.isArray(value.runs)) {
        throw new Error("宿主发现记录版本或结构无效");
      }
      return value;
    } catch (error) {
      if (error.code === "ENOENT") return emptyStore();
      throw error;
    }
  }

  async withLock(action) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const deadline = Date.now() + 3_000;
    while (true) {
      try {
        await mkdir(this.lockDir);
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const lockInfo = await stat(this.lockDir).catch(() => null);
        if (lockInfo && Date.now() - lockInfo.mtimeMs > STALE_LOCK_MS) {
          await rm(this.lockDir, { recursive: true, force: true });
          continue;
        }
        if (Date.now() >= deadline) throw new Error("宿主发现记录正在被另一个 EOS 进程更新");
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    try {
      return await action();
    } finally {
      await rm(this.lockDir, { recursive: true, force: true });
    }
  }

  async write(store) {
    const next = { ...store, version: STORE_VERSION, updatedAt: new Date().toISOString() };
    const temp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temp, this.file);
    return next;
  }

  async recordScan({ consent, selectedHosts, hostResults = {}, discovery }) {
    if (consent !== true) throw new Error("保存扫描结果需要用户明确授权");
    if (!Array.isArray(selectedHosts) || selectedHosts.length === 0) {
      throw new Error("扫描结果必须包含至少一个宿主");
    }
    if (!discovery || !Array.isArray(discovery.projects)) {
      throw new Error("扫描结果结构无效");
    }

    return this.withLock(async () => {
      const store = await this.read();
      const projects = discovery.projects.map(compactProject);
      const delta = deltaBetween(store.runs[0]?.projects || [], projects);
      const now = new Date().toISOString();
      const run = {
        id: `host_scan.${Date.now()}.${randomBytes(4).toString("hex")}`,
        status: "completed",
        selectedHosts: [...new Set(selectedHosts)],
        startedAt: now,
        completedAt: now,
        hostResults,
        hostDiagnostics: discovery.hostDiagnostics || {},
        metadataDiagnostics: (discovery.metadataDiagnostics || []).map((item) => ({
          host: item.host,
          sourceId: item.sourceId,
          fileName: item.fileName,
          status: item.status,
          extractedPathCount: item.extractedPathCount
        })),
        projects,
        delta,
        digest: buildDiscoveryDigest({
          selectedHosts,
          projects,
          delta,
          hostDiagnostics: discovery.hostDiagnostics
        })
      };
      store.grant = {
        active: true,
        scopeVersion: SCOPE_VERSION,
        allowedHosts: run.selectedHosts,
        allowedData: ["host_installation", "host_version", "project_path_index", "project_markers"],
        excludedData: ["chat_content", "source_content", "project_file_content", "credentials"],
        grantedAt: store.grant?.grantedAt || now,
        updatedAt: now,
        revokedAt: null
      };
      store.runs = [run, ...store.runs].slice(0, MAX_RUNS);
      await this.write(store);
      return run;
    });
  }

  async summary() {
    const store = await this.read();
    return {
      grant: store.grant,
      latestRun: store.runs[0] || null,
      history: store.runs.map((run) => ({
        id: run.id,
        completedAt: run.completedAt,
        selectedHosts: run.selectedHosts,
        projectCount: run.projects.length,
        delta: run.delta,
        digest: run.digest
      }))
    };
  }

  async revoke({ confirm }) {
    if (confirm !== true) throw new Error("撤销扫描授权需要明确确认");
    return this.withLock(async () => {
      const store = await this.read();
      const now = new Date().toISOString();
      store.grant = {
        ...(store.grant || {}),
        active: false,
        allowedHosts: [],
        updatedAt: now,
        revokedAt: now
      };
      await this.write(store);
      return store.grant;
    });
  }
}
