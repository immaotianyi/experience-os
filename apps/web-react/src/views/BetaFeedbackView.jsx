import { useState, useCallback } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { submitBetaFeedback, betaFeedbackExportUrl } from "../api/beta.js";

const STAGES = [
  { id: "first_impression", label: "初次印象" },
  { id: "after_trying", label: "试用后" },
  { id: "blocked", label: "遇到阻碍" },
];

const AGAIN = [
  { id: "yes", label: "会" },
  { id: "no", label: "不会" },
  { id: "unsure", label: "不确定" },
];

function StarRating({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="beta-stars">
      <span className="binding-label">{label}</span>
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star ${(hover || value) >= n ? "on" : ""}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} 分`}
          >
            ★
          </button>
        ))}
        <span className="muted" style={{ marginLeft: "8px", fontSize: "12px" }}>
          {value > 0 ? `${value}/5` : "未评分"}
        </span>
      </div>
    </div>
  );
}

export default function BetaFeedbackView({ refreshKey, toast }) {
  const { data, refresh } = useFetch(`/api/beta-feedback?t=${refreshKey ?? ""}`);
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState("after_trying");
  const [usefulness, setUsefulness] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [wouldUseAgain, setWouldUseAgain] = useState("");
  const [helped, setHelped] = useState("");
  const [blocked, setBlocked] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const feedbackList = data?.records ?? [];
  const exportUrl = betaFeedbackExportUrl();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    if (!consent) { setError("请先勾选同意提交"); return; }
    if (usefulness === 0) { setError("请评分有用程度"); return; }
    if (clarity === 0) { setError("请评分清晰程度"); return; }
    if (!wouldUseAgain) { setError("请选择是否会再用"); return; }
    setSubmitting(true);
    try {
      const res = await submitBetaFeedback({
        consent: true,
        stage,
        usefulness,
        clarity,
        wouldUseAgain,
        helped: helped.trim(),
        blocked: blocked.trim(),
        contactConsent,
        contact: contactConsent ? contact.trim() : "",
      });
      setResult(res);
      toast("反馈已提交，谢谢", "ok");
      refresh();
    } catch (err) {
      setError(err.message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  }, [consent, stage, usefulness, clarity, wouldUseAgain, helped, blocked, contactConsent, contact, toast, refresh]);

  const resetForm = () => {
    setResult(null);
    setConsent(false);
    setStage("after_trying");
    setUsefulness(0);
    setClarity(0);
    setWouldUseAgain("");
    setHelped("");
    setBlocked("");
    setContactConsent(false);
    setContact("");
    setError("");
  };

  if (result) {
    return (
      <div className="beta-feedback-view">
        <div className="beta-success">
          <h2>反馈已提交</h2>
          <p className="muted">记录 ID：{result.id}</p>
          <p>你的反馈已存入本地 Vault，不会上传云端。</p>
          <div className="beta-actions">
            <button className="btn" onClick={resetForm}>再写一条</button>
            <a className="btn btn-outline" href={exportUrl} target="_blank" rel="noopener noreferrer">
              导出全部反馈
            </a>
          </div>
        </div>
        {feedbackList.length > 0 && (
          <div className="beta-history">
            <h3>已提交反馈（{feedbackList.length}）</h3>
            <a className="btn btn-sm" href={exportUrl} target="_blank" rel="noopener noreferrer">
              导出 JSON
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="beta-feedback-view">
      <div className="beta-intro">
        <h2>Beta 反馈</h2>
        <p className="muted">
          这是一条自愿的产品体验报告。提交前请勾选同意。反馈仅存入本地 Vault，
          不会自动上传云端。如需交给测试组织者，请使用下方"导出"功能。
        </p>
        <p className="muted" style={{ fontSize: "12px" }}>
          不含聊天记录、密码、API Key 或个人数据。参与者 ID 默认匿名生成。
        </p>
      </div>

      <div className="beta-consent-banner">
        <label className="beta-checkbox-row">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>我同意提交此次反馈，并理解它将存入本地 Vault</span>
        </label>
      </div>

      <form className="project-form beta-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="binding-label">测试阶段</label>
          <div className="beta-radio-group">
            {STAGES.map((s) => (
              <label key={s.id} className={`beta-chip ${stage === s.id ? "on" : ""}`}>
                <input type="radio" name="stage" value={s.id} checked={stage === s.id} onChange={() => setStage(s.id)} />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        <StarRating label="有用程度（1-5）" value={usefulness} onChange={setUsefulness} />
        <StarRating label="清晰程度（1-5）" value={clarity} onChange={setClarity} />

        <div className="form-row">
          <label className="binding-label">会再用吗</label>
          <div className="beta-radio-group">
            {AGAIN.map((a) => (
              <label key={a.id} className={`beta-chip ${wouldUseAgain === a.id ? "on" : ""}`}>
                <input type="radio" name="again" value={a.id} checked={wouldUseAgain === a.id} onChange={() => setWouldUseAgain(a.id)} />
                {a.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label className="binding-label">什么对你有帮助</label>
          <textarea
            value={helped}
            onChange={(e) => setHelped(e.target.value)}
            placeholder="哪些功能或体验对你有用……"
            maxLength={1000}
          />
        </div>

        <div className="form-row">
          <label className="binding-label">什么阻碍了你</label>
          <textarea
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
            placeholder="哪里卡住了、哪里不清晰……"
            maxLength={1000}
          />
        </div>

        <div className="form-row">
          <label className="beta-checkbox-row">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(e) => setContactConsent(e.target.checked)}
            />
            <span>愿意留下联系方式（可选，测试组织者可能据此跟进）</span>
          </label>
          {contactConsent && (
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱或其他联系方式"
              maxLength={200}
            />
          )}
        </div>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="btn" disabled={!consent || submitting}>
          {submitting ? "提交中…" : "提交反馈"}
        </button>
      </form>

      {feedbackList.length > 0 && (
        <div className="beta-history">
          <span>已提交 {feedbackList.length} 条反馈</span>
          <a className="btn btn-sm btn-outline" href={exportUrl} target="_blank" rel="noopener noreferrer">
            导出 JSON
          </a>
        </div>
      )}
    </div>
  );
}
