import AppKit
import SwiftUI

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

@MainActor
final class EOSMenuBarApp: NSObject, NSApplicationDelegate {
  private let store = AttentionStore()
  private let popover = NSPopover()
  private var statusItem: NSStatusItem?
  private var statusWindow: NSPanel?

  func applicationDidFinishLaunching(_ notification: Notification) {
    lifecycleLog("applicationDidFinishLaunching")
    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    guard let button = item.button else { return }
    button.target = self
    button.action = #selector(togglePopover)
    button.sendAction(on: [.leftMouseUp])
    button.setAccessibilityLabel("EOS 协作状态")
    statusItem = item

    popover.behavior = .transient
    popover.contentViewController = NSHostingController(rootView: AttentionPanel(store: store))
    store.onChange = { [weak self] in self?.updateStatusItem() }
    updateStatusItem()
    showStatusWindow()
    lifecycleLog("status item and status window requested")
    NSLog("EOS menu bar status item registered")
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    false
  }

  @objc private func togglePopover() {
    guard let button = statusItem?.button else { return }
    if popover.isShown {
      popover.performClose(nil)
    } else {
      popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
    }
  }

  private func updateStatusItem() {
    guard let button = statusItem?.button else { return }
    button.image = statusImage(for: store.signals)
    button.image?.isTemplate = false
  }

  private func showStatusWindow() {
    let panel = NSPanel(
      contentRect: NSRect(x: 0, y: 0, width: 360, height: 460),
      styleMask: [.titled, .closable, .utilityWindow],
      backing: .buffered,
      defer: false
    )
    panel.title = "EOS 协作状态"
    panel.isFloatingPanel = true
    panel.level = .floating
    panel.hidesOnDeactivate = false
    panel.center()
    panel.contentViewController = NSHostingController(rootView: AttentionPanel(store: store))
    statusWindow = panel
    NSApp.setActivationPolicy(.regular)
    NSApp.activate(ignoringOtherApps: true)
    panel.makeKeyAndOrderFront(nil)
    lifecycleLog("status window ordered front")
  }
}

private func lifecycleLog(_ message: String) {
  let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("eos-menubar-lifecycle.log")
  let line = "\(ISO8601DateFormatter().string(from: Date())) \(message)\n"
  guard let data = line.data(using: .utf8) else { return }
  if FileManager.default.fileExists(atPath: url.path), let handle = try? FileHandle(forWritingTo: url) {
    defer { try? handle.close() }
    try? handle.seekToEnd()
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

struct AttentionSnapshot: Codable {
  let signals: [AttentionSignal]
  let actions: [AttentionAction]
}

@MainActor
final class AttentionStore: ObservableObject {
  @Published private(set) var signals: [AttentionSignal] = AttentionStore.loadingSignals
  @Published private(set) var actions: [AttentionAction] = []
  @Published private(set) var lastUpdated: Date?
  @Published private(set) var connectionError: String?
  var onChange: (() -> Void)?
  @AppStorage("eosCoreURL") var coreURL = "http://127.0.0.1:4173"

  private var refreshTask: Task<Void, Never>?

  static let loadingSignals = [
    AttentionSignal(id: "decisions", level: "amber", label: "需要你决定", detail: "正在读取 EOS Core。", count: 0),
    AttentionSignal(id: "production", level: "amber", label: "生产安全", detail: "正在读取 EOS Core。", count: 0),
    AttentionSignal(id: "model", level: "amber", label: "模型状态", detail: "正在读取 EOS Core。", count: 0)
  ]

  init() {
    refresh()
    refreshTask = Task { [weak self] in
      while !Task.isCancelled {
        try? await Task.sleep(for: .seconds(15))
        self?.refresh()
      }
    }
  }

  deinit {
    refreshTask?.cancel()
  }

  func refresh() {
    guard let url = URL(string: normalizedBaseURL + "/api/attention") else {
      setConnectionFailure("EOS Core 地址无效")
      return
    }

    Task {
      do {
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
          throw URLError(.badServerResponse)
        }
        let snapshot = try JSONDecoder().decode(AttentionSnapshot.self, from: data)
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
    NSWorkspace.shared.open(url)
  }

  private var normalizedBaseURL: String {
    coreURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
  }

  private func setConnectionFailure(_ message: String) {
    connectionError = message
    actions = []
    signals = [
      AttentionSignal(id: "decisions", level: "red", label: "EOS Core", detail: message, count: 0),
      AttentionSignal(id: "production", level: "amber", label: "生产安全", detail: "Core 未连接，无法判断。", count: 0),
      AttentionSignal(id: "model", level: "amber", label: "模型状态", detail: "Core 未连接，无法判断。", count: 0)
    ]
    onChange?()
  }
}

private func statusImage(for signals: [AttentionSignal]) -> NSImage {
  let image = NSImage(size: NSSize(width: 66, height: 18))
  image.lockFocus()
  let textAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.monospacedSystemFont(ofSize: 11, weight: .bold),
    .foregroundColor: NSColor.labelColor
  ]
  ("EOS" as NSString).draw(at: NSPoint(x: 0, y: 3), withAttributes: textAttributes)
  let levels = Array(signals.prefix(3).map(\.level)) + Array(repeating: "amber", count: max(0, 3 - signals.count))
  for (index, level) in levels.enumerated() {
    let dot = NSBezierPath(ovalIn: NSRect(x: 30 + index * 11, y: 5, width: 8, height: 8))
    statusColor(for: level).setFill()
    dot.fill()
  }
  image.unlockFocus()
  return image
}

private func statusColor(for level: String) -> NSColor {
  switch level {
  case "red": .systemRed
  case "green": .systemGreen
  default: .systemOrange
  }
}

struct AttentionPanel: View {
  @ObservedObject var store: AttentionStore
  @State private var showingSettings = false

  private var blockingCount: Int {
    store.signals.filter { $0.level == "red" }.count
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 3) {
          Text("EOS 状态").font(.caption).foregroundStyle(.secondary)
          Text(blockingCount > 0 ? "需要你的判断" : store.actions.isEmpty ? "当前流程清空" : "有可跟进事项")
            .font(.headline)
        }
        Spacer()
        Button("刷新") { store.refresh() }
          .buttonStyle(.borderless)
      }

      ForEach(store.signals) { signal in
        HStack(alignment: .top, spacing: 9) {
          Circle().fill(color(for: signal.level)).frame(width: 9, height: 9).padding(.top, 4)
          VStack(alignment: .leading, spacing: 2) {
            HStack {
              Text(signal.label).fontWeight(.semibold)
              if signal.count > 0 { Text("\(signal.count)").foregroundStyle(.secondary) }
            }
            Text(signal.detail).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
          }
        }
      }

      if !store.actions.isEmpty {
        Divider()
        Text("下一步").font(.caption).foregroundStyle(.secondary)
        ForEach(store.actions) { action in
          Button {
            store.openWorkbench(view: action.view, anchor: action.anchor)
          } label: {
            HStack {
              Circle().fill(color(for: action.level)).frame(width: 8, height: 8)
              VStack(alignment: .leading, spacing: 2) {
                Text(action.title).fontWeight(.semibold)
                Text(action.detail).font(.caption).foregroundStyle(.secondary)
              }
              Spacer()
            }
          }
          .buttonStyle(.plain)
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
        }
      }
    }
    .padding(16)
    .frame(width: 330)
  }
}

private func color(for level: String) -> Color {
  switch level {
  case "red": .red
  case "green": .green
  default: .orange
  }
}
