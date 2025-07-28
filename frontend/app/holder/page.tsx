"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "viem/chains";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { Web3AuthButton } from "@/components/Web3AuthButton";

// --- Konfigurasi ---
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const deploymentBlock = 24178838n;

const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
});

// --- Tipe Data ---
interface Credential {
  tokenId: string;
  tokenURI: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
    error?: string; // Menambah properti error
  };
}

// --- Fungsi Helper ---
async function fetchMetadata(uri: string): Promise<Credential['metadata']> {
  if (!uri) return null;

  const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  const fetchWithTimeout = (url: string, timeout = 8000) => {
    return new Promise<Response>((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timed out'));
      }, timeout);

      fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }).then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  };

  try {
    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      for (const gateway of ipfsGateways) {
        try {
          const response = await fetchWithTimeout(gateway + ipfsHash);
          if (response.ok) return await response.json();
        } catch {
          continue;
        }
      }
      throw new Error('All IPFS gateways failed');
    } else if (uri.startsWith('http')) {
      const response = await fetchWithTimeout(uri);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } else if (uri.startsWith('data:application/json;base64,')) {
      const base64Data = uri.split(',')[1];
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    return {
      name: `Token with unknown metadata`,
      description: 'Metadata could not be loaded',
      error: error.message
    };
  }
}

// --- Komponen ---
function ImageModal({ isOpen, onClose, imageUrl, title, tokenId }: { isOpen: boolean; onClose: () => void; imageUrl: string; title: string; tokenId: string; }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-black/80 text-white border-2 border-gray-600 text-xl flex items-center justify-center hover:bg-black z-10">
          ×
        </button>
        <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        <div className="absolute -bottom-14 left-0 right-0 text-center text-white bg-black/80 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-80">Token ID: {tokenId}</p>
        </div>
      </div>
    </div>
  );
}

function CredentialsGallery() {
  const { address } = useWeb3Auth(); // Ganti ke useWeb3Auth
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; tokenId: string; } | null>(null);

  useEffect(() => {
    async function fetchCredentials() {
      if (!address || !contractAddress) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event CredentialIssued(uint256 indexed tokenId, address indexed to, string tokenURI)'),
          fromBlock: deploymentBlock,
          toBlock: 'latest',
        });

        const filteredLogs = logs.filter(log => log.args?.to?.toLowerCase() === address.toLowerCase());

        const credentialsPromises = filteredLogs.map(async (log) => {
          const credential: Credential = {
            tokenId: log.args.tokenId?.toString() || '',
            tokenURI: log.args.tokenURI || '',
          };
          credential.metadata = await fetchMetadata(credential.tokenURI);
          return credential;
        });

        const resolvedCredentials = await Promise.all(credentialsPromises);
        setCredentials(resolvedCredentials);

      } catch (err: any) {
        console.error('Error fetching credentials:', err);
        setError('Failed to fetch credentials from blockchain');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredentials();
  }, [address]); // Jalankan effect saat 'address' berubah

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white">Loading your credentials...</p>
        {/* Skeleton UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>Error loading credentials: {error}</p>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎓</div>
        <h3 className="text-2xl font-semibold text-white mb-2">No Credentials Found</h3>
        <p className="text-gray-400">You don't have any credentials yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Your Credentials</h2>
        <p className="text-gray-400">You have {credentials.length} credential{credentials.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((cred, index) => {
          const imageUrl = cred.metadata?.image?.startsWith('ipfs://') ?
            cred.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') :
            cred.metadata?.image;

          return (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-full h-48 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onClick={imageUrl ? () => setSelectedImage({ url: imageUrl, title: cred.metadata?.name || `Credential #${cred.tokenId}`, tokenId: cred.tokenId }) : undefined}>
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt={cred.metadata?.name || `Credential #${cred.tokenId}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const container = target.parentElement!;
                        if (!container.querySelector('.error-message')) {
                           container.innerHTML += `<div class="error-message text-center text-gray-400 p-8"><div class="text-4xl mb-2">🖼️</div><div class="text-sm">Image failed to load</div></div>`;
                        }
                      }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍 Click to zoom</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 p-8">
                    <div className="text-4xl mb-2">🎓</div>
                    <div className="text-sm">No Image</div>
                  </div>
                )}
                <div className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded">ID: {cred.tokenId}</div>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-semibold text-white mb-2">{cred.metadata?.name || `Credential #${cred.tokenId}`}</h4>
                {cred.metadata?.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{cred.metadata.description}</p>
                )}
                <div className="text-xs text-gray-500 border-t border-white/10 pt-3">
                  <div>Token ID: {cred.tokenId}</div>
                </div>
                {cred.metadata?.attributes && cred.metadata.attributes.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {cred.metadata.attributes.slice(0, 3).map((attr, attrIndex) => (
                        <span key={attrIndex} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full">{attr.trait_type}: {attr.value}</span>
                      ))}
                      {cred.metadata.attributes.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded-full">+{cred.metadata.attributes.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage?.url || ''} title={selectedImage?.title || ''} tokenId={selectedImage?.tokenId || ''} />
    </div>
  );
}

export default function HolderPage() {
  // Gunakan hook dari Web3AuthProvider
  const { address, isConnected, isLoading: web3AuthLoading } = useWeb3Auth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleBackToHome = () => router.push("/");

  if (!isMounted || web3AuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="relative z-10 p-6">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToHome} className="text-white hover:text-purple-400 transition-colors duration-200 flex items-center gap-2">
              ← Back to Home
            </button>
            <div className="text-2xl font-bold text-white">CredentialVault</div>
          </div>
          <div className="flex items-center gap-4">
            <Web3AuthButton />
            {/* HAPUS ConnectButton dari RainbowKit */}
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-6 pb-12">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Please connect your wallet to view your digital credentials.
            </p>
            <div className="animate-pulse">
              <div className="w-48 h-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4">
                Your Digital Credentials
              </h1>
              <p className="text-gray-300 mb-2">
                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <CredentialsGallery />
          </div>
        )}
      </main>

      <footer className="relative z-10 p-6 text-center text-gray-400 border-t border-white/10">
        <p>&copy; 2025 CredentialVault. Powered by Web3Auth & Blockchain.</p>
      </footer>
    </div>
  );
}