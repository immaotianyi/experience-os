# TRAE WORK x Experience OS 试验接入说明

## 试验目的

验证 EOS 能否在不绑定某一个编码工具的前提下，接住 TRAE WORK 中由人明确选择保存的协作片段，并将它们推进为可回放、可审查、可验证的经验链路。

本次试验验证的是接入边界与真实工作流，不验证后台监听，不把完整对话、屏幕或业务目录自动同步到 EOS。

## 隔离边界

- 试验工作区：`work/experiments/trae-work-pilot/`
- 试验 Vault：`work/experiments/trae-work-pilot/.eos/vault/`
- 主产品 Vault：`work/vaults/`
- 两者绝不混用；TRAE 试验不得设置 `EOS_VAULT_DIR=work/vaults`。
- 每一个真实 TRAE 工作区都必须各自执行一次 Bootstrap，得到自己的 `.eos/` 与独立 Vault。

EOS 的 Vault 文件写入是原子替换，但 Git 记录和同一记录的并发语义不应依赖“碰巧不冲突”。因此一份 Vault 同一时间只允许一个写入入口：本次由 TRAE 的 MCP Relay 写入；不要同时用另一份 MCP 服务、脚本或 Web Server 对这份试验 Vault 执行写操作。

## 接入步骤

1. 在目标工作区执行：

```bash
cd /Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro
npm run bootstrap -- "/绝对路径/到/TRAE 工作区" "项目名称" "项目目标"
```

2. 将目标工作区 `.eos/mcp.json` 中的 `experience-os` 配置导入 TRAE WORK 的 MCP Server 设置。若当前 TRAE 工作区不支持 stdio MCP，保留该文件并使用 EOS Web 工作台的“保存工作节点”入口进行同样的明确同意捕获；不要自行改写 Vault JSON。

若使用 Codex，请先执行只读检查：

```bash
npm run codex:preflight -- "/绝对路径/到/Codex 工作区"
```

它会检测本机 Codex CLI、当前 EOS MCP 是否已登记，并输出一条显式安装命令。该检查不会修改 `~/.codex/config.toml`；只有人类主动执行输出的 `codex mcp add ...` 命令，Codex 才会获得该工作区的 EOS Relay。

3. 默认严格许可已开启。不要仅以 `consented: true` 直接调用 `eos_capture_collaboration`。TRAE 必须先调用 `eos_prepare_capture_permit` 提交一段不超过 600 字符的片段；这一步只会在本机待许可区暂存内容，不会写入 Vault 或 Git。

4. 人类在下方工作台的“待你许可的外部捕获”区逐字审阅来源、执行者、内容与附注。批准后，TRAE 用原样的内容、相同来源工具、相同执行者和该次 `permitId` 调用 `eos_capture_collaboration`。许可只有一次、五分钟有效；内容变化必须重新申请。

5. 回到 EOS，运行以下命令打开**只绑定这个 TRAE 工作区**的工作台，再检查项目页；不要在默认 `4173` 主 Vault 工作台中寻找试验记录：

```bash
cd /Users/sanzhaibanniang/Documents/Codex/2026-07-16/gemini-3-1-pro
npm run workbench -- "/绝对路径/到/TRAE 工作区" 4180
```

确认该片段以来源 -> Evidence -> WorkCheckpoint 的可追溯链路出现。

6. 人类选择工作节点后，生成 Experience Receipt Draft；只在阅读草案、确认适用边界与不确定性后，才确认成正式 Receipt。

7. 在真实任务产生结果后，记录人工决策与 Outcome。只有证据、决策和成功结果完整闭环后，EOS 才能升级 ExperienceAsset，并在后续项目提出有边界的建议。

## TRAE 同事的权限

允许：读取已获授权的 EOS 状态；申请待人类逐字审阅的捕获许可；在获得一次性许可后保存原样片段；读取项目时间线、升级资格和已验证经验。

禁止：批准草案、记录人工决策、记录成功结果、升级 ExperienceAsset、修改 `.eos/vault/` JSON、把未经同意的聊天或文件内容写入 EOS。

## 并发与交接规则

1. **工作区隔离**：每个编码项目一个 `.eos/`，不共享 Vault。
2. **写入者隔离**：一个 Vault 同一阶段只绑定一个写入端；其他参与者只读并提出建议。
3. **文件所有权隔离**：TRAE 只使用目标工作区与其 `.eos/`；不得修改 EOS 产品源码、`apps/web-react/`、`src/` 或主协作文档。
4. **交接记录**：每次试验结束写入一条 WorkCheckpoint，注明来源为 `TRAE WORK`、当前任务、是否成功、遇到的墙和是否值得沉淀。
5. **故障处理**：出现 MCP 调用失败、时间线缺失、来源不匹配或双写风险时，立即停止写入；保留错误信息，由工程 Debug + 升级 AI 复现和修复。不要通过手改 JSON 补救。

## 第一轮验收

- Bootstrap 不改动业务文件，只新增可见 `.eos/`；
- TRAE 可读取 MCP 工具清单；
- 一条通过严格许可的片段能进入正确项目的时间线；
- 缺少许可、内容/来源/执行者与许可不一致、或重复使用许可的捕获会被拒绝；
- 试验 Vault 与主产品 Vault 的记录数和 Git 历史相互独立；
- 试验结束后，人类能回答：这条记录来自哪里、是否可信、下一步应审查什么。
