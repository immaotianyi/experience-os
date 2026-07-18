import { useFetch } from "../hooks/useFetch.js";

export default function AuditView({ refreshKey }) {
  const url = `/api/review-audit?limit=40&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const entries = data?.entries || [];

  return (
    <>
      <div className="section-head">
        <div>
          <h2>决策审计</h2>
          <p>审查决策的历史记录，追踪每个决策的执行结果</p>
        </div>
      </div>

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : entries.length === 0 && !loading ? (
        <div className="empty-guide"><h3>暂无审计记录</h3><p>审查决策后将自动生成审计条目。</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>目标</th>
              <th>决策</th>
              <th>结果状态</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id || i}>
                <td style={{ fontSize: "12px" }}>{e.createdAt ? new Date(e.createdAt).toLocaleString("zh-CN") : "—"}</td>
                <td>{e.decision?.targetKind || e.packet?.targetKind || "—"}:{e.decision?.targetId?.slice(0, 20) || "—"}</td>
                <td><span className="tag accent">{e.decision?.decision || "—"}</span></td>
                <td>{e.targetStatus || "—"}</td>
                <td style={{ fontSize: "12px", color: "var(--muted)" }}>{e.decision?.rationale?.slice(0, 60) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
