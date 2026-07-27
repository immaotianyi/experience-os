import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { archiveVault } from "../api/core.js";

export default function VaultView({ refreshKey, toast }) {
  const validationUrl = `/api/validation?t=${refreshKey}`;
  const maintenanceUrl = `/api/vault-maintenance?t=${refreshKey}`;
  const { data: validation, loading: vLoading, error: vError, refresh: rev1 } = useFetch(validationUrl);
  const { data: maintenance, loading: mLoading, error: mError, refresh: rev2 } = useFetch(maintenanceUrl);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm("确认归档 Vault? 这将创建一个新的 Git commit。")) return;
    setArchiving(true);
    try {
      const result = await archiveVault();
      if (result.error) {
        toast(result.error, "bad");
      } else {
        toast("Vault 已归档", "ok");
        rev1();
        rev2();
      }
    } catch (err) {
      toast(err.message, "bad", "归档失败");
    } finally {
      setArchiving(false);
    }
  };

  const v = validation || {};
  const m = maintenance || {};

  if ((vLoading && !validation) || (mLoading && !maintenance)) {
    return <div className="skeleton" style={{ height: "200px" }}>加载中</div>;
  }

  return (
    <>
      {(vError || mError) && (
        <div className="error-banner" style={{ marginBottom: "14px" }}>
          <span>{vError || mError}</span>
          <button onClick={() => { rev1(); rev2(); }}>重试</button>
        </div>
      )}
      <div className="status-strip">
        <div className="status">
          <strong>检查记录</strong>
          <span>{v.checkedCount ?? "—"}</span>
        </div>
        <div className="status">
          <strong>有效记录</strong>
          <span>{v.supportedCount ?? 0} 支持</span>
        </div>
        <div className="status">
          <strong>无效记录</strong>
          <span>{v.invalidCount ?? 0}</span>
        </div>
        <div className="status">
          <strong>损坏文件</strong>
          <span>{v.corruptFileCount ?? 0}</span>
        </div>
      </div>

      <div className="bento">
        <div className="panel span-2">
          <div className="panel-head">
            <h2>验证概览</h2>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <strong>{v.valid ? <span className="pill ok">通过</span> : <span className="pill bad">存在问题</span>}</strong>
              <span>整体状态</span>
            </div>
            <div className="metric">
              <strong>{v.supportedCount ?? 0}</strong>
              <span>支持的记录类型</span>
            </div>
            <div className="metric">
              <strong>{v.unsupportedCount ?? 0}</strong>
              <span>不支持的记录</span>
            </div>
            <div className="metric">
              <strong>{v.corruptFileCount ?? 0}</strong>
              <span>损坏文件数</span>
            </div>
          </div>
          {v.unsupportedKinds?.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p className="muted" style={{ fontSize: "12px", margin: "0 0 6px" }}>不支持的类型:</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {v.unsupportedKinds.map((k, i) => (
                  <span key={i} className="pill warn">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel span-2">
          <div className="panel-head">
            <h2>Vault 维护</h2>
            <button className="primary-btn" onClick={handleArchive} disabled={archiving}>
              {archiving ? "归档中..." : "归档 Vault"}
            </button>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <strong>{m.totalRecords ?? "—"}</strong>
              <span>总记录</span>
            </div>
            <div className="metric">
              <strong>{m.totalArchiveCandidates ?? "—"}</strong>
              <span>归档候选</span>
            </div>
            <div className="metric">
              <strong>{Object.keys(m.retention || {}).length} 类</strong>
              <span>保留策略</span>
            </div>
            <div className="metric">
              <strong>{m.destructive ? <span className="pill bad">破坏性</span> : <span className="pill ok">安全</span>}</strong>
              <span>操作模式</span>
            </div>
          </div>
          {m.plans?.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <p className="muted" style={{ fontSize: "12px", margin: "0 0 6px" }}>维护计划:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {m.plans.slice(0, 5).map((p, i) => (
                  <span key={i} className="tag" style={{ fontSize: "12px" }}>
                    {p.kind}: {p.archiveCandidateCount}/{p.count} 待归档 (保留 {p.keep})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {v.corruptFiles?.length > 0 && (
        <div className="panel" style={{ marginTop: "14px", borderColor: "var(--bad)" }}>
          <h2>损坏文件</h2>
          <div style={{ marginTop: "12px" }}>
            {v.corruptFiles.slice(0, 10).map((f, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid var(--line)", marginBottom: "6px", fontSize: "12px" }}>
                <strong>{f.path || f.file || f}</strong>
                {f.error && <p className="muted" style={{ margin: "4px 0 0" }}>{f.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {v.invalid?.length > 0 && (
        <div className="panel" style={{ marginTop: "14px", borderColor: "var(--bad)" }}>
          <h2>无效记录详情</h2>
          <div style={{ marginTop: "12px" }}>
            {v.invalid.slice(0, 10).map((r, i) => (
              <div key={i} style={{ padding: "8px", border: "1px solid var(--line)", marginBottom: "6px", fontSize: "12px" }}>
                <strong>{r.kind}:{r.id}</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>{r.issues?.join("; ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
