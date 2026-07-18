import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { submitReviewDecision } from "../api/core.js";

function ReviewCard({ packet, onDecide }) {
  const [deciding, setDeciding] = useState(false);
  const options = packet.options || [];

  const handleDecide = async (decisionId) => {
    setDeciding(true);
    await onDecide(packet, decisionId);
    setDeciding(false);
  };

  return (
    <div className="review-card">
      <div className="review-title">
        <h3>{packet.title}</h3>
        <span className="tag">{packet.targetKind}</span>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: "12px" }}>{packet.recommendation}</p>
        {packet.status === "decided" && <span className="pill ok" style={{ marginTop: "8px" }}>已决定</span>}
      </div>
      <div style={{ padding: "16px" }}>
        <p className="body-copy" style={{ fontSize: "13px", margin: "0 0 10px" }}>{packet.why}</p>
        {packet.evidence?.length > 0 && (
          <ul style={{ margin: "0 0 10px", paddingLeft: "18px", fontSize: "12px", color: "var(--muted)" }}>
            {packet.evidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        <div className="decision-stack">
          {options.map((opt) => (
            <button
              key={opt.id}
              className={`decision-button ${opt.id === packet.defaultOption ? "primary" : ""}`}
              onClick={() => handleDecide(opt.id)}
              disabled={deciding || packet.status === "decided"}
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

  const handleDecide = async (packet, decision) => {
    try {
      const result = await submitReviewDecision({
        reviewPacketId: packet.id,
        decision,
        rationale: "web ui decision"
      });
      if (result.error) {
        toast(result.error, "bad", "决策失败");
      } else {
        toast(`已决策: ${decision}`, "ok");
        refresh();
      }
    } catch (err) {
      toast(err.message, "bad", "决策失败");
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
