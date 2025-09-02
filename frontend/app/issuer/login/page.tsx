'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AtSign, 
  Lock, 
  LogIn, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  UserCheck
} from 'lucide-react';

// Floating Particles Component
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

// Smart Back Button Component (reused from register)
const SmartBackButton = () => {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push('/')}
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 px-3 py-2 bg-[#222831]/40 backdrop-blur-sm border border-[#EEEEEE]/10 rounded-lg text-[#EEEEEE]/60 hover:text-[#EEEEEE]/90 hover:border-[#EEEEEE]/20 hover:bg-[#222831]/60 transition-all duration-300 text-sm group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
      <span>Kembali</span>
    </motion.button>
  );
};

// Enhanced Alert Component
const Alert = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
  const styles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      bgColor: 'bg-green-500/10 border-green-500/30',
      textColor: 'text-green-300',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
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
      <div className="flex-shrink-0 mt-0.5">
        {currentStyle.icon}
      </div>
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  );
};

// Enhanced Input Component
const InputField = ({ 
  icon: Icon, 
  label, 
  error, 
  className = "", 
  ...props 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#EEEEEE]/80">
          {label}
        </label>
      )}
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ADB5]/70 transition-colors duration-300" />
        <input
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-12 pr-4 py-3.5 bg-[#393E46]/50 border-2 rounded-xl text-[#EEEEEE] placeholder:text-[#EEEEEE]/50 transition-all duration-300 focus:outline-none focus:ring-0 ${
            isFocused 
              ? 'border-[#00ADB5] bg-[#393E46]/70 shadow-lg shadow-[#00ADB5]/10' 
              : 'border-[#EEEEEE]/10 hover:border-[#EEEEEE]/20'
          } ${error ? 'border-red-500/50' : ''}`}
        />
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error when user types
    if (error) setError(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    if (!formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Mohon perbaiki kesalahan pada formulir');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Gagal untuk masuk. Periksa kembali email dan password.');
      }

      // Success feedback
      setSuccess('Login berhasil! Mengalihkan ke dashboard...');
      
      // Save token to localStorage
      localStorage.setItem('access_token', data.access_token);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/issuer/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-hidden">
      <FloatingParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Back Button */}
        <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
          <SmartBackButton />
        </header>

        {/* Main Content */}
        <div className="flex-grow flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-6"
                >
                  <UserCheck className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                  Masuk Sebagai Institusi
                </h1>
                <p className="text-[#00ADB5] text-sm sm:text-base">
                  Akses dashboard untuk menerbitkan kredensial digital
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <InputField
                  icon={AtSign}
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@institusi.ac.id"
                  label="Email"
                  error={fieldErrors.email}
                />

                {/* Password Input */}
                <div className="relative">
                  <InputField
                    icon={Lock}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Masukkan password"
                    label="Password"
                    error={fieldErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[52px] -translate-y-1/2 text-[#EEEEEE]/50 hover:text-[#00ADB5] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Status Messages */}
                {error && <Alert message={error} type="error" />}
                {success && <Alert message={success} type="success" />}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white font-bold text-lg rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00ADB5]/25 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isLoading ? (
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

                {/* Additional Actions */}
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#EEEEEE]/60 hover:text-[#00ADB5] transition-colors"
                    onClick={() => {
                      // TODO: Implement forgot password
                      alert('Fitur lupa password akan segera tersedia');
                    }}
                  >
                    Lupa password?
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-6 space-y-3"
            >
              <Link
                href="/issuer/register"
                className="text-base text-[#EEEEEE]/90 hover:text-[#00ADB5] transition-colors inline-flex items-center gap-1 hover:underline font-medium"
              >
                Belum punya akun? <span className="text-[#00ADB5]">Daftar di sini</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}