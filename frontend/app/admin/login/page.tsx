'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AtSign, Lock, LogIn, ShieldAlert, CheckCircle2, UserCog } from 'lucide-react';

// --- Komponen yang Digunakan Kembali (dari halaman lain) ---

const FloatingParticles = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
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

const Alert = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
  const styles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      bgColor: 'bg-green-500/10 border-green-500/30',
      textColor: 'text-green-300',
    },
    error: {
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      bgColor: 'bg-red-500/10 border-red-500/30',
      textColor: 'text-red-400',
    },
  };
  const currentStyle = styles[type];

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${currentStyle.bgColor} ${currentStyle.textColor}`}
    >
      <div className="flex-shrink-0 mt-0.5">{currentStyle.icon}</div>
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  );
};

const InputField = ({ icon: Icon, label, error, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[#EEEEEE]/80">{label}</label>}
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ADB5]/70" />
        <input
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-12 pr-4 py-3.5 bg-[#393E46]/50 border-2 rounded-xl text-[#EEEEEE] placeholder:text-[#EEEEEE]/50 transition-all duration-300 focus:outline-none focus:ring-0 ${
            isFocused 
              ? 'border-[#00ADB5] bg-[#393E46]/70 shadow-lg shadow-[#00ADB5]/10' 
              : 'border-[#EEEEEE]/10 hover:border-[#EEEEEE]/20'
          }`}
        />
      </div>
    </div>
  );
};

// --- Komponen Utama Halaman Login Admin ---

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ isLoading: false, error: '' });
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ isLoading: true, error: '' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login gagal. Periksa kembali email dan password.');
      }

      // Simpan token ke localStorage
      localStorage.setItem('admin_token', result.access_token);

      // Arahkan ke dashboard admin
      router.push('/admin/dashboard');

    } catch (error: any) {
      setStatus({ isLoading: false, error: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-hidden flex items-center justify-center p-4">
      <FloatingParticles />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-6"
            >
              <UserCog className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Admin Panel Login
            </h1>
            <p className="text-[#00ADB5] text-sm sm:text-base">
              Masuk untuk mengelola platform VeritasID.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              icon={AtSign}
              name="email"
              type="email"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              label="Email"
            />
            <InputField
              icon={Lock}
              name="password"
              type="password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              label="Password"
            />

            {status.error && <Alert message={status.error} type="error" />}

            <motion.button
              type="submit"
              disabled={status.isLoading}
              whileHover={{ scale: status.isLoading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-[#00ADB5] to-[#009da3] text-white font-bold text-lg rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00ADB5]/25"
            >
              {status.isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                  />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Masuk
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
