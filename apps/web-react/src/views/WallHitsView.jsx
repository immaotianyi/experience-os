import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { resolveWallHit } from "../api/core.js";

function WallHitCard({ hit, onResolve }) {
  const [resolving, setResolving] = useState(false);
  const statusTag = hit.status === "open" ? "bad" : hit.status === "resolved" ? "ok" : "";

  const handleResolve = async () => {
    setResolving(true);
    await onResolve(hit.id);
    setResolving(false);
  };

  return (
    <div className="record-card">
      <header>
        <div>
          <h3>{hit.wallType}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>{hit.stage}</p>
        </div>
        <span className={`pill ${statusTag}`}>{hit.status}</span>
      </header>
      <p className="body-copy" style={{ fontSize: "13px" }}>{hit.message}</p>
      {hit.suggestedFixes?.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12px", color: "var(--muted)" }}>
          {hit.suggestedFixes.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
      {hit.status === "open" && (
        <button className="text-button" onClick={handleResolve} disabled={resolving}>
          {resolving ? "处理中..." : "标记已解决"}
        </button>
      )}
    </div>
  );
}

export default function WallHitsView({ refreshKey, toast }) {
  const url = `/api/wallhits?limit=40&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const handleResolve = async (wallHitId) => {
    try {
      const result = await resolveWallHit({ wallHitId });
      if (result.error) {
        toast(result.error, "bad");
      } else {
        toast("已标记为已解决", "ok");
        refresh();
      }
    } catch (err) {
      toast(err.message, "bad", "操作失败");
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
