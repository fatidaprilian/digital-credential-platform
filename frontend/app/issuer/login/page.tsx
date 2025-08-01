"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AtSign, Lock, LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal untuk masuk. Periksa kembali email dan password.');
      }

      // Simpan token ke localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // Arahkan ke dasbor setelah berhasil login
      router.push('/issuer/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Menggunakan warna dari palet yang diberikan
  const theme = {
    background: "#222831",
    card: "#393E46",
    accent: "#00ADB5",
    text: "#EEEEEE"
  };

  return (
    <main 
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${theme.background}, ${theme.card})` }}
    >
      <div className="w-full max-w-md">
        <div 
          className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: theme.text }}>
              Issuer Login
            </h1>
            <p style={{ color: theme.accent }}>
              Akses dasbor untuk menerbitkan kredensial
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Email */}
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all duration-300"
                style={{ backgroundColor: theme.card, color: theme.text }}
              />
            </div>

            {/* Input Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all duration-300"
                style={{ backgroundColor: theme.card, color: theme.text }}
              />
            </div>
            
            {error && (
              <p className="text-sm text-center text-red-400 bg-red-500/10 p-3 rounded-lg">
                {error}
              </p>
            )}

            {/* Tombol Submit */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3 px-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.accent, color: theme.background }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
            <button 
              onClick={() => router.push('/')}
              className="text-sm flex items-center justify-center w-full hover:underline"
              style={{ color: theme.text }}
            >
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Kembali ke Halaman Utama
            </button>
        </div>
      </div>
    </main>
  );
}