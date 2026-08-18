import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bootstrapWorkspace } from "./eosBootstrap.js";
import { resolveWorkspaceWorkbench } from "./eosWorkbench.js";

const REGISTRY_VERSION = 1;
const STALE_REGISTRY_LOCK_MS = 5 * 60_000;

export function resolveWorkspaceRegistryFile() {
  return process.env.EOS_WORKSPACE_REGISTRY
    ? path.resolve(process.env.EOS_WORKSPACE_REGISTRY)
    : path.join(os.homedir(), ".experience-os", "workspaces.json");
}

function emptyRegistry() {
  return { version: REGISTRY_VERSION, updatedAt: null, workspaces: [] };
}

function registryId(workspace) {
  return `workspace.${createHash("sha256").update(workspace).digest("hex").slice(0, 24)}`;
}

function validateHosts(hosts) {
  const allowed = new Set(["codex", "claude", "cursor", "trae", "vscode"]);
  const unique = [...new Set(hosts || [])];
  if (unique.some((host) => !allowed.has(host))) throw new Error("包含不受支持的宿主");
  return unique;
}

function validateWorkspacePath(workspaceDir) {
  if (typeof workspaceDir !== "string" || !workspaceDir.trim()) {
    throw new Error("项目路径不能为空");
  }
  const workspace = path.resolve(workspaceDir);
  const home = os.homedir();
  const blocked = new Set([
    path.parse(workspace).root,
    home,
    path.join(home, "Desktop"),
    path.join(home, "Documents")
  ]);
  if (blocked.has(workspace)) {
    throw new Error("请选择具体项目目录，不能接入整个磁盘、主目录、桌面或文档目录");
  }
  return workspace;
}

export class WorkspaceRegistry {
  constructor(file = resolveWorkspaceRegistryFile()) {
    this.file = path.resolve(file);
    this.lockDir = `${this.file}.lock`;
  }

  async read() {
    try {
      const parsed = JSON.parse(await readFile(this.file, "utf8"));
      if (parsed?.version !== REGISTRY_VERSION || !Array.isArray(parsed.workspaces)) {
        throw new Error("工作区注册表版本或结构无效");
      }
      return parsed;
    } catch (error) {
      if (error.code === "ENOENT") return emptyRegistry();
      throw error;
    }
  }

  async withLock(action) {
    await mkdir(path.dirname(this.file), { recursive: true });
    const started = Date.now();
    while (true) {
      try {
        await mkdir(this.lockDir);
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const lockInfo = await stat(this.lockDir).catch(() => null);
        if (lockInfo && Date.now() - lockInfo.mtimeMs > STALE_REGISTRY_LOCK_MS) {
          await rm(this.lockDir, { recursive: true, force: true });
          continue;
        }
        if (Date.now() - started > 3_000) throw new Error("工作区注册表正在被另一个 EOS 进程更新");
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    try {
      return await action();
    } finally {
      await rm(this.lockDir, { recursive: true, force: true });
    }
  }

  async write(registry) {
    const next = {
      ...registry,
      version: REGISTRY_VERSION,
      updatedAt: new Date().toISOString()
    };
    const temp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temp, this.file);
    return next;
  }

  async list() {
    const registry = await this.read();
    const checked = [];
    for (const entry of registry.workspaces) {
      try {
        await stat(entry.workspace);
        const config = await resolveWorkspaceWorkbench({ workspaceDir: entry.workspace });
        checked.push({
          ...entry,
          projectId: config.projectId,
          vaultDir: config.vaultDir,
          status: "ready",
          lastCheckedAt: new Date().toISOString()
        });
      } catch (error) {
        checked.push({
          ...entry,
          status: "unavailable",
          statusReason: error.message,
          lastCheckedAt: new Date().toISOString()
        });
      }
    }
    return checked;
  }

  async connect({ workspaceDir, sourceHosts = [], consent, confirmWrites }) {
    if (consent !== true || confirmWrites !== true) {
      throw new Error("接入项目需要确认将创建或复用 .eos 工作区");
    }
    const workspace = validateWorkspacePath(workspaceDir);
    const info = await stat(workspace).catch(() => null);
    if (!info?.isDirectory()) throw new Error("项目目录不存在或不是文件夹");
    const hosts = validateHosts(sourceHosts);

    return this.withLock(async () => {
      let config;
      try {
        config = await resolveWorkspaceWorkbench({ workspaceDir: workspace });
      } catch (error) {
        if (!String(error.message).includes("EOS workspace not found")) throw error;
        const bootstrapped = await bootstrapWorkspace({ workspaceDir: workspace });
        config = {
          workspace: bootstrapped.workspace,
          vaultDir: bootstrapped.vaultDir,
          projectId: bootstrapped.projectId
        };
      }

      const registry = await this.read();
      const previous = registry.workspaces.find((item) => item.workspace === workspace);
      const now = new Date().toISOString();
      const entry = {
        id: registryId(workspace),
        workspace,
        name: path.basename(workspace),
        projectId: config.projectId,
        vaultDir: config.vaultDir,
        sourceHosts: [...new Set([...(previous?.sourceHosts || []), ...hosts])],
        status: "ready",
        monitoringStatus: "awaiting_host_event",
        addedAt: previous?.addedAt || now,
        updatedAt: now
      };
      registry.workspaces = [
        ...registry.workspaces.filter((item) => item.workspace !== workspace),
        entry
      ].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
      await this.write(registry);
      return entry;
    });
  }

  async disconnect({ workspaceDir, confirm }) {
    if (confirm !== true) {
      throw new Error("移除项目注册需要明确确认；项目中的 .eos 数据不会被删除");
    }
    const workspace = validateWorkspacePath(workspaceDir);
    return this.withLock(async () => {
      const registry = await this.read();
      const existing = registry.workspaces.find((item) => item.workspace === workspace);
      if (!existing) throw new Error("项目不在 EOS 工作区注册表中");
      registry.workspaces = registry.workspaces.filter((item) => item.workspace !== workspace);
      await this.write(registry);
      return {
        disconnected: existing,
        eosDataPreserved: true
      };
    });
  }
}
