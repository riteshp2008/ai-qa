import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/seo/brand-image";
import { site } from "@/lib/seo/site";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: site.themeColor, borderRadius: 14 }}>
        <BrandMark size={64} />
      </div>
    ),
    size,
  );
}
