import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#13212b";

/** One crop mark stroke, in the same 512-unit grid as icon.svg. */
function Stroke({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const scale = size.width / 512;
  return (
    <div
      style={{
        position: "absolute",
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
        background: INK,
      }}
    />
  );
}

/** The home screen icon: a 9:16 print with crop marks, same drawing as icon.svg. */
export default function AppleIcon() {
  const scale = size.width / 512;
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#ffc420",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 168 * scale,
            top: 105 * scale,
            width: 176 * scale,
            height: 302 * scale,
            border: `${14 * scale}px solid ${INK}`,
            background: "#fbfcfc",
          }}
        />
        <Stroke x={112} y={106} w={36} h={12} />
        <Stroke x={364} y={106} w={36} h={12} />
        <Stroke x={112} y={394} w={36} h={12} />
        <Stroke x={364} y={394} w={36} h={12} />
        <Stroke x={169} y={52} w={12} h={36} />
        <Stroke x={331} y={52} w={12} h={36} />
        <Stroke x={169} y={424} w={12} h={36} />
        <Stroke x={331} y={424} w={12} h={36} />
      </div>
    ),
    size,
  );
}
