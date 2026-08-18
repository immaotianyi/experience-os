# Changelog

All notable EOS changes are recorded here. Versions follow Semantic Versioning.

## 3.0.0-alpha.2 — 2026-08-16

### Added

- Cursor promoted to a verified Hook host: project-level flat `.cursor/hooks.json` with full event mapping, `conversation_id`/`generation_id` normalization, and `--event` bridge injection — closing the permission-event blind spot.
- Factory preset skill pack (7 skills) in skill-central Universal Skill v1 format, auto-installed as reviewable candidates at workspace bootstrap; installable via `GET /api/skills/presets` + `POST /api/skill-registry/import`.
- Workbench cognitive overhaul: plain-language nav groups (主线/管道/连接/治理), one-line page descriptions, plain hints on the five main-loop steps, an "EOS 是什么 + 三步上手" overview card; payments group hidden (shelved).
- `docs/EOS_EXPLAINED.md` — one-page product explainer (concept, principles, main loop, glossary, three lights, skill-central relationship).
- Tester guides (macOS/Windows) now cover Gatekeeper bypass, optional DeepSeek key with no-key degradation, and preset-pack review onboarding.

### Changed

- Three-light semantics finalized: working = solid yellow, red flash = blocked, yellow flash = permission, green flash = completed; display modes (menubar/floating/both/off) with three switch entries.
- MCP exporter exposes the read-only `read_instructions` tool over stdio and SSE.
- JS/TS dependency parser feeds CodeGraph (`POST /api/code-graph/parse-project`) with hub/hotspot/cycle/bridge patterns and blast radius.

### Fixed

- Three-light working state end to end: host-observation collectors now merge the Core's own vault consents (the aggregation previously skipped the main vault, so the TRAE watcher silently recorded nothing); live `working` now outranks stale pending reviews in the attention rollup (review count still surfaces in the detail line); the menubar working animation is a flowing three-light sweep with trail instead of a static yellow dot.
- Menubar three-light clipping (image width, dot spacing); working state now lights yellow only.
- Stale WAL housekeeping writes no longer reset the 45s idle SessionEnd fallback (single-command polling, 150s cap).
- Credential resolution across aggregate vaults: consent-carried vaultDir traversal for host_capture tokens, dual-format (JSON/bare) token reads.

## Unreleased

### Added

- Self-contained Apple Silicon DMG packaging with the native EOS status surface, bundled Core, production Web UI, arm64 Node.js runtime, SHA-256 output, ad-hoc signing, and mounted-image verification.
- Native WebKit workbench window with startup retry, local-only in-app navigation, external-link browser handoff, and reopen actions from the persistent status surface.
- Evidence-gated per-Agent activity states, a menu-bar Agent radar, and a left/right edge attention panel that collapses to a vertical three-light strip.
- The selected three-circle EOS identity across the macOS app icon, native attention surfaces, and React workbench.
- Registered-workspace evidence aggregation and metadata-only operational Hooks for truthful Codex working, permission, and completion states.

### Fixed

- Packaged EOS now provides an explicit ESM manifest for the bundled Core, starts successfully from Finder, and terminates its bootstrap or server child process when the app exits.
- Workbench actions no longer require opening the system browser; they route to the reusable native EOS window.
- Codex bound to a registered project Vault is now reported as L3 even when the desktop control Vault differs; L4 requires a real event from that same project.
- Native and Web attention surfaces now transition continuously, respect reduced motion, and avoid remounting during expand/collapse.

## 3.0.0-alpha.1 - 2026-07-29

### Added

- Evidence-first project loop from consented work checkpoints to reusable Experience Assets.
- Strict capture permits and MCP Relay integration for active AI clients.
- Human review, outcome validation, reuse trials and readable WallHit feedback.
- Code graph ingestion, structural pattern extraction and change blast-radius analysis.
- Local Beta feedback form with stable anonymous participant IDs and downloadable reports.
- macOS menu-bar prototype and macOS/Windows local Beta packages.
- Architecture, API, data-model, Beta-testing and release documentation.

### Changed

- Unified the canonical identity protocol as `x-eos-identity`, with legacy header compatibility.
- Added an explicit admin role and kept loopback-local privileged actions zero-configuration.
- Production web builds now remove stale hashed assets before writing a new bundle.

### Security

- Remote participants cannot enumerate other testers' Beta feedback.
- Remote feedback export and process-spawning platform actions require admin access.
- Local capture remains opt-in and does not silently inspect other applications.
