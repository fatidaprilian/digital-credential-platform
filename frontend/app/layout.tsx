// app/layout.tsx
"use client";

import "./globals.css";
import { Web3AuthProvider } from "@/providers/Web3AuthProvider";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Web3AuthProvider>
          {children}
        </Web3AuthProvider>
      </body>
    </html>
  );
}