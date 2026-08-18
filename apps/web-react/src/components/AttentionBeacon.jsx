/**
 * AttentionBeacon — EOS 注意力状态指示器。
 *
 * 核心职责：
 *   - 每 15 秒轮询 /api/attention 获取协作状态信号
 *   - 展示红/黄/绿状态灯和可操作的下一步建议
 *   - 页面不可见时暂停轮询，可见时立即刷新
 *   - 通过 onNavigate 回调跳转到对应视图
 */
import { useCallback, useEffect, useState } from "react";
import { fetchAttention } from "../api/core.js";
import { IconChevronDown, IconClose } from "./icons.jsx";

export default function AttentionBeacon({ refreshKey, onNavigate }) {
  const [snapshot, setSnapshot] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchAttention();
      setSnapshot(next);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    let timer = null;
    const start = () => {
      if (timer) return;
      timer = window.setInterval(refresh, 15000);
    };
    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refresh();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, refreshKey]);

  const signals = snapshot?.signals || [
    { id: "decisions", level: error ? "red" : "amber", label: "需要你决定", detail: error ? "状态连接暂不可用。" : "正在读取状态。", count: 0 },
    { id: "production", level: "amber", label: "生产安全", detail: "正在读取状态。", count: 0 },
    { id: "model", level: "amber", label: "模型状态", detail: "正在读取状态。", count: 0 }
  ];
  const actions = snapshot?.actions || [];
  const blockingCount = signals.filter((item) => item.level === "red").length;

  const navigate = (action) => {
    setExpanded(false);
    onNavigate(action.view, action.anchor);
  };

  return (
    <aside className={`attention-beacon ${expanded ? "expanded" : ""}`} aria-label="EOS 协作状态">
        <section
          className="attention-panel"
          aria-live="polite"
          aria-hidden={!expanded}
          {...(!expanded ? { inert: "" } : {})}
        >
          <header className="attention-panel-head">
            <div className="attention-panel-brand">
              <img src="/eos-logo.png" alt="" aria-hidden="true" />
              <div>
                <p className="eyebrow">EOS 状态</p>
                <h2>{blockingCount ? "需要你的判断" : actions.length ? "有可跟进事项" : "当前流程清空"}</h2>
              </div>
            </div>
            <button className="icon-button attention-close" type="button" title="收起状态栏" aria-label="收起状态栏" onClick={() => setExpanded(false)}><IconClose /></button>
          </header>
          <div className="attention-signal-list">
            {signals.map((item) => (
              <div className="attention-signal" key={item.id}>
                <span className={`attention-dot ${item.level}`} aria-hidden="true" />
                <div><strong>{item.label}</strong><p>{item.detail}</p></div>
                {item.count > 0 && <span className="attention-count">{item.count}</span>}
              </div>
            ))}
          </div>
          {actions.length > 0 ? (
            <div className="attention-actions">
              <p className="attention-section-label">下一步</p>
              {actions.map((action) => (
                <button key={action.id} type="button" className={`attention-action ${action.level}`} onClick={() => navigate(action)}>
                  <span className={`attention-dot ${action.level}`} aria-hidden="true" />
                  <span><strong>{action.title}</strong><small>{action.detail}</small></span>
                  <IconChevronDown className="attention-action-arrow" />
                </button>
              ))}
            </div>
          ) : (
            <p className="attention-clear">没有需要你立即处理的事项。EOS 会继续保持观察，而不会打断你的工作。</p>
          )}
        </section>
      <button
        type="button"
        className="attention-trigger"
        title={expanded ? "收起 EOS 状态" : "展开 EOS 状态"}
        aria-label={expanded ? "收起 EOS 状态" : "展开 EOS 状态"}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <img className="attention-trigger-logo" src="/eos-logo.png" alt="" aria-hidden="true" />
        <span className="attention-trigger-label">EOS</span>
        <span className="attention-lights" aria-hidden="true">
          {signals.map((item) => <span key={item.id} className={`attention-dot ${item.level}`} />)}
        </span>
        <IconChevronDown className="attention-trigger-icon" />
      </button>
    </aside>
  );
}
