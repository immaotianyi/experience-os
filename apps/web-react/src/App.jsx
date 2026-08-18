/**
 * App — React 应用根组件。
 *
 * 核心职责：
 *   - 配置左侧导航栏（RAIL_GROUPS）与视图路由
 *   - 管理全局视图切换、抽屉、键盘快捷键
 *   - 包裹 ToastProvider 和 ErrorBoundary
 */
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
import OnboardingWizard from "./components/OnboardingWizard.jsx";
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
  { label: "主线 · 现在做什么", items: [
    { id: "project", label: "项目", icon: IconProject, key: "1" },
    { id: "overview", label: "总览", icon: IconOverview, key: "2" },
  ]},
  { label: "管道 · 经验变资产", items: [
    { id: "review", label: "审查包", icon: IconReview, key: "6" },
    { id: "wallhits", label: "撞墙", icon: IconWall, key: "7" },
    { id: "skills", label: "Skill 库", icon: IconSkills, key: "8" },
    { id: "codegraph", label: "代码图", icon: IconCodeGraph, key: "g" },
    { id: "quality", label: "质量看板", icon: IconQuality, key: "4" },
  ]},
  { label: "连接 · 接入 AI 工具", items: [
    { id: "platform", label: "AI 工具连接", icon: IconPlatform, key: "p" },
    { id: "feedback", label: "Beta 反馈", icon: IconFeedback, key: "f" },
  ]},
  { label: "治理 · 谁批准了什么", items: [
    { id: "audit", label: "决策审计", icon: IconAudit, key: "9" },
    { id: "vault", label: "Vault", icon: IconVault, key: "0" },
  ]},
  { label: "交易（已搁置）", hidden: true, items: [
    { id: "marketplace", label: "市场", icon: IconMarket, key: "3" },
    { id: "revenue", label: "卖家营收", icon: IconRevenue, key: "5" },
  ]},
];

const VIEWS = RAIL_GROUPS.flatMap((g) => g.items);

function viewFromLocation() {
  const candidate = new URLSearchParams(window.location.search).get("view");
  return VIEWS.some((view) => view.id === candidate) ? candidate : "project";
}

const VIEW_TITLES = {
  project: { eyebrow: "Experience OS 3.0", title: "项目", desc: "一个项目 = 一条经验主线。下面五步走完，这段工作的经验才算沉淀：保存节点 → 确认收据 → 人工审查 → 结果验证 → 升级资产。" },
  overview: { eyebrow: "Experience OS", title: "总览", desc: "这里能看到整个工作区的健康度：攒了多少经验、多少待审、管道通不通。" },
  marketplace: { eyebrow: "经验资产交易（已搁置）", title: "市场", desc: "支付与交易功能当前已搁置，此页仅供浏览既有数据。" },
  quality: { eyebrow: "生产管道", title: "质量看板", desc: "每个 Skill 的质量分：被复用多少次、审查通过率如何。" },
  revenue: { eyebrow: "经验资产交易（已搁置）", title: "卖家营收", desc: "支付与交易功能当前已搁置，此页仅供浏览既有数据。" },
  review: { eyebrow: "生产管道", title: "审查包", desc: "AI 整理好的经验草案在这里等你拍板：采纳、打回或拒绝。你的决策是资产入库的唯一入口。" },
  wallhits: { eyebrow: "生产管道", title: "撞墙记录", desc: "卡壳、失败、踩坑的现场记录。撞墙不是坏事——它是经验提炼的原材料。" },
  skills: { eyebrow: "生产管道", title: "Skill 库", desc: "已沉淀的可复用技能。出厂自带一组预设技能（待你审查激活），之后你自己提炼的也会住在这里。" },
  codegraph: { eyebrow: "生产管道", title: "代码图", desc: "把代码库的依赖关系画成图：哪些文件是枢纽、哪里有循环依赖、改动会波及多大范围。" },
  audit: { eyebrow: "治理", title: "决策审计", desc: "谁在什么时候批准了什么、依据是什么。所有决策可追溯，不可篡改。" },
  vault: { eyebrow: "治理", title: "Vault 维护", desc: "经验资产的实际存放地（本地 Git 仓库）。这里做备份、校验和维护。" },
  feedback: { eyebrow: "Beta", title: "Beta 反馈", desc: "用得顺手或哪里别扭，从这里告诉我们。" },
  platform: { eyebrow: "集成证据", title: "AI 工具连接", desc: "把 Codex、Claude Code、Cursor、TRAE 等 AI 工具接入 EOS 的观察范围。每一步连接都有真实证据，不猜不装。" }
};

function Workbench() {
  const [activeView, setActiveView] = useState(viewFromLocation);
  const [drawerContent, setDrawerContent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    try {
      return !window.localStorage.getItem("eos:onboarding:v1");
    } catch {
      return true;
    }
  });
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
    const props = {
      openDrawer,
      refreshKey,
      toast,
      openOnboarding: () => setOnboardingOpen(true)
    };
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
        <div className="mark">
          <img src="/eos-logo.png" alt="EOS" />
        </div>
        <div className="rail-scroll">
          {RAIL_GROUPS.filter((group) => !group.hidden).map((group) => (
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
        </div>
      </nav>

      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            {meta.desc && <p className="page-desc">{meta.desc}</p>}
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
      {onboardingOpen && (
        <OnboardingWizard
          open
          toast={toast}
          onSkip={() => {
            try { window.localStorage.setItem("eos:onboarding:v1", "skipped"); } catch { /* no-op */ }
            setOnboardingOpen(false);
          }}
          onComplete={() => {
            try { window.localStorage.setItem("eos:onboarding:v1", "completed"); } catch { /* no-op */ }
            setOnboardingOpen(false);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
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
