// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LebensKern",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "LebensKern", targets: ["LebensKern"])],
    targets: [
        .target(name: "LebensKern"),
        .testTarget(name: "LebensKernTests", dependencies: ["LebensKern"]),
    ]
)
