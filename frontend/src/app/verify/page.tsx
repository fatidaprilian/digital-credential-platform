"use client";

import { useState } from "react";
import { readContract } from "wagmi/actions";
import { config as wagmiConfig } from "../layout";
import { abi } from "../abi/VerifiableCredential.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

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
      const [tokenURI, isRevoked] = await Promise.all([
        readContract(wagmiConfig, {
          address: contractAddress,
          abi,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        }),
        readContract(wagmiConfig, {
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
      console.error(e);
      setError(e.shortMessage || "Verification failed. The token may not exist.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: "4rem", color: "white", textAlign: "center" }}>
      <h1>Public Credential Verification</h1>
      <p>Enter a Token ID to verify its authenticity and status.</p>
      
      <div style={{ margin: "2rem 0" }}>
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Token ID (e.g., 1)"
          style={{ padding: "0.5rem", marginRight: "1rem", color: "black" }}
        />
        <button onClick={handleVerification} disabled={isLoading} style={{ padding: "0.5rem 1rem" }}>
          {isLoading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {result && (
        <div style={{ border: '1px solid #444', padding: '1rem', marginTop: '1rem', textAlign: 'left' }}>
          <h3>Verification Result for Token ID: {tokenId}</h3>
          <p>
            <strong>Status:</strong> 
            <span style={{ color: result.isRevoked ? "red" : "green", fontWeight: "bold" }}>
              {result.isRevoked ? " REVOKED" : " VALID"}
            </span>
          </p>
          <p>
            <strong>Melihat Metadata:</strong> {result.tokenURI}
          </p>
        </div>
      )}
    </main>
  );
}