/**
 * CodeGraphView — 代码图谱视图。
 *
 * 核心职责：
 *   - 展示代码结构模式（枢纽/热点/循环依赖/叶子/桥接节点）列表
 *   - 触发代码图谱入库分析（ingest）
 *   - 计算并展示变更爆炸半径（blast radius）
 *   - 风险等级着色（low/medium/high/critical）
 */
import { useState, useCallback } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { fetchCodeGraphPatterns, ingestCodeGraph, computeBlastRadius } from "../api/codeGraph.js";

const PATTERN_LABELS = {
  hub: "枢纽",
  hotspot: "热点",
  cycle: "循环依赖",
  leaf: "叶子节点",
  bridge: "桥接节点"
};

const RISK_COLORS = {
  low: "ok",
  medium: "warn",
  high: "bad",
  critical: "bad"
};

function PatternBadge({ type }) {
  const label = PATTERN_LABELS[type] || type;
  return <span className={`pill ${type === "hotspot" ? "bad" : type === "hub" ? "warn" : "ok"}`}>{label}</span>;
}

function PatternRow({ pattern, onBlastRadius, loadingId }) {
  const isLoading = loadingId === pattern.id;
  return (
    <tr
      style={{ cursor: isLoading ? "wait" : "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={`查看 ${pattern.label} 的爆炸半径`}
      onKeyDown={(e) => {
        if (isLoading) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBlastRadius(pattern);
        }
      }}
      onClick={() => !isLoading && onBlastRadius(pattern)}
    >
      <td><PatternBadge type={pattern.patternType} /></td>
      <td>{pattern.label}</td>
      <td style={{ fontSize: "12px", color: "var(--muted)" }}>{pattern.description}</td>
      <td style={{ textAlign: "center" }}>
        {Object.entries(pattern.metrics || {}).map(([k, v]) => (
          <span key={k} className="pill" style={{ marginRight: "4px", fontSize: "11px" }}>{k}: {v}</span>
        ))}
      </td>
      <td style={{ textAlign: "center" }}>
        {isLoading ? <span className="pill">计算中…</span> : <span className="pill">点击评估</span>}
      </td>
    </tr>
  );
}

function BlastRadiusDetail({ result, pattern }) {
  if (!result || typeof result !== "object") {
    return <div className="empty-guide"><p>无分析结果数据</p></div>;
  }
  return (
    <>
      <div className="detail-grid">
        <div><span>目标节点</span><strong>{result.targetId}</strong></div>
        <div><span>风险等级</span><strong className={RISK_COLORS[result.riskLevel] || ""}>{result.riskLevel}</strong></div>
        <div><span>直接依赖</span><strong>{result.directDependents?.length ?? 0}</strong></div>
        <div><span>传递依赖</span><strong>{result.transitiveDependents?.length ?? 0}</strong></div>
        <div><span>受影响文件</span><strong>{result.affectedFiles?.length ?? 0}</strong></div>
      </div>

      {result.directDependents?.length > 0 && (
        <div className="detail-section">
          <h3>直接依赖方</h3>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {result.directDependents.map((dep) => (
              <span key={dep.id} className="pill">{dep.label || dep.id}</span>
            ))}
          </div>
        </div>
      )}

      {result.transitiveDependents?.length > 0 && (
        <div className="detail-section">
          <h3>传递依赖方</h3>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {result.transitiveDependents.map((dep) => (
              <span key={dep.id} className="pill" style={{ fontSize: "11px" }}>{dep.label || dep.id}</span>
            ))}
          </div>
        </div>
      )}

      {result.affectedFiles?.length > 0 && (
        <div className="detail-section">
          <h3>受影响文件</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {result.affectedFiles.map((file) => (
              <code key={file} style={{ fontSize: "12px", color: "var(--muted)" }}>{file}</code>
            ))}
          </div>
        </div>
      )}

      {pattern?.applicabilityBounds?.length > 0 && (
        <div className="detail-section">
          <h3>适用边界</h3>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "13px" }}>
            {pattern.applicabilityBounds.map((bound, i) => (
              <li key={i}>{bound}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function CodeGraphView({ openDrawer, refreshKey, toast }) {
  const [patternType, setPatternType] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [snapshotInput, setSnapshotInput] = useState("");

  const url = `/api/code-graph/patterns?projectId=${encodeURIComponent("*")}&t=${refreshKey}${patternType ? `&patternType=${patternType}` : ""}`;
  const { data, loading, error, refresh } = useFetch(url);

  const patterns = data?.patterns || [];

  const handleBlastRadius = useCallback(async (pattern) => {
    setLoadingId(pattern.id);
    try {
      // Cycle patterns have nodeIds[] instead of nodeId — use first node as target
      const targetId = pattern.nodeId || (pattern.nodeIds?.length ? pattern.nodeIds[0] : null);
      if (!targetId) {
        toast("此模式没有关联节点，无法评估爆炸半径", "bad", "参数错误");
        setLoadingId(null);
        return;
      }
      toast("需要代码图快照来计算爆炸半径。请在下方粘贴快照 JSON。", "warn", "爆炸半径");
      const snapshotText = window.prompt("粘贴代码图快照 JSON (nodes + edges)：");
      if (!snapshotText) {
        setLoadingId(null);
        return;
      }
      let snapshot;
      try {
        snapshot = JSON.parse(snapshotText);
      } catch {
        toast("JSON 格式无效", "bad", "解析失败");
        setLoadingId(null);
        return;
      }
      const result = await computeBlastRadius({
        projectId: pattern.projectId,
        targetId,
        snapshot
      });
      openDrawer({
        eyebrow: "爆炸半径分析",
        title: pattern.label,
        body: <BlastRadiusDetail result={result} pattern={pattern} />
      });
      toast(`风险等级: ${result.riskLevel}，直接依赖: ${result.directDependents?.length ?? 0}`, RISK_COLORS[result.riskLevel] || "ok", "分析完成");
    } catch (err) {
      toast(err.message || "分析过程中发生错误", "bad", "分析失败");
    } finally {
      setLoadingId(null);
    }
  }, [openDrawer, toast]);

  const handleIngest = useCallback(async () => {
    if (!snapshotInput.trim()) {
      toast("请粘贴快照 JSON", "warn", "输入为空");
      return;
    }
    setIngesting(true);
    try {
      const snapshot = JSON.parse(snapshotInput);
      const result = await ingestCodeGraph({
        projectId: snapshot.projectId || "*",
        snapshot: snapshot.snapshot || snapshot,
        sourceTool: snapshot.sourceTool || "web-ingest"
      });
      toast(`提取 ${result.patternCount} 个模式，节点 ${result.summary?.nodeCount ?? 0}，边 ${result.summary?.edgeCount ?? 0}`, "ok", "导入成功");
      setSnapshotInput("");
      refresh();
    } catch (err) {
      toast(err.message, "bad", "导入失败");
    } finally {
      setIngesting(false);
    }
  }, [snapshotInput, toast, refresh]);

  return (
    <>
      {/* 导入区 */}
      <div className="panel" style={{ marginBottom: "14px" }}>
        <div className="panel-head">
          <div>
            <h2>代码图导入</h2>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: "13px" }}>
              粘贴外部工具生成的代码结构快照 (AST/调用图/依赖图)，自动提取 hub/hotspot/cycle/leaf/bridge 模式
            </p>
          </div>
        </div>
        <div style={{ marginTop: "12px" }}>
          <textarea
            value={snapshotInput}
            onChange={(e) => setSnapshotInput(e.target.value)}
            placeholder={'{"projectId":"my-project","snapshot":{"nodes":[{"id":"fn1","type":"function","label":"handleAuth","complexity":10},{"id":"fn2","type":"function","label":"validateInput","complexity":5}],"edges":[{"source":"fn1","target":"fn2","kind":"calls"}]}}'}
            style={{
              width: "100%",
              minHeight: "100px",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid var(--rule)",
              background: "var(--bg2)",
              color: "var(--ink)",
              resize: "vertical"
            }}
          />
          <button
            className="primary-btn"
            onClick={handleIngest}
            disabled={ingesting}
            style={{ marginTop: "8px" }}
          >
            {ingesting ? "导入中..." : "导入快照"}
          </button>
        </div>
      </div>

      {/* 模式列表 */}
      <div className="section-head">
        <div>
          <h2>代码结构模式</h2>
          <p>从代码图中提取的结构模式，点击行可评估变更爆炸半径</p>
        </div>
        <label className="muted" style={{ fontSize: "12px" }}>
          类型筛选
          <select value={patternType} onChange={(e) => setPatternType(e.target.value)} style={{ minHeight: "38px" }}>
            <option value="">全部</option>
            <option value="hub">枢纽 (hub)</option>
            <option value="hotspot">热点 (hotspot)</option>
            <option value="cycle">循环依赖 (cycle)</option>
            <option value="leaf">叶子 (leaf)</option>
            <option value="bridge">桥接 (bridge)</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={refresh}>重试</button>
        </div>
      ) : patterns.length === 0 && !loading ? (
        <div className="empty-guide">
          <h3>暂无代码图模式</h3>
          <p>导入代码结构快照后，系统将自动提取枢纽、热点、循环依赖等模式并生成对应 Skill。</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "90px" }}>类型</th>
              <th style={{ width: "160px" }}>节点</th>
              <th>描述</th>
              <th style={{ width: "200px" }}>指标</th>
              <th style={{ width: "100px" }}>爆炸半径</th>
            </tr>
          </thead>
          <tbody>
            {patterns.map((pattern) => (
              <PatternRow
                key={pattern.id}
                pattern={pattern}
                onBlastRadius={handleBlastRadius}
                loadingId={loadingId}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* 模式分布统计 */}
      {patterns.length > 0 && (
        <div className="panel" style={{ marginTop: "14px" }}>
          <div className="panel-head">
            <h2>模式分布</h2>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            {Object.entries(
              patterns.reduce((acc, p) => {
                acc[p.patternType] = (acc[p.patternType] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <div key={type} className="metric">
                <strong>{count}</strong>
                <span>{PATTERN_LABELS[type] || type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
