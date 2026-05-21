import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DeleGate — Hire an AI to handle your on-chain chores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#070914",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(16,185,129,0.18), transparent 45%), radial-gradient(circle at 100% 100%, rgba(99,102,241,0.18), transparent 45%)",
          padding: "72px 80px",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#FAFAFA",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#0A0E1A",
              border: "1px solid rgba(250,250,250,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 28,
                height: 36,
                border: "3px solid #FAFAFA",
                borderRadius: "0 18px 18px 0",
                borderLeft: "3px solid #FAFAFA",
                marginRight: 4,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                top: 26,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
              }}
            />
          </div>
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: -0.5 }}>
            DeleGate
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              color: "rgba(250,250,250,0.65)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#10B981",
              }}
            />
            Live on Base Sepolia · MetaMask Smart Accounts · ERC-7710
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.02,
            }}
          >
            Hire an AI to handle
            <br />
            your on-chain chores.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "rgba(250,250,250,0.7)",
              lineHeight: 1.3,
              maxWidth: 980,
            }}
          >
            Trade · Rebalance · Claim · Subscribe — without giving up your keys.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(250,250,250,0.55)",
          }}
        >
          <span>MetaMask Smart Accounts · 1Shot · Venice AI · x402</span>
          <span>delegate-red.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
