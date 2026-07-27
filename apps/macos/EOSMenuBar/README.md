# EOS Menu Bar for macOS

The native macOS attention surface for Experience OS. It stays in the menu bar,
shows three compact lights, and opens detailed status only when the user clicks it.

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

The default Core address is `http://127.0.0.1:4173`. Use **连接设置** in the
menu bar panel to switch to an isolated workspace workbench such as `4180`.

## Scope

This is an unsigned local Swift Package executable for Alpha. It deliberately
does not read collaboration content, watch other applications, or write Vault
records. It only reads EOS Core's aggregated `/api/attention` endpoint and
opens the relevant EOS workbench on demand. The workbench supports deep links
such as `http://127.0.0.1:4173/?view=review` so a menu bar action lands on the
corresponding production surface rather than a generic home screen.

## Optional login service

The menu bar app is deliberately separate from EOS Core. To make the Core start
when this Mac user logs in, explicitly run:

```sh
npm run macos:install-core
```

This writes `~/Library/LaunchAgents/local.experienceos.core.plist`, binds Core
to `127.0.0.1:4173`, and records logs under `~/Library/Logs/ExperienceOS/`.
Check its state with `npm run macos:core-status`.
