"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import VerifiableCredential from "../abi/VerifiableCredential.json";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldAlert, Search, Loader2 } from "lucide-react";

// Mengambil ABI dari file JSON yang diimpor
const abi = VerifiableCredential.abi;
// Mengambil alamat kontrak dari environment variables
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
// Mengambil URL RPC dari environment variables
const rpcUrl = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL;

// Tipe untuk hasil verifikasi
type VerificationResult = {
  tokenURI: string;
  isRevoked: boolean;
};

// Komponen FloatingParticles untuk konsistensi tema
const FloatingParticles = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setIsMounted(true);
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isMounted || windowSize.width === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full opacity-20"
                    style={{ background: `linear-gradient(45deg, #00ADB5, #393E46)`, width: Math.random() * 6 + 4, height: Math.random() * 6 + 4, }}
                    animate={{
                        x: [Math.random() * windowSize.width, Math.random() * windowSize.width],
                        y: [Math.random() * windowSize.height, Math.random() * windowSize.height],
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: Math.random() * 20 + 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    initial={{
                        x: Math.random() * windowSize.width,
                        y: Math.random() * windowSize.height,
                    }}
                />
            ))}
        </div>
    );
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
    if (!rpcUrl) {
      setError("RPC URL is not configured. Please check your environment variables.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const [tokenURI, isRevoked] = await Promise.all([
        contract.tokenURI(BigInt(tokenId)),
        contract.isRevoked(BigInt(tokenId)),
      ]);
      setResult({
        tokenURI: tokenURI as string,
        isRevoked: isRevoked as boolean,
      });
    } catch (e: any) {
      console.error("Error details:", e);
      if (e.code === 'CALL_EXCEPTION') {
        setError("Verification failed. The token may not exist or the contract address is incorrect.");
      } else {
        setError(e.shortMessage || "An unexpected error occurred during verification.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingParticles />
        
        {/* Tombol Kembali ke Home */}
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="flex items-center gap-2 text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
            </Link>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-6 sm:p-8 z-10"
        >
            <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Verifikasi Kredensial
                </h1>
                <p className="text-[#EEEEEE]/70 mt-2">
                    Masukkan Token ID untuk memverifikasi keaslian dan status kredensial.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Masukkan Token ID (e.g., 1)"
                    min="1"
                    className="w-full px-4 py-3 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] outline-none transition-all"
                    disabled={isLoading}
                    onKeyUp={(e) => e.key === 'Enter' && handleVerification()}
                />
                <button
                    onClick={handleVerification}
                    disabled={isLoading || !tokenId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00ADB5] text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Memverifikasi...</span>
                        </>
                    ) : (
                        "Verifikasi"
                    )}
                </button>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center"
                >
                    {error}
                </motion.div>
            )}

            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-[#EEEEEE]/5 border border-[#EEEEEE]/20 p-4 sm:p-6 rounded-lg space-y-4"
                >
                    <h3 className="text-lg font-bold text-center">
                        Hasil Verifikasi (Token ID: <span className="text-[#00ADB5]">{tokenId}</span>)
                    </h3>
                    <div className={`flex items-center justify-center gap-2 p-3 rounded-md ${result.isRevoked ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {result.isRevoked ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                        <span className="font-bold text-lg">{result.isRevoked ? "DIBATALKAN" : "VALID"}</span>
                    </div>
                    <div className="text-left space-y-2">
                        <p className="font-semibold text-[#EEEEEE]/70">Metadata URI:</p>
                        <a 
                            href={result.tokenURI} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block w-full text-[#00ADB5] hover:underline break-words"
                        >
                            {result.tokenURI}
                        </a>
                    </div>
                </motion.div>
            )}
        </motion.div>
    </main>
  );
}
