"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import CredentialsGallery from "../components/CredentialsGallery";
import LoginModal from "../components/LoginModal";
import IssuerDashboard from "../components/IssuerDashboard";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [showHolder, setShowHolder] = useState(false);
  const [showIssuer, setShowIssuer] = useState(false);
  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; role: "holder" | "issuer" | null }>({
    isOpen: false,
    role: null,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Jika holder login atau terhubung dengan wallet, tampilkan galeri
  if (showHolder || (isMounted && isConnected)) {
    return (
      <>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <main
          style={{
            background: "#0a0a0a",
            minHeight: "100vh",
            color: "#fff",
            padding: "2rem",
          }}
        >
          <Link href="/" style={{ color: "#aaa", fontSize: "0.9rem" }}>
            ← Kembali
          </Link>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ marginBottom: "1rem" }}>Selamat datang, Pemegang Kredensial!</h2>
            <div style={{ marginBottom: "2rem" }}>
              <ConnectButton />
            </div>
            <hr style={{ margin: "0 0 3rem 0", width: "80%", border: "none", height: "1px", backgroundColor: "#333" }} />
            <CredentialsGallery />
          </div>
        </main>
      </>
    );
  }

  // Jika issuer login, tampilkan dashboard issuer
  if (showIssuer) {
    return (
      <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
        <Link href="/" style={{ color: "#aaa", fontSize: "0.9rem" }}>
          ← Kembali
        </Link>
        <IssuerDashboard />
      </main>
    );
  }

  // Landing page ala Relume.io
  return (
    <>
      <style jsx>{`
        .button:hover {
          background: rgba(79, 140, 255, 0.15);
          transform: translateY(-2px);
        }
      `}</style>
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(120deg, #0a0a0a 60%, #1e1e2f 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          color: "#fff",
        }}
      >
        <div
          style={{
            background: "rgba(30, 30, 47, 0.97)",
            borderRadius: "18px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.18)",
            padding: "3rem 2.5rem",
            maxWidth: 500,
            width: "100%",
            textAlign: "center",
          }}
        >
          <Image src="/logo.svg" alt="Logo" width={60} height={60} style={{ marginBottom: 16 }} />
          <h1 style={{ fontWeight: 800, fontSize: "2.5rem", marginBottom: "0.7rem", color: "#fff" }}>
            Platform Kredensial Digital
          </h1>
          <p style={{ color: "#bbb", marginBottom: "2.2rem", fontSize: "1.1rem" }}>
            Kelola dan verifikasi kredensial Anda dengan aman. <br />
            Didukung oleh teknologi blockchain.
          </p>
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => setLoginModal({ isOpen: true, role: "holder" })}
              style={{
                display: "inline-block",
                marginBottom: "1rem",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "1px solid #4f8cff",
                borderRadius: "8px",
                padding: "0.8rem 2rem",
                background: "rgba(79, 140, 255, 0.07)",
                transition: "background 0.2s, transform 0.2s",
                cursor: "pointer",
              }}
              className="button"
            >
              Masuk sebagai Pemegang Kredensial
            </button>
            <button
              onClick={() => setLoginModal({ isOpen: true, role: "issuer" })}
              style={{
                display: "inline-block",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "1px solid #ff6b6b",
                borderRadius: "8px",
                padding: "0.8rem 2rem",
                background: "rgba(255, 107, 107, 0.07)",
                transition: "background 0.2s, transform 0.2s",
                cursor: "pointer",
              }}
              className="button"
            >
              Masuk sebagai Penerbit
            </button>
          </div>
          <Link
            href="http://localhost:3000/verify"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              color: "#4f8cff",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              border: "1px solid #4f8cff",
              borderRadius: "8px",
              padding: "0.6rem 1.3rem",
              background: "rgba(79, 140, 255, 0.07)",
              transition: "background 0.2s, transform 0.2s",
            }}
            className="button"
          >
            🔎 Verifikasi Publik
          </Link>
        </div>
        <div style={{ marginTop: "2.5rem", color: "#888", fontSize: "0.95rem" }}>
          © {new Date().getFullYear()} Platform Kredensial Digital
        </div>
        <LoginModal
          isOpen={loginModal.isOpen}
          onClose={() => setLoginModal({ isOpen: false, role: null })}
          role={loginModal.role || "holder"}
          setShowHolder={setShowHolder}
          setShowIssuer={setShowIssuer}
        />
      </main>
    </>
  );
}