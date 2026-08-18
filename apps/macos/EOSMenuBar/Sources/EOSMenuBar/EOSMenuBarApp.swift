import AppKit
import QuartzCore
import SwiftUI
import WebKit

@main
struct EOSMenuBarMain {
  @MainActor
  static func main() {
    lifecycleLog("main entered")
    let application = NSApplication.shared
    let delegate = EOSMenuBarApp()
    application.delegate = delegate
    application.setActivationPolicy(.regular)
    lifecycleLog("delegate assigned; entering application run loop")
    application.run()
  }
}

enum DisplayMode: String, CaseIterable {
  case both
  case menuBarOnly
  case edgeOnly
  case off

  var label: String {
    switch self {
    case .both: return "顶部 + 悬浮窗"
    case .menuBarOnly: return "仅顶部组件"
    case .edgeOnly: return "仅悬浮窗"
    case .off: return "全部隐藏"
    }
  }

  var showsMenuBar: Bool { self == .both || self == .menuBarOnly }
  var showsEdge: Bool { self == .both || self == .edgeOnly }
}

@MainActor
final class EOSMenuBarApp: NSObject, NSApplicationDelegate {
  private let coreManager = CoreProcessManager()
  private let store = AttentionStore()
  private let popover = NSPopover()
  private var statusItem: NSStatusItem?
  private var edgePanelController: EdgeAttentionPanelController?
  private var workbenchWindowController: WorkbenchWindowController?

  func applicationDidFinishLaunching(_ notification: Notification) {
    lifecycleLog("applicationDidFinishLaunching")
    coreManager.startIfNeeded()
    if store.displayMode.showsMenuBar {
      installMenuBarItem()
    }

    popover.behavior = .transient
    popover.contentViewController = NSHostingController(rootView: AttentionPanel(store: store))
    store.onChange = { [weak self] in self?.updateStatusItem() }
    store.onOpenWorkbench = { [weak self] url in self?.showWorkbench(at: url) }
    store.onDisplayModeChange = { [weak self] mode in self?.applyDisplayMode(mode) }
    updateStatusItem()
    let edgeController = EdgeAttentionPanelController(store: store)
    edgePanelController = edgeController
    if store.displayMode.showsEdge {
      edgeController.show()
    }
    if store.displayMode != .off {
      store.openWorkbench()
    }
    lifecycleLog("display mode \(store.displayMode.rawValue); workbench \(store.displayMode == .off ? "skipped" : "requested")")
    NSLog("EOS menu bar status item registered")
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    false
  }

  func applicationWillTerminate(_ notification: Notification) {
    coreManager.stopBundledCore()
  }

  func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
    if !flag {
      store.openWorkbench()
      lifecycleLog("reopen handled: workbench restored")
    }
    return true
  }

  func applicationDockMenu(_ sender: NSApplication) -> NSMenu? {
    let menu = NSMenu()
    let openItem = NSMenuItem(
      title: "打开工作台",
      action: #selector(dockOpenWorkbench(_:)),
      keyEquivalent: ""
    )
    openItem.target = self
    menu.addItem(openItem)
    menu.addItem(.separator())
    for mode in DisplayMode.allCases {
      let item = NSMenuItem(
        title: (store.displayMode == mode ? "✓ " : "") + mode.label,
        action: #selector(dockDisplayModeSelected(_:)),
        keyEquivalent: ""
      )
      item.target = self
      item.representedObject = mode.rawValue
      menu.addItem(item)
    }
    return menu
  }

  @objc private func dockOpenWorkbench(_ sender: NSMenuItem) {
    store.openWorkbench()
  }

  @objc private func dockDisplayModeSelected(_ sender: NSMenuItem) {
    guard let raw = sender.representedObject as? String,
          let mode = DisplayMode(rawValue: raw) else { return }
    store.setDisplayMode(mode)
  }

  @objc private func togglePopover() {
    guard let button = statusItem?.button else { return }
    if popover.isShown {
      popover.performClose(nil)
    } else {
      popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
    }
  }

  private func installMenuBarItem() {
    guard statusItem == nil else { return }
    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    guard let button = item.button else { return }
    button.target = self
    button.action = #selector(togglePopover)
    button.sendAction(on: [.leftMouseUp])
    button.setAccessibilityLabel("EOS 协作状态")
    statusItem = item
    updateStatusItem()
  }

  private func removeMenuBarItem() {
    guard let item = statusItem else { return }
    popover.performClose(nil)
    NSStatusBar.system.removeStatusItem(item)
    statusItem = nil
  }

  private func applyDisplayMode(_ mode: DisplayMode) {
    if mode.showsMenuBar {
      installMenuBarItem()
    } else {
      removeMenuBarItem()
    }
    if mode.showsEdge {
      edgePanelController?.show()
    } else {
      edgePanelController?.hide()
    }
    if mode == .off {
      workbenchWindowController?.close()
    }
  }

  private func updateStatusItem() {
    guard let button = statusItem?.button else { return }
    button.image = statusImage(for: store.overall.state, phase: store.animationPhase)
    button.image?.isTemplate = false
  }

  private func showWorkbench(at url: URL) {
    let controller: WorkbenchWindowController
    if let existing = workbenchWindowController {
      controller = existing
    } else {
      controller = WorkbenchWindowController()
      workbenchWindowController = controller
    }
    controller.show(url: url)
  }
}

@MainActor
final class EdgePanelPresentation: ObservableObject {
  @Published var isExpanded: Bool
  @Published var side: String
  @Published var isPeeking = false

  init(isExpanded: Bool, side: String) {
    self.isExpanded = isExpanded
    self.side = side
  }
}

@MainActor
final class EdgeAttentionPanelController: NSObject, NSWindowDelegate {
  private enum Side: String {
    case left
    case right
  }

  private let store: AttentionStore
  private let panel: NSPanel
  private let presentation: EdgePanelPresentation
  private var side: Side
  private let expandedSize = NSSize(width: 342, height: 480)
  private let collapsedSize = NSSize(width: 44, height: 128)
  private let exposedWidth: CGFloat = 20
  private let peekExposedWidth: CGFloat = 34
  private var hasPositioned = false

  private var reducesMotion: Bool {
    NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
  }

  init(store: AttentionStore) {
    self.store = store
    let savedSide = UserDefaults.standard.string(forKey: "eosEdgePanelSide").flatMap(Side.init(rawValue:)) ?? .right
    let savedExpanded = UserDefaults.standard.object(forKey: "eosEdgePanelExpanded") == nil
      ? true
      : UserDefaults.standard.bool(forKey: "eosEdgePanelExpanded")
    side = savedSide
    presentation = EdgePanelPresentation(isExpanded: savedExpanded, side: savedSide.rawValue)
    panel = NSPanel(
      contentRect: NSRect(origin: .zero, size: savedExpanded ? expandedSize : collapsedSize),
      styleMask: [.borderless, .nonactivatingPanel],
      backing: .buffered,
      defer: false
    )
    super.init()
    panel.delegate = self
    panel.isFloatingPanel = true
    panel.level = .floating
    panel.hidesOnDeactivate = false
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = true
    panel.isMovableByWindowBackground = savedExpanded
    panel.animationBehavior = .none
    panel.acceptsMouseMovedEvents = true
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
    panel.setAccessibilityLabel("EOS 边缘注意力窗口")
    panel.contentViewController = NSHostingController(rootView: EdgeAttentionView(
      store: store,
      presentation: presentation,
      onToggle: { [weak self] in self?.toggleExpanded() },
      onSwapSide: { [weak self] in self?.swapSide() },
      onPeekChange: { [weak self] isPeeking in self?.setPeeking(isPeeking) }
    ))
  }

  func show() {
    position(animated: false)
    panel.orderFrontRegardless()
  }

  func hide() {
    panel.orderOut(nil)
  }

  private func toggleExpanded() {
    let next = !presentation.isExpanded
    presentation.isPeeking = false
    if reducesMotion {
      presentation.isExpanded = next
    } else {
      withAnimation(.spring(response: 0.38, dampingFraction: 0.88, blendDuration: 0.1)) {
        presentation.isExpanded = next
      }
    }
    UserDefaults.standard.set(next, forKey: "eosEdgePanelExpanded")
    panel.isMovableByWindowBackground = next
    position(animated: true, duration: next ? 0.36 : 0.3)
  }

  private func swapSide() {
    side = side == .right ? .left : .right
    UserDefaults.standard.set(side.rawValue, forKey: "eosEdgePanelSide")
    if reducesMotion {
      presentation.side = side.rawValue
      position(animated: false)
      return
    }
    withAnimation(.easeInOut(duration: 0.18)) {
      presentation.side = side.rawValue
    }
    NSAnimationContext.runAnimationGroup { context in
      context.duration = 0.12
      context.timingFunction = CAMediaTimingFunction(name: .easeIn)
      panel.animator().alphaValue = 0.12
    } completionHandler: { [weak self] in
      guard let self else { return }
      self.position(animated: false)
      NSAnimationContext.runAnimationGroup { context in
        context.duration = 0.2
        context.timingFunction = CAMediaTimingFunction(name: .easeOut)
        self.panel.animator().alphaValue = 1
      }
    }
  }

  private func setPeeking(_ isPeeking: Bool) {
    guard !presentation.isExpanded, presentation.isPeeking != isPeeking else { return }
    if reducesMotion {
      presentation.isPeeking = isPeeking
    } else {
      withAnimation(.easeOut(duration: 0.18)) {
        presentation.isPeeking = isPeeking
      }
    }
    position(animated: true, duration: 0.18)
  }

  private func position(animated: Bool, duration: TimeInterval = 0.3) {
    guard let screen = screenForPanel() else { return }
    let visible = screen.visibleFrame
    let size = presentation.isExpanded ? expandedSize : collapsedSize
    let previousMidY = hasPositioned ? panel.frame.midY : visible.midY
    let midY = min(max(previousMidY, visible.minY + size.height / 2 + 12), visible.maxY - size.height / 2 - 12)
    let exposure = presentation.isPeeking ? peekExposedWidth : exposedWidth
    let x: CGFloat
    if presentation.isExpanded {
      x = side == .right ? visible.maxX - size.width - 12 : visible.minX + 12
    } else {
      x = side == .right ? visible.maxX - exposure : visible.minX - size.width + exposure
    }
    let frame = NSRect(x: x, y: midY - size.height / 2, width: size.width, height: size.height)
    let alpha: CGFloat = presentation.isExpanded ? 1 : (presentation.isPeeking ? 0.98 : 0.88)
    if animated && !reducesMotion {
      NSAnimationContext.runAnimationGroup { context in
        context.duration = duration
        context.timingFunction = CAMediaTimingFunction(controlPoints: 0.22, 1, 0.36, 1)
        context.allowsImplicitAnimation = true
        panel.animator().setFrame(frame, display: true)
        panel.animator().alphaValue = alpha
      }
    } else {
      panel.setFrame(frame, display: true)
      panel.alphaValue = alpha
    }
    hasPositioned = true
  }

  private func screenForPanel() -> NSScreen? {
    if let current = panel.screen { return current }
    let pointer = NSEvent.mouseLocation
    return NSScreen.screens.first(where: { $0.frame.contains(pointer) }) ?? NSScreen.main
  }
}

@MainActor
final class WorkbenchWindowController: NSWindowController, WKNavigationDelegate {
  private let webView: WKWebView
  private let loadingOverlay = NSVisualEffectView()
  private let loadingLabel = NSTextField(labelWithString: "正在启动 EOS Core…")
  private let progressIndicator = NSProgressIndicator()
  private let retryButton = NSButton(title: "重试", target: nil, action: nil)
  private let backButton = NSButton()
  private let forwardButton = NSButton()
  private var targetURL: URL?
  private var retryWorkItem: DispatchWorkItem?
  private var retryCount = 0
  private let maximumRetries = 30

  init() {
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    webView = WKWebView(frame: .zero, configuration: configuration)

    let window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered,
      defer: false
    )
    window.title = "Experience OS"
    window.minSize = NSSize(width: 900, height: 620)
    window.isReleasedWhenClosed = false
    window.setFrameAutosaveName("ExperienceOSWorkbenchWindow")
    window.titlebarAppearsTransparent = false
    super.init(window: window)

    webView.navigationDelegate = self
    configureContent(in: window)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func show(url: URL) {
    targetURL = url
    retryCount = 0
    loadTarget()
    showWindow(nil)
    NSApp.activate(ignoringOtherApps: true)
    window?.makeKeyAndOrderFront(nil)
  }

  private func configureContent(in window: NSWindow) {
    let container = NSView()
    container.translatesAutoresizingMaskIntoConstraints = false

    let toolbar = NSVisualEffectView()
    toolbar.material = .headerView
    toolbar.blendingMode = .withinWindow
    toolbar.translatesAutoresizingMaskIntoConstraints = false

    configureIconButton(backButton, symbol: "chevron.left", tooltip: "后退", action: #selector(goBack))
    configureIconButton(forwardButton, symbol: "chevron.right", tooltip: "前进", action: #selector(goForward))
    let reloadButton = NSButton()
    configureIconButton(reloadButton, symbol: "arrow.clockwise", tooltip: "重新载入", action: #selector(reload))
    let browserButton = NSButton()
    configureIconButton(browserButton, symbol: "safari", tooltip: "在浏览器中打开", action: #selector(openInBrowser))

    let titleLabel = NSTextField(labelWithString: "EOS 工作台")
    titleLabel.font = .systemFont(ofSize: 13, weight: .semibold)
    titleLabel.textColor = .secondaryLabelColor
    let spacer = NSView()
    spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)

    let toolbarStack = NSStackView(views: [backButton, forwardButton, reloadButton, titleLabel, spacer, browserButton])
    toolbarStack.orientation = .horizontal
    toolbarStack.alignment = .centerY
    toolbarStack.spacing = 8
    toolbarStack.translatesAutoresizingMaskIntoConstraints = false
    toolbar.addSubview(toolbarStack)

    webView.translatesAutoresizingMaskIntoConstraints = false
    container.addSubview(toolbar)
    container.addSubview(webView)
    configureLoadingOverlay(in: container)
    window.contentView = container

    NSLayoutConstraint.activate([
      toolbar.topAnchor.constraint(equalTo: container.topAnchor),
      toolbar.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      toolbar.trailingAnchor.constraint(equalTo: container.trailingAnchor),
      toolbar.heightAnchor.constraint(equalToConstant: 44),
      toolbarStack.leadingAnchor.constraint(equalTo: toolbar.leadingAnchor, constant: 12),
      toolbarStack.trailingAnchor.constraint(equalTo: toolbar.trailingAnchor, constant: -12),
      toolbarStack.centerYAnchor.constraint(equalTo: toolbar.centerYAnchor),
      webView.topAnchor.constraint(equalTo: toolbar.bottomAnchor),
      webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
      webView.bottomAnchor.constraint(equalTo: container.bottomAnchor)
    ])
    updateNavigationButtons()
  }

  private func configureIconButton(_ button: NSButton, symbol: String, tooltip: String, action: Selector) {
    button.image = NSImage(systemSymbolName: symbol, accessibilityDescription: tooltip)
    button.imagePosition = .imageOnly
    button.bezelStyle = .texturedRounded
    button.target = self
    button.action = action
    button.toolTip = tooltip
    button.setAccessibilityLabel(tooltip)
  }

  private func configureLoadingOverlay(in container: NSView) {
    loadingOverlay.material = .contentBackground
    loadingOverlay.blendingMode = .withinWindow
    loadingOverlay.state = .active
    loadingOverlay.translatesAutoresizingMaskIntoConstraints = false

    progressIndicator.style = .spinning
    progressIndicator.controlSize = .regular
    progressIndicator.startAnimation(nil)
    retryButton.target = self
    retryButton.action = #selector(retry)
    retryButton.isHidden = true

    let stack = NSStackView(views: [progressIndicator, loadingLabel, retryButton])
    stack.orientation = .vertical
    stack.alignment = .centerX
    stack.spacing = 12
    stack.translatesAutoresizingMaskIntoConstraints = false
    loadingOverlay.addSubview(stack)
    container.addSubview(loadingOverlay)

    NSLayoutConstraint.activate([
      loadingOverlay.topAnchor.constraint(equalTo: container.topAnchor, constant: 44),
      loadingOverlay.leadingAnchor.constraint(equalTo: container.leadingAnchor),
      loadingOverlay.trailingAnchor.constraint(equalTo: container.trailingAnchor),
      loadingOverlay.bottomAnchor.constraint(equalTo: container.bottomAnchor),
      stack.centerXAnchor.constraint(equalTo: loadingOverlay.centerXAnchor),
      stack.centerYAnchor.constraint(equalTo: loadingOverlay.centerYAnchor)
    ])
  }

  private func loadTarget() {
    retryWorkItem?.cancel()
    guard let targetURL else { return }
    showLoading(message: retryCount == 0 ? "正在启动 EOS Core…" : "正在连接 EOS Core…", failed: false)
    webView.load(URLRequest(url: targetURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10))
  }

  private func scheduleRetry(after error: Error) {
    guard retryCount < maximumRetries else {
      showLoading(message: "EOS Core 暂时无法连接。\n(error.localizedDescription)", failed: true)
      return
    }
    retryCount += 1
    showLoading(message: "正在连接 EOS Core…（(retryCount)/(maximumRetries)）", failed: false)
    let item = DispatchWorkItem { [weak self] in self?.loadTarget() }
    retryWorkItem = item
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: item)
  }

  private func showLoading(message: String, failed: Bool) {
    loadingLabel.stringValue = message
    loadingLabel.alignment = .center
    loadingLabel.maximumNumberOfLines = 3
    loadingLabel.textColor = failed ? .systemRed : .secondaryLabelColor
    progressIndicator.isHidden = failed
    if failed { progressIndicator.stopAnimation(nil) } else { progressIndicator.startAnimation(nil) }
    retryButton.isHidden = !failed
    loadingOverlay.isHidden = false
  }

  private func hideLoading() {
    retryWorkItem?.cancel()
    progressIndicator.stopAnimation(nil)
    loadingOverlay.isHidden = true
  }

  private func updateNavigationButtons() {
    backButton.isEnabled = webView.canGoBack
    forwardButton.isEnabled = webView.canGoForward
  }

  private func isLocalEOSURL(_ url: URL) -> Bool {
    guard ["http", "https"].contains(url.scheme?.lowercased() ?? "") else { return false }
    return ["127.0.0.1", "localhost", "::1"].contains(url.host?.lowercased() ?? "")
  }

  @objc private func goBack() {
    if webView.canGoBack { webView.goBack() }
  }

  @objc private func goForward() {
    if webView.canGoForward { webView.goForward() }
  }

  @objc private func reload() {
    retryCount = 0
    if webView.url == nil { loadTarget() } else { webView.reload() }
  }

  @objc private func retry() {
    retryCount = 0
    loadTarget()
  }

  @objc private func openInBrowser() {
    if let url = webView.url ?? targetURL { NSWorkspace.shared.open(url) }
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    hideLoading()
    updateNavigationButtons()
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    scheduleRetry(after: error)
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    scheduleRetry(after: error)
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.cancel)
      return
    }
    if url.scheme == "about" || isLocalEOSURL(url) {
      decisionHandler(.allow)
    } else {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
    }
  }
}

final class CoreProcessManager: @unchecked Sendable {
  private let queue = DispatchQueue(label: "local.experienceos.core-manager", qos: .utility)
  private let lock = NSLock()
  private var process: Process?
  private var logHandle: FileHandle?

  func startIfNeeded() {
    queue.async { [weak self] in
      guard let self, !self.coreIsAvailable() else {
        lifecycleLog("existing EOS Core detected")
        return
      }
      do {
        try self.startBundledCore()
      } catch {
        lifecycleLog("bundled Core start failed: \(error.localizedDescription)")
      }
    }
  }

  func stopBundledCore() {
    lock.lock()
    let running = process
    process = nil
    let handle = logHandle
    logHandle = nil
    lock.unlock()
    if running?.isRunning == true {
      running?.terminate()
      lifecycleLog("bundled EOS Core termination requested")
    }
    try? handle?.close()
  }

  private func coreIsAvailable() -> Bool {
    let probe = Process()
    probe.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
    probe.arguments = ["-fsS", "--max-time", "1", "http://127.0.0.1:4173/api/health"]
    probe.standardOutput = FileHandle.nullDevice
    probe.standardError = FileHandle.nullDevice
    do {
      try probe.run()
      probe.waitUntilExit()
      return probe.terminationStatus == 0
    } catch {
      return false
    }
  }

  private func startBundledCore() throws {
    guard let resources = Bundle.main.resourceURL else {
      throw CoreLaunchError.missingResource("Contents/Resources")
    }
    let node = resources.appendingPathComponent("runtime/node")
    let coreRoot = resources.appendingPathComponent("eos-core")
    let bootstrap = coreRoot.appendingPathComponent("src/eosBootstrap.js")
    let server = coreRoot.appendingPathComponent("src/webServer.js")
    for required in [node, bootstrap, server] where !FileManager.default.fileExists(atPath: required.path) {
      throw CoreLaunchError.missingResource(required.lastPathComponent)
    }

    let appSupport = try FileManager.default.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    ).appendingPathComponent("ExperienceOS", isDirectory: true)
    let logs = appSupport.appendingPathComponent("Logs", isDirectory: true)
    try FileManager.default.createDirectory(at: logs, withIntermediateDirectories: true)
    let bundleParent = Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent()
    let projectVault = bundleParent.appendingPathComponent(".eos/vault", isDirectory: true)
    let workspace: URL
    if FileManager.default.fileExists(atPath: projectVault.path) {
      workspace = bundleParent
    } else {
      workspace = appSupport.appendingPathComponent("Workspace", isDirectory: true)
      try FileManager.default.createDirectory(at: workspace, withIntermediateDirectories: true)
    }
    let handle = try appendHandle(for: logs.appendingPathComponent("core.log"))

    let bootstrapProcess = Process()
    bootstrapProcess.executableURL = node
    bootstrapProcess.arguments = [
      bootstrap.path,
      workspace.path,
      "EOS Local Workspace",
      "Capture and verify reusable human-AI collaboration experience."
    ]
    bootstrapProcess.currentDirectoryURL = coreRoot
    bootstrapProcess.standardOutput = handle
    bootstrapProcess.standardError = handle
    setManagedProcess(bootstrapProcess, logHandle: handle)
    do {
      try bootstrapProcess.run()
    } catch {
      clearManagedProcess(bootstrapProcess, closeLog: true)
      throw error
    }
    bootstrapProcess.waitUntilExit()
    clearManagedProcess(bootstrapProcess, closeLog: false)
    guard bootstrapProcess.terminationStatus == 0 else {
      clearLogHandle(handle)
      throw CoreLaunchError.bootstrapFailed(bootstrapProcess.terminationStatus)
    }

    let serverProcess = Process()
    serverProcess.executableURL = node
    serverProcess.arguments = [server.path]
    serverProcess.currentDirectoryURL = coreRoot
    var environment = ProcessInfo.processInfo.environment
    environment["EOS_VAULT_DIR"] = workspace.appendingPathComponent(".eos/vault").path
    environment["EOS_HOST"] = "127.0.0.1"
    environment["PORT"] = "4173"
    environment["EOS_DEPLOYMENT_MODE"] = "local"
    environment["EOS_CAPTURE_POLICY"] = "strict_permit"
    serverProcess.environment = environment
    serverProcess.standardOutput = handle
    serverProcess.standardError = handle
    setManagedProcess(serverProcess, logHandle: handle)
    do {
      try serverProcess.run()
    } catch {
      clearManagedProcess(serverProcess, closeLog: true)
      throw error
    }
    lifecycleLog("bundled EOS Core started with pid \(serverProcess.processIdentifier)")
  }

  private func setManagedProcess(_ managedProcess: Process, logHandle handle: FileHandle) {
    lock.lock()
    process = managedProcess
    logHandle = handle
    lock.unlock()
  }

  private func clearManagedProcess(_ managedProcess: Process, closeLog: Bool) {
    lock.lock()
    if process === managedProcess { process = nil }
    let handle = closeLog ? logHandle : nil
    if closeLog { logHandle = nil }
    lock.unlock()
    try? handle?.close()
  }

  private func clearLogHandle(_ handle: FileHandle) {
    lock.lock()
    if logHandle === handle { logHandle = nil }
    lock.unlock()
    try? handle.close()
  }

  private func appendHandle(for url: URL) throws -> FileHandle {
    if !FileManager.default.fileExists(atPath: url.path) {
      FileManager.default.createFile(atPath: url.path, contents: nil)
    }
    let handle = try FileHandle(forWritingTo: url)
    try handle.seekToEnd()
    return handle
  }
}

private enum CoreLaunchError: LocalizedError {
  case missingResource(String)
  case bootstrapFailed(Int32)

  var errorDescription: String? {
    switch self {
    case .missingResource(let name): "缺少内置资源：\(name)"
    case .bootstrapFailed(let status): "本地工作区初始化失败（\(status)）"
    }
  }
}

private func lifecycleLog(_ message: String) {
  let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("eos-menubar-lifecycle.log")
  let line = "\(ISO8601DateFormatter().string(from: Date())) \(message)\n"
  guard let data = line.data(using: .utf8) else { return }
  if FileManager.default.fileExists(atPath: url.path), let handle = try? FileHandle(forWritingTo: url) {
    defer { try? handle.close() }
    _ = try? handle.seekToEnd()
    try? handle.write(contentsOf: data)
  } else {
    try? data.write(to: url, options: .atomic)
  }
}

struct AttentionSignal: Codable, Identifiable {
  let id: String
  let level: String
  let label: String
  let detail: String
  let count: Int
}

struct AttentionAction: Codable, Identifiable {
  let id: String
  let level: String
  let title: String
  let detail: String
  let view: String
  let anchor: String?
}

struct AttentionOverall: Codable {
  let state: String
  let label: String
  let detail: String

  static let loading = AttentionOverall(state: "loading", label: "正在连接", detail: "正在读取 EOS Core 状态。")
}

struct AgentLastEvent: Codable {
  let name: String
  let category: String?
  let outcome: String?
  let observedAt: String?
}

struct AgentActivity: Codable, Identifiable {
  let id: String
  let label: String
  let state: String
  let stateLabel: String
  let detail: String
  let evidenceLevel: Int
  let platformStatus: String
  let lastEvent: AgentLastEvent?
  let ageMs: Double?
}

struct AgentSummary: Codable {
  let installed: Int
  let working: Int
  let waitingPermission: Int
  let completed: Int
  let blocked: Int
  let stale: Int
  let callable: Int
  let observing: Int

  static let empty = AgentSummary(
    installed: 0,
    working: 0,
    waitingPermission: 0,
    completed: 0,
    blocked: 0,
    stale: 0,
    callable: 0,
    observing: 0
  )
}

struct AttentionSnapshot: Codable {
  let overall: AttentionOverall?
  let agents: [AgentActivity]?
  let agentSummary: AgentSummary?
  let signals: [AttentionSignal]
  let actions: [AttentionAction]
}

@MainActor
final class AttentionStore: ObservableObject {
  @Published private(set) var overall = AttentionOverall.loading
  @Published private(set) var agents: [AgentActivity] = []
  @Published private(set) var agentSummary = AgentSummary.empty
  @Published private(set) var signals: [AttentionSignal] = AttentionStore.loadingSignals
  @Published private(set) var actions: [AttentionAction] = []
  @Published private(set) var lastUpdated: Date?
  @Published private(set) var connectionError: String?
  @Published private(set) var animationPhase = 0
  @Published private(set) var displayMode = UserDefaults.standard
    .string(forKey: "eosDisplayMode")
    .flatMap(DisplayMode.init(rawValue:)) ?? .both
  var onChange: (() -> Void)?
  var onOpenWorkbench: ((URL) -> Void)?
  var onDisplayModeChange: ((DisplayMode) -> Void)?
  @AppStorage("eosCoreURL") var coreURL = "http://127.0.0.1:4173"

  func setDisplayMode(_ mode: DisplayMode) {
    displayMode = mode
    UserDefaults.standard.set(mode.rawValue, forKey: "eosDisplayMode")
    onDisplayModeChange?(mode)
  }

  private var refreshTask: Task<Void, Never>?
  private var animationTask: Task<Void, Never>?
  private var isRefreshing = false

  static let loadingSignals = [
    AttentionSignal(id: "decisions", level: "amber", label: "需要你决定", detail: "正在读取 EOS Core。", count: 0),
    AttentionSignal(id: "production", level: "amber", label: "生产安全", detail: "正在读取 EOS Core。", count: 0),
    AttentionSignal(id: "model", level: "amber", label: "模型状态", detail: "正在读取 EOS Core。", count: 0)
  ]

  init() {
    refresh()
    refreshTask = Task { [weak self] in
      while !Task.isCancelled {
        try? await Task.sleep(for: .seconds(5))
        self?.refresh()
      }
    }
    animationTask = Task { [weak self] in
      while !Task.isCancelled {
        try? await Task.sleep(for: .milliseconds(650))
        guard let self else { return }
        let animatedStates = ["working", "blocked", "waiting_permission", "waiting_review", "completed"]
        guard animatedStates.contains(overall.state) || agents.contains(where: { animatedStates.contains($0.state) }) else {
          continue
        }
        animationPhase = (animationPhase + 1) % 3
        onChange?()
      }
    }
  }

  deinit {
    refreshTask?.cancel()
    animationTask?.cancel()
  }

  func refresh() {
    guard !isRefreshing else { return }
    guard let url = URL(string: normalizedBaseURL + "/api/attention") else {
      setConnectionFailure("EOS Core 地址无效")
      return
    }

    isRefreshing = true
    Task {
      defer { isRefreshing = false }
      do {
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
          throw URLError(.badServerResponse)
        }
        let snapshot = try JSONDecoder().decode(AttentionSnapshot.self, from: data)
        overall = snapshot.overall ?? AttentionOverall.loading
        agents = snapshot.agents ?? []
        agentSummary = snapshot.agentSummary ?? .empty
        signals = snapshot.signals
        actions = snapshot.actions
        connectionError = nil
        lastUpdated = Date()
        onChange?()
      } catch {
        setConnectionFailure("无法连接 EOS Core。请确认工作台正在运行。")
      }
    }
  }

  func openWorkbench(view: String = "project", anchor: String? = nil) {
    guard var components = URLComponents(string: normalizedBaseURL) else { return }
    components.queryItems = [URLQueryItem(name: "view", value: view)]
    components.fragment = anchor?.replacingOccurrences(of: "#", with: "")
    guard let url = components.url else { return }
    if let onOpenWorkbench {
      onOpenWorkbench(url)
    } else {
      NSWorkspace.shared.open(url)
    }
  }

  private var normalizedBaseURL: String {
    coreURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
  }

  private func setConnectionFailure(_ message: String) {
    connectionError = message
    overall = AttentionOverall(state: "unknown", label: "Core 未连接", detail: message)
    agents = []
    agentSummary = .empty
    actions = []
    signals = [
      AttentionSignal(id: "decisions", level: "red", label: "EOS Core", detail: message, count: 0),
      AttentionSignal(id: "production", level: "amber", label: "生产安全", detail: "Core 未连接，无法判断。", count: 0),
      AttentionSignal(id: "model", level: "amber", label: "模型状态", detail: "Core 未连接，无法判断。", count: 0)
    ]
    onChange?()
  }
}

private func statusImage(for state: String, phase: Int) -> NSImage {
  let image = NSImage(size: NSSize(width: 38, height: 18))
  image.lockFocus()
  let colors: [NSColor] = [.systemRed, .systemOrange, .systemGreen]
  for (index, color) in colors.enumerated() {
    let dot = NSBezierPath(ovalIn: NSRect(x: 1 + index * 13, y: 4, width: 10, height: 10))
    color.withAlphaComponent(trafficOpacity(state: state, index: index, phase: phase)).setFill()
    dot.fill()
  }
  image.unlockFocus()
  return image
}

private func trafficOpacity(state: String, index: Int, phase: Int) -> CGFloat {
  switch state {
  case "working":
    let active = phase % 3
    if index == active { return 1 }
    if index == (active + 2) % 3 { return 0.55 }
    return 0.35
  case "blocked": return index == 0 ? (phase.isMultiple(of: 2) ? 1 : 0.3) : 0.3
  case "waiting_permission", "waiting_review": return index == 1 ? (phase.isMultiple(of: 2) ? 1 : 0.3) : 0.3
  case "completed": return index == 2 ? (phase.isMultiple(of: 2) ? 1 : 0.3) : 0.3
  case "idle": return 0.35
  default: return 0.35
  }
}

struct AttentionPanel: View {
  @ObservedObject var store: AttentionStore
  @State private var showingSettings = false

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(alignment: .top) {
        BrandLogo(size: 30)
        VStack(alignment: .leading, spacing: 3) {
          Text("AGENT 雷达").font(.caption).foregroundStyle(.secondary)
          Text(store.overall.label).font(.headline)
          Text(store.overall.detail).font(.caption).foregroundStyle(.secondary)
        }
        Spacer()
        TrafficLights(state: store.overall.state, phase: store.animationPhase)
        Button("刷新") { store.refresh() }
          .buttonStyle(.borderless)
      }

      Divider()
      if store.agents.isEmpty {
        Text("尚未检测到可展示的宿主。")
          .font(.caption)
          .foregroundStyle(.secondary)
      } else {
        ForEach(store.agents) { agent in
          HStack(spacing: 10) {
            TrafficLights(state: agent.state, phase: store.animationPhase, dotSize: 7, spacing: 4)
            VStack(alignment: .leading, spacing: 2) {
              HStack(spacing: 6) {
                Text(agent.label).fontWeight(.semibold)
                Text("L\(agent.evidenceLevel)")
                  .font(.caption2.monospacedDigit())
                  .foregroundStyle(.secondary)
              }
              Text(agent.stateLabel).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
          }
          .accessibilityElement(children: .combine)
          .accessibilityLabel("\(agent.label)，\(agent.stateLabel)，证据等级 L\(agent.evidenceLevel)")
        }
      }

      if !store.actions.isEmpty {
        Divider()
        Text("需要你处理").font(.caption).foregroundStyle(.secondary)
        ForEach(store.actions.prefix(3)) { action in
          Button {
            store.openWorkbench(view: action.view, anchor: action.anchor)
          } label: {
            HStack(alignment: .top, spacing: 9) {
              Circle().fill(color(for: action.level)).frame(width: 8, height: 8).padding(.top, 4)
              VStack(alignment: .leading, spacing: 2) {
                Text(action.title).fontWeight(.semibold)
                Text(action.detail).font(.caption).foregroundStyle(.secondary)
              }
              Spacer()
            }
          }
          .buttonStyle(.plain)
        }
      } else {
        Divider()
        HStack(spacing: 9) {
          Circle().fill(.green).frame(width: 8, height: 8)
          VStack(alignment: .leading, spacing: 2) {
            Text("当前没有待处理事项").fontWeight(.semibold)
            Text("EOS 会继续在本地等待真实事件。")
              .font(.caption).foregroundStyle(.secondary)
          }
        }
      }

      Divider()
      HStack {
        Button("打开工作台") { store.openWorkbench() }
        Spacer()
        Button("连接设置") { showingSettings.toggle() }
      }

      if showingSettings {
        VStack(alignment: .leading, spacing: 6) {
          Text("EOS Core 地址").font(.caption).foregroundStyle(.secondary)
          TextField("http://127.0.0.1:4173", text: $store.coreURL)
            .textFieldStyle(.roundedBorder)
            .onSubmit { store.refresh() }
          Text("主工作台通常为 4173；单个项目工作台通常为 4180。修改后按回车刷新。")
            .font(.caption2).foregroundStyle(.secondary)

          Divider()

          HStack {
            Text("显示方式").font(.caption).foregroundStyle(.secondary)
            Spacer()
            Picker("", selection: Binding(
              get: { store.displayMode },
              set: { store.setDisplayMode($0) }
            )) {
              ForEach(DisplayMode.allCases, id: \.self) { mode in
                Text(mode.label).tag(mode)
              }
            }
            .labelsHidden()
            .pickerStyle(.menu)
          }
          Text("全部隐藏后可从 Dock 图标右键菜单恢复。")
            .font(.caption2).foregroundStyle(.secondary)
        }
      }
    }
    .padding(16)
    .frame(width: 330)
  }
}

struct EdgeAttentionView: View {
  @ObservedObject var store: AttentionStore
  @ObservedObject var presentation: EdgePanelPresentation
  let onToggle: () -> Void
  let onSwapSide: () -> Void
  let onPeekChange: (Bool) -> Void
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @Namespace private var brandNamespace

  var body: some View {
    ZStack {
      if presentation.isExpanded {
        expandedView
          .transition(expandedTransition)
      } else {
        collapsedView
          .transition(collapsedTransition)
      }
    }
    .frame(
      width: presentation.isExpanded ? 340 : 42,
      height: presentation.isExpanded ? 478 : 126
    )
    .background(
      RoundedRectangle(cornerRadius: presentation.isExpanded ? 8 : 7)
        .fill(.regularMaterial)
        .overlay(
          RoundedRectangle(cornerRadius: presentation.isExpanded ? 8 : 7)
            .stroke(Color.primary.opacity(presentation.isPeeking ? 0.24 : 0.14), lineWidth: 1)
        )
    )
    .clipShape(RoundedRectangle(cornerRadius: presentation.isExpanded ? 8 : 7))
    .animation(panelAnimation, value: presentation.isExpanded)
    .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: presentation.isPeeking)
  }

  private var collapsedView: some View {
    Button(action: onToggle) {
      HStack(spacing: 0) {
        if presentation.side == "left" { Spacer(minLength: 0) }
        VStack(spacing: 8) {
          BrandLogo(size: 14)
            .matchedGeometryEffect(id: "edge-brand", in: brandNamespace)
          TrafficLights(state: store.overall.state, phase: store.animationPhase, vertical: true, dotSize: 8, spacing: 6)
          if !store.actions.isEmpty {
            Text("\(min(store.actions.count, 99))")
              .font(.system(size: 8, weight: .bold, design: .rounded))
              .frame(width: 15, height: 15)
              .background(Circle().fill(Color.orange.opacity(0.2)))
          }
        }
        .frame(width: 20)
        if presentation.side == "right" { Spacer(minLength: 0) }
      }
      .frame(width: 42, height: 126)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .help("展开 EOS 注意力窗口")
    .onHover(perform: onPeekChange)
    .accessibilityLabel("EOS、\(store.overall.label)")
  }

  private var expandedView: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(spacing: 10) {
        BrandLogo(size: 28)
          .matchedGeometryEffect(id: "edge-brand", in: brandNamespace)
        TrafficLights(state: store.overall.state, phase: store.animationPhase, dotSize: 9, spacing: 5)
        VStack(alignment: .leading, spacing: 2) {
          Text("EOS 注意力").font(.headline)
          Text(store.overall.label).font(.caption).foregroundStyle(.secondary)
        }
        Spacer()
        Menu {
          ForEach(DisplayMode.allCases, id: \.self) { mode in
            Button {
              store.setDisplayMode(mode)
            } label: {
              if store.displayMode == mode {
                Label(mode.label, systemImage: "checkmark")
              } else {
                Text(mode.label)
              }
            }
          }
        } label: {
          Image(systemName: "rectangle.on.rectangle")
        }
        .menuStyle(.borderlessButton)
        .menuIndicator(.hidden)
        .fixedSize()
        .help("显示方式")
        Button(action: onSwapSide) {
          Image(systemName: presentation.side == "right" ? "rectangle.lefthalf.inset.filled" : "rectangle.righthalf.inset.filled")
        }
        .buttonStyle(.borderless)
        .help(presentation.side == "right" ? "移到左侧" : "移到右侧")
        Button(action: onToggle) { Image(systemName: presentation.side == "right" ? "chevron.right" : "chevron.left") }
          .buttonStyle(.borderless)
          .help("收起到屏幕边缘")
      }

      Text(store.overall.detail)
        .font(.caption)
        .foregroundStyle(.secondary)
        .fixedSize(horizontal: false, vertical: true)

      HStack(spacing: 0) {
        metric(value: store.agentSummary.working, label: "工作中")
        metric(value: store.agentSummary.waitingPermission, label: "待许可")
        metric(value: store.actions.count, label: "待处理")
      }
      .padding(.vertical, 10)
      .background(Color.primary.opacity(0.045))

      Text("需要你处理").font(.caption).foregroundStyle(.secondary)
      if store.actions.isEmpty {
        VStack(alignment: .leading, spacing: 4) {
          Text("当前队列为空").fontWeight(.semibold)
          Text("EOS 只在有真实证据时提醒你。")
            .font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.green.opacity(0.08))
      } else {
        ForEach(store.actions.prefix(4)) { action in
          Button {
            store.openWorkbench(view: action.view, anchor: action.anchor)
          } label: {
            HStack(alignment: .top, spacing: 9) {
              Circle().fill(color(for: action.level)).frame(width: 8, height: 8).padding(.top, 4)
              VStack(alignment: .leading, spacing: 2) {
                Text(action.title).fontWeight(.semibold)
                Text(action.detail).font(.caption).foregroundStyle(.secondary).lineLimit(2)
              }
              Spacer()
              Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
            }
            .padding(10)
            .background(Color.primary.opacity(0.045))
          }
          .buttonStyle(.plain)
        }
      }

      Spacer(minLength: 0)
      HStack {
        Button("打开完整工作台") { store.openWorkbench() }
        Spacer()
        Button { store.refresh() } label: { Image(systemName: "arrow.clockwise") }
          .buttonStyle(.borderless)
          .help("刷新状态")
      }
    }
    .padding(16)
    .frame(width: 340, height: 478)
  }

  private var panelAnimation: Animation? {
    reduceMotion ? nil : .spring(response: 0.38, dampingFraction: 0.88, blendDuration: 0.1)
  }

  private var expandedTransition: AnyTransition {
    guard !reduceMotion else { return .identity }
    let anchor: UnitPoint = presentation.side == "right" ? .trailing : .leading
    return .opacity.combined(with: .scale(scale: 0.97, anchor: anchor))
  }

  private var collapsedTransition: AnyTransition {
    guard !reduceMotion else { return .identity }
    let edge: Edge = presentation.side == "right" ? .trailing : .leading
    return .opacity.combined(with: .move(edge: edge))
  }

  private func metric(value: Int, label: String) -> some View {
    VStack(spacing: 3) {
      Text("\(value)").font(.headline.monospacedDigit())
      Text(label).font(.caption2).foregroundStyle(.secondary)
    }
    .frame(maxWidth: .infinity)
  }
}

struct TrafficLights: View {
  let state: String
  let phase: Int
  var vertical = false
  var dotSize: CGFloat = 8
  var spacing: CGFloat = 5

  private let colors: [Color] = [.red, .orange, .green]

  var body: some View {
    Group {
      if vertical {
        VStack(spacing: spacing) { dots }
      } else {
        HStack(spacing: spacing) { dots }
      }
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(accessibilityState)
  }

  @ViewBuilder private var dots: some View {
    ForEach(0..<3, id: \.self) { index in
      Circle()
        .fill(colors[index].opacity(Double(trafficOpacity(state: state, index: index, phase: phase))))
        .frame(width: dotSize, height: dotSize)
    }
  }

  private var accessibilityState: String {
    switch state {
    case "working": "正在工作"
    case "blocked": "已阻塞"
    case "waiting_permission", "waiting_review": "等待人类处理"
    case "completed": "刚刚完成"
    default: "当前空闲"
    }
  }
}

struct BrandLogo: View {
  let size: CGFloat

  var body: some View {
    Group {
      if let path = Bundle.main.path(forResource: "EOSLogo", ofType: "png"),
         let image = NSImage(contentsOfFile: path) {
        Image(nsImage: image)
          .resizable()
          .interpolation(.high)
          .aspectRatio(contentMode: .fit)
      } else {
        Text("EOS")
          .font(.system(size: max(8, size * 0.34), weight: .bold, design: .monospaced))
      }
    }
    .frame(width: size, height: size)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("EOS")
  }
}

private func color(for level: String) -> Color {
  switch level {
  case "red": .red
  case "green": .green
  default: .orange
  }
}
