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
  };
}

// --- Fungsi untuk mengambil metadata dari URI ---
async function fetchMetadata(uri: string) {
  if (!uri) return null;

  // Daftar IPFS gateways untuk fallback
  const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  // Fungsi untuk mencoba fetch dengan timeout
  const fetchWithTimeout = async (url: string, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    console.log('Fetching metadata from:', uri);

    // Handle IPFS URLs dengan multiple gateways
    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      
      // Coba setiap gateway sampai ada yang berhasil
      for (const gateway of ipfsGateways) {
        try {
          const fetchUrl = gateway + ipfsHash;
          console.log('Trying gateway:', fetchUrl);
          
          const response = await fetchWithTimeout(fetchUrl, 8000);
          
          if (response.ok) {
            const metadata = await response.json();
            console.log('Successfully fetched metadata from:', fetchUrl);
            return metadata;
          }
        } catch (gatewayError) {
          console.log('Gateway failed:', gateway, gatewayError.message);
          continue; // Coba gateway berikutnya
        }
      }
      
      throw new Error('All IPFS gateways failed');
    }
    
    // Handle regular HTTP(S) URLs
    else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetchWithTimeout(uri);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const metadata = await response.json();
      console.log('Successfully fetched metadata from HTTP:', uri);
      return metadata;
    }
    
    // Handle data URLs (base64)
    else if (uri.startsWith('data:')) {
      try {
        const base64Data = uri.split(',')[1];
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      } catch (dataError) {
        console.error('Failed to parse data URI:', dataError);
        return null;
      }
    }
    
    // Jika format URI tidak dikenal
    else {
      console.warn('Unknown URI format:', uri);
      return null;
    }
    
  } catch (error) {
    console.error('Error fetching metadata from', uri, ':', error.message);
    
    // Return metadata minimal jika gagal total
    return {
      name: `Token with unknown metadata`,
      description: 'Metadata could not be loaded',
      error: error.message
    };
  }
}

// --- Modal Component untuk Full Image ---
function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  tokenId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  title: string; 
  tokenId: string; 
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '2px solid #333',
            fontSize: '1.2rem',
            cursor: 'pointer',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={title}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        />

        {/* Image Info */}
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '0',
            right: '0',
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{title}</h3>
          <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.8 }}>Token ID: {tokenId}</p>
        </div>
      </div>
    </div>
  );
}

// --- Komponen untuk Menampilkan Gallery Kredensial ---
function CredentialsGallery() {
  const { address } = useAccount();
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    tokenId: string;
  } | null>(null);

  const { data: credentials, isLoading, error } = useQuery({
    queryKey: ["userCredentials", address],
    queryFn: async () => {
      if (!address || !contractAddress) return [];

      try {
        // Ambil logs dari block deploy kontrak
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

        // Ambil metadata untuk setiap credential dengan error handling per item
        const credentialsWithMetadata: Credential[] = [];
        
        for (const log of filteredLogs) {
          const credential: Credential = {
            tokenId: log.args.tokenId?.toString() || '',
            tokenURI: log.args.tokenURI || '',
          };

          // Fetch metadata jika tokenURI ada, tapi jangan biarkan error satu item merusak semua
          if (credential.tokenURI) {
            try {
              console.log(`Fetching metadata for Token ID ${credential.tokenId}:`, credential.tokenURI);
              const metadata = await fetchMetadata(credential.tokenURI);
              if (metadata) {
                credential.metadata = metadata;
              }
            } catch (metadataError) {
              console.error(`Failed to fetch metadata for token ${credential.tokenId}:`, metadataError);
              // Tetap tambahkan credential meski metadata gagal
              credential.metadata = {
                name: `Credential #${credential.tokenId}`,
                description: 'Metadata unavailable',
                error: metadataError.message
              };
            }
          } else {
            // Jika tidak ada tokenURI
            credential.metadata = {
              name: `Credential #${credential.tokenId}`,
              description: 'No metadata URI provided'
            };
          }

          credentialsWithMetadata.push(credential);
        }

        console.log('Final credentials with metadata:', credentialsWithMetadata);
        return credentialsWithMetadata;

      } catch (err) {
        console.error('Error fetching logs:', err);

        // Fallback
        try {
          const allLogs = await publicClient.getLogs({
            address: contractAddress,
            topics: [
              '0xf03729c4e45d56313830b69839594a662bd953079e350899f22c95272f29567f'
            ],
            fromBlock: deploymentBlock,
            toBlock: 'latest',
          });

          return [];
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          throw new Error('Failed to fetch credentials from blockchain');
        }
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
            <div
              key={i}
              style={{
                width: '200px',
                height: '250px',
                backgroundColor: '#333',
                borderRadius: '12px',
                animation: 'pulse 2s infinite',
              }}
            />
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
      
      {/* Gallery Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '0 1rem',
        }}
      >
        {credentials.map((cred, index) => {
          const imageUrl = cred.metadata?.image?.startsWith('ipfs://') 
            ? cred.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : cred.metadata?.image;

          return (
            <div
              key={index}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Image Container */}
              <div 
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  backgroundColor: '#2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: imageUrl ? 'zoom-in' : 'default'
                }}
                onClick={imageUrl ? () => setSelectedImage({
                  url: imageUrl,
                  title: cred.metadata?.name || `Credential #${cred.tokenId}`,
                  tokenId: cred.tokenId
                }) : undefined}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={cred.metadata?.name || `Credential #${cred.tokenId}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const container = e.currentTarget.parentElement!;
                        container.innerHTML = `
                          <div style="color: #666; text-align: center; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🖼️</div>
                            <div style="font-size: 0.8rem;">Image failed to load</div>
                            ${cred.metadata?.error ? `<div style="font-size: 0.7rem; color: #999; margin-top: 0.5rem;">Error: ${cred.metadata.error}</div>` : ''}
                          </div>
                        `;
                      }}
                    />
                    {/* Zoom Icon Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.7rem',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                      className="zoom-hint"
                    >
                      🔍 Click to zoom
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      {cred.metadata?.error ? '⚠️' : '🎓'}
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      {cred.metadata?.error ? 'Metadata Error' : 'No Image'}
                    </div>
                    {cred.metadata?.error && (
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem' }}>
                        {cred.metadata.error}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Debug info */}
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: '0.6rem',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>
                  ID: {cred.tokenId}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1rem' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '1.1rem',
                  color: '#fff',
                  fontWeight: '600'
                }}>
                  {cred.metadata?.name || `Credential #${cred.tokenId}`}
                </h4>
                
                {cred.metadata?.description && (
                  <p style={{ 
                    margin: '0 0 1rem 0', 
                    fontSize: '0.9rem', 
                    color: '#bbb',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {cred.metadata.description}
                  </p>
                )}

                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#888',
                  borderTop: '1px solid #333',
                  paddingTop: '0.5rem'
                }}>
                  <div>Token ID: {cred.tokenId}</div>
                </div>

                {/* Attributes */}
                {cred.metadata?.attributes && cred.metadata.attributes.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.5rem' 
                    }}>
                      {cred.metadata.attributes.slice(0, 3).map((attr, attrIndex) => (
                        <span
                          key={attrIndex}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            color: '#ccc'
                          }}
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                      {cred.metadata.attributes.length > 3 && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#444',
                          borderRadius: '4px',
                          color: '#999'
                        }}>
                          +{cred.metadata.attributes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
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

// --- Komponen Halaman Utama ---
export default function Home() {
  const { address, isConnected } = useAccount();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          minHeight: "100vh",
          padding: "2rem",
          color: "white",
          textAlign: "center",
          backgroundColor: "#0a0a0a"
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <ConnectButton />
        </div>

        {isMounted && isConnected && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>Welcome, Credential Holder!</h2>
            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
              Connected: {address}
            </p>
            <hr style={{ margin: "0 0 3rem 0", width: "80%", border: 'none', height: '1px', backgroundColor: '#333' }} />
            <CredentialsGallery />
          </div>
        )}
      </main>
    </>
  );
}