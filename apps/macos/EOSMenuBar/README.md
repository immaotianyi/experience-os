# EOS Menu Bar for macOS

The native macOS attention surface for Experience OS. It stays in the menu bar,
shows three compact traffic lights, and opens a per-Agent evidence radar when the
user clicks it. A separate edge panel can collapse until only a vertical strip
of three lights remains visible.

## Attention surfaces

- **Menu bar:** global traffic lights. A moving three-light sequence means
  verified recent activity; amber means permission or review; green means a
  recent completion; red means failure or a blocking wall.
- **Menu popover:** one row per installed Agent host, with its own lights,
  state label, and L0-L4 evidence level.
- **Edge panel:** the EOS human-attention queue. It snaps to either screen edge,
  collapses to a 20 px reveal strip, and opens the relevant in-app review route.
- **Workbench:** full evidence, history, configuration, and consequential
  decisions.

An installed process is never enough to show "working". EOS requires a host
that is callable for the current Vault plus a recent, consented metadata event.
Stale events expire instead of leaving a misleading activity light on.

## Run locally

Start an EOS Core workbench first:

```sh
npm run web
```

Then start the menu bar app:

```sh
npm run macos:run
```

To package a local `.app` bundle instead, run:

```sh
npm run macos:bundle
open dist/EOS.app
```

To build the distributable Apple Silicon DMG, run:

```sh
npm run macos:dmg
```

打包脚本会从 `assets/brand/eos-logo-primary.png` 生成 16px 到 1024px 的 `EOS.icns`，同时把原始 Logo 嵌入应用资源，供菜单弹层和屏幕边缘注意力窗使用。

The DMG contains a self-contained `EOS.app`: the native status surface, an
in-app WebKit workbench, EOS Core, the production Web UI, and an arm64 Node.js
runtime. After copying the app to `/Applications`, EOS starts or reuses
`http://127.0.0.1:4173` and opens the workbench in its own native window. A
browser and a separate `npm run web` process are not required.

The default Core address is `http://127.0.0.1:4173`. Use **连接设置** in the
menu bar panel to switch to an isolated workspace workbench such as `4180`.

## Scope

The packaged Alpha app uses ad-hoc signing for invited local testing. It is not
Apple Developer ID signed or notarized, so macOS can require confirmation in
**System Settings > Privacy & Security** on first launch. The app does not
silently read collaboration content or watch other applications. It reads EOS
Core's aggregated `/api/attention` endpoint and opens the relevant workbench
surface. Capturing content and installing host hooks remain separately gated by
explicit human permission.

The packaged app stores its default workspace under
`~/Library/Application Support/ExperienceOS/Workspace` and Core logs under
`~/Library/Application Support/ExperienceOS/Logs/core.log`. It reports host
installation, MCP registration, callable status, and observed events as
different evidence levels; detecting Codex, Claude, Cursor, or TRAE does not
mean the host is already connected.

The native workbench retries while the bundled Core is starting. Local EOS
routes remain inside the app; non-local links are handed to the default browser.
Closing the workbench does not stop EOS: the menu-bar radar and edge attention
panel remain available, and their actions reopen the relevant in-app route.

## Optional login service

Source builds can still run EOS Core as a separate login service. To make a
repository workspace Core start when this Mac user logs in, explicitly run:

```sh
npm run macos:install-core -- /absolute/path/to/your/eos-workspace
```

This writes `~/Library/LaunchAgents/local.experienceos.core.plist`, binds Core
to `127.0.0.1:4173`, binds it to that workspace's `.eos/vault`, and records
logs under `~/Library/Logs/ExperienceOS/`. The workspace must already contain
`.eos/project.json`; the installer fails closed instead of using a development
Vault by accident.
Check its state with `npm run macos:core-status`.
