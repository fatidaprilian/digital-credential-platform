"use client";

import { Web3AuthButton } from "@/components/Web3AuthButton";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";

export default function HomePage() {
  const { address, isConnected, isLoading } = useWeb3Auth();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleViewCredentials = () => {
    router.push("/holder");
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-white">
            CredentialVault
          </div>
          <div className="flex items-center gap-4">
            {/* Hanya ada satu tombol sekarang */}
            <Web3AuthButton />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-6 leading-tight">
            Secure Digital
            <br />
            Credentials
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Store, verify, and showcase your achievements with blockchain-powered NFT credentials
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {isConnected ? (
              <div className="space-y-4">
                <div className="text-green-400 text-lg">
                  ✅ Connected as {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={handleViewCredentials}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  View My Credentials
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400">Connect your wallet to get started</p>
                <div className="animate-pulse">
                  <div className="w-48 h-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure Storage</h3>
              <p className="text-gray-400">Your credentials are stored securely on the blockchain, ensuring immutability and transparency</p>
            </div>
            
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy Verification</h3>
              <p className="text-gray-400">Instantly verify the authenticity of any credential with blockchain technology</p>
            </div>
            
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-white mb-2">Global Access</h3>
              <p className="text-gray-400">Access your credentials from anywhere in the world, anytime you need them</p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-4 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-gray-400 border-t border-white/10">
        <p>&copy; 2025 CredentialVault. Powered by Web3Auth & Blockchain.</p>
      </footer>
    </div>
  );
}