import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { submitReviewDecision } from "../api/core.js";
import { TrustTag, BindingCard, shortId } from "../components/trust.jsx";

function ReviewCard({ packet, onDecide }) {
  const [deciding, setDeciding] = useState(false);
  const [rationale, setRationale] = useState("");
  const [pendingDecision, setPendingDecision] = useState(null);
  const options = packet.options || [];
  const isDecided = packet.status === "decided";
  const trust = isDecided
    ? { level: "confirmed", label: "已决策" }
    : { level: "draft", label: "待决策" };

  const handleDecide = async (decisionId) => {
    if (!rationale.trim()) {
      setPendingDecision(decisionId);
      return;
    }
    setDeciding(true);
    const ok = await onDecide(packet, decisionId, rationale.trim());
    setDeciding(false);
    if (ok) setRationale("");
  };

  const handleRationaleChange = (e) => {
    setRationale(e.target.value);
    if (e.target.value.trim() && pendingDecision) {
      setPendingDecision(null);
    }
  };

  return (
    <div className="review-card">
      <div className="review-title">
        <h3>{packet.title}</h3>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
          <TrustTag level={trust.level}>{trust.label}</TrustTag>
          <span className="tag">{packet.targetKind}</span>
        </div>
        {packet.recommendation && (
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "12px" }}>
            建议：{packet.recommendation}
          </p>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <BindingCard
          label="审查目标"
          title={packet.targetKind || "—"}
          meta={`ID ${shortId(packet.targetId)}`}
        />
        <p className="body-copy" style={{ fontSize: "13px", margin: "12px 0 10px" }}>{packet.why}</p>
        {packet.evidence?.length > 0 && (
          <div className="wallhit-fixes" style={{ marginBottom: "12px" }}>
            <span className="binding-label">证据</span>
            <ul>
              {packet.evidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
        <div className="rationale-note">
          <label htmlFor={`rationale-${packet.id}`} className="binding-label">决策理由</label>
          <textarea
            id={`rationale-${packet.id}`}
            className="rationale-input"
            placeholder="为什么这样决定？（必填，会写入审计记录）"
            value={rationale}
            onChange={handleRationaleChange}
            disabled={deciding || isDecided}
            rows={2}
          />
          {pendingDecision && !rationale.trim() && (
            <span className="field-error">请先填写决策理由。</span>
          )}
        </div>
        <div className="decision-stack">
          {options.map((opt) => (
            <button
              key={opt.id}
              className={`decision-button ${opt.id === packet.defaultOption ? "primary" : ""}`}
              onClick={() => handleDecide(opt.id)}
              disabled={deciding || isDecided || !rationale.trim()}
            >
              <strong>{opt.label || opt.id}</strong>
              {opt.description && <span>{opt.description}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReviewView({ refreshKey, toast }) {
  const url = `/api/review-packets?limit=40&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const handleDecide = async (packet, decision, rationale) => {
    try {
      const result = await submitReviewDecision({
        reviewPacketId: packet.id,
        decision,
        rationale
      });
      if (result.error) {
        toast(result.error, "bad", "决策失败");
        return false;
      }
      toast(`已决策: ${decision}`, "ok");
      refresh();
      return true;
    } catch (err) {
      toast(err.message, "bad", "决策失败");
      return false;
    }
  };

  const packets = data?.records || [];

  return (
    <>
      <div className="section-head">
        <div>
          <h2>审查包队列</h2>
          <p>线性化的审查决策流，每个包包含推荐、证据和可选决策</p>
        </div>
      </div>

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : packets.length === 0 && !loading ? (
        <div className="empty-guide"><h3>暂无审查包</h3><p>生产管道运行后将自动生成审查包。</p></div>
      ) : (
        <div className="review-list">
          {packets.map((p) => (
            <ReviewCard key={p.id} packet={p} onDecide={handleDecide} />
          ))}
        </div>
      )}
    </>
  );
}
