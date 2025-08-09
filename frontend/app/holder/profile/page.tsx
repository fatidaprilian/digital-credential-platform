'use client';

import { useState, useEffect } from "react";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { motion, AnimatePresence } from 'framer-motion';
import { User, Wallet, Save, Loader2, Shield, Image as ImageIcon, ExternalLink, CheckCircle, Globe } from 'lucide-react';
import { Navbar } from "@/components/Navbar"; // Asumsi Navbar ada di components
import Image from "next/image";

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
            x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
            y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
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
// LOADING & PROMPT COMPONENTS
// ============================================================================
const LoadingScreen = ({ text = "Memuat Halaman..." }: { text?: string }) => (
    <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center">
        <FloatingParticles />
        <div className="text-center text-white relative z-10">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-2 border-[#00ADB5] border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-[#EEEEEE]/70">{text}</p>
        </div>
    </div>
);

const ConnectWalletPrompt = () => {
    return (
        <div className="max-w-4xl mx-auto text-center py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="inline-block p-6 rounded-full mb-8">
                <Image src="/veritasidtrans.svg" alt="Logo VeritasID" width={48} height={48} className="w-12 h-12" />
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">Hubungkan Wallet Anda</h2>
            <p className="text-[#EEEEEE]/70 mb-8 max-w-2xl mx-auto text-lg">
                Untuk melihat dan mengelola profil Anda, silakan hubungkan wallet terlebih dahulu.
            </p>
        </div>
    );
};


// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function HolderProfilePage() {
  const { isConnected, address, isLoading: isAuthLoading } = useWeb3Auth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Ganti dengan endpoint API backend Anda nanti
  const API_URL = `/api/holder/profile/${address}`; 

  useEffect(() => {
    setIsMounted(true);
    if (isConnected && address) {
      // TODO: Ganti dengan logika fetch data dari API backend Anda
      // fetch(API_URL).then(res => res.json()).then(data => { ... })
      
      // Untuk sekarang, kita lewati fetch
      setIsLoading(false);
    } else if (!isAuthLoading) {
        setIsLoading(false);
    }
  }, [isConnected, address, isAuthLoading]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // TODO: Ganti dengan logika POST/PUT ke API backend Anda
    console.log("Saving profile:", { name, bio });
    
    // Simulasikan save
    setTimeout(() => {
        setMessage("Profil berhasil disimpan!");
        setIsLoading(false);
    }, 1000);
  };

  if (!isMounted || isAuthLoading || isLoading) {
    return <LoadingScreen text={isAuthLoading ? "Mengautentikasi..." : "Memuat profil..."} />;
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-[#222831]/90 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
                            <div className="text-center mb-8">
                                <div className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-4">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">Profil Anda</h1>
                                <p className="text-[#EEEEEE]/70 text-sm">Perbarui informasi publik yang terkait dengan wallet Anda.</p>
                            </div>

                            <div className="bg-[#393E46]/40 p-4 rounded-lg border border-[#EEEEEE]/10 mb-6">
                                <p className="text-xs font-semibold text-[#EEEEEE]/60 mb-1 flex items-center gap-2">
                                    <Wallet size={14} /> Alamat Wallet
                                </p>
                                <p className="font-mono text-[#00ADB5] text-sm break-all">{address}</p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">Nama</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] outline-none transition-all"
                                        placeholder="Nama Lengkap Anda"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bio" className="block text-sm font-medium text-[#EEEEEE]/80 mb-2">Bio</label>
                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] outline-none transition-all"
                                        rows={4}
                                        placeholder="Ceritakan sedikit tentang diri Anda..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00ADB5] text-white font-semibold rounded-lg hover:bg-[#00ADB5]/90 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Simpan Profil</span>
                                        </>
                                    )}
                                </button>
                                {message && <p className="mt-4 text-sm text-center text-green-400">{message}</p>}
                            </form>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    </div>
  );
}
