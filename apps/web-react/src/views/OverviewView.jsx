/**
 * OverviewView — 总览仪表盘视图。
 *
 * 信息分三层，避免一眼全是数据：
 *   1) 焦点层：现在需要你做什么（待审审查包置顶放大，可点击直达）
 *   2) 引导层：EOS 是什么（可折叠，默认收起）
 *   3) 细节层：管道健康 / 记录分布（条形化，次要类型折叠） / 数据快照
 */
import { useFetch } from "../hooks/useFetch.js";
import { IconChevronDown } from "../components/icons.jsx";
import { KIND_LABELS } from "../components/trust.jsx";

function StatusCard({ label, value, hint, emph, href }) {
  const body = (
    <>
      <strong>{label}</strong>
      <span className="status-value">{value}</span>
      {hint && <small className="status-hint">{hint}</small>}
    </>
  );
  if (href) {
    return <a className={`status ${emph ? "emph" : ""}`} href={href}>{body}</a>;
  }
  return <div className={`status ${emph ? "emph" : ""}`}>{body}</div>;
}

function DistributionRow({ kind, count, max }) {
  return (
    <div className="funnel-row">
      <span className="funnel-label">{KIND_LABELS[kind] || kind}</span>
      <span className="funnel-track">
        <span className="funnel-bar" style={{ width: `${Math.max(3, (count / max) * 100)}%` }} />
      </span>
      <strong className="funnel-count">{count}</strong>
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
  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
  const pendingReview = reviewQueue.pendingReviewCount ?? 0;
  const generatedAt = s.generatedAt ? new Date(s.generatedAt).toLocaleString("zh-CN") : "—";

  const healthyCount = [health.selfIterationHealthy, health.humanReviewReady, health.wallFeedbackLoopReady, health.reuseReady].filter(Boolean).length;
  const healthStatus = healthyCount >= 4 ? "ok" : healthyCount >= 2 ? "warn" : "bad";

  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0]?.[1] || 1;
  const topEntries = entries.slice(0, 6);
  const restEntries = entries.slice(6);

  return (
    <>
      <div className="status-strip">
        <StatusCard
          label="待审审查包"
          value={pendingReview}
          hint={pendingReview > 0 ? "需要你拍板 →" : "全部已处理"}
          emph={pendingReview > 0}
          href="?view=review"
        />
        <StatusCard label="Skill 数" value={counts.Skill ?? 0} hint="已沉淀的可复用资产" />
        <StatusCard label="撞墙记录" value={counts.WallHit ?? 0} hint="经验提炼的原材料" />
        <StatusCard label="记录总数" value={totalRecords} hint={`快照 ${generatedAt}`} />
      </div>

      <details className="panel advanced-path eos-guide">
        <summary>
          <IconChevronDown />
          EOS 是什么？三步上手
          <span className="advanced-note">没有你的批准，EOS 什么都不存</span>
        </summary>
        <div className="eos-what-card">
          <p className="body-copy" style={{ margin: 0 }}>
            EOS 记录你和 AI 协作干活的过程：AI 做了什么 → 你批准了什么 → 哪些经验值得留下。留下来的经验变成可复用的 Skill，下次直接调用，不用重踩一遍坑。
          </p>
          <ol className="eos-what-steps">
            <li><strong>① 连接工具</strong><span>把 Codex / Cursor / TRAE 接入观察（AI 工具连接页）</span></li>
            <li><strong>② 正常干活</strong><span>菜单栏三灯显示状态：黄=工作中，绿=完成</span></li>
            <li><strong>③ 审查沉淀</strong><span>AI 整理经验草案，你在审查包页拍板入库</span></li>
          </ol>
        </div>
      </details>

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
            <span className="pill">{entries.length} 类</span>
          </div>
          <div className="funnel">
            {topEntries.map(([kind, count]) => (
              <DistributionRow key={kind} kind={kind} count={count} max={maxCount} />
            ))}
            {entries.length === 0 && <p className="empty">还没有记录。保存第一个工作节点后，这里会长出分布。</p>}
          </div>
          {restEntries.length > 0 && (
            <details className="advanced-path" style={{ marginTop: 10 }}>
              <summary>
                <IconChevronDown />
                其余 {restEntries.length} 类
                <span className="advanced-note">{restEntries.map(([kind]) => KIND_LABELS[kind] || kind).join(" · ")}</span>
              </summary>
              <div className="funnel" style={{ marginTop: 8 }}>
                {restEntries.map(([kind, count]) => (
                  <DistributionRow key={kind} kind={kind} count={count} max={maxCount} />
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>数据快照</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {latest.project && <span className="tag">最新项目: {latest.project.name || latest.project.id}</span>}
            {latest.skillRun && <span className="tag accent">最近 Skill 运行: {latest.skillRun.summary || latest.skillRun.id?.slice(0, 30) || "—"}</span>}
            {latest.wallHit && <span className="tag bad">最近撞墙: {latest.wallHit.message?.slice(0, 40) || latest.wallHit.id?.slice(0, 30) || "—"}</span>}
          </div>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "12px" }}>
            审查队列: {pendingReview} 待审 · 最近包 {reviewQueue.latestReviewPacketCount ?? 0} 条
          </p>
        </div>
      </div>
    </>
  );
}
