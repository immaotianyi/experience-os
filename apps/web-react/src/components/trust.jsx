/**
 * Shared trust-level visual language components.
 * Used by ProjectView, ReviewView, WallHitsView, SkillsView, AuditView.
 *
 * Trust encoding (shape + border-style + icon + text, never color alone):
 *   L0 source    — solid thin border,  muted  「来源」
 *   L1 draft     — dashed border,      warn  「AI 草案·待确认」
 *   L2 confirmed — solid border,       ok    「已由你确认」
 *   L3 verified  — solid filled badge, ✓     「已验证」
 */
import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons.jsx";

export const KIND_LABELS = {
  EvidenceLink: "证据",
  ConversationEvent: "协作片段",
  WorkCheckpoint: "工作节点",
  ExperienceReceipt: "经验收据",
  DecisionReceipt: "审查决策",
  OutcomeRecord: "实际结果",
  Skill: "Skill",
  WallHit: "撞墙",
  ReviewPacket: "审查包",
  PreferenceHypothesis: "偏好假设",
  Project: "项目",
  ReflectionMemory: "反思",
  WorkflowPattern: "工作流",
  Rule: "规则"
};

export function shortId(id) {
  if (!id) return "";
  return id.length > 16 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id;
}

export function truncate(text, max = 72) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/* ——— 信任等级标记 ——— */
export function TrustTag({ level, children }) {
  return (
    <span className={`trust-tag trust-${level}`}>
      {level === "verified" && <IconCheck />}
      {children}
    </span>
  );
}

/* ——— 不可逆动作的二次确认按钮（4 秒自动复位）——— */
export function ConfirmButton({ label, confirmLabel, onConfirm, disabled, busy }) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      timer.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    setConfirming(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      className={`commit-btn ${confirming ? "confirming" : ""}`}
      disabled={disabled || busy}
      onClick={handleClick}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}

/* ——— 显式绑定目标卡 ——— */
export function BindingCard({ label, title, meta }) {
  return (
    <div className="binding-card">
      <span className="binding-label">{label}</span>
      <strong>{title}</strong>
      {meta && <span className="trust-meta">{meta}</span>}
    </div>
  );
}
