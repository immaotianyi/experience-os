import { useFetch } from "../hooks/useFetch.js";
import { TrustTag, shortId, KIND_LABELS } from "../components/trust.jsx";

/* 区分人工 vs 系统决策：rationale 含 "web ui" 或 "人工" → 人工；
   其他 → 系统。未来后端若新增 actor 字段可直接替换此判定。 */
function decisionSource(rationale) {
  if (!rationale) return { level: "source", label: "系统" };
  const r = rationale.toLowerCase();
  if (r.includes("web ui") || r.includes("人工") || r.includes("human")) {
    return { level: "confirmed", label: "人工" };
  }
  return { level: "source", label: "系统" };
}

function targetTrust(status) {
  if (!status || status === "missing") return { level: "source", label: "断链" };
  return null;
}

function AuditRow({ entry }) {
  const src = decisionSource(entry.decision?.rationale);
  const tgt = targetTrust(entry.targetStatus);
  const broken = !entry.linked;
  const targetKind = entry.decision?.targetKind || entry.packet?.targetKind || "—";
  const targetLabel = KIND_LABELS[targetKind] || targetKind;

  return (
    <tr className={broken ? "audit-broken" : ""}>
      <td className="timeline-time">
        {entry.createdAt ? new Date(entry.createdAt).toLocaleString("zh-CN") : "—"}
      </td>
      <td>
        <TrustTag level={src.level}>{src.label}</TrustTag>
      </td>
      <td>
        <span className="timeline-kind">{targetLabel}</span>
        <span className="trust-meta" style={{ display: "block" }}>
          {shortId(entry.decision?.targetId)}
        </span>
      </td>
      <td>
        <span className="tag accent">{entry.decision?.decision || "—"}</span>
      </td>
      <td>
        {broken ? (
          <TrustTag level="source">断链</TrustTag>
        ) : tgt ? (
          <TrustTag level={tgt.level}>{tgt.label}</TrustTag>
        ) : (
          <span className="trust-meta">{entry.targetStatus}</span>
        )}
      </td>
      <td className="audit-rationale">
        {entry.decision?.rationale || "—"}
      </td>
    </tr>
  );
}

export default function AuditView({ refreshKey }) {
  const url = `/api/review-audit?limit=40&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const entries = data?.entries || [];
  const brokenCount = data?.brokenLinkCount ?? entries.filter((e) => !e.linked).length;

  return (
    <>
      <div className="section-head">
        <div>
          <h2>决策审计</h2>
          <p>审查决策的历史记录，追踪每个决策的执行结果与来源（人工 vs 系统）</p>
        </div>
      </div>

      {brokenCount > 0 && (
        <div className="next-action" style={{ marginBottom: "16px", borderColor: "var(--bad)" }}>
          <div>
            <span className="eyebrow">需要关注</span>
            <p>发现 {brokenCount} 条断链记录：决策已写入但目标资产缺失，可能需要重建目标或补写回链。</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : entries.length === 0 && !loading ? (
        <div className="empty-guide"><h3>暂无审计记录</h3><p>审查决策后将自动生成审计条目。</p></div>
      ) : (
        <table className="data-table audit-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>来源</th>
              <th>目标</th>
              <th>决策</th>
              <th>结果</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <AuditRow key={e.id || i} entry={e} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
