import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { IconChevronDown } from "../components/icons.jsx";
import { TrustTag, ConfirmButton, BindingCard, shortId, truncate, KIND_LABELS } from "../components/trust.jsx";
import {
  createEvidence,
  fetchLLMStatus,
  createExperienceReceipt,
  createExperienceReceiptDraft,
  fetchExperienceReceiptDrafts,
  acceptExperienceReceiptDraft,
  rejectExperienceReceiptDraft,
  deferExperienceReceiptDraft,
  resumeExperienceReceiptDraft,
  createProject,
  fetchProjectTimeline,
  createDecision,
  createOutcome,
  captureWorkCheckpoint,
  fetchReadiness,
  fetchProjectTrialEvidence,
  promoteExperienceAsset,
  fetchExperienceAssets,
  fetchReuseSuggestions,
  recordReuseFeedback,
  fetchExperienceReuseTrials,
  startExperienceReuseTrial,
  completeExperienceReuseTrial,
  fetchCapturePermitRequests,
  approveCapturePermitRequest,
  rejectCapturePermitRequest
} from "../api/projects.js";

const MODES = ["explore", "advise", "draft", "execute", "commit"];
const EVIDENCE_TYPES = ["doc", "code", "data", "test", "feedback", "reference", "observation"];

function recordId(prefix) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

function uncertaintyError(value) {
  if (value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) return "需为 0 到 1 之间的数字，也可留空。";
  return null;
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
  // Defensive: if record is missing/corrupt, render a minimal placeholder
  if (!record) {
    return (
      <article className="timeline-item">
        <span className="timeline-kind">{KIND_LABELS[item.kind] || item.kind}</span>
        <div>
          <strong className="muted">记录数据缺失</strong>
          <p className="timeline-time">{item.timestamp ? new Date(item.timestamp).toLocaleString("zh-CN") : ""}</p>
        </div>
      </article>
    );
  }
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
      <span className="timeline-kind">{KIND_LABELS[item.kind] || item.kind}</span>
      <div>
        <strong>{text}</strong>
        <p className="timeline-time">{when}</p>
        {(record.consented === true) && <span className="tag ok">已同意保存</span>}
        {record.capturePermitId && <span className="tag accent">严格许可 {shortId(record.capturePermitId)}</span>}
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

/* ——— 已验证经验建议卡：来源链 + 拒绝可留原因 ——— */
function SuggestionCard({ item, sourceName, submitting, onFeedback, onAdopt }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [note, setNote] = useState("");

  const openNote = (decision) => {
    setPendingDecision(decision);
    setNoteOpen(true);
  };

  const submitWithNote = () => {
    if (pendingDecision === "adopted") onAdopt(item.assetId, note.trim());
    else onFeedback(item.assetId, pendingDecision, note.trim());
    setNoteOpen(false);
    setNote("");
    setPendingDecision(null);
  };

  return (
    <article className="trust-draft-card" style={{ borderStyle: "solid", borderColor: "var(--line)" }}>
      <div>
        <TrustTag level="verified">已验证·可复用</TrustTag>
        <strong>{item.title}</strong>
        <p>{item.summary}</p>
      </div>
      <p className="trust-meta">
        来自项目「{sourceName}」· {item.reason} 适用边界：{(item.applicabilityBounds || []).join("；") || "未声明"}
      </p>
      {!noteOpen ? (
        <div className="receipt-draft-actions">
          <button className="primary-btn" type="button" disabled={submitting} onClick={() => openNote("adopted")}>用于本次任务</button>
          <button className="ghost-btn" type="button" onClick={() => openNote("ignored")}>忽略</button>
          <button className="ghost-btn" type="button" onClick={() => openNote("not_applicable")}>不适用</button>
        </div>
      ) : (
        <div className="suggestion-note">
          <textarea
            aria-label="反馈原因"
            placeholder={pendingDecision === "adopted" ? "本次要用它解决什么任务？（必填）" : pendingDecision === "ignored" ? "为什么选择忽略？（可选，会随反馈一并记录）" : "为什么不适用？（可选，会随反馈一并记录）"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="receipt-draft-actions">
            <button className="primary-btn" type="button" disabled={submitting || (pendingDecision === "adopted" && !note.trim())} onClick={submitWithNote}>{pendingDecision === "adopted" ? "开始复用试验" : "提交反馈"}</button>
            <button className="ghost-btn" type="button" onClick={() => { setNoteOpen(false); setNote(""); }}>取消</button>
          </div>
        </div>
      )}
    </article>
  );
}

function ReuseTrialCard({ trial, submitting, onComplete }) {
  const [outcome, setOutcome] = useState("success");
  const [reduced, setReduced] = useState(true);
  const [note, setNote] = useState("");
  if (trial.completedAt) {
    return <article className="trust-draft-card"><div><TrustTag level="verified">复用试验已完成</TrustTag><strong>{trial.taskTitle}</strong><p>{trial.outcome} · {trial.reducedRepeatedDecision ? "减少了重复判断" : "未确认减少重复判断"}</p></div>{trial.outcomeNote && <p className="timeline-meta">{trial.outcomeNote}</p>}</article>;
  }
  return <article className="trust-draft-card"><div><TrustTag level="draft">正在验证复用</TrustTag><strong>{trial.taskTitle}</strong><p>经验资产 {shortId(trial.assetId)} 已被用于本次任务。任务结束后再记录事实。</p></div><div className="suggestion-note"><label>结果<select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option value="success">success</option><option value="partial">partial</option><option value="failure">failure</option></select></label><label><input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} /> 减少了重复判断</label><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="哪项判断被避免了，或为什么没有帮助？" /><button className="primary-btn" type="button" disabled={submitting} onClick={() => onComplete(trial.id, outcome, reduced, note.trim())}>完成复用试验</button></div></article>;
}

function DraftReviewCard({ draft, submitting, onAccept, onReject, onDefer }) {
  const [editing, setEditing] = useState(false);
  const [phase, setPhase] = useState(draft.phase);
  const [summary, setSummary] = useState(draft.summary);
  const [reason, setReason] = useState("");

  // Sync local state when draft prop changes (e.g., after timeline refresh)
  useEffect(() => {
    setPhase(draft.phase);
    setSummary(draft.summary);
  }, [draft.id, draft.updatedAt]);

  const confirmEdited = () => {
    if (!phase.trim() || !summary.trim()) return;
    onAccept(draft, { phase: phase.trim(), summary: summary.trim() });
  };

  return (
    <article className="trust-draft-card">
      <div>
        <TrustTag level="draft">{draft.generatedBy?.mode === "agent_hosted" ? "当前工具生成·待你确认" : "AI 草案·待你确认"}</TrustTag>
        <strong>{draft.phase}</strong>
        <p>{draft.summary}</p>
      </div>
      <p className="trust-meta">引用 {(draft.checkpointIds || []).length} 个工作节点、{(draft.evidenceLinkIds || []).length} 条证据 · 模型 {draft.generatedBy?.provider}/{draft.generatedBy?.model}</p>
      {draft.generatedBy?.mode === "agent_hosted" && <span className="tag accent">由 {draft.generatedBy?.sourceTool || draft.generatedBy?.provider} 当前会话提交，无需 EOS API Key</span>}
      {draft.generatedBy?.mode === "rehearsal" && <span className="tag warn">离线演练，不是模型质量证据</span>}
      {draft.generationWarnings?.map((warning) => <p className="timeline-meta" key={warning}>生成警告：{warning}</p>)}
      {draft.uncertainty !== null && draft.uncertainty !== undefined && <span className="tag warn">不确定性 {Math.round(draft.uncertainty * 100)}%</span>}
      {draft.applicabilityBounds?.length > 0 && <p className="timeline-meta">适用边界：{draft.applicabilityBounds.join("；")}</p>}
      {editing && (
        <div className="suggestion-note">
          <label>阶段<input value={phase} onChange={(event) => setPhase(event.target.value)} /></label>
          <label>你的事实性改写<textarea value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
          <div className="receipt-draft-actions">
            <button className="primary-btn" type="button" disabled={submitting || !phase.trim() || !summary.trim()} onClick={confirmEdited}>改写后确认</button>
            <button className="ghost-btn" type="button" disabled={submitting} onClick={() => setEditing(false)}>取消改写</button>
          </div>
        </div>
      )}
      <div className="receipt-draft-actions">
        <button className="primary-btn" type="button" disabled={submitting} onClick={() => onAccept(draft)}>直接确认</button>
        <button className="ghost-btn" type="button" disabled={submitting} onClick={() => setEditing(true)}>改写后确认</button>
        <button className="ghost-btn" type="button" disabled={submitting} onClick={() => onDefer(draft, reason)}>暂缓</button>
        <button className="text-button" type="button" disabled={submitting} onClick={() => onReject(draft)}>丢弃草案</button>
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
  const pendingNewId = useRef("");
  const [timeline, setTimeline] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [trialEvidence, setTrialEvidence] = useState(null);
  const [assets, setAssets] = useState([]);
  const [receiptDrafts, setReceiptDrafts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [reuseTrials, setReuseTrials] = useState([]);
  const [permitRequests, setPermitRequests] = useState([]);
  const [permitActivity, setPermitActivity] = useState([]);
  const [llmStatus, setLlmStatus] = useState(null);
  const [submitting, setSubmitting] = useState("");
  const [projectForm, setProjectForm] = useState({ name: "", goal: "", autonomyMode: "advise" });
  const [evidenceForm, setEvidenceForm] = useState({ type: "observation", title: "", source: "", notes: "", uncertainty: "" });
  const [receiptForm, setReceiptForm] = useState({ phase: "协作", summary: "", outcome: "partial", uncertainty: "", bounds: "", lessons: "" });
  const [checkpointForm, setCheckpointForm] = useState({ title: "", sourceTool: "codex", content: "", notes: "", consented: false });
  const [decisionForm, setDecisionForm] = useState({ action: "验证经验", rationale: "", reviewedBy: "human" });
  const [outcomeForm, setOutcomeForm] = useState({ outcome: "success", notes: "" });

  useEffect(() => {
    if (pendingNewId.current) {
      if (projects.some((p) => p.id === pendingNewId.current)) {
        setSelectedId(pendingNewId.current);
        pendingNewId.current = "";
      }
      return;
    }
    if (!selectedId && projects[0]) setSelectedId(projects[0].id);
    if (selectedId && !projects.some((p) => p.id === selectedId)) setSelectedId(projects[0]?.id || "");
  }, [projects, selectedId]);

  const selectedProject = projects.find((project) => project.id === selectedId) || null;

  // 切换项目时清空旧数据，避免 A 项目的时间线短暂显示在 B 项目下
  useEffect(() => {
    setTimeline(null);
    setReadiness(null);
    setTrialEvidence(null);
    setAssets([]);
    setReceiptDrafts([]);
    setSuggestions([]);
    setReuseTrials([]);
    setPermitRequests([]);
    setPermitActivity([]);
  }, [selectedId]);

  const loadTimeline = useCallback(async (projectId = selectedId) => {
    if (!projectId) return;
    const results = await Promise.allSettled([
      fetchProjectTimeline(projectId),
      fetchReadiness(projectId),
      fetchProjectTrialEvidence(projectId),
      fetchExperienceAssets(projectId),
      fetchExperienceReceiptDrafts(projectId),
      fetchReuseSuggestions(projectId),
      fetchExperienceReuseTrials(projectId),
      fetchCapturePermitRequests(projectId),
      fetchLLMStatus()
    ]);
    const [tl, rd, te, as, dr, sg, rt, pr, ls] = results;
    if (tl.status === "fulfilled") setTimeline(tl.value);
    if (rd.status === "fulfilled") setReadiness(rd.value);
    if (te.status === "fulfilled") setTrialEvidence(te.value);
    if (as.status === "fulfilled") setAssets(as.value.records || []);
    if (dr.status === "fulfilled") setReceiptDrafts(dr.value.records || []);
    if (sg.status === "fulfilled") setSuggestions(sg.value.records || []);
    if (rt.status === "fulfilled") setReuseTrials(rt.value.records || []);
    if (pr.status === "fulfilled") {
      setPermitRequests(pr.value.records || []);
      setPermitActivity(pr.value.activity || []);
    }
    if (ls.status === "fulfilled") setLlmStatus(ls.value);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) toast(`${failed} 个区块读取失败，其余内容已正常显示。可稍后按 R 刷新重试。`, "warn", "部分数据不可用");
  }, [selectedId, toast]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  /* ——— 主线派生状态 ——— */
  const counts = timeline?.counts || {};
  const timelineItems = timeline?.timeline || [];
  const pendingDrafts = receiptDrafts.filter((draft) => draft.status === "pending_review");
  const historyDrafts = receiptDrafts.filter((draft) => draft.status !== "pending_review");
  const canGenerateDraft = llmStatus?.isLive || llmStatus?.mockDraftsAllowed;
  const latestReceipt = timelineItems.find((item) => item.kind === "ExperienceReceipt")?.record || null;
  const latestDecision = timelineItems.find((item) => item.kind === "DecisionReceipt")?.record || null;
  const receiptById = useMemo(
    () => new Map(timelineItems.filter((item) => item.kind === "ExperienceReceipt").map((item) => [item.record.id, item.record])),
    [timelineItems]
  );
  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );
  const promotedReceiptIds = useMemo(() => new Set(assets.map((asset) => asset.receiptId)), [assets]);
  const eligibleEntry = readiness?.receipts?.find((entry) => entry.eligible && !promotedReceiptIds.has(entry.receiptId)) || null;

  const nextAction = useMemo(() => {
    if (!selectedProject || !timeline) return null;
    if (permitRequests.length > 0) return { text: `有 ${permitRequests.length} 段外部协作内容正在等待你的逐条许可；它们尚未写入项目记录。`, anchor: "#capture-permits", cta: "去审阅" };
    if ((counts.checkpoints || 0) === 0) return { text: "保存第一个工作节点——它是之后所有经验、草案与验证的来源。", anchor: "#checkpoint", cta: "去保存" };
    if (pendingDrafts.length > 0) return { text: `有 ${pendingDrafts.length} 份 AI 草案待你确认或驳回；系统不会替你做这个决定。`, anchor: "#drafts", cta: "去处理" };
    if ((counts.receipts || 0) === 0) return { text: "由已保存的工作节点生成一份收据草案，草案仍需要你确认。", anchor: "#drafts", cta: "去生成" };
    if ((counts.decisions || 0) === 0) return { text: "为最新收据留下一次人工审查决策——这是升级资格的必要一环。", anchor: "#validation", cta: "去审查" };
    if ((counts.outcomes || 0) === 0) return { text: "观察真实运行结果并回写，经验才算被生产验证。", anchor: "#validation", cta: "去记录结果" };
    if (eligibleEntry) return { text: "一条收据已集齐证据、审查与成功结果，可以升级为可复用经验。", anchor: "#readiness", cta: "去升级" };
    return { text: "主线已完成一轮。继续记录新的工作节点，或评估下方来自其他项目的已验证经验。", anchor: "#suggestions", cta: "查看建议" };
  }, [selectedProject, timeline, counts, pendingDrafts.length, eligibleEntry, permitRequests.length]);

  const loopSteps = useMemo(() => {
    const done = [
      (counts.checkpoints || 0) > 0,
      (counts.receipts || 0) > 0,
      (counts.decisions || 0) > 0,
      (counts.outcomes || 0) > 0,
      assets.length > 0
    ];
    const currentIndex = done.findIndex((d) => !d);
    const labels = ["保存节点", "确认收据", "人工审查", "结果验证", "升级资产"];
    const anchors = ["#checkpoint", "#drafts", "#validation", "#validation", "#readiness"];
    const stepCounts = [counts.checkpoints || 0, counts.receipts || 0, counts.decisions || 0, counts.outcomes || 0, assets.length];
    return labels.map((label, i) => ({
      label,
      anchor: anchors[i],
      count: stepCounts[i],
      state: done[i] ? "done" : (i === currentIndex ? "current" : "todo")
    }));
  }, [counts, assets.length]);

  /* ——— 提交处理（语义与之前一致，仅增加内联校验与反馈理由） ——— */
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
      pendingNewId.current = project.id;
      await refreshProjects();
      setSelectedId(project.id);
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
    if (uncertaintyError(evidenceForm.uncertainty)) return;
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
    if (uncertaintyError(receiptForm.uncertainty)) return;
    setSubmitting("receipt");
    try {
      const evidenceLinkIds = timelineItems
        .filter((item) => item.kind === "EvidenceLink")
        .map((item) => item.record.id);
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
    const checkpointIds = timelineItems.filter((item) => item.kind === "WorkCheckpoint").slice(0, 3).map((item) => item.record.id);
    if (!selectedProject || checkpointIds.length === 0) return;
    if (!canGenerateDraft) {
      toast("真实 LLM 尚未配置，草案生成保持锁定；工作节点和人工收据仍可继续使用。", "warn", "需要配置模型");
      return;
    }
    setSubmitting("receipt-draft");
    try {
      await createExperienceReceiptDraft({ id: recordId("receipt_draft"), projectId: selectedProject.id, checkpointIds });
      await loadTimeline();
      toast(llmStatus?.isLive ? "系统已提出一份带来源的草案。它还不是经验，也不会自动复用。" : "已生成离线演练草案；它不能作为真实模型质量证据。", "ok", "收据草案已生成");
    } catch (err) { toast(err.message, "bad", "草案生成失败"); } finally { setSubmitting(""); }
  };

  const acceptDraft = async (draft, edits = {}) => {
    setSubmitting(`accept-draft-${draft.id}`);
    try {
      await acceptExperienceReceiptDraft({ draftId: draft.id, receiptId: recordId("receipt"), actor: "human", edits });
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

  const deferDraft = async (draft, reason = "") => {
    setSubmitting(`defer-draft-${draft.id}`);
    try {
      await deferExperienceReceiptDraft({ draftId: draft.id, actor: "human", reason });
      await loadTimeline();
      toast("草案已暂缓；它没有变成经验，也不会被系统自行处理。", "ok", "已暂缓草案");
    } catch (err) { toast(err.message, "bad", "暂缓失败"); } finally { setSubmitting(""); }
  };

  const resumeDraft = async (draft) => {
    setSubmitting(`resume-draft-${draft.id}`);
    try {
      await resumeExperienceReceiptDraft({ draftId: draft.id, actor: "human" });
      await loadTimeline();
      toast("草案已回到待审状态；你可以继续改写、确认或丢弃。", "ok", "已恢复审查");
    } catch (err) { toast(err.message, "bad", "恢复失败"); } finally { setSubmitting(""); }
  };

  const feedbackSuggestion = async (assetId, decision, note = "") => {
    setSubmitting(`reuse-${assetId}`);
    try {
      await recordReuseFeedback({ projectId: selectedProject.id, assetId, decision, note });
      setSuggestions((items) => items.filter((item) => item.assetId !== assetId));
      toast("反馈已记录；系统不会把它直接当成永久偏好。", "ok", "已记录复用反馈");
    } catch (err) { toast(err.message, "bad", "反馈失败"); } finally { setSubmitting(""); }
  };

  const adoptSuggestion = async (assetId, taskTitle) => {
    setSubmitting(`reuse-${assetId}`);
    try {
      await startExperienceReuseTrial({ id: recordId("reuse_trial"), projectId: selectedProject.id, assetId, taskTitle });
      setSuggestions((items) => items.filter((item) => item.assetId !== assetId));
      await loadTimeline();
      toast("已开始复用试验。任务结束后，EOS 会请你记录实际结果。", "ok", "经验已用于本次任务");
    } catch (err) { toast(err.message, "bad", "开始试验失败"); } finally { setSubmitting(""); }
  };

  const completeReuseTrial = async (id, outcome, reducedRepeatedDecision, outcomeNote) => {
    setSubmitting(`reuse-trial-${id}`);
    try {
      await completeExperienceReuseTrial({ id, projectId: selectedProject.id, outcome, reducedRepeatedDecision, outcomeNote });
      await loadTimeline();
      toast("复用结果已记录。它会成为 EOS 是否真的有价值的证据，而不是一句口号。", "ok", "复用试验已完成");
    } catch (err) { toast(err.message, "bad", "记录试验失败"); } finally { setSubmitting(""); }
  };

  const submitDecision = async (event) => {
    event.preventDefault();
    const evidenceLinkIds = timelineItems.filter((item) => item.kind === "EvidenceLink").map((item) => item.record.id);
    if (!selectedProject || !latestReceipt || !decisionForm.rationale.trim() || !evidenceLinkIds.length) return;
    setSubmitting("decision");
    try {
      await createDecision({
        id: recordId("decision"), projectId: selectedProject.id, action: decisionForm.action,
        target: latestReceipt.id, receiptId: latestReceipt.id, rationale: decisionForm.rationale.trim(), evidenceLinkIds,
        autonomyMode: selectedProject.autonomyMode, humanReviewed: true, reviewedBy: decisionForm.reviewedBy.trim() || "human"
      });
      setDecisionForm({ action: "验证经验", rationale: "", reviewedBy: decisionForm.reviewedBy });
      await loadTimeline();
      toast("决策已留下审查收据。", "ok", "已记录决策");
    } catch (err) { toast(err.message, "bad", "记录失败"); } finally { setSubmitting(""); }
  };

  const submitOutcome = async (event) => {
    event.preventDefault();
    const evidenceLinkIds = timelineItems.filter((item) => item.kind === "EvidenceLink").map((item) => item.record.id);
    if (!selectedProject || !latestDecision || !evidenceLinkIds.length) return;
    setSubmitting("outcome");
    try {
      await createOutcome({
        id: recordId("outcome"), projectId: selectedProject.id, decisionReceiptId: latestDecision.id,
        action: latestDecision.action, outcome: outcomeForm.outcome, notes: outcomeForm.notes.trim(), evidenceLinkIds
      });
      setOutcomeForm({ outcome: "success", notes: "" });
      await loadTimeline();
      toast("结果已经回写到经验链路。", "ok", "已记录结果");
    } catch (err) { toast(err.message, "bad", "记录失败"); } finally { setSubmitting(""); }
  };

  const promoteEligible = async (entry) => {
    const outcome = timelineItems.find((item) => item.kind === "OutcomeRecord" && item.record.decisionReceiptId === entry.decisionReceiptId)?.record;
    if (!selectedProject || !outcome) return;
    setSubmitting(`promote-${entry.receiptId}`);
    try {
      await promoteExperienceAsset({
        id: recordId("experience_asset"), projectId: selectedProject.id, receiptId: entry.receiptId,
        decisionReceiptId: entry.decisionReceiptId, outcomeRecordId: outcome.id,
        title: `已验证经验：${truncate(receiptById.get(entry.receiptId)?.summary || entry.receiptId, 40)}`, approvedBy: "human"
      });
      await loadTimeline();
      toast("经验已升级为可复用资产，仍保留它的来源与边界。", "ok", "已升级经验");
    } catch (err) { toast(err.message, "bad", "升级失败"); } finally { setSubmitting(""); }
  };

  const decideCapturePermit = async (request, decision) => {
    if (!selectedProject) return;
    setSubmitting(`${decision}-permit-${request.id}`);
    try {
      const body = { id: request.id, projectId: selectedProject.id, [decision === "approve" ? "approvedBy" : "rejectedBy"]: "human" };
      if (decision === "approve") await approveCapturePermitRequest(body);
      else await rejectCapturePermitRequest(body);
      await loadTimeline();
      toast(
        decision === "approve" ? "许可已签发。AI 只能用这段已审阅的原文完成一次捕获。" : "请求已拒绝并从待许可区清除。",
        "ok",
        decision === "approve" ? "已签发一次性许可" : "已拒绝捕获"
      );
    } catch (err) {
      toast(err.message, "bad", "许可处理失败");
    } finally {
      setSubmitting("");
    }
  };

  if (loading && !data) return <div className="skeleton" style={{ height: "240px" }}>加载中</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const evidenceUncertaintyError = uncertaintyError(evidenceForm.uncertainty);
  const receiptUncertaintyError = uncertaintyError(receiptForm.uncertainty);

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

              {trialEvidence && (
                <section className="trial-evidence" aria-label="本项目的试用证据">
                  <div><p className="eyebrow">试用证据</p><strong>系统只报告已发生的事实，不给这次项目虚构价值分数。</strong></div>
                  <dl>
                    <div><dt>已处理草案</dt><dd>{trialEvidence.draftReview?.handled ?? 0} 份{trialEvidence.draftReview?.medianReviewMs != null ? ` · 中位 ${Math.round(trialEvidence.draftReview.medianReviewMs / 1000)} 秒` : ""}</dd></div>
                    <div><dt>来源覆盖</dt><dd>{trialEvidence.evidenceCoverage?.ratio == null ? "尚无收据" : `${Math.round(trialEvidence.evidenceCoverage.ratio * 100)}%`}</dd></div>
                    <div><dt>已验证经验</dt><dd>{trialEvidence.verification?.approvedAssets ?? 0} 条</dd></div>
                    <div><dt>复用试验</dt><dd>{trialEvidence.reuseTrials?.completed ?? 0} 完成 / {trialEvidence.reuseTrials?.total ?? 0} 发起</dd></div>
                  </dl>
                  {trialEvidence.interpretation?.isSufficientForValueClaim === false && <p className="trial-note">还不能宣称 EOS 已产生复用价值：{trialEvidence.interpretation?.missingEvidence?.[0] ?? "证据不足"}</p>}
                </section>
              )}

              {!timeline ? (
                <div className="skeleton" style={{ height: "200px" }}>加载中</div>
              ) : (
                <>
                  {nextAction && (
                    <div className="next-action">
                      <div>
                        <p className="eyebrow">下一步</p>
                        <p>{nextAction.text}</p>
                      </div>
                      <a className="ghost-btn" href={nextAction.anchor} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{nextAction.cta}</a>
                    </div>
                  )}

                  <nav aria-label="主线进度">
                    <ol className="loop-steps">
                      {loopSteps.map((step, i) => (
                        <li key={step.label}>
                          <a
                            className={`loop-step ${step.state}`}
                            href={step.anchor}
                            aria-current={step.state === "current" ? "step" : undefined}
                          >
                            <span className="loop-index">{step.state === "done" ? "✓" : `0${i + 1}`}</span>
                            <strong>{step.label}</strong>
                            <span className="loop-count">{step.count} 条</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>

                  <form className="panel project-form checkpoint-form" id="checkpoint" onSubmit={submitCheckpoint}>
                    <div className="section-head"><div><p className="eyebrow">第一步 · 记录</p><h3>保存一个工作节点</h3><p>在自然工作告一段落时，留下一段你愿意保存的上下文。EOS 会保留原文和可追溯证据，之后才建议形成经验收据。</p></div></div>
                    <div className="checkpoint-grid">
                      <label>这段工作叫什么<input value={checkpointForm.title} onChange={(e) => setCheckpointForm({ ...checkpointForm, title: e.target.value })} placeholder="例如：修复登录测试的失败原因" /></label>
                      <label>来源工具<input value={checkpointForm.sourceTool} onChange={(e) => setCheckpointForm({ ...checkpointForm, sourceTool: e.target.value })} placeholder="Codex、终端、IDE..." /></label>
                    </div>
                    <label>发生了什么<textarea value={checkpointForm.content} onChange={(e) => setCheckpointForm({ ...checkpointForm, content: e.target.value })} placeholder="用你自己的话记录关键讨论、尝试、发现或决定。它只会保存到本地项目 Vault。" /></label>
                    <label>为什么值得留下（可选）<textarea value={checkpointForm.notes} onChange={(e) => setCheckpointForm({ ...checkpointForm, notes: e.target.value })} placeholder="例如：下次遇到同类问题，先检查 Schema 与测试边界。" /></label>
                    <div className="checkpoint-submit"><label className="project-check"><input type="checkbox" checked={checkpointForm.consented} onChange={(e) => setCheckpointForm({ ...checkpointForm, consented: e.target.checked })} />我同意将这段内容保存在本地项目记录中</label><button className="primary-btn" disabled={submitting === "checkpoint" || !checkpointForm.consented}>保存工作节点</button></div>
                  </form>

                  {permitRequests.length > 0 && (
                    <section className="panel receipt-draft-panel" id="capture-permits">
                      <div className="section-head"><div><p className="eyebrow">严格许可</p><h3>待你许可的外部捕获</h3><p>这些内容只暂存在本机待许可区，尚未进入 Vault 或 Git 历史。请逐字审阅；批准后，AI 只能以相同内容、相同来源和相同执行者使用一次。</p></div><span className="pill">{permitRequests.length} 待处理</span></div>
                      <div className="receipt-draft-list">
                        {permitRequests.map((request) => (
                          <article className="trust-draft-card permit-request" key={request.id}>
                            <div><TrustTag level="draft">外部内容·未捕获</TrustTag><strong>{request.title}</strong></div>
                            <p className="trust-meta">来源 {request.sourceTool} · 执行者 {request.actor} · 请求于 {new Date(request.requestedAt).toLocaleString("zh-CN")}</p>
                            <pre className="permit-content">{request.contentPreview}</pre>
                            {request.notes && <p className="timeline-meta">附注：{request.notes}</p>}
                            <div className="receipt-draft-actions">
                              <ConfirmButton label="批准一次性捕获" confirmLabel="确认：内容已完整审阅" busy={submitting === `approve-permit-${request.id}`} onConfirm={() => decideCapturePermit(request, "approve")} />
                              <button className="text-button" type="button" disabled={submitting === `reject-permit-${request.id}`} onClick={() => decideCapturePermit(request, "reject")}>拒绝并清除</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {permitActivity.length > 0 && (
                    <details className="panel advanced-path permit-activity">
                      <summary><IconChevronDown />严格许可记录（{permitActivity.length}）<span className="advanced-note">只显示本地许可状态，不重复展示已捕获内容</span></summary>
                      <div className="permit-activity-list">
                        {permitActivity.map((permit) => (
                          <article key={permit.id} className="permit-activity-item">
                            <div><strong>{permit.title}</strong><p>{permit.sourceTool} · {permit.actor} · {shortId(permit.id)}</p></div>
                            <span className={`tag ${permit.status === "consumed" ? "ok" : permit.status === "expired" || permit.status === "rejected" ? "warn" : "accent"}`}>
                              {{ pending: "待审阅", issued: "已签发", consumed: "已捕获", rejected: "已拒绝", expired: "已过期" }[permit.status] || permit.status}
                            </span>
                          </article>
                        ))}
                      </div>
                    </details>
                  )}

                  <section className="panel receipt-draft-panel" id="drafts">
                    <div className="section-head"><div><p className="eyebrow">第二步 · 确认</p><h3>由工作节点提出收据草案</h3><p>只读取最近三个已保存节点。AI 必须附着于已有来源；它提出，不替你下结论。</p>{llmStatus && <p className={llmStatus.isLive ? "trust-meta" : "notice warn"}>{llmStatus.isLive ? `真实模型已连接：${llmStatus.adapter}/${llmStatus.model}；草案仍需要你确认。` : llmStatus.mockDraftsAllowed ? "离线演练模式：草案会明确标为模拟，不计入真实模型质量证据。" : "真实模型尚未配置，草案生成已锁定；不会以模拟输出冒充 AI 结论。"}</p>}</div><button className="ghost-btn" type="button" disabled={submitting === "receipt-draft" || !(counts.checkpoints > 0) || (llmStatus !== null && !canGenerateDraft)} onClick={createDraft}>{llmStatus?.isLive ? "生成草案" : llmStatus?.mockDraftsAllowed ? "生成演练草案" : "需配置真实模型"}</button></div>
                    {counts.checkpoints === 0 && <p className="empty">先保存一个工作节点，草案才有可引用的事实基础。</p>}
                    <div className="receipt-draft-list">
                      {pendingDrafts.map((draft) => <DraftReviewCard key={draft.id} draft={draft} submitting={submitting !== ""} onAccept={acceptDraft} onReject={rejectDraft} onDefer={deferDraft} />)}
                      {pendingDrafts.length === 0 && counts.checkpoints > 0 && <p className="empty">还没有待确认草案。系统不会在后台自行提炼。</p>}
                    </div>
                    {historyDrafts.length > 0 && (
                      <details className="advanced-path" style={{ marginTop: "12px" }}>
                        <summary><IconChevronDown />草案历史（{historyDrafts.length}）<span className="advanced-note">已处理草案的留痕，原始节点不受影响</span></summary>
                        <div className="receipt-draft-list" style={{ marginTop: "12px" }}>
                          {historyDrafts.map((draft) => (
                            <article className="trust-draft-card" style={{ borderColor: "var(--line)", borderStyle: "solid" }} key={draft.id}>
                              <div>
                                {draft.status === "accepted"
                                  ? <TrustTag level="confirmed">已确认为收据</TrustTag>
                                  : draft.status === "deferred"
                                    ? <TrustTag level="source">已暂缓</TrustTag>
                                    : <TrustTag level="source">已丢弃</TrustTag>}
                                <strong>{draft.phase}</strong>
                                <p>{truncate(draft.summary, 120)}</p>
                              </div>
                              <p className="trust-meta">模型 {draft.generatedBy?.provider}/{draft.generatedBy?.model} · {draft.id}</p>
                              {draft.generatedBy?.mode === "rehearsal" && <span className="tag warn">离线演练</span>}
                              {draft.generationWarnings?.map((warning) => <p className="timeline-meta" key={warning}>生成警告：{warning}</p>)}
                              {draft.status === "deferred" && <button className="ghost-btn" type="button" disabled={submitting === `resume-draft-${draft.id}`} onClick={() => resumeDraft(draft)}>恢复审查</button>}
                            </article>
                          ))}
                        </div>
                      </details>
                    )}
                  </section>

                  <section className="project-validation" id="validation">
                    <div className="section-head"><div><p className="eyebrow">第三、四步 · 审查与验证</p><h3>人工审查与结果验证</h3><p>一段经验必须先有证据、被人审查、再被真实结果验证，才会成为可复用资产。每个表单都明确显示它正在作用的对象。</p></div></div>
                    <div className="project-actions">
                      {latestReceipt ? (
                        <form className="panel project-form" onSubmit={submitDecision}>
                          <h3>人工审查决策</h3>
                          <BindingCard
                            label="正在审查的收据"
                            title={truncate(latestReceipt.summary, 80)}
                            meta={`${shortId(latestReceipt.id)} · 关联 ${latestReceipt.evidenceLinkIds?.length || 0} 条证据`}
                          />
                          <label>动作<input value={decisionForm.action} onChange={(e) => setDecisionForm({ ...decisionForm, action: e.target.value })} /></label>
                          <label>为什么<textarea value={decisionForm.rationale} onChange={(e) => setDecisionForm({ ...decisionForm, rationale: e.target.value })} placeholder="说明你为什么认可、修改或否决这条路径。" /></label>
                          <button className="primary-btn" disabled={submitting === "decision"}>记录审查</button>
                        </form>
                      ) : (
                        <div className="panel binding-hint">先在上一步确认一份收据草案，审查决策才有作用对象。系统不允许审查不存在的经验。</div>
                      )}
                      {latestDecision ? (
                        <form className="panel project-form" onSubmit={submitOutcome}>
                          <h3>观察实际结果</h3>
                          <BindingCard
                            label="正在验证的决策"
                            title={`${latestDecision.action}：${truncate(latestDecision.rationale, 56)}`}
                            meta={shortId(latestDecision.id)}
                          />
                          <label>结果<select value={outcomeForm.outcome} onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })}><option value="success">success</option><option value="partial">partial</option><option value="failure">failure</option></select></label>
                          <label>观察说明<textarea value={outcomeForm.notes} onChange={(e) => setOutcomeForm({ ...outcomeForm, notes: e.target.value })} placeholder="测试、运行或用户反馈告诉了你什么？" /></label>
                          <button className="ghost-btn" disabled={submitting === "outcome"}>记录结果</button>
                        </form>
                      ) : (
                        <div className="panel binding-hint">先记录一次人工审查决策，真实结果才能回写到对应的决策上。</div>
                      )}
                    </div>
                  </section>

                  <section className="panel" id="readiness">
                    <div className="section-head"><div><p className="eyebrow">第五步 · 升级</p><h3>验证与升级资格</h3><p>系统逐条解释每张收据距离“可复用经验”还差什么；升级是不可逆动作，需要两次点击确认。</p></div><span className="pill">{assets.length} 已升级</span></div>
                    <div className="readiness-list">
                      {readiness?.receipts?.map((entry) => {
                        const receipt = receiptById.get(entry.receiptId);
                        const hasEvidence = !entry.reasons.includes("缺少证据");
                        const reviewed = !entry.reasons.some((r) => r.includes("决策"));
                        return (
                          <article className="readiness-item" key={entry.receiptId}>
                            <div>
                              <strong className="readiness-title">{receipt ? truncate(receipt.summary, 64) : entry.receiptId}</strong>
                              <p className="trust-meta">{shortId(entry.receiptId)}</p>
                              <div className="readiness-chips">
                                <span className={`tag ${hasEvidence ? "ok" : "warn"}`}>{hasEvidence ? "✓ 证据" : "✗ 缺证据"}</span>
                                <span className={`tag ${reviewed ? "ok" : "warn"}`}>{reviewed ? "✓ 审查+结果" : "✗ 缺审查/成功结果"}</span>
                              </div>
                              {!entry.eligible && <p>{entry.reasons.join("；")}</p>}
                            </div>
                            {promotedReceiptIds.has(entry.receiptId) ? (
                              <TrustTag level="verified">已升级·可复用</TrustTag>
                            ) : entry.eligible && (
                              <ConfirmButton
                                label="升级为经验资产"
                                confirmLabel="确认升级？再次点击"
                                busy={submitting === `promote-${entry.receiptId}`}
                                onConfirm={() => promoteEligible(entry)}
                              />
                            )}
                          </article>
                        );
                      })}
                      {readiness?.receipts?.length === 0 && <p className="empty">先生成一条 Experience Receipt，系统会在这里解释它离可复用还差什么。</p>}
                    </div>
                  </section>

                  <section className="panel receipt-draft-panel" id="suggestions">
                    <div className="section-head"><div><p className="eyebrow">下次可用</p><h3>已验证经验建议</h3><p>只显示其他项目中已经过证据、审查和结果验证的经验。不会自动套用；拒绝可以留下原因。</p></div><span className="pill">最多 3 条</span></div>
                    <div className="receipt-draft-list">
                      {suggestions.map((item) => (
                        <SuggestionCard
                          key={item.assetId}
                          item={item}
                          sourceName={projectNameById.get(item.sourceProjectId) || item.sourceProjectId}
                          submitting={submitting === `reuse-${item.assetId}`}
                          onFeedback={feedbackSuggestion}
                          onAdopt={adoptSuggestion}
                        />
                      ))}
                      {suggestions.length === 0 && <p className="empty">还没有与当前项目足够相关的已验证经验。</p>}
                    </div>
                    {reuseTrials.length > 0 && <div className="receipt-draft-list" style={{ marginTop: "12px" }}>{reuseTrials.map((trial) => <ReuseTrialCard key={trial.id} trial={trial} submitting={submitting === `reuse-trial-${trial.id}`} onComplete={completeReuseTrial} />)}</div>}
                  </section>

                  <details className="panel advanced-path" id="advanced">
                    <summary><IconChevronDown />高级路径：直接记录证据或收据<span className="advanced-note">通常不需要——保存工作节点已自动创建可引用证据</span></summary>
                    <div className="project-actions">
                      <form className="panel project-form" onSubmit={submitEvidence}>
                        <div className="section-head"><div><h3>记录证据</h3><p>保存你正在依据的材料，而非让总结脱离来源。</p></div></div>
                        <label>类型<select value={evidenceForm.type} onChange={(e) => setEvidenceForm({ ...evidenceForm, type: e.target.value })}>{EVIDENCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                        <label>标题<input value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} placeholder="例如：用户测试的反例" /></label>
                        <label>来源<textarea value={evidenceForm.source} onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })} placeholder="文件路径、链接、提交号或观察记录。" /></label>
                        <label>
                          不确定性（0-1，可留空）
                          <input type="number" min="0" max="1" step="0.05" value={evidenceForm.uncertainty} onChange={(e) => setEvidenceForm({ ...evidenceForm, uncertainty: e.target.value })} />
                          {evidenceUncertaintyError && <span className="field-error">{evidenceUncertaintyError}</span>}
                        </label>
                        <button className="ghost-btn" disabled={submitting === "evidence" || !!evidenceUncertaintyError}>保存证据</button>
                      </form>

                      <form className="panel project-form" onSubmit={submitReceipt}>
                        <div className="section-head"><div><h3>生成 Experience Receipt</h3><p>说明发生了什么、依据什么、在哪里仍然不确定。</p></div></div>
                        <label>阶段<input value={receiptForm.phase} onChange={(e) => setReceiptForm({ ...receiptForm, phase: e.target.value })} /></label>
                        <label>事实性总结<textarea value={receiptForm.summary} onChange={(e) => setReceiptForm({ ...receiptForm, summary: e.target.value })} placeholder="写下已尝试的路径、当前结果与尚未解决的问题。" /></label>
                        <label>结果<select value={receiptForm.outcome} onChange={(e) => setReceiptForm({ ...receiptForm, outcome: e.target.value })}><option value="success">success</option><option value="partial">partial</option><option value="failure">failure</option><option value="unknown">unknown</option></select></label>
                        <label>
                          不确定性（0-1，可留空）
                          <input type="number" min="0" max="1" step="0.05" value={receiptForm.uncertainty} onChange={(e) => setReceiptForm({ ...receiptForm, uncertainty: e.target.value })} />
                          {receiptUncertaintyError && <span className="field-error">{receiptUncertaintyError}</span>}
                        </label>
                        <label>适用边界（每行一条）<textarea value={receiptForm.bounds} onChange={(e) => setReceiptForm({ ...receiptForm, bounds: e.target.value })} placeholder="例如：仅适用于单用户本地 Vault" /></label>
                        <button className="ghost-btn" disabled={submitting === "receipt" || !!receiptUncertaintyError}>沉淀这段经验</button>
                      </form>
                    </div>
                  </details>

                  <section className="panel timeline-panel" id="timeline">
                    <div className="section-head"><div><p className="eyebrow">来源链</p><h3>项目时间线</h3><p>你能看到系统依据什么形成了每一段经验。</p></div><span className="pill">{timelineItems.length}</span></div>
                    <div className="timeline-list">
                      {timelineItems.map((item) => <TimelineItem key={`${item.kind}-${item.record.id}`} item={item} />)}
                      {timelineItems.length === 0 && <p className="empty">从保存一个工作节点开始，这里会逐步长出完整的来源链。</p>}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
