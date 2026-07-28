import { useState, useCallback, useEffect } from "react";
import { ToastProvider, useToast } from "./hooks/useToast.jsx";
import { useTheme } from "./hooks/useTheme.js";
import {
  IconOverview, IconReview, IconWall, IconSkills, IconAudit,
  IconVault, IconMarket, IconQuality, IconRevenue, IconProject,
  IconRefresh, IconClose, IconSun, IconMoon, IconFeedback, IconPlatform,
  IconCodeGraph
} from "./components/icons.jsx";
import AttentionBeacon from "./components/AttentionBeacon.jsx";
import ProjectView from "./views/ProjectView.jsx";
import DetailDrawer from "./components/DetailDrawer.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import OverviewView from "./views/OverviewView.jsx";
import ReviewView from "./views/ReviewView.jsx";
import WallHitsView from "./views/WallHitsView.jsx";
import SkillsView from "./views/SkillsView.jsx";
import AuditView from "./views/AuditView.jsx";
import VaultView from "./views/VaultView.jsx";
import MarketplaceView from "./views/MarketplaceView.jsx";
import QualityView from "./views/QualityView.jsx";
import SellerRevenueView from "./views/SellerRevenueView.jsx";
import BetaFeedbackView from "./views/BetaFeedbackView.jsx";
import PlatformView from "./views/PlatformView.jsx";
import CodeGraphView from "./views/CodeGraphView.jsx";

const RAIL_GROUPS = [
  { label: "主线", items: [
    { id: "project", label: "项目", icon: IconProject, key: "1" },
    { id: "overview", label: "总览", icon: IconOverview, key: "2" },
  ]},
  { label: "管道", items: [
    { id: "review", label: "审查包", icon: IconReview, key: "6" },
    { id: "wallhits", label: "撞墙", icon: IconWall, key: "7" },
    { id: "skills", label: "Skill 库", icon: IconSkills, key: "8" },
    { id: "codegraph", label: "代码图", icon: IconCodeGraph, key: "g" },
  ]},
  { label: "交易", items: [
    { id: "marketplace", label: "市场", icon: IconMarket, key: "3" },
    { id: "quality", label: "质量看板", icon: IconQuality, key: "4" },
    { id: "revenue", label: "卖家营收", icon: IconRevenue, key: "5" },
  ]},
  { label: "治理", items: [
    { id: "audit", label: "决策审计", icon: IconAudit, key: "9" },
    { id: "vault", label: "Vault", icon: IconVault, key: "0" },
    { id: "feedback", label: "Beta 反馈", icon: IconFeedback, key: "f" },
    { id: "platform", label: "平台兼容", icon: IconPlatform, key: "p" },
  ]},
];

const VIEWS = RAIL_GROUPS.flatMap((g) => g.items);

function viewFromLocation() {
  const candidate = new URLSearchParams(window.location.search).get("view");
  return VIEWS.some((view) => view.id === candidate) ? candidate : "project";
}

const VIEW_TITLES = {
  project: { eyebrow: "Experience OS 3.0", title: "项目" },
  overview: { eyebrow: "Experience OS", title: "总览" },
  marketplace: { eyebrow: "经验资产交易", title: "市场" },
  quality: { eyebrow: "经验资产交易", title: "质量看板" },
  revenue: { eyebrow: "经验资产交易", title: "卖家营收" },
  review: { eyebrow: "生产管道", title: "审查包" },
  wallhits: { eyebrow: "生产管道", title: "撞墙记录" },
  skills: { eyebrow: "生产管道", title: "Skill 库" },
  codegraph: { eyebrow: "生产管道", title: "代码图" },
  audit: { eyebrow: "治理", title: "决策审计" },
  vault: { eyebrow: "治理", title: "Vault 维护" },
  feedback: { eyebrow: "Beta", title: "Beta 反馈" },
  platform: { eyebrow: "平台兼容", title: "平台" }
};

function Workbench() {
  const [activeView, setActiveView] = useState(viewFromLocation);
  const [drawerContent, setDrawerContent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const openDrawer = useCallback((content) => setDrawerContent(content), []);
  const closeDrawer = useCallback(() => setDrawerContent(null), []);
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    toast("已刷新", "ok");
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.isContentEditable) return;
      if (e.key === "Escape") { closeDrawer(); return; }
      // Disable view-switching shortcuts when drawer is open
      if (drawerContent) return;
      // Ignore Cmd/Ctrl+key combos (browser shortcuts like Cmd+R)
      if (e.metaKey || e.ctrlKey) return;
      const view = VIEWS.find((v) => v.key === e.key);
      if (view) {
        setActiveView(view.id);
        return;
      }
      if (e.key === "r" || e.key === "R") refresh();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [refresh, closeDrawer, drawerContent]);

  // Sync activeView with browser back/forward
  useEffect(() => {
    const onPop = () => setActiveView(viewFromLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const meta = VIEW_TITLES[activeView] || { eyebrow: "", title: "" };

  const navigateFromAttention = useCallback((view, anchor = null) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.pushState(null, "", url);
    if (anchor) {
      window.setTimeout(() => { window.location.hash = anchor; }, 0);
    }
  }, []);

  const renderView = () => {
    const props = { openDrawer, refreshKey, toast };
    switch (activeView) {
      case "project": return <ProjectView {...props} />;
      case "overview": return <OverviewView {...props} />;
      case "marketplace": return <MarketplaceView {...props} />;
      case "quality": return <QualityView {...props} />;
      case "revenue": return <SellerRevenueView {...props} />;
      case "review": return <ReviewView {...props} />;
      case "wallhits": return <WallHitsView {...props} />;
      case "skills": return <SkillsView {...props} />;
      case "codegraph": return <CodeGraphView {...props} />;
      case "audit": return <AuditView {...props} />;
      case "vault": return <VaultView {...props} />;
      case "feedback": return <BetaFeedbackView {...props} />;
      case "platform": return <PlatformView {...props} />;
      default: return null;
    }
  };

  return (
    <>
      <nav className="rail" aria-label="主导航">
        <div className="mark">EOS</div>
        {RAIL_GROUPS.map((group) => (
          <div key={group.label} className="rail-group">
            <span className="rail-group-label">{group.label}</span>
            {group.items.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  className={`rail-item ${activeView === v.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveView(v.id);
                    const u = new URL(window.location.href);
                    u.searchParams.set("view", v.id);
                    window.history.pushState(null, "", u);
                  }}
                  title={`${v.label} (${v.key})`}
                  aria-label={v.label}
                  aria-current={activeView === v.id ? "page" : undefined}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
          </div>
          <div className="toolbar">
            <button className="icon-button" onClick={toggle} title="切换主题">
              {theme === "light" ? <IconMoon /> : <IconSun />}
            </button>
            <button className="icon-button" onClick={refresh} title="刷新 (R)">
              <IconRefresh />
            </button>
          </div>
        </header>

        {renderView()}
      </main>

      <DetailDrawer content={drawerContent} onClose={closeDrawer} />
      <AttentionBeacon refreshKey={refreshKey} onNavigate={navigateFromAttention} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Workbench />
      </ErrorBoundary>
    </ToastProvider>
  );
}
