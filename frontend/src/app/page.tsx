"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "wagmi/chains";
import { useState, useEffect } from "react";

// --- Konfigurasi ---
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const deploymentBlock = 24178838n; // <<--- Block deploy kontrak

// Membuat 'public client' DENGAN RPC EKSPLISIT
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
});

// --- Komponen untuk Menampilkan Daftar Kredensial ---
function CredentialsList() {
  const { address } = useAccount();

  const { data: credentials, isLoading, error } = useQuery({
    queryKey: ["userCredentials", address],
    queryFn: async () => {
      if (!address || !contractAddress) return [];

      try {
        // Ambil logs dari block deploy kontrak, bukan dari 0
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event CredentialIssued(uint256 indexed tokenId, address indexed to, string tokenURI)'),
          fromBlock: deploymentBlock,
          toBlock: 'latest',
        });

        // Filter manual untuk address
        const filteredLogs = logs.filter(
          log =>
            log.args &&
            log.args.to &&
            log.args.to.toLowerCase() === address.toLowerCase()
        );

        return filteredLogs.map(log => ({
          tokenId: log.args.tokenId?.toString(),
          tokenURI: log.args.tokenURI,
        }));

      } catch (err) {
        console.error('Error fetching logs:', err);

        // Fallback (tidak perlu dari block 0, tetap dari block deploy)
        try {
          const allLogs = await publicClient.getLogs({
            address: contractAddress,
            topics: [
              '0xf03729c4e45d56313830b69839594a662bd953079e350899f22c95272f29567f'
            ],
            fromBlock: deploymentBlock,
            toBlock: 'latest',
          });

          // Jika perlu decode log manual di sini
          return [];
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          throw new Error('Failed to fetch credentials from blockchain');
        }
      }
    },
    enabled: !!address && !!contractAddress,
  });

  if (isLoading) return <p>Fetching your credentials...</p>;
  if (error) return <p>Error fetching credentials: {error.message}</p>;
  if (!credentials || credentials.length === 0) return <p>No credentials found for this address.</p>;

  return (
    <div style={{ textAlign: 'left', marginTop: '1rem', width: '100%', maxWidth: '600px' }}>
      <h3>Your Credentials:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {credentials.map((cred, index) => (
          <li key={index} style={{ border: '1px solid #444', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
            <strong>Token ID:</strong> {cred.tokenId} <br />
            <strong>Token URI:</strong> {cred.tokenURI}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Komponen Halaman Utama ---
export default function Home() {
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
        justifyContent: "flex-start",
        minHeight: "100vh",
        padding: "4rem",
        color: "white",
        textAlign: "center"
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <ConnectButton />
      </div>

      {isMounted && isConnected && (
        <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h2>Welcome, Holder!</h2>
          <p>Your connected address: {address}</p>
          <hr style={{ margin: "2rem 0", width: "80%" }} />
          <CredentialsList />
        </div>
      )}
    </main>
  );
}