import { useMemo, useState } from "react";
import { IconCheck, IconClose } from "./icons.jsx";
import {
  connectWorkspaces,
  inspectManualProject,
  scanDiscovery,
  scanHosts
} from "../api/onboarding.js";

const STEPS = ["许可", "宿主", "项目", "确认"];
const HOST_ORDER = ["codex", "trae", "claude", "cursor", "vscode"];
const HOST_LABELS = {
  codex: "Codex",
  trae: "TRAE",
  claude: "Claude",
  cursor: "Cursor",
  vscode: "VS Code",
  eos: "当前工作区",
  manual: "手动添加"
};

function StepRail({ step }) {
  return (
    <ol className="onboarding-steps onboarding-steps-four" aria-label="项目接入进度">
      {STEPS.map((label, index) => (
        <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
          <span>{index < step ? <IconCheck /> : index + 1}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}

function HostChoice({ host, checked, onChange }) {
  return (
    <label className={`host-choice ${checked ? "selected" : ""} ${!host.installed ? "unavailable" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!host.installed}
        onChange={(event) => onChange(host.name, event.target.checked)}
      />
      <span className={`status-dot ${host.installed ? "ok" : ""}`} aria-hidden="true" />
      <span>
        <strong>{host.label}</strong>
        <small>{host.installed ? `已检测到${host.version ? ` · ${host.version}` : ""}` : "本机未检测到"}</small>
      </span>
    </label>
  );
}

function ProjectChoice({ project, checked, onChange }) {
  return (
    <label className={`discovered-project ${checked ? "selected" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(project.path, event.target.checked)} />
      <span>
        <strong>{project.name}</strong>
        <code>{project.path}</code>
        <small>
          {project.alreadyBootstrapped ? "已有 EOS 工作区" : "尚未建立 EOS 工作区"}
          {` · ${project.confidence === "high" ? "高可信" : project.confidence === "medium" ? "中可信" : "低可信"}`}
          {project.writable ? " · 可接入" : " · 当前不可写"}
        </small>
      </span>
    </label>
  );
}

export default function OnboardingWizard({ open, onSkip, onComplete, toast }) {
  const [step, setStep] = useState(0);
  const [hosts, setHosts] = useState([]);
  const [selectedHosts, setSelectedHosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [manualPath, setManualPath] = useState("");
  const [confirmWrites, setConfirmWrites] = useState(false);
  const [scanRun, setScanRun] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const selectedProjects = useMemo(
    () => projects.filter((project) => selectedPaths.includes(project.path)),
    [projects, selectedPaths]
  );

  const projectGroups = useMemo(() => {
    const order = [...HOST_ORDER, "eos", "manual"];
    return order.map((host) => ({
      host,
      projects: projects.filter((project) => {
        const sources = project.sourceHosts?.length ? project.sourceHosts : ["manual"];
        return sources.includes(host);
      })
    })).filter((group) => group.projects.length > 0);
  }, [projects]);

  if (!open) return null;

  const run = async (name, action) => {
    setBusy(name);
    setError("");
    try {
      return await action();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy("");
    }
  };

  const authorizeScan = async () => {
    const response = await run("scan-hosts", scanHosts);
    if (!response) return;
    const ordered = [...response.hosts].sort(
      (a, b) => HOST_ORDER.indexOf(a.name) - HOST_ORDER.indexOf(b.name)
    );
    setHosts(ordered);
    setSelectedHosts(ordered.filter((host) => host.installed).map((host) => host.name));
    setStep(1);
  };

  const findProjects = async () => {
    if (!selectedHosts.length) {
      setError("请至少选择一个已安装的宿主");
      return;
    }
    const response = await run("discover", () => scanDiscovery(selectedHosts));
    if (!response) return;
    setProjects(response.projects);
    setScanRun(response.run);
    setSelectedPaths(response.projects
      .filter((project) => project.alreadyBootstrapped && project.writable)
      .map((project) => project.path));
    setStep(2);
  };

  const addManual = async () => {
    const response = await run("manual", () => inspectManualProject(manualPath.trim()));
    if (!response) return;
    const candidate = { ...response, sourceHosts: ["manual"] };
    setProjects((current) => [
      ...current.filter((project) => project.path !== candidate.path),
      candidate
    ]);
    if (candidate.writable) {
      setSelectedPaths((current) => [...new Set([...current, candidate.path])]);
    }
    setManualPath("");
  };

  const connect = async () => {
    const response = await run("connect", () => connectWorkspaces(selectedProjects, confirmWrites));
    if (!response) return;
    setResult(response);
    if (response.connected?.length) {
      toast(`已接入 ${response.connected.length} 个项目`, "ok", "工作区已建立");
    }
  };

  const toggleHost = (name, checked) => {
    setSelectedHosts((current) => checked
      ? [...new Set([...current, name])]
      : current.filter((item) => item !== name));
  };

  const toggleProject = (projectPath, checked) => {
    const project = projects.find((item) => item.path === projectPath);
    if (checked && !project?.writable) {
      setError("该目录当前不可写，EOS 不能安全创建工作区");
      return;
    }
    setSelectedPaths((current) => checked
      ? [...new Set([...current, projectPath])]
      : current.filter((item) => item !== projectPath));
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-shell">
        <header className="onboarding-head">
          <div>
            <p className="eyebrow">Experience OS 项目接入</p>
            <h2 id="onboarding-title">{result ? "项目已进入 EOS" : "发现你真实使用的 AI 工作区"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onSkip} title="稍后设置" aria-label="稍后设置">
            <IconClose />
          </button>
        </header>

        {!result && <StepRail step={step} />}

        <div className="onboarding-body">
          {error && <div className="error-banner" role="alert">{error}</div>}

          {result ? (
            <section className="onboarding-complete">
              <span className="completion-mark"><IconCheck /></span>
              <div>
                <h3>{result.connected?.length || 0} 个项目已接入</h3>
                <p>接入只建立独立 `.eos` 边界。真正监测仍需宿主产生经许可事件，EOS 不读取聊天正文或源码内容。</p>
              </div>
              {result.failed?.length > 0 && (
                <div className="onboarding-result-list">
                  <strong>{result.failed.length} 个项目未接入</strong>
                  {result.failed.map((item) => <code key={item.path}>{item.path}: {item.error}</code>)}
                </div>
              )}
              <button className="primary-btn" type="button" onClick={() => onComplete(result)}>返回项目工作台</button>
            </section>
          ) : step === 0 ? (
            <section className="onboarding-stage">
              <div className="stage-copy">
                <p className="eyebrow">扫描许可</p>
                <h3>先确认 EOS 可以读取哪些线索</h3>
                <p>本次点击只允许检测宿主；选择宿主后才读取对应的项目路径索引。每次重新扫描都需要你主动触发。</p>
              </div>
              <div className="scope-grid">
                <div>
                  <strong>会读取</strong>
                  <ul><li>应用或 CLI 是否安装</li><li>公开版本与 EOS 连接状态</li><li>所选宿主的项目路径索引</li><li>目录工程标记和可写状态</li></ul>
                </div>
                <div className="excluded">
                  <strong>不会读取</strong>
                  <ul><li>聊天正文</li><li>源码和项目文件内容</li><li>密码、密钥和浏览器内容</li><li>未选择宿主的项目索引</li></ul>
                </div>
              </div>
              <label className="permission-check">
                <input type="checkbox" checked readOnly />
                <span>严格许可默认开启；扫描批次和授权范围会保存在本机，便于之后审计或撤销。</span>
              </label>
              <div className="onboarding-actions">
                <button className="text-button" type="button" onClick={onSkip}>暂不扫描</button>
                <button className="primary-btn" type="button" disabled={busy === "scan-hosts"} onClick={authorizeScan}>
                  {busy === "scan-hosts" ? "正在检测…" : "允许检测宿主"}
                </button>
              </div>
            </section>
          ) : step === 1 ? (
            <section className="onboarding-stage">
              <div className="stage-copy">
                <p className="eyebrow">宿主选择</p>
                <h3>哪些工具可以向 EOS 提供项目线索？</h3>
                <p>已安装不等于已连接。扫描只读取你勾选宿主的结构化项目路径索引。</p>
              </div>
              <div className="host-choice-grid">
                {hosts.map((host) => <HostChoice key={host.name} host={host} checked={selectedHosts.includes(host.name)} onChange={toggleHost} />)}
              </div>
              <div className="onboarding-actions">
                <button className="ghost-btn" type="button" onClick={() => setStep(0)}>返回</button>
                <button className="primary-btn" type="button" disabled={busy === "discover" || !selectedHosts.length} onClick={findProjects}>
                  {busy === "discover" ? "正在扫描…" : "扫描所选宿主"}
                </button>
              </div>
            </section>
          ) : step === 2 ? (
            <section className="onboarding-stage">
              <div className="stage-copy">
                <p className="eyebrow">项目选择</p>
                <h3>选择 EOS 要接入的真实工作区</h3>
                <p>同一项目即使被多个宿主引用，也只会保留一份规范路径。不可写目录会显示，但不能接入。</p>
              </div>
              {scanRun && (
                <div className="scan-digest">
                  <strong>本次扫描</strong>
                  <span>{scanRun.digest}</span>
                </div>
              )}
              <div className="manual-project">
                <label>手动添加绝对路径<input value={manualPath} onChange={(event) => setManualPath(event.target.value)} placeholder="/Users/name/Projects/example" /></label>
                <button className="ghost-btn" type="button" disabled={busy === "manual" || !manualPath.trim()} onClick={addManual}>{busy === "manual" ? "检查中…" : "检查并加入"}</button>
              </div>
              <div className="project-discovery-list">
                {projectGroups.map((group) => (
                  <section key={group.host}>
                    <div className="project-group-head"><strong>{HOST_LABELS[group.host] || group.host}</strong><span>{group.projects.length}</span></div>
                    {group.projects.map((project) => (
                      <ProjectChoice key={`${group.host}:${project.path}`} project={project} checked={selectedPaths.includes(project.path)} onChange={toggleProject} />
                    ))}
                  </section>
                ))}
                {projects.length === 0 && <p className="empty">所选宿主没有提供可用项目。你仍可手动添加。</p>}
              </div>
              <div className="selection-summary">已选择 {selectedProjects.length} 个唯一项目</div>
              <div className="onboarding-actions">
                <button className="ghost-btn" type="button" onClick={() => setStep(1)}>返回</button>
                <button className="primary-btn" type="button" disabled={!selectedProjects.length} onClick={() => setStep(3)}>审查写入内容</button>
              </div>
            </section>
          ) : (
            <section className="onboarding-stage">
              <div className="stage-copy">
                <p className="eyebrow">最终确认</p>
                <h3>EOS 将对 {selectedProjects.length} 个项目执行这些动作</h3>
                <p>已有 `.eos/` 的项目只注册；其余项目会在根目录新建独立 `.eos/` 工作区。不会修改业务源码或宿主配置。</p>
              </div>
              <div className="connect-preview">
                {selectedProjects.map((project) => (
                  <div key={project.path}>
                    <span className={`status-dot ${project.alreadyBootstrapped ? "ok" : "warn"}`} />
                    <span><strong>{project.name}</strong><code>{project.path}</code></span>
                    <small>{project.alreadyBootstrapped ? "复用现有 .eos" : "将创建 .eos"}</small>
                  </div>
                ))}
              </div>
              <label className="permission-check final-confirm">
                <input type="checkbox" checked={confirmWrites} onChange={(event) => setConfirmWrites(event.target.checked)} />
                <span>我确认 EOS 可以为上述项目创建或复用 `.eos/`，并写入本机工作区注册表。</span>
              </label>
              <p className="truth-note">初始状态固定为“等待宿主事件”。只有真实 MCP 事件抵达并通过许可，才会显示为正在监测。</p>
              <div className="onboarding-actions">
                <button className="ghost-btn" type="button" onClick={() => setStep(2)}>返回修改</button>
                <button className="primary-btn" type="button" disabled={!confirmWrites || busy === "connect"} onClick={connect}>{busy === "connect" ? "正在串行接入…" : "确认接入"}</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
