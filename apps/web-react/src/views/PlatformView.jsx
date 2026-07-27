import { useState, useRef, useEffect, useCallback } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { startPlatform } from "../api/platform.js";

const STATUS_LABELS = {
  active: { text: "已连接", className: "pill ok" },
  ready: { text: "就绪", className: "pill warn" },
  not_configured: { text: "未配置", className: "pill" },
  error: { text: "异常", className: "pill bad" }
};

const PLATFORM_META = {
  tray: { label: "系统托盘", desc: "macOS 菜单栏应用 (EOS.app) + launchd 核心代理" },
  work: { label: "工作区", desc: "本地 EOS 工作区 (.eos/project.json) 绑定独立 Vault" },
  vault: { label: "数据仓库", desc: "Git 版本化 Vault，存储全部记录" },
  codex: { label: "Codex CLI", desc: "Codex CLI + EOS 捕获中继 MCP 服务 (opt-in)" },
  cloud: { label: "云端部署", desc: "Docker + Render 云端部署" }
};

function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] || STATUS_LABELS.error;
  return <span className={meta.className}>{meta.text}</span>;
}

function PlatformCard({ name, result, onStart }) {
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState(null);
  const meta = PLATFORM_META[name] || { label: name, desc: result?.description || "" };

  const handleStart = async () => {
    setStarting(true);
    setStartResult(null);
    try {
      const result = await startPlatform(name);
      setStartResult(result);
      onStart();
    } catch (err) {
      setStartResult({ started: false, message: err.message });
    } finally {
      setStarting(false);
    }
  };

  const details = result?.details || {};

  return (
    <div className="panel" style={{ marginBottom: "12px" }}>
      <div className="panel-head">
        <div>
          <h3 style={{ margin: 0 }}>{meta.label}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>{meta.desc}</p>
        </div>
        <StatusBadge status={result?.status || "error"} />
      </div>
      <div style={{ padding: "12px 16px" }}>
        {result?.detected ? (
          <div className="detail-grid" style={{ marginBottom: "10px" }}>
            {Object.entries(details).slice(0, 6).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{typeof value === "object" ? JSON.stringify(value) : String(value)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: "13px", margin: "0 0 10px" }}>
            {details?.reason || "此平台尚未检测到"}
          </p>
        )}

        {startResult && (
          <div
            className={startResult.started ? "panel" : "error-banner"}
            style={{ marginBottom: "10px", padding: "8px 12px", borderColor: startResult.started ? "var(--ok)" : undefined }}
          >
            <span style={{ fontSize: "13px" }}>{startResult.message}</span>
            {startResult.command && (
              <code style={{ display: "block", marginTop: "6px", fontSize: "12px", wordBreak: "break-all" }}>
                {startResult.command}
              </code>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="primary-btn" onClick={handleStart} disabled={starting}>
            {starting ? "启动中..." : "启动 / 连接"}
          </button>
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? "收起说明" : "安装说明"}
          </button>
        </div>

        {expanded && result?.instructions && (
          <pre style={{ marginTop: "10px", padding: "10px", background: "var(--panel-2)", fontSize: "12px", whiteSpace: "pre-wrap", borderRadius: "4px", overflowX: "auto" }}>
            {result.instructions}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function PlatformView({ refreshKey, toast }) {
  const url = `/api/platforms?t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);
  const refreshTimerRef = useRef(null);

  const platforms = data?.platforms || {};
  const summary = data?.summary || {};

  const handleStart = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(refresh, 500);
  }, [refresh]);

  useEffect(() => {
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  return (
    <>
      <div className="section-head">
        <div>
          <h2>平台兼容</h2>
          <p>检测并连接 EOS 的五大集成面：tray · work · vault · codex · cloud</p>
        </div>
        {summary.total > 0 && (
          <div className="muted" style={{ fontSize: "12px", display: "flex", gap: "12px" }}>
            <span>活跃 {summary.active}</span>
            <span>就绪 {summary.ready}</span>
            <span>未配 {summary.notConfigured}</span>
            {summary.errors > 0 && <span className="pill bad">异常 {summary.errors}</span>}
          </div>
        )}
      </div>

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : loading ? (
        <div className="skeleton-card" />
      ) : (
        Object.entries(PLATFORM_META).map(([name]) => (
          <PlatformCard
            key={name}
            name={name}
            result={platforms[name]}
            onStart={handleStart}
          />
        ))
      )}
    </>
  );
}
