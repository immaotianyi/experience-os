import { constants, existsSync } from "node:fs";
import { access, readFile, realpath, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const home = os.homedir();

export function hostMetadataLocations({
  platform = process.platform,
  homeDir = os.homedir(),
  env = process.env
} = {}) {
  const locations = {
    codex: [path.join(homeDir, ".codex", ".codex-global-state.json")],
    claude: [path.join(homeDir, ".claude.json")],
    cursor: [],
    trae: [],
    vscode: []
  };

  if (platform === "darwin") {
    const appSupport = path.join(homeDir, "Library", "Application Support");
    locations.cursor.push(path.join(appSupport, "Cursor", "User", "globalStorage", "storage.json"));
    locations.trae.push(
      path.join(appSupport, "Trae", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "Trae CN", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "TRAE SOLO", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "TRAE SOLO CN", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "TRAE Work", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "TRAE Work CN", "User", "globalStorage", "storage.json")
    );
    locations.vscode.push(
      path.join(appSupport, "Code", "User", "globalStorage", "storage.json"),
      path.join(appSupport, "Code - Insiders", "User", "globalStorage", "storage.json")
    );
  } else if (platform === "win32") {
    const appData = env.APPDATA || path.win32.join(homeDir, "AppData", "Roaming");
    locations.cursor.push(path.win32.join(appData, "Cursor", "User", "globalStorage", "storage.json"));
    locations.trae.push(
      path.win32.join(appData, "Trae", "User", "globalStorage", "storage.json"),
      path.win32.join(appData, "Trae CN", "User", "globalStorage", "storage.json")
    );
    locations.vscode.push(
      path.win32.join(appData, "Code", "User", "globalStorage", "storage.json"),
      path.win32.join(appData, "Code - Insiders", "User", "globalStorage", "storage.json")
    );
  } else {
    const configHome = env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
    locations.cursor.push(path.join(configHome, "Cursor", "User", "globalStorage", "storage.json"));
    locations.trae.push(
      path.join(configHome, "Trae", "User", "globalStorage", "storage.json"),
      path.join(configHome, "Trae CN", "User", "globalStorage", "storage.json")
    );
    locations.vscode.push(
      path.join(configHome, "Code", "User", "globalStorage", "storage.json"),
      path.join(configHome, "Code - Insiders", "User", "globalStorage", "storage.json")
    );
  }

  return locations;
}

export const DEFAULT_HOST_METADATA = Object.freeze(hostMetadataLocations());

const VALID_HOSTS = new Set(Object.keys(DEFAULT_HOST_METADATA));
const PROJECT_MARKERS = [
  ".eos/project.json",
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle"
];

async function readBoundedJson(file) {
  try {
    const info = await stat(file);
    if (!info.isFile()) return { status: "not_file", data: null };
    if (info.size > 8 * 1024 * 1024) {
      return { status: "too_large", data: null, size: info.size };
    }
    try {
      return {
        status: "read",
        data: JSON.parse(await readFile(file, "utf8")),
        size: info.size,
        modifiedAt: info.mtime.toISOString()
      };
    } catch (error) {
      return { status: error instanceof SyntaxError ? "invalid_json" : "unreadable", data: null };
    }
  } catch (error) {
    return { status: error.code === "ENOENT" ? "missing" : "unreadable", data: null };
  }
}

function pathFromUri(value) {
  if (typeof value !== "string") return null;
  if (value.startsWith("file://")) {
    try { return fileURLToPath(value); } catch { return null; }
  }
  return path.isAbsolute(value) ? value : null;
}

function vscodeLikePaths(data) {
  const backupFolders = Array.isArray(data?.backupWorkspaces?.folders)
    ? data.backupWorkspaces.folders
    : [];
  const openedWindows = Array.isArray(data?.windowsState?.openedWindows)
    ? data.windowsState.openedWindows
    : [];
  const values = [
    ...Object.keys(
      data?.profileAssociations?.workspaces
      && typeof data.profileAssociations.workspaces === "object"
      && !Array.isArray(data.profileAssociations.workspaces)
        ? data.profileAssociations.workspaces
        : {}
    ),
    ...backupFolders,
    ...(openedWindows.flatMap((item) => [
      item?.folderUri,
      item?.workspace?.configPath
    ]))
  ];
  return values.map(pathFromUri).filter(Boolean);
}

function codexPaths(data) {
  const savedRoots = Array.isArray(data?.["electron-saved-workspace-roots"])
    ? data["electron-saved-workspace-roots"]
    : [];
  const activeRoots = Array.isArray(data?.["active-workspace-roots"])
    ? data["active-workspace-roots"]
    : [];
  const threadHints = data?.["thread-workspace-root-hints"]
    && typeof data["thread-workspace-root-hints"] === "object"
    && !Array.isArray(data["thread-workspace-root-hints"])
      ? Object.values(data["thread-workspace-root-hints"])
      : [];
  const localProjects = data?.["local-projects"]
    && typeof data["local-projects"] === "object"
    && !Array.isArray(data["local-projects"])
      ? Object.values(data["local-projects"])
      : [];
  const values = [
    ...savedRoots,
    ...activeRoots,
    ...threadHints,
    ...localProjects.flatMap((item) => Array.isArray(item?.rootPaths) ? item.rootPaths : [])
  ];
  return values.map(pathFromUri).filter(Boolean);
}

function claudePaths(data) {
  const projects = data?.projects && typeof data.projects === "object" && !Array.isArray(data.projects)
    ? data.projects
    : {};
  return Object.keys(projects).map(pathFromUri).filter(Boolean);
}

function isBroadRoot(candidate) {
  const resolved = path.resolve(candidate);
  return [
    home,
    path.join(home, "Desktop"),
    path.join(home, "Documents"),
    path.parse(resolved).root
  ].includes(resolved);
}

function projectIdFor(workspacePath) {
  return `discovered.${createHash("sha256").update(workspacePath).digest("hex").slice(0, 20)}`;
}

async function inspectCandidate(workspacePath) {
  let canonicalPath;
  let info;
  try {
    canonicalPath = await realpath(workspacePath);
    info = await stat(canonicalPath);
    if (!info.isDirectory() || isBroadRoot(canonicalPath)) return null;
  } catch {
    return null;
  }
  const markers = PROJECT_MARKERS.filter((marker) => existsSync(path.join(canonicalPath, marker)));
  const writable = await access(canonicalPath, constants.W_OK).then(() => true).catch(() => false);
  const confidence = markers.includes(".eos/project.json") || markers.includes(".git")
    ? "high"
    : markers.length > 0
      ? "medium"
      : "low";
  return {
    id: projectIdFor(canonicalPath),
    path: canonicalPath,
    name: path.basename(canonicalPath),
    markers,
    confidence,
    writable,
    lastModifiedAt: info.mtime.toISOString(),
    alreadyBootstrapped: markers.includes(".eos/project.json")
  };
}

export async function discoverHostProjects({
  consent,
  hosts,
  metadataFiles = DEFAULT_HOST_METADATA,
  currentWorkspace = null,
  limit = 120
} = {}) {
  if (consent !== true) throw new Error("项目发现需要用户明确授权");
  const selectedHosts = [...new Set(hosts || [])];
  if (!selectedHosts.length || selectedHosts.some((host) => !VALID_HOSTS.has(host))) {
    throw new Error("请选择至少一个受支持的 AI 宿主");
  }

  const raw = [];
  const metadataDiagnostics = [];
  const hostDiagnostics = Object.fromEntries(selectedHosts.map((host) => [host, {
    attemptedSources: 0,
    readableSources: 0,
    extractedPaths: 0,
    acceptedProjects: 0
  }]));
  for (const host of selectedHosts) {
    const files = metadataFiles[host] || [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const readResult = await readBoundedJson(file);
      hostDiagnostics[host].attemptedSources += 1;
      const diagnostic = {
        host,
        sourceId: `${host}.${index + 1}`,
        fileName: path.basename(file),
        status: readResult.status,
        size: readResult.size ?? null,
        modifiedAt: readResult.modifiedAt ?? null,
        extractedPathCount: 0
      };
      metadataDiagnostics.push(diagnostic);
      if (!readResult.data) continue;
      hostDiagnostics[host].readableSources += 1;
      const data = readResult.data;
      const paths = host === "claude"
        ? claudePaths(data)
        : host === "codex"
          ? codexPaths(data)
          : vscodeLikePaths(data);
      diagnostic.extractedPathCount = paths.length;
      hostDiagnostics[host].extractedPaths += paths.length;
      for (const workspacePath of paths) {
        raw.push({ host, workspacePath, evidence: diagnostic.sourceId });
      }
    }
  }
  if (currentWorkspace) {
    raw.push({ host: "eos", workspacePath: currentWorkspace, evidence: "current_workspace" });
  }

  const merged = new Map();
  for (const item of raw) {
    const inspected = await inspectCandidate(item.workspacePath);
    if (!inspected) continue;
    if (merged.size >= Math.max(1, Math.min(Number(limit) || 120, 500)) && !merged.has(inspected.path)) continue;
    const existing = merged.get(inspected.path) || {
      ...inspected,
      sourceHosts: [],
      evidence: []
    };
    if (!existing.sourceHosts.includes(item.host)) existing.sourceHosts.push(item.host);
    if (!existing.evidence.includes(item.evidence)) existing.evidence.push(item.evidence);
    merged.set(inspected.path, existing);
  }

  const projects = [...merged.values()].sort((a, b) => {
    if (a.alreadyBootstrapped !== b.alreadyBootstrapped) return a.alreadyBootstrapped ? -1 : 1;
    if (a.sourceHosts.length !== b.sourceHosts.length) return b.sourceHosts.length - a.sourceHosts.length;
    return a.name.localeCompare(b.name, "zh-CN");
  });
  for (const host of selectedHosts) {
    hostDiagnostics[host].acceptedProjects = projects.filter((project) =>
      project.sourceHosts.includes(host)
    ).length;
  }
  return {
    consented: true,
    selectedHosts,
    scannedMetadataFiles: metadataDiagnostics.filter((item) => item.status === "read").length,
    attemptedMetadataFiles: metadataDiagnostics.length,
    metadataDiagnostics,
    hostDiagnostics,
    count: projects.length,
    projects
  };
}

export async function inspectManualProject(workspacePath) {
  if (typeof workspacePath !== "string" || !path.isAbsolute(workspacePath)) {
    throw new Error("项目路径必须是绝对路径");
  }
  const candidate = await inspectCandidate(workspacePath);
  if (!candidate) throw new Error("项目目录不存在，或路径范围过于宽泛");
  return { ...candidate, sourceHosts: [], evidence: ["manual"] };
}
