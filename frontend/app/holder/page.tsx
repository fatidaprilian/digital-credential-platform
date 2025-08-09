"use client";

// --- IMPORTS ---
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import Image from 'next/image';

// Import Navbar dari file terpisah
import { Navbar } from '@/components/Navbar';

// Lucide Icons
import {
    Search, 
    Image as ImageIcon, 
    ExternalLink, 
    Shield,
    Wallet,
    Award,
    Eye,
    Download,
    CheckCircle,
    Calendar,
    Globe,
    Sparkles
} from 'lucide-react';

// ============================================================================
// FLOATING PARTICLES COMPONENT
// ============================================================================

const FloatingParticles = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-[#00ADB5]/20 to-[#393E46]/20"
          style={{
            width: Math.random() * 6 + 4,
            height: Math.random() * 6 + 4,
          }}
          animate={{
            x: [Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)],
            y: [Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800), Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

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

// Enhanced Image Modal Component with Fixed Download
function ImageModal({ 
    isOpen, 
    onClose, 
    imageUrl, 
    title,
    description 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    imageUrl: string; 
    title: string; 
    description?: string;
}) {
    if (!isOpen) return null;

    // Function to handle image download by opening in new tab
    const handleDownload = () => {
        // Create a temporary link to open image in new tab
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Add download attribute to suggest filename
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_credential.jpg`;
        link.download = fileName;
        
        // Trigger click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.8, opacity: 0 }} 
                className="relative max-w-4xl w-full bg-[#222831]/95 backdrop-blur-lg border border-[#EEEEEE]/20 rounded-2xl overflow-hidden shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#EEEEEE]/10">
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        {description && (
                            <p className="text-sm text-[#EEEEEE]/70 mt-1">{description}</p>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 rounded-full bg-[#393E46] text-white hover:bg-red-500 transition-colors flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>
                
                {/* Image */}
                <div className="p-6">
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzkzRTQ2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRUVFRUVFIiBmb250LXNpemU9IjEyIj5HYW1iYXIgVGlkYWsgRGl0ZW11a2FuPC90ZXh0Pgo8L3N2Zz4K';
                        }}
                    />
                </div>
                
                {/* Actions */}
                <div className="p-6 border-t border-[#EEEEEE]/10 flex gap-3">
                    <button
                        onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
                        className="flex-1 bg-[#00ADB5] hover:bg-[#00ADB5]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Buka di Tab Baru
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-[#393E46] hover:bg-[#393E46]/80 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Lihat Gambar Asli
                    </button>
                </div>

                {/* Info Helper */}
                <div className="px-6 pb-4">
                    <p className="text-xs text-[#EEEEEE]/50 text-center">
                        💡 Tip: Klik kanan pada gambar dan pilih "Save image as..." untuk mengunduh
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Enhanced Stats Component
const StatsOverview = ({ totalCredentials }: { totalCredentials: number }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[#EEEEEE]/60 text-sm font-medium">Total Kredensial</p>
                    <p className="text-2xl font-bold text-white mt-1">{totalCredentials}</p>
                </div>
                <div className="w-12 h-12 bg-[#00ADB5]/20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#00ADB5]" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[#EEEEEE]/60 text-sm font-medium">Status Verifikasi</p>
                    <p className="text-lg font-bold text-green-400 mt-1 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Terverifikasi
                    </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-400" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[#EEEEEE]/60 text-sm font-medium">Blockchain</p>
                    <p className="text-lg font-bold text-purple-400 mt-1">Polygon</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-400" />
                </div>
            </div>
        </motion.div>
    </div>
);

// Enhanced Loading Component
const LoadingSkeleton = () => (
    <div className="space-y-8">
        <StatsOverview totalCredentials={0} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl overflow-hidden"
                >
                    <div className="w-full aspect-video bg-[#393E46]/50 animate-pulse"></div>
                    <div className="p-6 space-y-3">
                        <div className="h-5 bg-[#393E46]/50 rounded animate-pulse"></div>
                        <div className="h-4 bg-[#393E46]/30 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-[#393E46]/30 rounded w-1/2 animate-pulse"></div>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

// Enhanced Empty State Component
const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-6 rounded-full mb-8"
        >
            <Image
                src="/veritasidtrans.svg"
                alt="Logo VeritasID"
                width={48}
                height={48}
                className="w-12 h-12"
            />
        </motion.div>
        
        <h3 className="text-3xl font-bold text-white mb-4">Galeri Kosong</h3>
        <p className="text-[#EEEEEE]/70 mb-8 max-w-md mx-auto">
            Anda belum memiliki kredensial digital. Kredensial akan muncul di sini setelah diterbitkan oleh institusi.
        </p>
        
        <div className="space-y-4">
            <motion.button
                onClick={() => window.open('/verify', '_blank')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#00ADB5]/25"
            >
                <Shield className="w-5 h-5" />
                Coba Verifikasi Kredensial
                <ExternalLink className="w-4 h-4" />
            </motion.button>
            
            <p className="text-sm text-[#EEEEEE]/50">
                atau hubungi institusi terkait untuk mendapatkan kredensial digital
            </p>
        </div>
    </motion.div>
);

// Enhanced Credential Card Component
const CredentialCard = ({ 
    credential, 
    index, 
    onImageClick 
}: { 
    credential: Credential; 
    index: number; 
    onImageClick: (imageUrl: string, title: string, description?: string) => void; 
}) => {
    const imageUrl = credential.metadata?.image;
    const hasValidImage = imageUrl && !credential.metadata?.error;
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: index * 0.1 }} 
            className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl overflow-hidden group hover:border-[#00ADB5]/30 hover:shadow-lg hover:shadow-[#00ADB5]/10 transition-all duration-300"
        >
            {/* Image Section */}
            <div 
                className={`w-full aspect-video bg-[#393E46]/50 flex items-center justify-center overflow-hidden relative ${hasValidImage ? 'cursor-pointer' : ''}`}
                onClick={hasValidImage ? () => onImageClick(
                    imageUrl!, 
                    credential.metadata?.name || `Kredensial #${credential.tokenId}`,
                    credential.metadata?.description
                ) : undefined}
            >
                {hasValidImage ? (
                    <>
                        <img 
                            src={imageUrl} 
                            alt={credential.metadata?.name || ''} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                        <div class="flex flex-col items-center justify-center h-full text-[#EEEEEE]/50 p-8">
                                            <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <div class="text-sm font-medium">Gambar Tidak Tersedia</div>
                                        </div>
                                    `;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Eye className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-3 right-3 bg-[#00ADB5] text-white px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Klik untuk melihat
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#EEEEEE]/50 p-8">
                        <ImageIcon className="w-12 h-12 mb-3" />
                        <div className="text-sm font-medium">Gambar Tidak Tersedia</div>
                        {credential.metadata?.error && (
                            <div className="text-xs text-red-400 mt-2 text-center">
                                Error: {credential.metadata.error}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Content Section */}
            <div className="p-6">
                <h4 className="font-bold text-white text-lg mb-2 line-clamp-1">
                    {credential.metadata?.name || `Kredensial #${credential.tokenId}`}
                </h4>
                <p className="text-[#EEEEEE]/70 text-sm mb-4 line-clamp-3 min-h-[60px]">
                    {credential.metadata?.description || 'Tidak ada deskripsi tersedia untuk kredensial ini.'}
                </p>
                
                {/* Footer */}
                <div className="border-t border-[#EEEEEE]/10 pt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-[#EEEEEE]/50">
                        <Award className="w-4 h-4" />
                        <span>Token #{credential.tokenId}</span>
                    </div>
                    {hasValidImage && (
                        <span className="text-[#00ADB5] text-xs font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Interaktif
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Enhanced Credentials Gallery Component
function CredentialsGallery() {
    const { address } = useWeb3Auth();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string; description?: string; } | null>(null);

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

    const handleImageClick = (imageUrl: string, title: string, description?: string) => {
        setSelectedImage({ url: imageUrl, title, description });
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (credentials.length === 0) {
        return <EmptyState />;
    }

    return (
        <>
            <StatsOverview totalCredentials={credentials.length} />
            
            {/* Header dengan tombol verifikasi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kredensial Digital Anda</h2>
                    <p className="text-[#EEEEEE]/70">
                        Kelola dan lihat {credentials.length} kredensial yang telah diterbitkan
                    </p>
                </div>
                <motion.button
                    onClick={() => window.open('/verify', '_blank')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 bg-[#00ADB5]/20 hover:bg-[#00ADB5]/30 border border-[#00ADB5]/50 text-[#00ADB5] px-4 py-2 rounded-xl font-medium transition-all"
                >
                    <Shield className="w-4 h-4" />
                    Verifikasi Kredensial
                    <ExternalLink className="w-3 h-3" />
                </motion.button>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {credentials.map((credential, index) => (
                    <CredentialCard
                        key={credential.tokenId}
                        credential={credential}
                        index={index}
                        onImageClick={handleImageClick}
                    />
                ))}
            </div>
            
            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <ImageModal 
                        isOpen={!!selectedImage} 
                        onClose={() => setSelectedImage(null)} 
                        imageUrl={selectedImage.url}
                        title={selectedImage.title}
                        description={selectedImage.description}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Enhanced Connect Wallet Component
const ConnectWalletPrompt = () => {
    const router = useRouter();
    
    return (
        <div className="max-w-4xl mx-auto text-center py-20">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-6 rounded-full mb-8"
            >
                <Image
                    src="/veritasidtrans.svg"
                    alt="Logo VeritasID"
                    width={48}
                    height={48}
                    className="w-12 h-12"
                />
            </motion.div>
            
            <h2 className="text-4xl font-bold text-white mb-4">Hubungkan Wallet Anda</h2>
            <p className="text-[#EEEEEE]/70 mb-8 max-w-2xl mx-auto text-lg">
                Untuk melihat kredensial digital yang telah diterbitkan untuk Anda, 
                silakan hubungkan wallet terlebih dahulu.
            </p>
            
            <div className="space-y-6">
                <motion.button
                    onClick={() => router.push('/verify')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-3 bg-[#00ADB5]/20 hover:bg-[#00ADB5]/30 border border-[#00ADB5]/50 text-[#00ADB5] px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                >
                    <Shield className="w-6 h-6" />
                    Atau Coba Verifikasi Kredensial
                    <ExternalLink className="w-5 h-5" />
                </motion.button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                    <div className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">Aman & Terpercaya</h3>
                        <p className="text-sm text-[#EEEEEE]/70">
                            Kredensial disimpan dengan aman di blockchain
                        </p>
                    </div>
                    
                    <div className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">Terverifikasi</h3>
                        <p className="text-sm text-[#EEEEEE]/70">
                            Semua kredensial telah diverifikasi oleh institusi
                        </p>
                    </div>
                    
                    <div className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-white mb-2">Global</h3>
                        <p className="text-sm text-[#EEEEEE]/70">
                            Dapat diakses dan diverifikasi di mana saja
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function HolderPage() {
    const { address, isConnected, isLoading: web3AuthLoading } = useWeb3Auth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { 
        setIsMounted(true); 
    }, []);

    // Tampilkan loading screen sampai komponen mounted dan Web3Auth ready
    if (!isMounted || web3AuthLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center">
                <FloatingParticles />
                <div className="text-center text-white relative z-10">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-2 border-[#00ADB5] border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-[#EEEEEE]/70">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE] relative">
            <FloatingParticles />
            
            <div className="relative z-10">
                <Navbar />
                
                <main className="pt-32 pb-12 px-4 sm:px-6">
                    {!isConnected ? (
                        <ConnectWalletPrompt />
                    ) : (
                        <div className="max-w-7xl mx-auto">
                            {/* Header Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-12"
                            >
                                <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00ADB5] mb-4">
                                    Galeri Kredensial Digital
                                </h1>
                                <p className="text-[#EEEEEE]/70 text-lg mb-6">
                                    Kelola dan lihat semua kredensial digital yang telah diterbitkan untuk Anda
                                </p>
                                <div className="inline-flex items-center gap-2 bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 px-4 py-2 rounded-xl">
                                    <Wallet className="w-4 h-4 text-[#00ADB5]" />
                                    <span className="font-mono text-sm">
                                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                                    </span>
                                </div>
                            </motion.div>
                            
                            {/* Credentials Gallery */}
                            <CredentialsGallery />
                        </div>
                    )}
                </main>
                
                {/* Enhanced Footer */}
                <footer className="border-t border-[#EEEEEE]/10 mt-12 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Image
                                src="/veritasidtrans.svg"
                                alt="Logo VeritasID"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                            <span className="font-bold text-white text-lg">VERITASID</span>
                        </div>
                        <p className="text-[#EEEEEE]/70">
                            &copy; {new Date().getFullYear()} VERITASID. Powered by Blockchain Technology.
                        </p>
                        <p className="text-xs text-[#EEEEEE]/50 mt-2">
                            Kredensial digital yang aman, terverifikasi, dan dapat dipercaya
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}