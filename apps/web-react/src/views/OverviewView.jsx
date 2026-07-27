import { useFetch } from "../hooks/useFetch.js";

function StatusCard({ label, value, hint }) {
  return (
    <div className="status">
      <strong>{label}</strong>
      <span>{value}{hint && ` — ${hint}`}</span>
    </div>
  );
}

export default function OverviewView({ refreshKey }) {
  const url = `/api/summary?t=${refreshKey}`;
  const { data, loading, error, refresh } = useFetch(url);

  if (loading && !data) return <div className="skeleton" style={{ height: "200px" }}>加载中</div>;
  if (error) return <div className="error-banner"><span>{error}</span><button onClick={refresh}>重试</button></div>;
  if (!data) return null;

  const s = data;
  const counts = s.counts || {};
  const health = s.health || {};
  const latest = s.latest || {};
  const reviewQueue = s.reviewQueue || {};
  const marketplace = s.marketplace || {};
  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
  const generatedAt = s.generatedAt ? new Date(s.generatedAt).toLocaleString("zh-CN") : "—";

  const healthyCount = [health.selfIterationHealthy, health.humanReviewReady, health.wallFeedbackLoopReady, health.reuseReady].filter(Boolean).length;
  const healthStatus = healthyCount >= 4 ? "ok" : healthyCount >= 2 ? "warn" : "bad";

  return (
    <>
      <div className="status-strip">
        <StatusCard label="记录总数" value={totalRecords} />
        <StatusCard label="Skill 数" value={counts.Skill ?? 0} hint={`${counts.Skill ?? 0} stable`} />
        <StatusCard label="审查包" value={counts.ReviewPacket ?? 0} hint={`${reviewQueue.pendingReviewCount ?? 0} 待处理`} />
        <StatusCard label="撞墙" value={counts.WallHit ?? 0} />
      </div>

      {/* 2.0-C Marketplace stats strip */}
      <div className="status-strip" style={{ marginTop: "10px" }}>
        <StatusCard label="市场 Listing" value={marketplace.activeListings ?? 0} hint={`${counts.MarketplaceListing ?? 0} 总计`} />
        <StatusCard label="交易笔数" value={marketplace.totalTransactions ?? 0} />
        <StatusCard label="市场收入" value={`¥${marketplace.totalRevenue?.toFixed(2) ?? "0.00"}`} />
        <StatusCard label="评分数" value={counts.SkillRating ?? 0} />
      </div>

      <div className="bento">
        <div className="panel">
          <div className="panel-head">
            <h2>管道健康</h2>
            <span className={`pill ${healthStatus === "ok" ? "ok" : healthStatus === "warn" ? "warn" : "bad"}`}>
              {healthStatus === "ok" ? "健康" : healthStatus === "warn" ? "注意" : "异常"}
            </span>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <strong>{health.selfIterationHealthy ? <span className="pill ok">正常</span> : <span className="pill bad">异常</span>}</strong>
              <span>自迭代管道</span>
            </div>
            <div className="metric">
              <strong>{health.humanReviewReady ? <span className="pill ok">就绪</span> : <span className="pill warn">等待</span>}</strong>
              <span>人工审查</span>
            </div>
            <div className="metric">
              <strong>{health.wallFeedbackLoopReady ? <span className="pill ok">就绪</span> : <span className="pill warn">等待</span>}</strong>
              <span>撞墙反馈环</span>
            </div>
            <div className="metric">
              <strong>{health.reuseReady ? <span className="pill ok">就绪</span> : <span className="pill warn">等待</span>}</strong>
              <span>复用管道</span>
            </div>
          </div>
        </div>

        <div className="panel span-2">
          <div className="panel-head">
            <h2>记录分布</h2>
          </div>
          <div className="funnel">
            {Object.entries(counts).map(([k, v]) => (
              <span key={k}><strong style={{ display: "inline-block", minWidth: "180px" }}>{k}</strong> {v}</span>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>数据快照</h2>
          </div>
          <p className="body-copy" style={{ fontSize: "13px" }}>生成时间: {generatedAt}</p>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {latest.project && <span className="tag">最新项目: {latest.project.name || latest.project.id}</span>}
            {latest.skillRun && <span className="tag accent">最近 Skill 运行: {latest.skillRun.summary || latest.skillRun.id?.slice(0, 30) || "—"}</span>}
            {latest.wallHit && <span className="tag bad">最近撞墙: {latest.wallHit.message?.slice(0, 40) || latest.wallHit.id?.slice(0, 30) || "—"}</span>}
          </div>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "12px" }}>
            审查队列: {reviewQueue.pendingReviewCount ?? 0} 待审 · 最近包 {reviewQueue.latestReviewPacketCount ?? 0} 条
          </p>
        </div>
      </div>
    </>
  );
}
