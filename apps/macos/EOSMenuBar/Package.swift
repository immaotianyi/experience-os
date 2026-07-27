// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "EOSMenuBar",
  platforms: [.macOS(.v14)],
  products: [
    .executable(name: "EOSMenuBar", targets: ["EOSMenuBar"])
  ],
  targets: [
    .executableTarget(name: "EOSMenuBar")
  ]
)
