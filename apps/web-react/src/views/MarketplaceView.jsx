import { useState, useEffect, useRef, useCallback } from "react";
import { useFetch } from "../hooks/useFetch.js";
import { useToast } from "../hooks/useToast.jsx";
import { searchMarketplace, fetchMarketplaceStats } from "../api/marketplace.js";
import { fetchRatings } from "../api/quality.js";
import { submitRating } from "../api/quality.js";
import { processPurchase, processTrial, fetchPricingBreakdown, verifyBuyerLicense } from "../api/transaction.js";
import { IconSearch, IconStar } from "../components/icons.jsx";

const SORT_OPTIONS = [
  { value: "recent", label: "最近更新" },
  { value: "downloads", label: "下载量" },
  { value: "rating", label: "评分" },
  { value: "revenue", label: "收入" }
];

const LICENSE_OPTIONS = ["", "MIT", "Commercial", "Team"];
const PRICING_OPTIONS = ["", "free", "one_time", "subscription"];

function ListingCard({ listing, onOpen }) {
  const avg = listing.averageRating ? listing.averageRating.toFixed(1) : "—";
  const priceLabel = listing.pricing?.model === "free" ? "免费" :
    listing.pricing?.model === "one_time" ? `¥${listing.pricing?.price ?? 0}` :
    listing.pricing?.model === "subscription" ? `¥${listing.pricing?.price ?? 0}/月` : "—";

  return (
    <div
      className="record-card"
      role="button"
      tabIndex={0}
      aria-label={`${listing.skillName || listing.skillId}（${priceLabel}）`}
      onClick={() => onOpen(listing)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(listing);
        }
      }}
    >
      <header>
        <div>
          <h3>{listing.skillName || listing.skillId}</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>{listing.sellerId}</p>
        </div>
        <span className="tag accent">{listing.license}</span>
      </header>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span className="tag">{priceLabel}</span>
        <span className="tag">{listing.pricing?.model}</span>
        <span className="tag">v{listing.version}</span>
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "12px", fontSize: "12px", color: "var(--muted)" }}>
        <span>↓ {listing.downloads || 0}</span>
        <span>★ {avg}</span>
        <span>¥ {listing.revenue?.toFixed(2) || "0.00"}</span>
      </div>
    </div>
  );
}

function ListingDetail({ listing, toast }) {
  const [buyerId, setBuyerId] = useState("buyer.demo");
  const [purchaseType, setPurchaseType] = useState("purchase");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Load ratings + breakdown
  useEffect(() => {
    fetchRatings(listing.skillId).then(setRatings).catch(() => {});
  }, [listing.skillId]);

  const previewBreakdown = async () => {
    try {
      const result = await fetchPricingBreakdown(listing.id, purchaseType);
      setBreakdown(result.breakdown || result);
    } catch (err) {
      toast(err.message, "bad", "价格预览失败");
    }
  };

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    try {
      // Check existing license for one_time
      if (purchaseType !== "trial" && listing.pricing?.model === "one_time") {
        const lic = await verifyBuyerLicense(listing.id, buyerId);
        if (lic.hasLicense) {
          toast(`已有授权: ${lic.licenseKey}`, "warn", "重复购买");
          setPurchaseLoading(false);
          return;
        }
      }
      const fn = purchaseType === "trial" ? processTrial : processPurchase;
      const result = await fn({ listingId: listing.id, buyerId });
      // processPurchase/processTrial already increments listing.downloads on the server
      // (see transactionLog.js). Do NOT call recordDownload here — that would double-count.
      toast(`购买成功! 授权密钥: ${result.licenseKey}`, "ok", "交易完成");
    } catch (err) {
      toast(err.message, "bad", "购买失败");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRate = async () => {
    if (ratingScore < 1 || ratingScore > 5) {
      toast("请选择 1-5 星评分", "warn");
      return;
    }
    setSubmittingRating(true);
    try {
      await submitRating({
        skillId: listing.skillId,
        userId: buyerId,
        score: ratingScore,
        review: ratingReview
      });
      toast("评分已提交", "ok");
      setRatingScore(0);
      setRatingReview("");
      // Refresh ratings — failure here doesn't mean the rating wasn't submitted
      try {
        const updated = await fetchRatings(listing.skillId);
        setRatings(updated);
      } catch (refreshErr) {
        toast("评分已提交，但刷新评价列表失败", "warn");
      }
    } catch (err) {
      toast(err.message, "bad", "评分失败");
    } finally {
      setSubmittingRating(false);
    }
  };

  const avg = ratings?.average?.toFixed(1) || "—";

  return (
    <>
      <div className="detail-grid">
        <div><span>定价模型</span><strong>{listing.pricing?.model || "—"}</strong></div>
        <div><span>价格</span><strong>{listing.pricing?.model === "free" ? "免费" : `¥${listing.pricing?.price || 0}`}</strong></div>
        <div><span>授权类型</span><strong>{listing.license}</strong></div>
        <div><span>版本</span><strong>{listing.version}</strong></div>
        <div><span>下载量</span><strong>{listing.downloads || 0}</strong></div>
        <div><span>收入</span><strong>¥{listing.revenue?.toFixed(2) || "0.00"}</strong></div>
        <div><span>评分</span><strong>★ {avg} ({ratings?.count || 0} 条)</strong></div>
        <div><span>卖家</span><strong>{listing.sellerId}</strong></div>
      </div>

      {/* Purchase section */}
      <div className="detail-section">
        <h3>购买</h3>
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          <label className="muted" style={{ fontSize: "12px" }}>买家 ID</label>
          <input
            type="text"
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            style={{ width: "100%", minHeight: "38px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", padding: "0 10px" }}
          />
          <label className="muted" style={{ fontSize: "12px" }}>购买类型</label>
          <select
            value={purchaseType}
            onChange={(e) => { setPurchaseType(e.target.value); setBreakdown(null); }}
            style={{ minHeight: "38px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", padding: "0 9px" }}
          >
            <option value="purchase">购买 ({listing.pricing?.model === "free" ? "免费" : `¥${listing.pricing?.price || 0}`})</option>
            {listing.pricing?.model !== "free" && <option value="subscription">订阅</option>}
            {listing.trialEnabled && <option value="trial">试用 (免费)</option>}
          </select>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ghost-btn" onClick={previewBreakdown} disabled={purchaseType === "trial"}>
              预览价格
            </button>
            <button className="primary-btn" onClick={handlePurchase} disabled={purchaseLoading || !buyerId.trim()}>
              {purchaseLoading ? "处理中..." : "确认购买"}
            </button>
          </div>
          {breakdown && (
            <div style={{ marginTop: "8px", padding: "10px", background: "var(--panel-2)", fontSize: "12px" }}>
              <div>总价: ¥{breakdown.gross?.toFixed(2) ?? "0.00"}</div>
              <div>平台抽成 (15%): ¥{breakdown.platformCommission?.toFixed(2) ?? "0.00"}</div>
              <div>作者净收入: ¥{breakdown.authorNet?.toFixed(2) ?? "0.00"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Rating section */}
      <div className="detail-section">
        <h3>评分</h3>
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={star <= ratingScore ? "filled" : ""}
                onClick={() => setRatingScore(star)}
              >
                <IconStar />
              </button>
            ))}
          </div>
          <textarea
            placeholder="写下你的评价..."
            value={ratingReview}
            onChange={(e) => setRatingReview(e.target.value)}
            style={{ width: "100%", minHeight: "60px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", padding: "8px", resize: "vertical" }}
          />
          <button className="primary-btn" onClick={handleRate} disabled={submittingRating || ratingScore === 0}>
            {submittingRating ? "提交中..." : "提交评分"}
          </button>
        </div>
      </div>

      {/* Ratings list */}
      {ratings?.ratings?.length > 0 && (
        <div className="detail-section">
          <h3>用户评价 ({ratings.count})</h3>
          <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
            {ratings.ratings.slice(0, 5).map((r) => (
              <div key={r.id} style={{ padding: "8px", border: "1px solid var(--line)", fontSize: "12px" }}>
                <strong>{r.userId}</strong> ★ {r.score}
                {r.review && <p className="muted" style={{ margin: "4px 0 0" }}>{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function MarketplaceView({ openDrawer, refreshKey, toast }) {
  const [query, setQuery] = useState("");
  const [license, setLicense] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const statsUrl = `/api/marketplace/stats?t=${refreshKey}`;
  const { data: stats } = useFetch(statsUrl);

  // Use refs to always have latest values in doSearch without stale closures
  const paramsRef = useRef({ query: "", license: "", pricingModel: "", sortBy: "recent" });
  paramsRef.current = { query, license, pricingModel, sortBy };

  const doSearch = useCallback(async () => {
    setSearching(true);
    try {
      const { query: q, license: l, pricingModel: pm, sortBy: sb } = paramsRef.current;
      const result = await searchMarketplace({ query: q, license: l, pricingModel: pm, sortBy: sb, limit: 24 });
      setSearchResults(result);
    } catch (err) {
      toast(err.message, "bad", "搜索失败");
    } finally {
      setSearching(false);
    }
  }, [toast]);

  // Initial search and when sortBy/refreshKey changes
  useEffect(() => {
    doSearch();
  }, [refreshKey, sortBy, doSearch]);

  const openListing = async (listing) => {
    openDrawer({
      eyebrow: "市场详情",
      title: listing.skillName || listing.skillId,
      body: <ListingDetail listing={listing} toast={toast} />
    });
  };

  const listings = searchResults?.listings || [];
  const s = stats || {};

  return (
    <>
      {/* Stats strip */}
      <div className="status-strip">
        <div className="status">
          <strong>活跃 listing</strong>
          <span>{s.activeListings ?? "—"}</span>
        </div>
        <div className="status">
          <strong>总下载量</strong>
          <span>{s.totalDownloads ?? "—"}</span>
        </div>
        <div className="status">
          <strong>总收入</strong>
          <span>¥{s.totalRevenue?.toFixed(2) ?? "—"}</span>
        </div>
        <div className="status">
          <strong>总 listing</strong>
          <span>{s.totalListings ?? "—"}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search" style={{ minWidth: "280px" }}>
          <IconSearch />
          <input
            type="text"
            placeholder="搜索 skill 名称..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
        </div>
        <label>
          授权
          <select value={license} onChange={(e) => setLicense(e.target.value)}>
            {LICENSE_OPTIONS.map((l) => <option key={l} value={l}>{l || "全部"}</option>)}
          </select>
        </label>
        <label>
          定价
          <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
            {PRICING_OPTIONS.map((p) => <option key={p} value={p}>{p || "全部"}</option>)}
          </select>
        </label>
        <label>
          排序
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <button className="primary-btn" onClick={doSearch} disabled={searching}>
          {searching ? "搜索中..." : "搜索"}
        </button>
      </div>

      {/* Results grid */}
      {searching ? (
        <div className="skeleton" style={{ height: "100px" }}>搜索中...</div>
      ) : listings.length === 0 ? (
        <div className="empty-guide">
          <h3>暂无市场 listing</h3>
          <p>发布一个 stable Skill 到市场即可在此显示。</p>
        </div>
      ) : (
        <div className="grid-list">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onOpen={openListing} />
          ))}
        </div>
      )}
    </>
  );
}
