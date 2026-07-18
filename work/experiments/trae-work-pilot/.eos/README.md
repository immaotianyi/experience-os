# Experience OS local workspace

This directory is EOS's visible local memory and governance boundary for this workspace.

- **Project ID:** `project.trae_work_eos_u63a5u5165u8bd5u9a8c`
- **Storage:** local Git-backed Vault in `vault/`
- **Default autonomy:** `advise`
- **Capture:** explicit consent only; EOS does not silently observe your applications.

## MCP connection

Use `mcp.json` as the server definition in an MCP-compatible client. The relay exposes:

- `eos_capture_collaboration` — capture one explicitly consented fragment
- `eos_project_readiness` — see what blocks promotion
- `eos_verified_experience` — retrieve approved experience assets
- `eos_project_timeline` — read the evidence-first timeline

The workspace's business files are untouched. You may delete `.eos/` to remove this local EOS installation.
