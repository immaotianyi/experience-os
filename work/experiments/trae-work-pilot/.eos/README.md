# Experience OS local workspace

This directory is EOS's visible local memory and governance boundary for this workspace.

- **Project ID:** `project.trae_work_eos_u63a5u5165u8bd5u9a8c`
- **Storage:** local Git-backed Vault in `vault/`
- **Default autonomy:** `advise`
- **Capture:** strict human permit required for MCP capture; EOS does not silently observe your applications.

## MCP connection

Use `mcp.json` as the server definition in an MCP-compatible client. The relay exposes:

- `eos_capture_collaboration` — capture one explicitly consented fragment
- `eos_prepare_capture_permit` — request a human review before strict capture
- `eos_project_readiness` — see what blocks promotion
- `eos_verified_experience` — retrieve approved experience assets
- `eos_project_timeline` — read the evidence-first timeline

The workspace's business files are untouched. You may delete `.eos/` to remove this local EOS installation.

## Local workbench

From the EOS source directory, run:

`npm run workbench -- "/Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro/work/experiments/trae-work-pilot" 4180`

This opens the same workbench against this workspace's local Vault only. It does not mix this project's records with EOS's default Vault.
