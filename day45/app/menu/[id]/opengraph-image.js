import { ImageResponse } from "next/og";
import { getDish } from "@/lib/dishes";

export const alt = "Addis Eats dish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { id } = await params;
  const dish = await getDish(id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "60px", background: "#0A1F3D", color: "white"
        }}
      >
        <div style={{ fontSize: 72 }}>{dish?.name ?? "Addis Eats"}</div>
        <div style={{ fontSize: 40, marginTop: 16 }}>{dish ? `${dish.price} ETB` : ""}</div>
        <div style={{ fontSize: 30, marginTop: 40 }}>Addis Eats</div>
      </div>
    ),
    size
  );
}
