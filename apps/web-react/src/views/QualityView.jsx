import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { useToast } from "../hooks/useToast.jsx";
import { fetchQualityReport, autoFlagLowQuality } from "../api/quality.js";

function GradeBadge({ grade }) {
  if (!grade) return <span className="tag">—</span>;
  return <span className={`grade-badge grade-${grade}`}>{grade}</span>;
}

function LeaderboardRow({ entry, rank, onOpen }) {
  return (
    <tr onClick={() => onOpen(entry)} style={{ cursor: "pointer" }}>
      <td style={{ textAlign: "center", fontWeight: 700 }}>{rank}</td>
      <td>{entry.skillName || entry.skillId}</td>
      <td style={{ textAlign: "center" }}><GradeBadge grade={entry.grade} /></td>
      <td style={{ textAlign: "center" }}>{entry.score}</td>
      <td style={{ textAlign: "center" }}>{entry.signals?.reuseCount ?? 0}</td>
      <td style={{ textAlign: "center" }}>{entry.signals?.downloadCount ?? 0}</td>
      <td style={{ textAlign: "center" }}>{entry.signals?.ratingCount ?? 0}</td>
      <td style={{ textAlign: "center" }}>
        {entry.shouldFlag ? <span className="pill bad">需修订</span> : <span className="pill ok">正常</span>}
      </td>
    </tr>
  );
}

function QualityReportDetail({ report, toast }) {
  const s = report.signals || {};
  return (
    <>
      <div className="detail-grid">
        <div><span>评分</span><strong>{report.score}</strong></div>
        <div><span>等级</span><strong><GradeBadge grade={report.grade} /></strong></div>
        <div><span>Skill 状态</span><strong>{report.skillStatus}</strong></div>
        <div><span>是否标记</span><strong>{report.shouldFlag ? "是" : "否"}</strong></div>
      </div>

      <div className="detail-section">
        <h3>信号明细</h3>
        <div className="metric-grid">
          <div className="metric">
            <strong>{s.reuseCount ?? 0}</strong>
            <span>复用次数 (25%)</span>
          </div>
          <div className="metric">
            <strong>{s.approvalRate ?? 0}%</strong>
            <span>审查通过率 (20%)</span>
          </div>
          <div className="metric">
            <strong>{s.reviewCount ?? 0}</strong>
            <span>审查次数 (20%)</span>
          </div>
          <div className="metric">
            <strong>{s.downloadCount ?? 0}</strong>
            <span>下载量 (20%)</span>
          </div>
          <div className="metric">
            <strong>{s.ratingCount ?? 0} (★{s.ratingAverage ?? 0})</strong>
            <span>评分数</span>
          </div>
          <div className="metric">
            <strong>¥{s.revenue?.toFixed(2) ?? "0.00"}</strong>
            <span>收入</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function QualityView({ openDrawer, refreshKey, toast }) {
  const [limit, setLimit] = useState(20);
  const [autoFlagging, setAutoFlagging] = useState(false);

  const url = `/api/quality/leaderboard?limit=${limit}&t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  const leaderboard = data?.leaderboard || [];

  const lowQuality = leaderboard.filter((e) => e.shouldFlag);

  const handleAutoFlag = async () => {
    setAutoFlagging(true);
    try {
      const result = await autoFlagLowQuality();
      const count = result.flagged?.length || 0;
      toast(`已标记 ${count} 个低质 Skill`, count > 0 ? "warn" : "ok", "自动标记完成");
      refresh();
    } catch (err) {
      toast(err.message, "bad", "标记失败");
    } finally {
      setAutoFlagging(false);
    }
  };

  const openReport = async (entry) => {
    try {
      const report = await fetchQualityReport(entry.skillId);
      openDrawer({
        eyebrow: "质量报告",
        title: report.skillName || entry.skillId,
        body: <QualityReportDetail report={report} toast={toast} />
      });
    } catch (err) {
      toast(err.message, "bad", "加载报告失败");
    }
  };

  return (
    <>
      {/* Low quality alert */}
      {lowQuality.length > 0 && (
        <div className="panel" style={{ marginBottom: "14px", borderColor: "var(--bad)" }}>
          <div className="panel-head">
            <div>
              <h2>低质告警</h2>
              <p className="muted" style={{ margin: "6px 0 0", fontSize: "13px" }}>
                {lowQuality.length} 个 stable Skill 质量评分为 D 级，建议修订
              </p>
            </div>
            <button className="primary-btn" onClick={handleAutoFlag} disabled={autoFlagging}>
              {autoFlagging ? "标记中..." : "自动标记低质"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            {lowQuality.map((e) => (
              <span key={e.skillId} className="pill bad" style={{ cursor: "pointer" }} onClick={() => openReport(e)}>
                {e.skillName || e.skillId} (D, {e.score})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="section-head">
        <div>
          <h2>质量排行榜</h2>
          <p>基于市场信号的 Skill 质量评分 (S/A/B/C/D 等级)</p>
        </div>
        <label className="muted" style={{ fontSize: "12px" }}>
          显示数量
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ minHeight: "38px" }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={refresh}>重试</button>
        </div>
      ) : leaderboard.length === 0 && !loading ? (
        <div className="empty-guide">
          <h3>暂无质量数据</h3>
          <p>发布 Skill 到市场并产生下载/评分后，质量排行榜将自动生成。</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th>Skill</th>
              <th style={{ width: "50px" }}>等级</th>
              <th style={{ width: "50px" }}>分数</th>
              <th style={{ width: "60px" }}>复用</th>
              <th style={{ width: "60px" }}>下载</th>
              <th style={{ width: "60px" }}>评分</th>
              <th style={{ width: "80px" }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((e, i) => (
              <LeaderboardRow key={e.skillId} entry={e} rank={i + 1} onOpen={openReport} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
