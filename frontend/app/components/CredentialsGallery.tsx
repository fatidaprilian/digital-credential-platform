"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, parseAbiItem } from "viem";
import { polygonAmoy } from "wagmi/chains";
import { useState } from "react";
import ImageModal from './ImageModal';

// --- Konfigurasi ---
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const deploymentBlock = 24178838n; [cite_start]// Block deploy kontrak [cite: 2]

// Membuat 'public client' DENGAN RPC EKSPLISIT
const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
});

// --- Interface untuk Credential ---
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
    error?: string; // Menambahkan properti error untuk menangani kegagalan fetch
  };
}

// --- Fungsi untuk mengambil metadata dari URI ---
async function fetchMetadata(uri: string) {
  if (!uri) return null;

  const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  const fetchWithTimeout = async (url: string, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      for (const gateway of ipfsGateways) {
        try {
          const fetchUrl = gateway + ipfsHash;
          const response = await fetchWithTimeout(fetchUrl, 8000);
          if (response.ok) return await response.json();
        } catch (gatewayError: any) {
          console.log(`Gateway failed: ${gateway}`, gatewayError.message);
          continue;
        }
      }
      throw new Error('All IPFS gateways failed');
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetchWithTimeout(uri);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } else if (uri.startsWith('data:')) {
        const base64Data = uri.split(',')[1];
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
    } else {
      console.warn('Unknown URI format:', uri);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching metadata from', uri, ':', error.message);
    return { name: `Token with unknown metadata`, description: 'Metadata could not be loaded', error: error.message };
  }
}

// --- Komponen untuk Menampilkan Gallery Kredensial ---
export default function CredentialsGallery() {
  const { address } = useAccount();
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; tokenId: string; } | null>(null);

  const { data: credentials, isLoading, error } = useQuery({
    queryKey: ["userCredentials", address],
    queryFn: async () => {
      if (!address || !contractAddress) return [];

      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event CredentialIssued(uint256 indexed tokenId, address indexed to, string tokenURI)'),
          fromBlock: deploymentBlock,
          toBlock: 'latest',
        });

        const filteredLogs = logs.filter(log => log.args && log.args.to && log.args.to.toLowerCase() === address.toLowerCase());

        const credentialsWithMetadata: Credential[] = [];
        for (const log of filteredLogs) {
          const credential: Credential = {
            tokenId: log.args.tokenId?.toString() || '',
            tokenURI: log.args.tokenURI || '',
          };

          if (credential.tokenURI) {
            try {
              const metadata = await fetchMetadata(credential.tokenURI);
              credential.metadata = metadata || { name: `Credential #${credential.tokenId}`, description: 'Metadata unavailable' };
            } catch (metadataError: any) {
              credential.metadata = { name: `Credential #${credential.tokenId}`, description: 'Metadata unavailable', error: metadataError.message };
            }
          } else {
            credential.metadata = { name: `Credential #${credential.tokenId}`, description: 'No metadata URI provided' };
          }
          credentialsWithMetadata.push(credential);
        }
        return credentialsWithMetadata;
      } catch (err) {
        console.error('Error fetching logs:', err);
        throw new Error('Failed to fetch credentials from the blockchain.');
      }
    },
    enabled: !!address && !!contractAddress,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Fetching your credentials...</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ width: '200px', height: '250px', backgroundColor: '#333', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
        <p>Error fetching credentials: {error.message}</p>
      </div>
    );
  }

  if (!credentials || credentials.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No credentials found for this address.</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1rem' }}>
          Make sure you have NFT credentials minted to this wallet address.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>
        Your Credentials Gallery ({credentials.length})
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', padding: '0 1rem' }}>
        {credentials.map((cred, index) => {
          const imageUrl = cred.metadata?.image?.startsWith('ipfs://') ? cred.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : cred.metadata?.image;
          return (
            <div
              key={index}
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div 
                style={{ width: '100%', height: '200px', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: imageUrl ? 'zoom-in' : 'default' }}
                onClick={imageUrl ? () => setSelectedImage({ url: imageUrl, title: cred.metadata?.name || `Credential #${cred.tokenId}`, tokenId: cred.tokenId }) : undefined}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={cred.metadata?.name || `Credential #${cred.tokenId}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease' }}
                    onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; target.parentElement!.innerHTML = `<div style="color: #666; text-align: center; padding: 2rem;"><div style="font-size: 3rem; margin-bottom: 0.5rem;">🖼️</div><div style="font-size: 0.8rem;">Image failed to load</div></div>`; }}
                  />
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{cred.metadata?.error ? '⚠️' : '🎓'}</div>
                    <div style={{ fontSize: '0.8rem' }}>{cred.metadata?.error ? 'Metadata Error' : 'No Image'}</div>
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>{cred.metadata?.name || `Credential #${cred.tokenId}`}</h4>
                {cred.metadata?.description && <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#bbb', lineHeight: '1.4' }}>{cred.metadata.description}</p>}
                <div style={{ fontSize: '0.8rem', color: '#888', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>Token ID: {cred.tokenId}</div>
              </div>
            </div>
          );
        })}
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.url || ''}
        title={selectedImage?.title || ''}
        tokenId={selectedImage?.tokenId || ''}
      />
    </div>
  );
}