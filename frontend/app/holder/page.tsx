"use client";

// --- IMPORTS ---
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';

// Import Navbar dari file terpisah
import { Navbar } from '@/components/Navbar';

// Lucide Icons
import {
    Search, Image as ImageIcon, ExternalLink, Shield
} from 'lucide-react';

// ============================================================================
// LOGIC & COMPONENTS FOR CREDENTIALS GALLERY
// ============================================================================

// Konfigurasi
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const deploymentBlock = 24178838n;

const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL),
});

// Tipe Data
interface Credential {
    tokenId: string;
    tokenURI: string;
    metadata?: { name?: string; description?: string; image?: string; error?: string; };
}

// Fungsi Helper untuk mengkonversi IPFS URL
function convertIPFSUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('ipfs://')) {
        return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return url;
}

// Fungsi Helper untuk fetch metadata
async function fetchMetadata(uri: string): Promise<Credential['metadata']> {
    if (!uri) return { name: "Invalid URI", description: "Token URI is missing.", error: "Missing URI" };
    
    try {
        let response;
        
        if (uri.startsWith('ipfs://')) {
            const ipfsUrl = convertIPFSUrl(uri);
            response = await fetch(ipfsUrl);
        } else if (uri.startsWith('http')) {
            response = await fetch(uri);
        } else if (uri.startsWith('data:')) {
            // Handle base64 encoded JSON
            try {
                const json = JSON.parse(atob(uri.split(',')[1]));
                return json;
            } catch {
                return { name: "Base64 Error", description: 'Could not parse base64 data.', error: "Base64 parsing failed" };
            }
        } else {
            return { name: "Unknown URI Format", description: 'URI format not supported.', error: "Unsupported URI format" };
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const metadata = await response.json();
        
        // Convert IPFS image URL if needed
        if (metadata.image) {
            metadata.image = convertIPFSUrl(metadata.image);
        }
        
        return metadata;
    } catch (error: any) {
        console.error("Metadata fetch error:", error);
        return { 
            name: `Metadata Error`, 
            description: 'Could not load metadata from IPFS.', 
            error: error.message 
        };
    }
}

// Komponen Modal untuk melihat gambar
function ImageModal({ isOpen, onClose, imageUrl, title }: { 
    isOpen: boolean; 
    onClose: () => void; 
    imageUrl: string; 
    title: string; 
}) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.8, opacity: 0 }} 
                className="relative max-w-[90vw] max-h-[85vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[#222831] text-white border-2 border-[#393E46] text-xl flex items-center justify-center hover:bg-[#00ADB5] z-10 transition-colors"
                >
                    ×
                </button>
                <img 
                    src={imageUrl} 
                    alt={title} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzkzRTQ2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRUVFRUVFIiBmb250LXNpemU9IjEyIj5HYW1iYXIgVGlkYWsgRGl0ZW11a2FuPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                />
            </motion.div>
        </div>
    );
}

// Komponen Galeri Kredensial
function CredentialsGallery() {
    const { address } = useWeb3Auth();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; } | null>(null);

    useEffect(() => {
        async function fetchCredentials() {
            if (!address || !contractAddress) { 
                setIsLoading(false); 
                return; 
            }
            
            setIsLoading(true);
            try {
                const logs = await publicClient.getLogs({
                    address: contractAddress,
                    event: parseAbiItem('event CredentialIssued(uint256 indexed tokenId, address indexed to, string tokenURI)'),
                    fromBlock: deploymentBlock, 
                    toBlock: 'latest',
                });
                
                const userLogs = logs.filter(log => 
                    log.args?.to?.toLowerCase() === address.toLowerCase()
                );
                
                const resolvedCredentials = await Promise.all(userLogs.map(async (log) => ({
                    tokenId: log.args.tokenId!.toString(),
                    tokenURI: log.args.tokenURI!,
                    metadata: await fetchMetadata(log.args.tokenURI!),
                })));
                
                setCredentials(resolvedCredentials.reverse());
            } catch (err) {
                console.error('Error fetching credentials:', err);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchCredentials();
    }, [address]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#EEEEEE]/5 backdrop-blur-sm rounded-xl p-4 animate-pulse">
                        <div className="w-full aspect-video bg-[#EEEEEE]/10 rounded-lg mb-4"></div>
                        <div className="h-5 bg-[#EEEEEE]/10 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-[#EEEEEE]/10 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (credentials.length === 0) {
        return (
            <div className="text-center py-20 text-[#EEEEEE]/70">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-2xl font-semibold text-white mb-2">Galeri Kosong</h3>
                <p className="mb-6">Anda belum memiliki kredensial digital.</p>
                
                {/* Tombol Coba Verifikasi */}
                <motion.button
                    onClick={() => window.open('/verify', '_blank')}
                    className="inline-flex items-center gap-2 bg-[#00ADB5] hover:bg-[#00ADB5]/90 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Shield className="w-5 h-5" />
                    Coba Verifikasi Kredensial
                    <ExternalLink className="w-4 h-4" />
                </motion.button>
            </div>
        );
    }

    return (
        <>
            {/* Header dengan tombol verifikasi */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kredensial Anda</h2>
                    <p className="text-[#EEEEEE]/70">Total: {credentials.length} kredensial</p>
                </div>
                <motion.button
                    onClick={() => window.open('/verify', '_blank')}
                    className="inline-flex items-center gap-2 bg-[#00ADB5]/20 hover:bg-[#00ADB5]/30 border border-[#00ADB5]/50 text-[#00ADB5] px-4 py-2 rounded-lg font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Shield className="w-4 h-4" />
                    Verifikasi Kredensial
                    <ExternalLink className="w-3 h-3" />
                </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {credentials.map((cred) => {
                    const imageUrl = cred.metadata?.image;
                    const hasValidImage = imageUrl && !cred.metadata?.error;
                    
                    return (
                        <motion.div 
                            key={cred.tokenId} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.5 }} 
                            className="bg-[#EEEEEE]/5 backdrop-blur-sm rounded-xl border border-[#EEEEEE]/10 overflow-hidden group hover:border-[#00ADB5]/30 transition-all duration-300"
                        >
                            <div 
                                className="w-full aspect-video bg-[#393E46]/50 flex items-center justify-center overflow-hidden cursor-pointer relative"
                                onClick={hasValidImage ? () => setSelectedImage({ 
                                    url: imageUrl!, 
                                    title: cred.metadata?.name || `Kredensial #${cred.tokenId}`
                                }) : undefined}
                            >
                                {hasValidImage ? (
                                    <>
                                        <img 
                                            src={imageUrl} 
                                            alt={cred.metadata?.name || ''} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                        <div class="text-center text-[#EEEEEE]/50 p-8">
                                                            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                            </svg>
                                                            <div class="text-sm">Gambar Tidak Tersedia</div>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Search className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-[#EEEEEE]/50 p-8">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                        <div className="text-sm">Gambar Tidak Tersedia</div>
                                        {cred.metadata?.error && (
                                            <div className="text-xs text-red-400 mt-1">
                                                Error: {cred.metadata.error}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h4 className="font-semibold text-white mb-1 truncate">
                                    {cred.metadata?.name || `Kredensial #${cred.tokenId}`}
                                </h4>
                                <p className="text-[#EEEEEE]/70 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {cred.metadata?.description || 'Tidak ada deskripsi tersedia.'}
                                </p>
                                <div className="text-xs text-[#EEEEEE]/50 border-t border-[#EEEEEE]/10 pt-3 flex justify-between items-center">
                                    <span>Token ID: {cred.tokenId}</span>
                                    {hasValidImage && (
                                        <span className="text-[#00ADB5] text-xs">Klik untuk memperbesar</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            
            <AnimatePresence>
                {selectedImage && (
                    <ImageModal 
                        isOpen={!!selectedImage} 
                        onClose={() => setSelectedImage(null)} 
                        imageUrl={selectedImage.url}
                        title={selectedImage.title}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function HolderPage() {
    const { address, isConnected, isLoading: web3AuthLoading } = useWeb3Auth();
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();

    useEffect(() => { 
        setIsMounted(true); 
    }, []);

    // Tampilkan loading screen sampai komponen mounted dan Web3Auth ready
    if (!isMounted || web3AuthLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ADB5] mx-auto mb-4"></div>
                    <p className="text-[#EEEEEE]/70">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE]">
            <Navbar />
            
            <main className="relative pt-32 pb-12 px-4 sm:px-6">
                {!isConnected ? (
                    <div className="max-w-7xl mx-auto text-center py-20">
                        <div className="text-6xl mb-6">🔐</div>
                        <h2 className="text-3xl font-bold text-white mb-4">Hubungkan Wallet Anda</h2>
                        <p className="text-[#EEEEEE]/70 mb-8 max-w-md mx-auto">
                            Silakan hubungkan wallet untuk melihat kredensial digital Anda.
                        </p>
                        
                        {/* Tombol alternatif untuk verifikasi */}
                        <div className="space-y-4">
                            <motion.button
                                onClick={() => router.push('/verify')}
                                className="inline-flex items-center gap-2 bg-[#00ADB5]/20 hover:bg-[#00ADB5]/30 border border-[#00ADB5]/50 text-[#00ADB5] px-6 py-3 rounded-lg font-medium transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Shield className="w-5 h-5" />
                                Atau Coba Verifikasi Kredensial
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00ADB5] mb-2">
                                Galeri Kredensial Saya
                            </h1>
                            <p className="text-[#EEEEEE]/70">
                                Terhubung sebagai: <span className="font-mono bg-[#EEEEEE]/10 px-2 py-1 rounded-md text-sm">
                                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                                </span>
                            </p>
                        </div>
                        <CredentialsGallery />
                    </div>
                )}
            </main>
            
            <footer className="relative z-10 p-6 text-center text-[#EEEEEE]/70 border-t border-[#EEEEEE]/10 mt-12">
                <p>&copy; {new Date().getFullYear()} VERITASID. Powered by Blockchain Technology.</p>
            </footer>
        </div>
    );
}