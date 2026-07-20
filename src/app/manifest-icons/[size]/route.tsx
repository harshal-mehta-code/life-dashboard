import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const s = parseInt(size, 10) || 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#B85C3E",
          fontSize: Math.round(s * 0.6),
        }}
      >
        🌱
      </div>
    ),
    { width: s, height: s }
  );
}
