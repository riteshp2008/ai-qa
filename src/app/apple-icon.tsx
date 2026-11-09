import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/seo/brand-image";
import { site } from "@/lib/seo/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: site.themeColor }}>
        <BrandMark size={180} />
      </div>
    ),
    size,
  );
}
