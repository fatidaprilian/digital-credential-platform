"use client";

import "./globals.css";
import { Web3AuthProvider } from "@/providers/Web3AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3AuthProvider>
          {children}
        </Web3AuthProvider>
      </body>
    </html>
  );
}