import AppKit
import Foundation

let assets = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets", isDirectory: true)
let mascotURL = assets.appendingPathComponent("Crunchy.png")
guard let mascot = NSImage(contentsOf: mascotURL) else {
    fatalError("No se pudo abrir Crunchy.png")
}

func render(_ name: String, size: Int, mascotWidth: CGFloat, background: NSColor?) {
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        fatalError("No se pudo crear el icono \(name)")
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    NSColor.clear.setFill()
    NSRect(x: 0, y: 0, width: size, height: size).fill()
    if let background {
        background.setFill()
        NSRect(x: 0, y: 0, width: size, height: size).fill()
    }
    let aspect = mascot.size.height / mascot.size.width
    let height = mascotWidth * aspect
    mascot.draw(
        in: NSRect(x: (CGFloat(size) - mascotWidth) / 2, y: (CGFloat(size) - height) / 2, width: mascotWidth, height: height),
        from: .zero,
        operation: .sourceOver,
        fraction: 1
    )
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()

    guard let png = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("No se pudo codificar el icono \(name)")
    }
    try! png.write(to: assets.appendingPathComponent(name))
}

let cream = NSColor(calibratedRed: 1, green: 0.969, blue: 0.902, alpha: 1)
render("icon.png", size: 1024, mascotWidth: 795, background: cream)
render("adaptive-icon.png", size: 1024, mascotWidth: 650, background: nil)
render("splash-icon.png", size: 1024, mascotWidth: 600, background: nil)
render("favicon.png", size: 48, mascotWidth: 43, background: cream)
