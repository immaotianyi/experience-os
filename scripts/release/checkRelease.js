import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EOS_VERSION } from "../../src/version.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function requiredFile(relativePath) {
  await access(path.join(root, relativePath));
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert(packageJson.version === EOS_VERSION, `package.json version ${packageJson.version} != ${EOS_VERSION}`);
assert(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(EOS_VERSION), `invalid semver: ${EOS_VERSION}`);

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "SECURITY.md",
  "docs/ARCHITECTURE.md",
  "docs/API.md",
  "docs/DATA_MODEL.md",
  "docs/BETA_TESTING.md",
  "docs/RELEASING.md",
  "apps/macos/EOSMenuBar/README.md",
  "assets/brand/eos-logo-primary.png",
  "apps/web-react/public/eos-logo.png",
  "apps/web/eos-logo.png",
  "scripts/macos/buildAppBundle.js",
  "scripts/macos/buildDmg.js",
  ".github/workflows/verify.yml"
];
await Promise.all(requiredFiles.map(requiredFile));

const webDir = path.join(root, "apps", "web");
const indexHtml = await readFile(path.join(webDir, "index.html"), "utf8");
const referencedAssets = new Set(
  [...indexHtml.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map((match) => match[1])
);
assert(referencedAssets.size >= 2, "web index must reference JavaScript and CSS assets");

const builtAssets = (await readdir(path.join(webDir, "assets")))
  .filter((name) => name.endsWith(".js") || name.endsWith(".css"));
const staleAssets = builtAssets.filter((name) => !referencedAssets.has(name));
assert(staleAssets.length === 0, `stale web assets found: ${staleAssets.join(", ")}`);

console.log(JSON.stringify({
  ok: true,
  version: EOS_VERSION,
  webAssets: builtAssets,
  requiredFiles: requiredFiles.length
}, null, 2));
