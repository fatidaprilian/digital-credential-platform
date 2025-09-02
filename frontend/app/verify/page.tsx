"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import VerifiableCredential from "../abi/VerifiableCredential.json";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  Search, 
  Loader2, 
  ExternalLink, 
  User, 
  Info, 
  Hash, 
  CalendarDays,
  RefreshCw,
  Copy
} from "lucide-react";

// --- Types ---
interface VerificationResult {
  isRevoked: boolean;
  owner: string;
}

interface CredentialMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

// REVISI: Tipe data IssuanceLog disesuaikan dengan respons backend baru
interface IssuanceLog {
  transactionHash: string;
  issuedAt: string;
  onChainTokenId: string; // ID asli di blockchain
}

// --- Environment Variables & Constants ---
const abi = VerifiableCredential.abi;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const rpcUrl = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL;
const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// --- Helper Functions ---
const formatIpfsUrl = (ipfsUri: string) => {
  if (!ipfsUri || !ipfsUri.startsWith("ipfs://")) return ipfsUri;
  const cid = ipfsUri.substring(7);
  return `${IPFS_GATEWAY}${cid}`;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const FloatingParticles = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { 
    setIsMounted(true); 
  }, []);
  
  if (!isMounted) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            background: `linear-gradient(45deg, #00ADB5, #393E46)`, 
            opacity: 0.2, 
            width: Math.random() * 6 + 4, 
            height: Math.random() * 6 + 4,
          }}
          animate={{ 
            x: [Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)], 
            y: [Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800), Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)], 
            opacity: [0, 0.4, 0],
          }}
          transition={{ 
            duration: Math.random() * 20 + 15, 
            repeat: Infinity, 
            ease: "easeInOut",
          }}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
        />
      ))}
    </div>
  );
};

// --- Navigation Component ---
const BackButton = ({ className = "" }: { className?: string }) => (
  <Link 
    href="/" 
    className={`inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#222831]/60 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-lg text-[#EEEEEE]/90 hover:text-[#00ADB5] hover:border-[#00ADB5]/50 hover:bg-[#222831]/80 transition-all duration-300 text-sm sm:text-base group ${className}`}
  >
    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform duration-300" />
    <span className="font-medium">Kembali ke Beranda</span>
  </Link>
);

// --- Main Component ---
export default function VerifyPage() {
  const [publicId, setPublicId] = useState(""); // REVISI: State ini sekarang menyimpan publicId
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [metadata, setMetadata] = useState<CredentialMetadata | null>(null);
  const [issuanceLog, setIssuanceLog] = useState<IssuanceLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [copiedText, setCopiedText] = useState<string>("");

  const handleCopy = async (text: string, type: string) => {
    await copyToClipboard(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleVerification = async () => {
    if (!publicId.trim()) {
      setError("Harap masukkan ID Kredensial.");
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setMetadata(null);
    setIssuanceLog(null);
    setError(null);

    try {
      // --- REVISI UTAMA: ALUR VERIFIKASI BARU ---

      // 1. Ambil data log dari backend menggunakan publicId
      const logResponse = await fetch(`${backendApiUrl}/credentials/log/${publicId.trim()}`);
      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        throw new Error(errorData.message || "ID Kredensial tidak valid atau tidak ditemukan.");
      }
      
      const fetchedLog: IssuanceLog = await logResponse.json();
      setIssuanceLog(fetchedLog);
      
      const onChainTokenId = fetchedLog.onChainTokenId; // Ini adalah ID asli di blockchain

      // 2. Lanjutkan verifikasi ke blockchain menggunakan onChainTokenId
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      const [tokenURI, isRevoked, owner] = await Promise.all([
        contract.tokenURI(BigInt(onChainTokenId)),
        contract.isRevoked(BigInt(onChainTokenId)),
        contract.ownerOf(BigInt(onChainTokenId)),
      ]);
      
      setResult({ isRevoked, owner });

      // 3. Ambil metadata dari IPFS (logika ini tetap sama)
      const metadataUrl = formatIpfsUrl(tokenURI);
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) throw new Error("Tidak dapat mengambil metadata kredensial.");
      
      const fetchedMetadata: CredentialMetadata = await metadataResponse.json();
      setMetadata(fetchedMetadata);

      setShowForm(false);

    } catch (e: any) {
      console.error("Detail error:", e);
      setResult(null);
      setMetadata(null);
      setIssuanceLog(null);
      
      // Pesan error lebih umum karena bisa berasal dari backend atau blockchain
      setError(e.message || "Terjadi kesalahan yang tidak terduga saat verifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewVerification = () => {
    setShowForm(true);
    setResult(null);
    setMetadata(null);
    setIssuanceLog(null);
    setError(null);
    setPublicId("");
  };

  const renderVerificationForm = () => (
    <div className="w-full max-w-md mx-auto">
      <motion.div 
        key="verification-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="bg-[#222831]/90 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-3 sm:p-4 rounded-full mb-4">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            Verifikasi Kredensial
          </h1>
          <p className="text-[#EEEEEE]/70 text-xs sm:text-sm px-2">
            Masukkan ID Kredensial unik untuk memverifikasi keaslian dan statusnya.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="publicId" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">
              ID Kredensial
            </label>
            {/* REVISI: type diubah menjadi "text" untuk menerima UUID */}
            <input
              id="publicId"
              type="text" 
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              placeholder="Masukkan ID unik kredensial"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] outline-none transition-all text-sm sm:text-base"
              disabled={isLoading}
              onKeyUp={(e) => e.key === 'Enter' && !isLoading && publicId.trim() && handleVerification()}
            />
          </div>
          
          <button
            onClick={handleVerification}
            disabled={isLoading || !publicId.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#00ADB5] text-white font-semibold rounded-lg hover:bg-[#00ADB5]/90 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Verifikasi Dokumen</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-500/20 border border-red-500/50 text-red-300 p-3 sm:p-4 rounded-lg text-xs sm:text-sm"
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  const renderResultCard = () => {
    // REVISI: Pastikan issuanceLog ada sebelum render
    if (!result || !metadata || !issuanceLog) return null;

    const imageUrl = formatIpfsUrl(metadata.image);
    const textAttributes = metadata.attributes.filter(
      attr => !(typeof attr.value === 'string' && attr.value.startsWith('data:image/'))
    );

    return (
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          key="verification-result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="bg-[#222831]/90 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 z-10 overflow-hidden"
        >
          {/* Header Status */}
          <div className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl mb-6 text-sm sm:text-base lg:text-lg font-bold ${result.isRevoked ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-green-500/20 border border-green-500/30 text-green-300'}`}>
            {result.isRevoked ? <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
            <span className="text-center">Kredensial {result.isRevoked ? "TELAH DICABUT" : "VALID"}</span>
          </div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            {/* Image Section */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
              <div className="w-full">
                <img 
                  src={imageUrl} 
                  alt="Gambar Kredensial" 
                  className="w-full h-auto rounded-xl shadow-lg border-2 border-[#00ADB5]/30 object-cover"
                />
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6 min-w-0">
              {/* Title */}
              <div className="break-words">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 leading-tight">
                  {metadata.name}
                </h2>
                <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                  <p className="text-xs sm:text-sm font-mono text-[#00ADB5] break-all leading-relaxed">
                    {result.owner}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-[#EEEEEE]/70 text-xs sm:text-sm lg:text-base leading-relaxed break-words">
                  {metadata.description}
                </p>
              </div>
              
              {/* Attributes */}
              {textAttributes.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 pb-2 border-b-2 border-[#00ADB5]/30 text-white">
                    Informasi Kredensial
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {textAttributes.map((attr, index) => (
                      <div key={index} className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                        <p className="text-xs font-semibold text-[#EEEEEE]/60 mb-1">
                          {attr.trait_type}
                        </p>
                        <p className="text-xs sm:text-sm font-mono text-white break-words leading-relaxed">
                          {String(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Blockchain Details */}
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 pb-2 border-b-2 border-[#00ADB5]/30 text-white">
                  Detail Blockchain
                </h3>
                <div className="space-y-3">
                  {/* REVISI: Tampilkan onChainTokenId dari log */}
                  <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2 text-xs sm:text-sm flex-shrink-0">
                        <Hash size={14}/>ID Token (On-Chain)
                      </span>
                      <button
                        onClick={() => handleCopy(issuanceLog.onChainTokenId, 'tokenId')}
                        className="text-[#00ADB5] hover:text-[#00ADB5]/80 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="font-mono text-[#00ADB5] text-xs sm:text-sm break-all">
                      {issuanceLog.onChainTokenId}
                    </p>
                    {copiedText === 'tokenId' && (
                      <p className="text-xs text-green-400 mt-1">Tersalin!</p>
                    )}
                  </div>
                  
                  {/* Tanggal Terbit */}
                  {issuanceLog && (
                    <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays size={14}/>
                        <span className="font-semibold text-[#EEEEEE]/60 text-xs sm:text-sm">
                          Tanggal Terbit
                        </span>
                      </div>
                      <p className="font-mono text-white text-xs sm:text-sm">
                        {new Date(issuanceLog.issuedAt).toLocaleString('id-ID', { 
                          dateStyle: 'long', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                  )}
                  
                  {/* Hash Transaksi */}
                  {issuanceLog ? (
                    <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2 text-xs sm:text-sm flex-shrink-0">
                          <Info size={14}/>Hash Transaksi
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(issuanceLog.transactionHash, 'txHash')}
                            className="text-[#00ADB5] hover:text-[#00ADB5]/80 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                          <a 
                            href={`https://www.oklink.com/amoy/tx/${issuanceLog.transactionHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#00ADB5] hover:text-[#00ADB5]/80 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                      <p className="font-mono text-[#00ADB5] text-xs break-all leading-relaxed">
                        {issuanceLog.transactionHash}
                      </p>
                      {copiedText === 'txHash' && (
                        <p className="text-xs text-green-400 mt-1">Tersalin!</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={14}/>
                        <span className="font-semibold text-[#EEEEEE]/60 text-xs sm:text-sm">
                          Hash Transaksi
                        </span>
                      </div>
                      <p className="font-mono text-[#EEEEEE]/50 text-xs sm:text-sm">
                        Data tidak ditemukan
                      </p>
                    </div>
                  )}
                  
                  {/* Pemilik Saat Ini */}
                  <div className="bg-[#393E46]/40 p-3 rounded-lg border border-[#EEEEEE]/5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2 text-xs sm:text-sm flex-shrink-0">
                        <User size={14}/>Pemilik Saat Ini
                      </span>
                      <button
                        onClick={() => handleCopy(result.owner, 'owner')}
                        className="text-[#00ADB5] hover:text-[#00ADB5]/80 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="font-mono text-white text-xs break-all leading-relaxed">
                      {result.owner}
                    </p>
                    {copiedText === 'owner' && (
                      <p className="text-xs text-green-400 mt-1">Tersalin!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <button
              onClick={handleNewVerification}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00ADB5] text-white font-semibold rounded-lg hover:bg-[#00ADB5]/90 transition-all shadow-lg text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Verifikasi Dokumen Lain</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE] relative overflow-hidden">
      <FloatingParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
          <BackButton />
        </header>

        <div className="flex-grow flex items-center justify-center px-4 pb-8">
          {showForm ? renderVerificationForm() : renderResultCard()}
        </div>
      </div>
    </main>
  );
}
