// frontend/src/app/layout.tsx
"use client";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from "viem"; // Tambahkan ini

export const config = getDefaultConfig({
  appName: "Digital Credential Platform",
  projectId: "111f7bf9c5d9b04c38e1785efa2682e2", // Sudah dikonfirmasi benar
  chains: [
    {
      ...polygonAmoy,
      rpcUrls: {
        default: { http: [process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/"] },
      },
    },
  ],
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}