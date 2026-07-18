import { useEffect, useCallback, useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import {
  createEvidence,
  createExperienceReceipt,
  createExperienceReceiptDraft,
  fetchExperienceReceiptDrafts,
  acceptExperienceReceiptDraft,
  rejectExperienceReceiptDraft,
  createProject,
  fetchProjectTimeline,
  createDecision,
  createOutcome,
  captureWorkCheckpoint,
  fetchReadiness,
  promoteExperienceAsset,
  fetchExperienceAssets,
  fetchReuseSuggestions,
  recordReuseFeedback
} from "../api/projects.js";

const MODES = ["explore", "advise", "draft", "execute", "commit"];
const EVIDENCE_TYPES = ["doc", "code", "data", "test", "feedback", "reference", "observation"];

function recordId(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

function ProjectOption({ project, selected, onSelect }) {
  return (
    <button className={`project-option ${selected ? "selected" : ""}`} onClick={() => onSelect(project.id)}>
      <strong>{project.name}</strong>
      <span>{project.status || "planning"} · {project.autonomyMode || "advise"}</span>
    </button>
  );
}

function TimelineItem({ item }) {
  const { record } = item;
  const text = item.kind === "EvidenceLink"
    ? record.title
    : item.kind === "ConversationEvent"
      ? `${record.sourceTool}: ${record.content}`
    : item.kind === "WorkCheckpoint"
      ? record.title
    : item.kind === "ExperienceReceipt"
      ? record.summary
      : item.kind === "DecisionReceipt"
        ? `${record.action}: ${record.rationale}`
        : `${record.action}: ${record.outcome}`;
  const when = item.timestamp ? new Date(item.timestamp).toLocaleString("zh-CN") : "";

  return (
    <article className="timeline-item">
      <span className="timeline-kind">{item.kind}</span>
      <div>
        <strong>{text}</strong>
        <p>{when}</p>
        {record.uncertainty !== null && record.uncertainty !== undefined && (
          <span className="tag warn">不确定性 {Math.round(record.uncertainty * 100)}%</span>
        )}
        {record.applicabilityBounds?.length > 0 && (
          <p className="timeline-meta">适用范围：{record.applicabilityBounds.join("；")}</p>
        )}
      </div>
    </article>
  );
}

export default function ProjectView({ refreshKey, toast }) {
  const { data, loading, error, refresh: refreshProjects } = useFetch(`/api/projects?t=${refreshKey}`);
  const projects = useMemo(
    () => [...(data?.records || [])].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    [data]
  );
  const [selectedId, setSelectedId] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [assets, setAssets] = useState([]);
  const [receiptDrafts, setReceiptDrafts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState("");
  const [projectForm, setProjectForm] = useState({ name: "", goal: "", autonomyMode: "advise" });
  const [evidenceForm, setEvidenceForm] = useState({ type: "observation", title: "", source: "", notes: "", uncertainty: "" });
  const [receiptForm, setReceiptForm] = useState({ phase: "协作", summary: "", outcome: "partial", uncertainty: "", bounds: "", lessons: "" });
  const [checkpointForm, setCheckpointForm] = useState({ title: "", sourceTool: "codex", content: "", notes: "", consented: false });
  const [decisionForm, setDecisionForm] = useState({ action: "验证经验", rationale: "", reviewedBy: "human" });
  const [outcomeForm, setOutcomeForm] = useState({ outcome: "success", notes: "" });

  useEffect(() => {
    if (!selectedId && projects[0]) setSelectedId(projects[0].id);
    if (selectedId && !projects.some((p) => p.id === selectedId)) setSelectedId(projects[0]?.id || "");
  }, [projects, selectedId]);

  const selectedProject = projects.find((project) => project.id === selectedId) || null;

  const loadTimeline = useCallback(async (projectId = selectedId) => {
    if (!projectId) return;
    try {
      const [nextTimeline, nextReadiness, nextAssets, nextDrafts, nextSuggestions] = await Promise.all([
        fetchProjectTimeline(projectId), fetchReadiness(projectId), fetchExperienceAssets(projectId), fetchExperienceReceiptDrafts(projectId), fetchReuseSuggestions(projectId)
      ]);
      setTimeline(nextTimeline);
      setReadiness(nextReadiness);
      setAssets(nextAssets.records || []);
      setReceiptDrafts(nextDrafts.records || []);
      setSuggestions(nextSuggestions.records || []);
    } catch (err) {
      toast(err.message, "bad", "无法读取项目时间线");
    }
  }, [selectedId, toast]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const submitProject = async (event) => {
    event.preventDefault();
    if (!projectForm.name.trim() || !projectForm.goal.trim()) return;
    setSubmitting("project");
    try {
      const project = await createProject({
        id: recordId("project"),
        name: projectForm.name.trim(),
        goal: projectForm.goal.trim(),
        autonomyMode: projectForm.autonomyMode
      });
      setProjectForm({ name: "", goal: "", autonomyMode: "advise" });
      setSelectedId(project.id);
      await refreshProjects();
      toast("项目已开始。系统默认只建议，不会自行执行。", "ok", "项目已创建");
    } catch (err) {
      toast(err.message, "bad", "创建失败");
    } finally {
      setSubmitting("");
    }
  };

  const submitEvidence = async (event) => {
    event.preventDefault();
    if (!selectedProject || !evidenceForm.title.trim() || !evidenceForm.source.trim()) return;
    setSubmitting("evidence");
    try {
      await createEvidence({
        id: recordId("evidence"), projectId: selectedProject.id,
        type: evidenceForm.type, title: evidenceForm.title.trim(), source: evidenceForm.source.trim(),
        notes: evidenceForm.notes.trim(),
        uncertainty: evidenceForm.uncertainty === "" ? null : Number(evidenceForm.uncertainty)
      });
      setEvidenceForm({ type: "observation", title: "", source: "", notes: "", uncertainty: "" });
      await Promise.all([refreshProjects(), loadTimeline()]);
      toast("证据已保存，可随时回看来源。", "ok", "已记录证据");
    } catch (err) {
      toast(err.message, "bad", "保存失败");
    } finally {
      setSubmitting("");
    }
  };

  const submitReceipt = async (event) => {
    event.preventDefault();
    if (!selectedProject || !receiptForm.summary.trim()) return;
    setSubmitting("receipt");
    try {
      const evidenceLinkIds = timeline?.timeline
        .filter((item) => item.kind === "EvidenceLink")
        .map((item) => item.record.id) || [];
      await createExperienceReceipt({
        id: recordId("receipt"), projectId: selectedProject.id,
        phase: receiptForm.phase.trim() || "协作",
        summary: receiptForm.summary.trim(), evidenceLinkIds,
        outcome: receiptForm.outcome,
        uncertainty: receiptForm.uncertainty === "" ? null : Number(receiptForm.uncertainty),
        applicabilityBounds: receiptForm.bounds.split("\n").map((item) => item.trim()).filter(Boolean),
        lessonsLearned: receiptForm.lessons.split("\n").map((item) => item.trim()).filter(Boolean),
        autonomyMode: selectedProject.autonomyMode || "advise"
      });
      setReceiptForm({ phase: "协作", summary: "", outcome: "partial", uncertainty: "", bounds: "", lessons: "" });
      await Promise.all([refreshProjects(), loadTimeline()]);
      toast("Experience Receipt 已生成；它是可追溯的压缩，不是永久结论。", "ok", "已沉淀经验");
    } catch (err) {
      toast(err.message, "bad", "生成失败");
    } finally {
      setSubmitting("");
    }
  };

  const submitCheckpoint = async (event) => {
    event.preventDefault();
    if (!selectedProject || !checkpointForm.title.trim() || !checkpointForm.content.trim() || !checkpointForm.consented) return;
    setSubmitting("checkpoint");
    try {
      await captureWorkCheckpoint({
        id: recordId("checkpoint"), eventId: recordId("event"), evidenceId: recordId("evidence"),
        projectId: selectedProject.id, title: checkpointForm.title.trim(),
        content: checkpointForm.content.trim(), sourceTool: checkpointForm.sourceTool.trim() || "manual",
        notes: checkpointForm.notes.trim(), actor: "human", consented: true
      });
      setCheckpointForm({ title: "", sourceTool: checkpointForm.sourceTool, content: "", notes: "", consented: false });
      await Promise.all([refreshProjects(), loadTimeline()]);
      toast("工作节点已保存：原始片段和证据都留在本地，可随时回看。", "ok", "已保存工作节点");
    } catch (err) { toast(err.message, "bad", "保存失败"); } finally { setSubmitting(""); }
  };

  const createDraft = async () => {
    const checkpointIds = timeline?.timeline.filter((item) => item.kind === "WorkCheckpoint").slice(0, 3).map((item) => item.record.id) || [];
    if (!selectedProject || checkpointIds.length === 0) return;
    setSubmitting("receipt-draft");
    try {
      await createExperienceReceiptDraft({ id: recordId("receipt_draft"), projectId: selectedProject.id, checkpointIds });
      await loadTimeline();
      toast("系统已提出一份带来源的草案。它还不是经验，也不会自动复用。", "ok", "收据草案已生成");
    } catch (err) { toast(err.message, "bad", "草案生成失败"); } finally { setSubmitting(""); }
  };

  const acceptDraft = async (draft) => {
    setSubmitting(`accept-draft-${draft.id}`);
    try {
      await acceptExperienceReceiptDraft({ draftId: draft.id, receiptId: recordId("receipt"), actor: "human" });
      await Promise.all([refreshProjects(), loadTimeline()]);
      toast("草案已由你确认并成为正式收据；接下来仍需要真实结果验证。", "ok", "已确认收据");
    } catch (err) { toast(err.message, "bad", "确认失败"); } finally { setSubmitting(""); }
  };

  const rejectDraft = async (draft) => {
    setSubmitting(`reject-draft-${draft.id}`);
    try {
      await rejectExperienceReceiptDraft({ draftId: draft.id, actor: "human" });
      await loadTimeline();
      toast("草案已丢弃，不会影响原始工作节点和证据。", "ok", "已丢弃草案");
    } catch (err) { toast(err.message, "bad", "丢弃失败"); } finally { setSubmitting(""); }
  };

  const feedbackSuggestion = async (assetId, decision) => {
    setSubmitting(`reuse-${assetId}`);
    try { await recordReuseFeedback({ projectId: selectedProject.id, assetId, decision }); setSuggestions((items) => items.filter((item) => item.assetId !== assetId)); toast("反馈已记录；系统不会把它直接当成永久偏好。", "ok", "已记录复用反馈"); }
    catch (err) { toast(err.message, "bad", "反馈失败"); } finally { setSubmitting(""); }
  };

  const submitDecision = async (event) => {
    event.preventDefault();
    const evidenceLinkIds = timeline?.timeline.filter((item) => item.kind === "EvidenceLink").map((item) => item.record.id) || [];
    const receipt = timeline?.timeline.find((item) => item.kind === "ExperienceReceipt")?.record;
    if (!selectedProject || !receipt || !decisionForm.rationale.trim() || !evidenceLinkIds.length) return;
    setSubmitting("decision");
    try {
      await createDecision({
        id: recordId("decision"), projectId: selectedProject.id, action: decisionForm.action,
        target: receipt.id, receiptId: receipt.id, rationale: decisionForm.rationale.trim(), evidenceLinkIds,
        autonomyMode: selectedProject.autonomyMode, humanReviewed: true, reviewedBy: decisionForm.reviewedBy.trim() || "human"
      });
      setDecisionForm({ action: "验证经验", rationale: "", reviewedBy: decisionForm.reviewedBy });
      await loadTimeline();
      toast("决策已留下审查收据。", "ok", "已记录决策");
    } catch (err) { toast(err.message, "bad", "记录失败"); } finally { setSubmitting(""); }
  };

  const submitOutcome = async (event) => {
    event.preventDefault();
    const decision = timeline?.timeline.find((item) => item.kind === "DecisionReceipt")?.record;
    const evidenceLinkIds = timeline?.timeline.filter((item) => item.kind === "EvidenceLink").map((item) => item.record.id) || [];
    if (!selectedProject || !decision || !evidenceLinkIds.length) return;
    setSubmitting("outcome");
    try {
      await createOutcome({
        id: recordId("outcome"), projectId: selectedProject.id, decisionReceiptId: decision.id,
        action: decision.action, outcome: outcomeForm.outcome, notes: outcomeForm.notes.trim(), evidenceLinkIds
      });
      setOutcomeForm({ outcome: "success", notes: "" });
      await loadTimeline();
      toast("结果已经回写到经验链路。", "ok", "已记录结果");
    } catch (err) { toast(err.message, "bad", "记录失败"); } finally { setSubmitting(""); }
  };

  const promoteEligible = async (entry) => {
    const outcome = timeline?.timeline.find((item) => item.kind === "OutcomeRecord" && item.record.decisionReceiptId === entry.decisionReceiptId)?.record;
    if (!selectedProject || !outcome) return;
    setSubmitting(`promote-${entry.receiptId}`);
    try {
      await promoteExperienceAsset({
        id: recordId("experience_asset"), projectId: selectedProject.id, receiptId: entry.receiptId,
        decisionReceiptId: entry.decisionReceiptId, outcomeRecordId: outcome.id,
        title: `已验证经验：${entry.receiptId}`, approvedBy: "human"
      });
      await loadTimeline();
      toast("经验已升级为可复用资产，仍保留它的来源与边界。", "ok", "已升级经验");
    } catch (err) { toast(err.message, "bad", "升级失败"); } finally { setSubmitting(""); }
  };

  if (loading && !data) return <div className="skeleton" style={{ height: "240px" }}>加载中</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="project-workspace">
      <section className="project-intro">
        <div>
          <p className="eyebrow">3.0 Main Loop</p>
          <h2>从真实工作开始</h2>
          <p>先记录事实和上下文，再提炼经验。系统默认只提供建议；每一条沉淀都保留来源、边界与不确定性。</p>
        </div>
        <span className="tag accent">默认：advise</span>
      </section>

      <div className="project-layout">
        <aside className="project-list panel">
          <div className="section-head"><h3>项目</h3><span className="pill">{projects.length}</span></div>
          <div className="project-options">
            {projects.map((project) => <ProjectOption key={project.id} project={project} selected={project.id === selectedId} onSelect={setSelectedId} />)}
            {projects.length === 0 && <p className="empty">还没有项目。从右侧开始一项真实工作。</p>}
          </div>
        </aside>

        <div className="project-main">
          {!selectedProject ? (
            <form className="panel project-form" onSubmit={submitProject}>
              <div className="section-head"><div><h2>开始一个项目</h2><p>这不是创建一个新的管理条目，而是把此刻要完成的工作变成可追溯的协作上下文。</p></div></div>
              <label>项目名称<input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="例如：Experience OS 3.0 Alpha" /></label>
              <label>你要达成什么<textarea value={projectForm.goal} onChange={(e) => setProjectForm({ ...projectForm, goal: e.target.value })} placeholder="用自己的话描述目标、问题或交付物。" /></label>
              <label>本次自治等级<select value={projectForm.autonomyMode} onChange={(e) => setProjectForm({ ...projectForm, autonomyMode: e.target.value })}>{MODES.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <button className="primary-btn" disabled={submitting === "project"}>开始项目</button>
            </form>
          ) : (
            <>
              <section className="panel project-brief">
                <div><p className="eyebrow">当前项目</p><h2>{selectedProject.name}</h2><p className="body-copy">{selectedProject.goal}</p></div>
                <div className="project-facts"><span className="tag">{selectedProject.status}</span><span className="tag accent">{selectedProject.autonomyMode}</span></div>
              </section>

              <form className="panel project-form checkpoint-form" onSubmit={submitCheckpoint}>
                <div className="section-head"><div><p className="eyebrow">第一步</p><h3>保存一个工作节点</h3><p>在自然工作告一段落时，留下一段你愿意保存的上下文。EOS 会保留原文和可追溯证据，之后才建议形成经验收据。</p></div></div>
                <div className="checkpoint-grid">
                  <label>这段工作叫什么<input value={checkpointForm.title} onChange={(e) => setCheckpointForm({ ...checkpointForm, title: e.target.value })} placeholder="例如：修复登录测试的失败原因" /></label>
                  <label>来源工具<input value={checkpointForm.sourceTool} onChange={(e) => setCheckpointForm({ ...checkpointForm, sourceTool: e.target.value })} placeholder="Codex、终端、IDE..." /></label>
                </div>
                <label>发生了什么<textarea value={checkpointForm.content} onChange={(e) => setCheckpointForm({ ...checkpointForm, content: e.target.value })} placeholder="用你自己的话记录关键讨论、尝试、发现或决定。它只会保存到本地项目 Vault。" /></label>
                <label>为什么值得留下（可选）<textarea value={checkpointForm.notes} onChange={(e) => setCheckpointForm({ ...checkpointForm, notes: e.target.value })} placeholder="例如：下次遇到同类问题，先检查 Schema 与测试边界。" /></label>
                <div className="checkpoint-submit"><label className="project-check"><input type="checkbox" checked={checkpointForm.consented} onChange={(e) => setCheckpointForm({ ...checkpointForm, consented: e.target.checked })} />我同意将这段内容保存在本地项目记录中</label><button className="primary-btn" disabled={submitting === "checkpoint" || !checkpointForm.consented}>保存工作节点</button></div>
              </form>

              <section className="panel receipt-draft-panel">
                <div className="section-head"><div><p className="eyebrow">第二步</p><h3>由工作节点提出收据草案</h3><p>只读取最近三个已保存节点。AI 必须附着于已有来源；它提出，不替你下结论。</p></div><button className="ghost-btn" type="button" disabled={submitting === "receipt-draft" || !(timeline?.counts?.checkpoints > 0)} onClick={createDraft}>生成草案</button></div>
                {timeline?.counts?.checkpoints === 0 && <p className="empty">先保存一个工作节点，草案才有可引用的事实基础。</p>}
                <div className="receipt-draft-list">
                  {receiptDrafts.filter((draft) => draft.status === "pending_review").map((draft) => <article className="receipt-draft" key={draft.id}>
                    <div><span className="tag warn">待你确认</span><strong>{draft.phase}</strong><p>{draft.summary}</p></div>
                    <p className="timeline-meta">引用 {draft.checkpointIds.length} 个工作节点、{draft.evidenceLinkIds.length} 条证据；模型：{draft.generatedBy.provider}/{draft.generatedBy.model}</p>
                    {draft.uncertainty !== null && <span className="tag warn">不确定性 {Math.round(draft.uncertainty * 100)}%</span>}
                    {draft.applicabilityBounds?.length > 0 && <p className="timeline-meta">适用边界：{draft.applicabilityBounds.join("；")}</p>}
                    <div className="receipt-draft-actions"><button className="primary-btn" type="button" disabled={submitting === `accept-draft-${draft.id}`} onClick={() => acceptDraft(draft)}>确认成收据</button><button className="text-button" type="button" disabled={submitting === `reject-draft-${draft.id}`} onClick={() => rejectDraft(draft)}>丢弃草案</button></div>
                  </article>)}
                  {receiptDrafts.filter((draft) => draft.status === "pending_review").length === 0 && timeline?.counts?.checkpoints > 0 && <p className="empty">还没有待确认草案。系统不会在后台自行提炼。</p>}
                </div>
              </section>

              <section className="panel receipt-draft-panel">
                <div className="section-head"><div><p className="eyebrow">下次可用</p><h3>已验证经验建议</h3><p>只显示其他项目中已经过证据、审查和结果验证的经验。不会自动套用。</p></div><span className="pill">最多 3 条</span></div>
                <div className="receipt-draft-list">{suggestions.map((item) => <article className="receipt-draft" key={item.assetId}><strong>{item.title}</strong><p>{item.summary}</p><p className="timeline-meta">{item.reason} 适用边界：{item.applicabilityBounds.join("；") || "未声明"}</p><div className="receipt-draft-actions"><button className="primary-btn" type="button" disabled={submitting === `reuse-${item.assetId}`} onClick={() => feedbackSuggestion(item.assetId, "adopted")}>采纳</button><button className="text-button" type="button" onClick={() => feedbackSuggestion(item.assetId, "ignored")}>忽略</button><button className="text-button" type="button" onClick={() => feedbackSuggestion(item.assetId, "not_applicable")}>不适用</button></div></article>)}{suggestions.length === 0 && <p className="empty">还没有与当前项目足够相关的已验证经验。</p>}</div>
              </section>

              <div className="project-actions">
                <form className="panel project-form" onSubmit={submitEvidence}>
                  <div className="section-head"><div><h3>记录证据</h3><p>保存你正在依据的材料，而非让总结脱离来源。</p></div></div>
                  <label>类型<select value={evidenceForm.type} onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}>{EVIDENCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                  <label>标题<input value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} placeholder="例如：用户测试的反例" /></label>
                  <label>来源<textarea value={evidenceForm.source} onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })} placeholder="文件路径、链接、提交号或观察记录。" /></label>
                  <label>不确定性（0-1，可留空）<input type="number" min="0" max="1" step="0.05" value={evidenceForm.uncertainty} onChange={(e) => setEvidenceForm({ ...evidenceForm, uncertainty: e.target.value })} /></label>
                  <button className="ghost-btn" disabled={submitting === "evidence"}>保存证据</button>
                </form>

                <form className="panel project-form" onSubmit={submitReceipt}>
                  <div className="section-head"><div><h3>生成 Experience Receipt</h3><p>说明发生了什么、依据什么、在哪里仍然不确定。</p></div></div>
                  <label>阶段<input value={receiptForm.phase} onChange={(e) => setReceiptForm({ ...receiptForm, phase: e.target.value })} /></label>
                  <label>事实性总结<textarea value={receiptForm.summary} onChange={(e) => setReceiptForm({ ...receiptForm, summary: e.target.value })} placeholder="写下已尝试的路径、当前结果与尚未解决的问题。" /></label>
                  <label>结果<select value={receiptForm.outcome} onChange={(e) => setReceiptForm({ ...receiptForm, outcome: e.target.value })}><option value="success">success</option><option value="partial">partial</option><option value="failure">failure</option><option value="unknown">unknown</option></select></label>
                  <label>不确定性（0-1，可留空）<input type="number" min="0" max="1" step="0.05" value={receiptForm.uncertainty} onChange={(e) => setReceiptForm({ ...receiptForm, uncertainty: e.target.value })} /></label>
                  <label>适用边界（每行一条）<textarea value={receiptForm.bounds} onChange={(e) => setReceiptForm({ ...receiptForm, bounds: e.target.value })} placeholder="例如：仅适用于单用户本地 Vault" /></label>
                  <button className="primary-btn" disabled={submitting === "receipt"}>沉淀这段经验</button>
                </form>
              </div>

              <section className="project-validation">
                <div className="section-head"><div><h3>验证与升级</h3><p>一段经验必须先有证据、被人审查、再被真实结果验证，才会成为可复用资产。</p></div><span className="pill">{assets.length} 已升级</span></div>
                <div className="project-actions">
                  <form className="panel project-form" onSubmit={submitDecision}>
                    <h3>人工审查决策</h3>
                    <label>动作<input value={decisionForm.action} onChange={(e) => setDecisionForm({ ...decisionForm, action: e.target.value })} /></label>
                    <label>为什么<textarea value={decisionForm.rationale} onChange={(e) => setDecisionForm({ ...decisionForm, rationale: e.target.value })} placeholder="说明你为什么认可、修改或否决这条路径。" /></label>
                    <button className="ghost-btn" disabled={submitting === "decision"}>记录审查</button>
                  </form>
                  <form className="panel project-form" onSubmit={submitOutcome}>
                    <h3>观察实际结果</h3>
                    <label>结果<select value={outcomeForm.outcome} onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })}><option value="success">success</option><option value="partial">partial</option><option value="failure">failure</option></select></label>
                    <label>观察说明<textarea value={outcomeForm.notes} onChange={(e) => setOutcomeForm({ ...outcomeForm, notes: e.target.value })} placeholder="测试、运行或用户反馈告诉了你什么？" /></label>
                    <button className="ghost-btn" disabled={submitting === "outcome"}>记录结果</button>
                  </form>
                </div>
                <div className="readiness-list">
                  {readiness?.receipts?.map((entry) => <article className="readiness-item" key={entry.receiptId}><div><strong>{entry.receiptId}</strong><p>{entry.eligible ? "证据、人工审查与成功结果已齐备。" : entry.reasons.join("；")}</p></div>{entry.eligible && <button className="primary-btn" disabled={submitting === `promote-${entry.receiptId}`} onClick={() => promoteEligible(entry)}>升级为经验资产</button>}</article>)}
                  {readiness?.receipts?.length === 0 && <p className="empty">先生成一条 Experience Receipt，系统会在这里解释它离可复用还差什么。</p>}
                </div>
              </section>

              <section className="panel timeline-panel">
                <div className="section-head"><div><h3>项目时间线</h3><p>你能看到系统依据什么形成了每一段经验。</p></div><span className="pill">{timeline?.timeline?.length || 0}</span></div>
                <div className="timeline-list">
                  {timeline?.timeline?.map((item) => <TimelineItem key={`${item.kind}-${item.record.id}`} item={item} />)}
                  {timeline && timeline.timeline.length === 0 && <p className="empty">从一条证据或一段 Experience Receipt 开始。</p>}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
