import { useFetch } from "../hooks/useFetch.js";
import { TrustTag, BindingCard, shortId } from "../components/trust.jsx";

/* Skill 状态 → 信任等级映射（对齐后端 domain.js 状态枚举）
   candidate          → L1 draft   候选·待验证
   candidate_retained → L1 draft   保留候选
   candidate_confirmed→ L2 confirmed 已确认候选
   stable             → L3 verified  已验证
   needs_revision     → L2 confirmed 需修订
   rejected           → L0 source  已否决
   deprecated         → L0 source  已废弃 */
const STATUS_TRUST = {
  candidate: { level: "draft", label: "候选·待验证" },
  candidate_retained: { level: "draft", label: "保留候选" },
  candidate_confirmed: { level: "confirmed", label: "已确认候选" },
  stable: { level: "verified", label: "已验证" },
  needs_revision: { level: "confirmed", label: "需修订" },
  rejected: { level: "source", label: "已否决" },
  deprecated: { level: "source", label: "已废弃" }
};

function SkillCard({ skill, onOpen }) {
  const trust = STATUS_TRUST[skill.status] || { level: "source", label: skill.status || "未知" };
  return (
    <div
      className="record-card"
      role="button"
      tabIndex={0}
      aria-label={`${skill.name}（${trust.label}）`}
      onClick={() => onOpen(skill)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(skill);
        }
      }}
    >
      <header>
        <div>
          <h3>{skill.name}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>{skill.origin}</p>
        </div>
        <TrustTag level={trust.level}>{trust.label}</TrustTag>
      </header>
      <p className="body-copy" style={{ fontSize: "13px" }}>
        {skill.trigger?.intent || "—"}
      </p>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
        <span className="tag">{skill.skillLevel}</span>
        <span className="tag">{skill.safetyLevel}</span>
        {skill.humanConfirmationRequired && <TrustTag level="confirmed">需人工确认</TrustTag>}
      </div>
    </div>
  );
}

export default function SkillsView({ openDrawer, refreshKey }) {
  const url = `/api/skills?limit=24&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const skills = data?.records || [];

  const openSkill = (skill) => {
    const trust = STATUS_TRUST[skill.status] || { level: "source", label: skill.status };
    openDrawer({
      eyebrow: "Skill 详情",
      title: skill.name,
      body: (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <TrustTag level={trust.level}>{trust.label}</TrustTag>
            {skill.humanConfirmationRequired && <TrustTag level="confirmed">需人工确认</TrustTag>}
          </div>
          <BindingCard
            label="触发意图"
            title={skill.trigger?.intent || "—"}
            meta={`ID ${shortId(skill.id)}`}
          />
          <div className="detail-grid">
            <div><span>层级</span><strong>{skill.skillLevel}</strong></div>
            <div><span>安全等级</span><strong>{skill.safetyLevel}</strong></div>
            <div><span>来源</span><strong>{skill.origin}</strong></div>
            <div><span>状态</span><strong>{skill.status}</strong></div>
          </div>
          <div className="detail-section">
            <h3>触发信号</h3>
            <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "13px" }}>
              {(skill.trigger?.signals || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          {skill.inputSchema && (
            <div className="detail-section">
              <h3>输入 Schema</h3>
              <pre>{JSON.stringify(skill.inputSchema, null, 2)}</pre>
            </div>
          )}
          {skill.fallback && (
            <div className="detail-section">
              <h3>降级策略</h3>
              <p className="body-copy" style={{ fontSize: "13px" }}>{skill.fallback}</p>
            </div>
          )}
          {skill.lastReviewDecisionId && (
            <div className="detail-section">
              <h3>最近审查</h3>
              <p className="trust-meta">决策 ID {shortId(skill.lastReviewDecisionId)}</p>
              {skill.reviewedAt && (
                <p className="trust-meta">审查时间 {new Date(skill.reviewedAt).toLocaleString("zh-CN")}</p>
              )}
            </div>
          )}
        </>
      )
    });
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Skill 库</h2>
          <p>所有已生成的 Skill，按信任等级分层（候选 → 已验证）</p>
        </div>
      </div>

      {error ? (
        <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>
      ) : skills.length === 0 && !loading ? (
        <div className="empty-guide"><h3>暂无 Skill</h3><p>运行自迭代引擎后将生成候选 Skill。</p></div>
      ) : (
        <div className="grid-list">
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s} onOpen={openSkill} />
          ))}
        </div>
      )}
    </>
  );
}
