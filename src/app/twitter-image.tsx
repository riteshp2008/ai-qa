import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/seo/brand-image";
import { site } from "@/lib/seo/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview image, generated once at build time. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0b1220 0%, #0f2a2a 55%, #0f766e 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 18, background: site.themeColor }}>
            <BrandMark size={72} />
          </div>
          <span style={{ fontSize: 40, fontWeight: 700 }}>{site.name}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>{site.tagline}</span>
          <span style={{ fontSize: 30, color: "#a7f3d0" }}>AI quality control with evidence you can trust.</span>
        </div>
      </div>
    ),
    size,
  );
}
