/**
 * JS/TS Dependency Parser — 零依赖启发式 import 图扫描器。
 *
 * 职责：把一个 JS/TS 项目目录解析成 CodeGraph 快照（文件节点 + import 边），
 * 交给 eosCodeGraphAdapter 的模式提取（hub/hotspot/cycle/leaf/bridge）与 blast radius。
 *
 * 明确边界（v1 限制，均为有意取舍）：
 *   1. 不做完整 AST —— 用注释剥离 + 正则提取 import/export from/require/dynamic import。
 *      对常规 ESM/CJS/TS 源码准确；极端字符串技巧可能漏报，但不会误连边。
 *   2. 不解析 tsconfig paths / webpack alias —— 相对路径与包名之外的裸说明符按外部包处理。
 *   3. node: 内建模块默认排除（不可操作），仅在 metadata 统计。
 *   4. complexity 为分支关键字密度的代理指标（if/for/while/case/catch/&&/||/??），非圈复杂度。
 */

import { readdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PARSER_VERSION = "eos-dependency-parser/1.0";

const DEFAULT_IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", "coverage",
  ".next", ".nuxt", ".cache", ".turbo", ".eos", ".venv", "vendor"
]);

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);
const RESOLVE_CANDIDATES = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

export function resolveProjectRoot(rawPath, { baseDir = process.cwd() } = {}) {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    throw new Error("rootDir is required");
  }
  const resolved = path.resolve(baseDir, rawPath.trim());
  const home = os.homedir();
  const tmp = os.tmpdir();
  if (resolved === home || resolved === tmp || resolved === path.parse(resolved).root) {
    throw new Error("rootDir must be a project subdirectory, not the home, temp, or filesystem root");
  }
  const insideAllowedTree = resolved.startsWith(home + path.sep) || resolved.startsWith(tmp + path.sep);
  if (!insideAllowedTree) {
    throw new Error("rootDir must stay inside the user home or temp directory");
  }
  return resolved;
}

export async function parseProjectDependencies(rootDir, options = {}) {
  const includeExternal = options.includeExternal !== false;
  const includeNodeBuiltins = options.includeNodeBuiltins === true;
  const ignoreDirs = new Set([...DEFAULT_IGNORE_DIRS, ...(options.ignoreDirs ?? [])]);

  const root = resolveProjectRoot(rootDir);
  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(`rootDir is not an existing directory: ${root}`);
  }

  const files = await collectSourceFiles(root, "", ignoreDirs, 0);
  const fileIds = new Set(files.map((f) => f.id));
  const nodes = [];
  const edges = [];
  const seenEdges = new Set();
  const externalIds = new Set();
  const stats = { unresolvedSpecifiers: 0, nodeBuiltinSpecifiers: 0, skippedFiles: 0, totalSpecifiers: 0 };

  for (const file of files) {
    const source = await readFile(file.absolutePath, "utf8").catch(() => {
      stats.skippedFiles += 1;
      return "";
    });
    const stripped = stripComments(source);
    const specifiers = extractSpecifiers(stripped);

    nodes.push({
      id: file.id,
      type: "file",
      label: path.basename(file.id),
      filePath: file.id,
      loc: source.length === 0 ? 0 : source.split("\n").length,
      complexity: estimateComplexity(stripped)
    });

    for (const specifier of specifiers) {
      stats.totalSpecifiers += 1;
      if (specifier.startsWith("node:")) {
        stats.nodeBuiltinSpecifiers += 1;
        if (!includeNodeBuiltins) continue;
      }

      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const resolvedId = resolveRelativeSpecifier(file.id, specifier, fileIds, root);
        if (!resolvedId) {
          stats.unresolvedSpecifiers += 1;
          continue;
        }
        pushEdge(edges, seenEdges, file.id, resolvedId);
        continue;
      }

      if (!specifier.startsWith("node:") && !includeExternal) continue;
      const externalId = specifier.startsWith("node:") ? `node:${specifier.slice(5).split("/")[0]}` : `pkg:${packageRoot(specifier)}`;
      if (!externalIds.has(externalId)) {
        externalIds.add(externalId);
        nodes.push({
          id: externalId,
          type: "module",
          label: externalId.replace(/^(pkg|node):/, ""),
          filePath: null,
          loc: null,
          complexity: null
        });
      }
      pushEdge(edges, seenEdges, file.id, externalId);
    }
  }

  const hasTypeScript = files.some((f) => /\.(ts|tsx)$/.test(f.id));
  return {
    nodes,
    edges,
    metadata: {
      language: hasTypeScript ? "javascript+typescript" : "javascript",
      parserVersion: PARSER_VERSION,
      fileCount: files.length,
      rootDir: root,
      includeExternal,
      stats
    }
  };
}

async function collectSourceFiles(root, relativeDir, ignoreDirs, depth) {
  if (depth > 24) return [];
  const absoluteDir = path.join(root, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const collected = [];
  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name) || entry.name.startsWith(".")) continue;
      collected.push(...await collectSourceFiles(root, relativePath, ignoreDirs, depth + 1));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;
    if (entry.name.endsWith(".d.ts")) continue;
    collected.push({ id: relativePath, absolutePath: path.join(absoluteDir, entry.name) });
  }
  return collected.sort((a, b) => a.id.localeCompare(b.id));
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");
}

function extractSpecifiers(strippedSource) {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of strippedSource.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }
  return specifiers;
}

function resolveRelativeSpecifier(fromFileId, specifier, fileIds, root) {
  const baseDir = path.dirname(path.join(root, fromFileId));
  const absolute = path.resolve(baseDir, specifier);
  for (const suffix of RESOLVE_CANDIDATES) {
    const candidate = absolute + suffix;
    const relativeCandidate = toPosix(path.relative(root, candidate));
    if (fileIds.has(relativeCandidate)) return relativeCandidate;
  }
  for (const suffix of RESOLVE_CANDIDATES) {
    const candidate = path.join(absolute, `index${suffix}`);
    const relativeCandidate = toPosix(path.relative(root, candidate));
    if (fileIds.has(relativeCandidate)) return relativeCandidate;
  }
  return null;
}

function packageRoot(specifier) {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}

function estimateComplexity(strippedSource) {
  const branches = strippedSource.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?\?/g);
  return (branches?.length ?? 0) + 1;
}

function pushEdge(edges, seenEdges, source, target) {
  if (source === target) return;
  const key = `${source}\u0000${target}`;
  if (seenEdges.has(key)) return;
  seenEdges.add(key);
  edges.push({ source, target, kind: "imports", weight: 1 });
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}
