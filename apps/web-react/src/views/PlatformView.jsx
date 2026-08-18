import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import {
  applyPlatformConnection,
  applyHostHookPlan,
  applyHostHookRemoval,
  approveHostObservation,
  previewHostHookPlan,
  previewHostHookRemoval,
  previewPlatformConnection
} from "../api/platform.js";

const STATUS_LABELS = {
  observing: { text: "已收到事件", className: "pill ok" },
  callable: { text: "可调用", className: "pill ok" },
  configured: { text: "已配置待验收", className: "pill warn" },
  available: { text: "已安装未连接", className: "pill warn" },
  not_installed: { text: "未安装", className: "pill" },
  error: { text: "检测异常", className: "pill bad" }
};

const PLATFORM_META = {
  codex: {
    label: "Codex",
    desc: "桌面、CLI 与 IDE 扩展共享 MCP 配置，并支持经许可的运行状态 Hooks。"
  },
  claude: {
    label: "Claude Code",
    desc: "通过本地 MCP 调用 EOS；Hooks 可提供会话与工具调用事件。"
  },
  cursor: {
    label: "Cursor",
    desc: "IDE 与 CLI 支持 MCP；Hook 契约尚未通过官方结构验收。"
  },
  trae: {
    label: "TRAE",
    desc: "官方确认提供 MCP；配置入口和运行状态 Hook 仍需逐版本人工验收。"
  },
  vscode: {
    label: "VS Code",
    desc: "Agent 支持 MCP，扩展可注册 MCP Server Definition Provider。"
  }
};

const HOOK_LABELS = {
  supported: "MCP + 运行状态 Hooks",
  unverified: "MCP 已知，Hooks 待验收",
  mcp_only: "公开能力：MCP",
  extension: "MCP + 扩展 API"
};

const PROOF_ROWS = [
  ["hostInstalled", "宿主已安装"],
  ["mcpRegistered", "EOS MCP 已注册"],
  ["relayConformant", "Relay 握手通过"],
  ["hostConfirmed", "宿主确认已加载"],
  ["eventObserved", "收到经许可事件"]
];

function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] || STATUS_LABELS.error;
  return <span className={meta.className}>{meta.text}</span>;
}

function ProofValue({ value }) {
  const state = value === true ? "pass" : value === false ? "fail" : "unknown";
  const label = value === true ? "是" : value === false ? "否" : "待确认";
  return (
    <span className={`proof-value ${state}`}>
      <span className="proof-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function ConnectionPlan({ result, approved, applying, onApprovalChange, onApply }) {
  if (!result) return null;
  const plan = result.diffPreview
    ? JSON.stringify(result.diffPreview, null, 2)
    : result.config
      ? JSON.stringify(result.config, null, 2)
      : result.command;
  const steps = result.manualSteps || result.steps;

  return (
    <div className="connection-plan" role="status">
      <strong>{result.message}</strong>
      {result.configPath && (
        <div className="connection-path">
          <span>目标配置</span>
          <code>{result.configPath}</code>
        </div>
      )}
      {plan && <pre>{plan}</pre>}
      {steps?.length > 0 && (
        <ol className="connection-steps">
          {steps.map((step) => (
            <li key={typeof step === "string" ? step : step.id}>
              {typeof step === "string" ? step : `${step.id}: ${step.status}`}
            </li>
          ))}
        </ol>
      )}
      {result.canApply && (
        <div className="connection-approval">
          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => onApprovalChange(event.target.checked)}
            />
            <span>我已审查目标文件与上述 EOS 专属变更</span>
          </label>
          <button className="primary-btn" disabled={!approved || applying} onClick={onApply}>
            {applying ? "写入并验证中..." : "批准并写入"}
          </button>
        </div>
      )}
    </div>
  );
}

function HookChangePlan({ result, approved, applying, approvalLabel, applyLabel, onApprovalChange, onApply }) {
  return (
    <div className="connection-plan" role="status">
      <strong>{result.message}</strong>
      {result.configPath && (
        <div className="connection-path"><span>目标配置</span><code>{result.configPath}</code></div>
      )}
      {result.diffPreview && <pre>{JSON.stringify(result.diffPreview, null, 2)}</pre>}
      {result.steps?.length > 0 && (
        <ol className="connection-steps">
          {result.steps.map((step) => <li key={step.id}>{`${step.id}: ${step.status}`}</li>)}
        </ol>
      )}
      {result.canApply && (
        <div className="connection-approval">
          <label>
            <input type="checkbox" checked={approved} onChange={(event) => onApprovalChange(event.target.checked)} />
            <span>{approvalLabel}</span>
          </label>
          <button className="primary-btn" disabled={!approved || applying} onClick={onApply}>
            {applying ? "执行并验证中..." : applyLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function PlatformCard({ name, result, projectId, onRefresh }) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [approved, setApproved] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [hookAcknowledged, setHookAcknowledged] = useState(false);
  const [hookPlanning, setHookPlanning] = useState(false);
  const [hookPlan, setHookPlan] = useState(null);
  const [hookSecondApproved, setHookSecondApproved] = useState(false);
  const [hookApplying, setHookApplying] = useState(false);
  const [removalPlan, setRemovalPlan] = useState(null);
  const [removalApproved, setRemovalApproved] = useState(false);
  const [removing, setRemoving] = useState(false);
  const meta = PLATFORM_META[name];
  const proof = result?.proof || {};
  const details = result?.details || {};
  const hookInstallation = details.hookInstallation || {};
  const hookInstalled = hookInstallation.configured === true;
  const hookTokenReady = hookInstallation.tokenReady === true;
  const consentActive = details.observationConsentActive === true;

  const handlePlan = async () => {
    setPlanning(true);
    setApproved(false);
    setPlanResult(null);
    try {
      setPlanResult(await previewPlatformConnection(name, projectId));
    } catch (error) {
      setPlanResult({ message: error.message });
    } finally {
      setPlanning(false);
    }
  };

  const handleApply = async () => {
    if (!approved || !planResult?.planId) return;
    setApplying(true);
    try {
      setPlanResult(await applyPlatformConnection(name, planResult.planId));
      setApproved(false);
      onRefresh();
    } catch (error) {
      setPlanResult({ ...planResult, canApply: false, message: error.message });
    } finally {
      setApplying(false);
    }
  };

  const handleHookPlan = async () => {
    if (!projectId || !hookAcknowledged) return;
    setHookPlanning(true);
    setHookPlan(null);
    setHookSecondApproved(false);
    try {
      const consent = await approveHostObservation({ projectId, host: name });
      setHookPlan(await previewHostHookPlan(name, consent.id, consent.captureToken));
    } catch (error) {
      setHookPlan({ message: error.message, status: "error" });
    } finally {
      setHookPlanning(false);
    }
  };

  const handleHookApply = async () => {
    if (!hookSecondApproved || !hookPlan?.planId) return;
    setHookApplying(true);
    try {
      setHookPlan(await applyHostHookPlan(name, hookPlan.planId));
      setHookSecondApproved(false);
      setHookAcknowledged(false);
      onRefresh();
    } catch (error) {
      setHookPlan({ ...hookPlan, canApply: false, message: error.message, status: "error" });
    } finally {
      setHookApplying(false);
    }
  };

  const handleRemovalPlan = async () => {
    setRemovalPlan(null);
    setRemovalApproved(false);
    try {
      setRemovalPlan(await previewHostHookRemoval(name, projectId));
    } catch (error) {
      setRemovalPlan({ message: error.message, status: "error" });
    }
  };

  const handleRemovalApply = async () => {
    if (!removalApproved || !removalPlan?.planId) return;
    setRemoving(true);
    try {
      setRemovalPlan(await applyHostHookRemoval(name, removalPlan.planId, projectId));
      setRemovalApproved(false);
      setHookPlan(null);
      onRefresh();
    } catch (error) {
      setRemovalPlan({ ...removalPlan, canApply: false, message: error.message, status: "error" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <article className="integration-card">
      <header className="integration-card-head">
        <div>
          <div className="integration-title-row">
            <h3>{meta.label}</h3>
            <span className="compat-level">L{result?.compatibilityLevel ?? 0}</span>
          </div>
          <p>{meta.desc}</p>
        </div>
        <StatusBadge status={result?.status || "error"} />
      </header>

      <div className="integration-runtime">
        <span>{HOOK_LABELS[details.hooks] || "开放能力待验证"}</span>
        {details.version && <code>{details.version}</code>}
      </div>

      <div className="integration-proof" aria-label={`${meta.label} 兼容性证据`}>
        {PROOF_ROWS.map(([key, label]) => (
          <div className="proof-row" key={key}>
            <span>{label}</span>
            <ProofValue value={proof[key]} />
          </div>
        ))}
        <div className="proof-row">
          <span>绑定已注册项目 Vault</span>
          <ProofValue value={proof.vaultBound} />
        </div>
      </div>

      {proof.vaultBound === false && (
        <p className="integration-warning">
          EOS 配置没有指向任何已注册项目 Vault，因此不能算作可调用。
        </p>
      )}
      {details.error && <p className="integration-error">{details.error}</p>}

      <div className="integration-actions">
        <button className="primary-btn" onClick={handlePlan} disabled={planning}>
          {planning ? "生成中..." : "查看连接方案"}
        </button>
        <button onClick={() => setInstructionsOpen((value) => !value)}>
          {instructionsOpen ? "收起验收步骤" : "验收步骤"}
        </button>
      </div>

      <ConnectionPlan
        result={planResult}
        approved={approved}
        applying={applying}
        onApprovalChange={setApproved}
        onApply={handleApply}
      />

      {details.hooks === "supported" && (
        <div className="hook-review-flow">
          <div className="hook-review-heading">
            <strong>事件观察审查</strong>
            <span>1 许可 · 2 差异 · 3 宿主确认</span>
          </div>
          <div className={`hook-installation-state ${hookInstalled ? "installed" : "idle"}`}>
            <span className="proof-dot" aria-hidden="true" />
            <span>
              {hookInstalled
                ? consentActive && hookTokenReady
                  ? "Hook 已安装，等待宿主事件回执"
                  : consentActive
                    ? "检测到 EOS Hook，但私有许可令牌缺失或无效"
                    : "检测到 EOS Hook，但观察许可已失效"
                : "尚未安装 EOS 运行状态 Hook"}
            </span>
          </div>

          {(!hookInstalled || !consentActive || !hookTokenReady) && (
            <>
              <label className="hook-consent-check">
                <input
                  type="checkbox"
                  checked={hookAcknowledged}
                  onChange={(event) => setHookAcknowledged(event.target.checked)}
                />
                <span>仅允许会话、工具、权限和完成状态元数据；不采集提示词、回复、工具参数、输出、源码与对话文件。</span>
              </label>
              <button
                onClick={handleHookPlan}
                disabled={!projectId || !hookAcknowledged || hookPlanning}
              >
                {hookPlanning ? "生成审查方案中..." : hookInstalled ? "重新建立许可并查看差异" : "建立许可并查看 Hook 差异"}
              </button>
              {!projectId && <p className="integration-warning">当前不是已绑定的 EOS 项目工作区，无法建立项目级观察许可。</p>}
            </>
          )}

          {hookPlan && (
            <HookChangePlan
              result={hookPlan}
              approved={hookSecondApproved}
              applying={hookApplying}
              approvalLabel="我已审查脱敏差异，并确认只安装不含工作内容的运行状态 Hook"
              applyLabel="二次确认并写入"
              onApprovalChange={setHookSecondApproved}
              onApply={handleHookApply}
            />
          )}

          {hookInstalled && (
            <div className="hook-removal-flow">
              <button onClick={handleRemovalPlan}>查看移除差异</button>
              {removalPlan && (
                <HookChangePlan
                  result={removalPlan}
                  approved={removalApproved}
                  applying={removing}
                  approvalLabel="我确认撤销观察许可，并只移除 EOS 自己的 Hook"
                  applyLabel="确认撤销并移除"
                  onApprovalChange={setRemovalApproved}
                  onApply={handleRemovalApply}
                />
              )}
            </div>
          )}
        </div>
      )}

      {instructionsOpen && result?.instructions && (
        <pre className="integration-instructions">{result.instructions}</pre>
      )}
    </article>
  );
}

function EvidenceLadder() {
  const levels = [
    ["L0", "未检测"],
    ["L1", "已安装"],
    ["L2", "已配置"],
    ["L3", "可调用"],
    ["L4", "已观测"]
  ];
  return (
    <div className="evidence-ladder" aria-label="兼容证据等级">
      {levels.map(([level, label]) => (
        <div key={level}>
          <strong>{level}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PlatformView({ refreshKey }) {
  const url = `/api/platforms?t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);
  const platforms = data?.platforms || {};
  const summary = data?.summary || {};
  const scope = data?.scope || {};

  return (
    <>
      <div className="section-head integration-section-head">
        <div>
          <h2>AI 工具连接</h2>
          <p>兼容状态只依据宿主检测、MCP 注册、Relay 握手与真实事件回执。</p>
        </div>
        <button onClick={refresh} disabled={loading}>重新检测</button>
      </div>

      <div className="integration-truth">
        <div>
          <strong>MCP 可调用不等于 EOS 能读取全部聊天。</strong>
          <span>
            只有宿主 Hooks 或用户主动调用，并通过严格许可，协作事件才会进入当前 Vault。
          </span>
        </div>
        {scope.vaultDir && (
          <div className="integration-scope">
            <span>
              {scope.mode === "registered_workspaces"
                ? `已注册项目范围 · ${scope.workspaceCount || 0} 个工作区`
                : scope.mode === "workspace" ? "项目工作区" : "EOS 控制库"}
            </span>
            <code>{scope.vaultDir}</code>
          </div>
        )}
      </div>

      <EvidenceLadder />

      {summary.total > 0 && (
        <div className="integration-summary" aria-label="连接概况">
          <div><strong>{summary.installed}</strong><span>已安装</span></div>
          <div><strong>{summary.configured}</strong><span>已配置</span></div>
          <div><strong>{summary.callable}</strong><span>可调用</span></div>
          <div><strong>{summary.observing}</strong><span>已观测</span></div>
        </div>
      )}

      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={refresh}>重试</button>
        </div>
      ) : loading ? (
        <div className="integration-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : (
        <div className="integration-grid">
          {Object.keys(PLATFORM_META).map((name) => (
            <PlatformCard
              key={name}
              name={name}
              result={platforms[name]}
              projectId={platforms[name]?.details?.boundWorkspace?.projectId || scope.projectId}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </>
  );
}
