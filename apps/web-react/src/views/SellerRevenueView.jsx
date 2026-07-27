import { useState } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { refundTransaction } from "../api/transaction.js";

function TransactionRow({ tx, onRefund, sellerView }) {
  const [refunding, setRefunding] = useState(false);
  const handleRefund = async () => {
    if (!confirm(`确认退款交易 ${tx.id}? 此操作不可撤销。`)) return;
    setRefunding(true);
    await onRefund(tx.id);
    setRefunding(false);
  };

  const statusTag = tx.status === "completed" ? "ok" : tx.status === "refunded" ? "bad" : "warn";

  return (
    <tr>
      <td style={{ fontSize: "11px", fontFamily: "monospace" }}>{tx.id?.slice(0, 24) || "—"}...</td>
      <td>{tx.buyerId}</td>
      <td style={{ textAlign: "center" }}>{tx.type}</td>
      <td style={{ textAlign: "right" }}>¥{tx.amount?.toFixed(2) ?? "0.00"}</td>
      <td style={{ textAlign: "right" }}>¥{tx.commission?.toFixed(2) ?? "0.00"}</td>
      <td style={{ textAlign: "right" }}>¥{tx.netToSeller?.toFixed(2) ?? "0.00"}</td>
      <td style={{ textAlign: "center" }}><span className={`pill ${statusTag}`}>{tx.status}</span></td>
      <td style={{ fontSize: "11px", fontFamily: "monospace" }}>{tx.licenseKey?.slice(0, 20) || "—"}...</td>
      {sellerView && tx.status === "completed" && tx.type !== "trial" && (
        <td>
          <button className="ghost-btn" onClick={handleRefund} disabled={refunding} style={{ minHeight: "30px", fontSize: "11px" }}>
            {refunding ? "..." : "退款"}
          </button>
        </td>
      )}
    </tr>
  );
}

export default function SellerRevenueView({ refreshKey, toast }) {
  const [sellerId, setSellerId] = useState("seller.demo");
  const [activeSeller, setActiveSeller] = useState("seller.demo");

  const revenueUrl = `/api/transaction/revenue?sellerId=${encodeURIComponent(activeSeller)}&t=${refreshKey}`;
  const historyUrl = `/api/transaction/history?sellerId=${encodeURIComponent(activeSeller)}&limit=50&t=${refreshKey}`;
  const { data: revenue, loading: revLoading, error: revError, refresh: revRefresh } = useFetch(revenueUrl);
  const { data: historyData, loading: histLoading, error: histError, refresh: histRefresh } = useFetch(historyUrl);

  const handleSearch = () => {
    if (sellerId.trim()) {
      setActiveSeller(sellerId.trim());
    }
  };

  const handleRefund = async (transactionId) => {
    try {
      await refundTransaction(transactionId);
      toast("退款成功", "ok");
      revRefresh();
      histRefresh();
    } catch (err) {
      toast(err.message, "bad", "退款失败");
    }
  };

  const r = revenue || {};
  const transactions = historyData?.transactions || [];

  if ((revLoading && !revenue) || (histLoading && !historyData)) {
    return <div className="skeleton" style={{ height: "200px" }}>加载中</div>;
  }

  return (
    <>
      {(revError || histError) && (
        <div className="error-banner" style={{ marginBottom: "14px" }}>
          <span>{revError || histError}</span>
          <button onClick={() => { revRefresh(); histRefresh(); }}>重试</button>
        </div>
      )}
      {/* Seller selector */}
      <div className="filters">
        <div className="search" style={{ minWidth: "300px" }}>
          <input
            type="text"
            placeholder="输入卖家 ID..."
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="primary-btn" onClick={handleSearch}>查询</button>
      </div>

      {/* Revenue summary */}
      <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <div className="metric">
          <strong>¥{r.totalRevenue?.toFixed(2) ?? "0.00"}</strong>
          <span>总收入</span>
        </div>
        <div className="metric">
          <strong>¥{r.netRevenue?.toFixed(2) ?? "0.00"}</strong>
          <span>净收入 (扣除抽成)</span>
        </div>
        <div className="metric">
          <strong>¥{r.totalCommission?.toFixed(2) ?? "0.00"}</strong>
          <span>平台抽成</span>
        </div>
        <div className="metric">
          <strong>{r.transactionCount ?? 0}</strong>
          <span>交易笔数</span>
        </div>
      </div>

      {/* Top skills */}
      {r.topSkills?.length > 0 && (
        <div className="panel" style={{ marginTop: "14px" }}>
          <div className="panel-head">
            <h2>Top Skills (按收入)</h2>
          </div>
          <table className="data-table" style={{ marginTop: "12px" }}>
            <thead>
              <tr>
                <th>Skill</th>
                <th style={{ width: "100px" }}>收入</th>
                <th style={{ width: "80px" }}>销量</th>
              </tr>
            </thead>
            <tbody>
              {r.topSkills.map((s) => (
                <tr key={s.skillId}>
                  <td>{s.skillId}</td>
                  <td style={{ textAlign: "right" }}>¥{s.revenue?.toFixed(2) ?? "0.00"}</td>
                  <td style={{ textAlign: "center" }}>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* By type distribution */}
      {r.byType && Object.keys(r.byType).length > 0 && (
        <div className="panel" style={{ marginTop: "14px" }}>
          <div className="panel-head">
            <h2>交易类型分布</h2>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            {Object.entries(r.byType).map(([type, count]) => (
              <div key={type} style={{ flex: 1, padding: "12px", border: "1px solid var(--line)", textAlign: "center" }}>
                <strong style={{ display: "block", fontSize: "20px" }}>{count}</strong>
                <span className="muted" style={{ fontSize: "12px" }}>{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="section-head" style={{ marginTop: "18px" }}>
        <h2>交易流水</h2>
      </div>

      {transactions.length === 0 && !histLoading ? (
        <div className="empty-guide">
          <h3>暂无交易记录</h3>
          <p>卖家 {activeSeller} 还没有交易记录。</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>交易 ID</th>
              <th>买家</th>
              <th style={{ width: "60px" }}>类型</th>
              <th style={{ width: "80px" }}>金额</th>
              <th style={{ width: "80px" }}>抽成</th>
              <th style={{ width: "80px" }}>净收入</th>
              <th style={{ width: "70px" }}>状态</th>
              <th>授权密钥</th>
              <th style={{ width: "60px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onRefund={handleRefund} sellerView />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
