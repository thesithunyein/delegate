"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { RPC_URL, WC_PROJECT_ID, APP_NAME } from "./constants";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    metaMask({ dappMetadata: { name: APP_NAME, url: "https://delegate.app" } }),
    injected({ shimDisconnect: true }),
    ...(WC_PROJECT_ID
      ? [
          walletConnect({
            projectId: WC_PROJECT_ID,
            metadata: {
              name: APP_NAME,
              description: "Hire an AI agent. Set a budget.",
              url: "https://delegate.app",
              icons: [],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
