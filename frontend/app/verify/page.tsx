"use client";

import { useState } from "react";
import { readContract } from "wagmi/actions";
import { polygonAmoy } from "wagmi/chains";
import { createConfig, http } from "wagmi";
import VerifiableCredential from "../abi/VerifiableCredential.json";

const abi = VerifiableCredential.abi;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Create a minimal config for read-only operations
const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
  },
});

type VerificationResult = {
  tokenURI: string;
  isRevoked: boolean;
};

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async () => {
    if (!tokenId) {
      setError("Please enter a Token ID.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log("Contract Address:", contractAddress);

      const [tokenURI, isRevoked] = await Promise.all([
        readContract(config, {
          address: contractAddress,
          abi,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        }),
        readContract(config, {
          address: contractAddress,
          abi,
          functionName: "isRevoked",
          args: [BigInt(tokenId)],
        }),
      ]);

      setResult({
        tokenURI: tokenURI as string,
        isRevoked: isRevoked as boolean,
      });
    } catch (e: any) {
      console.error("Error details:", e);
      setError(e.shortMessage || "Verification failed. The token may not exist or network issue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #191970 0%, #212121 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(30, 30, 40, 0.95)",
          borderRadius: "18px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.2)",
          padding: "2.5rem 2rem",
          maxWidth: "370px",
          width: "100%",
          color: "white",
        }}
      >
        <h1 style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
          letterSpacing: "0.02em"
        }}>
          🔎 Public Credential Verification
        </h1>
        <p style={{
          fontSize: "1rem",
          color: "#bbb",
          marginBottom: "1.5rem"
        }}>
          Enter a Token ID to verify its authenticity and status.
        </p>
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Token ID (e.g., 1)"
            min="1"
            style={{
              padding: "0.65rem",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#222",
              color: "#f7f7f7",
              fontSize: "1rem",
              flex: "1",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#1976d2"}
            onBlur={e => e.currentTarget.style.borderColor = "#444"}
            disabled={isLoading}
          />
          <button
            onClick={handleVerification}
            disabled={isLoading}
            style={{
              padding: "0.65rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              background: "#1976d2",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(30,50,230,0.07)",
              transition: "background 0.2s",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <span style={{
                display: "inline-block",
                verticalAlign: "middle",
                width: "18px",
                height: "18px",
                border: "2px solid #fff",
                borderTop: "2px solid #1976d2",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
            ) : "Verify"}
          </button>
        </div>
        {error && <p style={{ color: "#ff5252", fontWeight: 600, marginBottom: "1rem" }}>Error: {error}</p>}
        {result && (
          <div
            style={{
              border: '1px solid #1976d2',
              background: "#141d34",
              borderRadius: "12px",
              padding: '1.2rem',
              marginTop: '1rem',
              textAlign: 'left',
              boxShadow: "0 2px 8px rgba(50,90,255,0.07)"
            }}
          >
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.6rem 0" }}>
              Verification Result for Token ID: <span style={{ color: "#1976d2" }}>{tokenId}</span>
            </h3>
            <p>
              <strong>Status:</strong>
              <span style={{
                color: result.isRevoked ? "#ff5252" : "#2bd65c",
                fontWeight: "bold",
                marginLeft: "0.5rem"
              }}>
                {result.isRevoked ? " REVOKED" : " VALID"}
              </span>
            </p>
            <p>
              <strong>Metadata URI:</strong>{" "}
              <a href={result.tokenURI} target="_blank" rel="noopener noreferrer" style={{ color: "#90caf9" }}>
                {result.tokenURI}
              </a>
            </p>
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </main>
  );
}