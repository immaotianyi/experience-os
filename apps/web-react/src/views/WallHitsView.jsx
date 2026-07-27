import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { resolveWallHit } from "../api/core.js";
import { TrustTag, ConfirmButton, shortId } from "../components/trust.jsx";

function WallHitCard({ hit, onResolve }) {
  const [resolving, setResolving] = useState(false);
  const [rationale, setRationale] = useState("");
  const trust = hit.status === "open"
    ? { level: "draft", label: "待处理" }
    : { level: "confirmed", label: "已解决" };

  const handleResolve = async () => {
    setResolving(true);
    const ok = await onResolve(hit.id, rationale.trim() || undefined);
    setResolving(false);
    if (ok) setRationale("");
  };

  return (
    <div className="record-card">
      <header>
        <div>
          <h3>{hit.wallType}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>
            {hit.stage}{hit.id ? ` · ${shortId(hit.id)}` : ""}
          </p>
        </div>
        <TrustTag level={trust.level}>{trust.label}</TrustTag>
      </header>
      <p className="body-copy" style={{ fontSize: "13px" }}>{hit.message}</p>
      {hit.suggestedFixes?.length > 0 && (
        <div className="wallhit-fixes">
          <span className="binding-label">建议修复</span>
          <ul>
            {hit.suggestedFixes.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
      {hit.status === "open" && (
        <div className="wallhit-resolve">
          <input
            type="text"
            className="rationale-input"
            placeholder="解决说明（可选，记录你做了什么）"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            disabled={resolving}
          />
          <ConfirmButton
            label="标记已解决"
            confirmLabel="确认解决？再次点击"
            onConfirm={handleResolve}
            busy={resolving}
          />
        </div>
      )}
    </div>
  );
}

export default function WallHitsView({ refreshKey, toast }) {
  const url = `/api/wallhits?limit=40&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const handleResolve = async (wallHitId, rationale) => {
    try {
      const result = await resolveWallHit({ wallHitId, rationale });
      if (result.error) {
        toast(result.error, "bad");
        return false;
      }
      toast("已标记为已解决", "ok");
      refresh();
      return true;
    } catch (err) {
      toast(err.message, "bad", "操作失败");
      return false;
    }
  };

  const hits = data?.records || [];

  return (
    <>
      <div className="section-head">
        <div>
          <h2>撞墙记录</h2>
          <p>管道执行中遇到的阻塞点及建议修复方案</p>
        </div>
      </div>

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : hits.length === 0 && !loading ? (
        <div className="empty-guide"><h3>暂无撞墙记录</h3><p>管道执行顺畅时不会产生撞墙记录。</p></div>
      ) : (
        <div className="grid-list">
          {hits.map((h) => (
            <WallHitCard key={h.id} hit={h} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </>
  );
}
