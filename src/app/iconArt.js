import { ImageResponse } from "next/og";

// App icon: a cream plate with a "$" on the app's orange, drawn at any size
export function renderIcon(size, { rounded = false } = {}) {
  const plate = Math.round(size * 0.74);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e6a96c",
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        <div
          style={{
            width: plate,
            height: plate,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#f5f1e8",
            border: `${Math.max(2, Math.round(size * 0.04))}px solid #ffffff`,
            color: "#4a3629",
            fontSize: Math.round(size * 0.5),
            fontWeight: 700,
          }}
        >
          $
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
