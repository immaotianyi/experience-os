import { useFetch } from "../hooks/useFetch.js";

const STATUS_TAG = {
  candidate: "warn",
  draft: "",
  stable: "ok",
  needs_revision: "bad",
  deprecated: "bad"
};

function SkillCard({ skill, onOpen }) {
  return (
    <div className="record-card" onClick={() => onOpen(skill)}>
      <header>
        <div>
          <h3>{skill.name}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>{skill.origin}</p>
        </div>
        <span className={`pill ${STATUS_TAG[skill.status] || ""}`}>{skill.status}</span>
      </header>
      <p className="body-copy" style={{ fontSize: "13px" }}>
        {skill.trigger?.intent || "—"}
      </p>
      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
        <span className="tag">{skill.skillLevel}</span>
        <span className="tag">{skill.safetyLevel}</span>
        {skill.humanConfirmationRequired && <span className="tag warn">需人工确认</span>}
      </div>
    </div>
  );
}

export default function SkillsView({ openDrawer, refreshKey }) {
  const url = `/api/skills?limit=24&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const skills = data?.records || [];

  const openSkill = (skill) => {
    openDrawer({
      eyebrow: "Skill 详情",
      title: skill.name,
      body: (
        <>
          <div className="detail-grid">
            <div><span>ID</span><strong style={{ fontSize: "11px", fontFamily: "monospace" }}>{skill.id}</strong></div>
            <div><span>状态</span><strong>{skill.status}</strong></div>
            <div><span>层级</span><strong>{skill.skillLevel}</strong></div>
            <div><span>安全等级</span><strong>{skill.safetyLevel}</strong></div>
            <div><span>来源</span><strong>{skill.origin}</strong></div>
            <div><span>触发意图</span><strong>{skill.trigger?.intent}</strong></div>
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
        </>
      )
    });
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Skill 库</h2>
          <p>所有已生成的 Skill，按状态分层 (candidate → stable)</p>
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
