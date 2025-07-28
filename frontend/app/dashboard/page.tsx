// app/dashboard/page.tsx
"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import CredentialsGallery from "../components/CredentialsGallery"; // Impor komponen galeri
import Link from "next/link";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "2rem",
        color: "white",
        backgroundColor: "#0a0a0a",
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '1200px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#ccc' }}>
           ← Kembali ke Beranda
          </Link>
          <ConnectButton />
      </div>

      {isMounted && isConnected ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Selamat Datang!</h2>
          <p style={{ opacity: 0.8, marginBottom: '2rem', fontSize: '0.9rem', wordBreak: 'break-all' }}>
            Terhubung dengan: {address}
          </p>
          <hr style={{ margin: "0 0 3rem 0", width: "80%", border: 'none', height: '1px', backgroundColor: '#333' }} />
          <CredentialsGallery />
        </div>
      ) : (
          <div style={{ textAlign: 'center', paddingTop: '5rem'}}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem'}}>Silakan Hubungkan Dompet</h2>
              <p style={{ color: '#aaa'}}>
                  Hubungkan dompet Anda untuk melihat galeri kredensial. <br/>
                  Anda bisa menggunakan login sosial, email, atau dompet kripto.
              </p>
              <div style={{ marginTop: '2rem'}}>
                  <ConnectButton />
              </div>
          </div>
      )}
    </main>
  );
}