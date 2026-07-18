import { useState, useCallback, useEffect } from "react";
import { ToastProvider, useToast } from "./hooks/useToast.jsx";
import { useTheme } from "./hooks/useTheme.js";
import {
  IconOverview, IconReview, IconWall, IconSkills, IconAudit,
  IconVault, IconMarket, IconQuality, IconRevenue,
  IconRefresh, IconClose, IconSun, IconMoon
} from "./components/icons.jsx";
import ProjectView from "./views/ProjectView.jsx";
import DetailDrawer from "./components/DetailDrawer.jsx";
import OverviewView from "./views/OverviewView.jsx";
import ReviewView from "./views/ReviewView.jsx";
import WallHitsView from "./views/WallHitsView.jsx";
import SkillsView from "./views/SkillsView.jsx";
import AuditView from "./views/AuditView.jsx";
import VaultView from "./views/VaultView.jsx";
import MarketplaceView from "./views/MarketplaceView.jsx";
import QualityView from "./views/QualityView.jsx";
import SellerRevenueView from "./views/SellerRevenueView.jsx";

const VIEWS = [
  { id: "project", label: "项目", icon: IconOverview, key: "1" },
  { id: "overview", label: "总览", icon: IconOverview, key: "2" },
  { id: "marketplace", label: "市场", icon: IconMarket, key: "3" },
  { id: "quality", label: "质量看板", icon: IconQuality, key: "4" },
  { id: "revenue", label: "卖家营收", icon: IconRevenue, key: "5" },
  { id: "review", label: "审查包", icon: IconReview, key: "6" },
  { id: "wallhits", label: "撞墙", icon: IconWall, key: "7" },
  { id: "skills", label: "Skill 库", icon: IconSkills, key: "8" },
  { id: "audit", label: "决策审计", icon: IconAudit, key: "9" },
  { id: "vault", label: "Vault", icon: IconVault, key: "0" }
];

const VIEW_TITLES = {
  project: { eyebrow: "Experience OS 3.0", title: "项目" },
  overview: { eyebrow: "Experience OS", title: "总览" },
  marketplace: { eyebrow: "经验资产交易", title: "市场" },
  quality: { eyebrow: "经验资产交易", title: "质量看板" },
  revenue: { eyebrow: "经验资产交易", title: "卖家营收" },
  review: { eyebrow: "生产管道", title: "审查包" },
  wallhits: { eyebrow: "生产管道", title: "撞墙记录" },
  skills: { eyebrow: "生产管道", title: "Skill 库" },
  audit: { eyebrow: "治理", title: "决策审计" },
  vault: { eyebrow: "治理", title: "Vault 维护" }
};

function Workbench() {
  const [activeView, setActiveView] = useState("project");
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
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      const view = VIEWS.find((v) => v.key === e.key);
      if (view) {
        setActiveView(view.id);
        return;
      }
      if (e.key === "r" || e.key === "R") refresh();
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [refresh, closeDrawer]);

  const meta = VIEW_TITLES[activeView] || { eyebrow: "", title: "" };

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
      case "audit": return <AuditView {...props} />;
      case "vault": return <VaultView {...props} />;
      default: return null;
    }
  };

  return (
    <>
      <nav className="rail">
        <div className="mark">EOS</div>
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              className={`rail-item ${activeView === v.id ? "active" : ""}`}
              onClick={() => setActiveView(v.id)}
              title={`${v.label} (${v.key})`}
            >
              <Icon />
            </button>
          );
        })}
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
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}
