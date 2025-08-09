'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building, 
  AtSign, 
  Lock, 
  Phone, 
  MapPin, 
  FileUp, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  UserPlus,
  Eye,
  EyeOff,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle
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
      {[...Array(20)].map((_, i) => (
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

// Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi", 
  message = "Apakah Anda yakin?" 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#222831] border border-[#EEEEEE]/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-[#EEEEEE]/70 mt-1">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#393E46] text-[#EEEEEE] rounded-lg hover:bg-[#393E46]/80 transition-colors font-medium"
          >
            Lanjut Isi Form
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Ya, Kembali
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Smart Back Button Component
const SmartBackButton = ({ 
  hasUnsavedData, 
  onBack 
}: { 
  hasUnsavedData: boolean; 
  onBack: () => void; 
}) => {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    if (hasUnsavedData) {
      setShowModal(true);
    } else {
      router.push('/');
    }
  };

  const handleConfirmBack = () => {
    setShowModal(false);
    router.push('/');
  };

  return (
    <>
      <motion.button
        onClick={handleBack}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 px-3 py-2 bg-[#222831]/40 backdrop-blur-sm border border-[#EEEEEE]/10 rounded-lg text-[#EEEEEE]/60 hover:text-[#EEEEEE]/90 hover:border-[#EEEEEE]/20 hover:bg-[#222831]/60 transition-all duration-300 text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
        <span>Kembali</span>
      </motion.button>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmBack}
        title="Data Akan Hilang"
        message="Data yang sudah Anda isi akan hilang jika kembali ke halaman utama. Yakin ingin melanjutkan?"
      />
    </>
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

// Enhanced TextArea Component
const TextAreaField = ({ 
  icon: Icon, 
  label, 
  error, 
  ...props 
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#EEEEEE]/80">
          {label}
        </label>
      )}
      <div className="relative">
        <Icon className="absolute left-4 top-4 w-5 h-5 text-[#00ADB5]/70 transition-colors duration-300" />
        <textarea
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full pl-12 pr-4 py-3.5 bg-[#393E46]/50 border-2 rounded-xl text-[#EEEEEE] placeholder:text-[#EEEEEE]/50 transition-all duration-300 focus:outline-none focus:ring-0 resize-none ${
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

// FIXED: Enhanced File Upload Component
const FileUpload = ({ 
  file, 
  onFileChange, 
  onFileRemove, 
  error, 
  inputRef 
}: any) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileChange({ target: { files } });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // FIX: Separate click handlers to prevent double trigger
  const handleContainerClick = () => {
    if (!file && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#EEEEEE]/80">
        Dokumen Verifikasi Legalitas
      </label>
      
      <div
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300 ${
          !file ? 'cursor-pointer group' : ''
        } ${
          isDragOver 
            ? 'border-[#00ADB5] bg-[#00ADB5]/5' 
            : file 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-[#EEEEEE]/20 hover:border-[#00ADB5]/50 hover:bg-[#393E46]/20'
        } ${error ? 'border-red-500/50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleContainerClick}
      >
        {file ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <span className="text-sm font-medium text-green-400">File Terpilih</span>
            </div>
            <p className="text-xs text-[#EEEEEE]/70 max-w-xs truncate px-2">{file.name}</p>
            <p className="text-xs text-[#EEEEEE]/50">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <div className="flex gap-2 items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <X className="w-3 h-3" />
                Hapus
              </button>
              <button
                type="button"
                onClick={handleFileButtonClick}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-[#00ADB5]/20 text-[#00ADB5] rounded-lg hover:bg-[#00ADB5]/30 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Ganti
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Upload className="w-8 h-8 text-[#00ADB5]/70 mx-auto group-hover:text-[#00ADB5] transition-colors" />
            <div>
              <p className="text-sm font-medium text-[#EEEEEE]/80">
                Klik atau seret file ke sini
              </p>
              <p className="text-xs text-[#EEEEEE]/50 mt-1">
                PNG, JPG, atau PDF (Maks. 5MB)
              </p>
            </div>
          </div>
        )}
        
        {/* FIX: Hidden input - no onClick to prevent double trigger */}
        <input
          ref={inputRef}
          type="file"
          onChange={onFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Progress Indicator Component
const FormProgress = ({ hasData }: { hasData: boolean }) => {
  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
    >
      <div className="flex items-center gap-2 text-blue-300">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">Sedang mengisi form...</span>
      </div>
    </motion.div>
  );
};

// Main Component
export default function RegisterIssuerPage() {
  const [formData, setFormData] = useState({
    name: '',
    officialEmail: '',
    password: '',
    phoneNumber: '',
    address: '',
  });
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  const [status, setStatus] = useState({ isLoading: false, error: '', success: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Check if user has unsaved data
  const hasUnsavedData = Object.values(formData).some(value => value.trim() !== '') || 
                        verificationDocument !== null;

  // Browser back/refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = 'Data yang sudah diisi akan hilang. Yakin ingin meninggalkan halaman?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, file: 'Ukuran file tidak boleh lebih dari 5MB' }));
        return;
      }
      setVerificationDocument(file);
      setFieldErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleFileRemove = () => {
    setVerificationDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Nama institusi wajib diisi';
    if (!formData.officialEmail.trim()) errors.officialEmail = 'Email resmi wajib diisi';
    if (!formData.password || formData.password.length < 8) errors.password = 'Password minimal 8 karakter';
    if (!verificationDocument) errors.file = 'Dokumen verifikasi wajib diunggah';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setStatus({ isLoading: false, error: 'Mohon perbaiki kesalahan pada formulir', success: '' });
      return;
    }

    setStatus({ isLoading: true, error: '', success: '' });

    const data = new FormData();
    data.append('name', formData.name);
    data.append('officialEmail', formData.officialEmail);
    data.append('password', formData.password);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('address', formData.address);
    data.append('verificationDocument', verificationDocument!);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/auth/register/institution`, {
        method: 'POST',
        body: data,
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Terjadi kesalahan saat mendaftar.');
      }
      
      setStatus({ 
        isLoading: false, 
        error: '', 
        success: "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi." 
      });
      
      // Reset form
      setFormData({ name: '', officialEmail: '', password: '', phoneNumber: '', address: '' });
      setVerificationDocument(null);
      setFieldErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      setStatus({ isLoading: false, error: error.message, success: '' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-hidden">
      <FloatingParticles />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Smart Back Button */}
        <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
          <SmartBackButton 
            hasUnsavedData={hasUnsavedData}
            onBack={() => router.push('/')}
          />
        </header>

        {/* Main Content */}
        <div className="flex-grow flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10"
            >
              {/* Progress Indicator */}
              <FormProgress hasData={hasUnsavedData} />

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-6"
                >
                  <Building className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                  Daftar Sebagai Institusi
                </h1>
                <p className="text-[#00ADB5] text-sm sm:text-base">
                  Isi formulir untuk memulai proses verifikasi institusi Anda
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grid Layout for Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InputField
                    icon={Building}
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nama Institusi"
                    label="Nama Institusi"
                    error={fieldErrors.name}
                  />
                  
                  <InputField
                    icon={AtSign}
                    name="officialEmail"
                    type="email"
                    required
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    placeholder="email@institusi.ac.id"
                    label="Email Resmi"
                    error={fieldErrors.officialEmail}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative">
                    <InputField
                      icon={Lock}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimal 8 karakter"
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
                  
                  <InputField
                    icon={Phone}
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+62 xxx xxxx xxxx"
                    label="Nomor Telepon (Opsional)"
                  />
                </div>

                <TextAreaField
                  icon={MapPin}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Alamat lengkap institusi (opsional)"
                  label="Alamat (Opsional)"
                  rows={3}
                />

                {/* File Upload */}
                <FileUpload
                  file={verificationDocument}
                  onFileChange={handleFileChange}
                  onFileRemove={handleFileRemove}
                  error={fieldErrors.file}
                  inputRef={fileInputRef}
                />

                {/* Status Messages */}
                <Alert message={status.error} type="error" />
                <Alert message={status.success} type="success" />

                {/* Submit Button - DOMINANT */}
                <motion.button
                  type="submit"
                  disabled={status.isLoading}
                  whileHover={{ scale: status.isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white font-bold text-lg rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#00ADB5]/25 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  {status.isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      />
                      Mendaftarkan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Daftar Sekarang
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Footer Links - SECONDARY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-6 space-y-3"
            >
              <Link
                href="/issuer/login"
                className="text-base text-[#EEEEEE]/90 hover:text-[#00ADB5] transition-colors inline-flex items-center gap-1 hover:underline font-medium"
              >
                Sudah punya akun? <span className="text-[#00ADB5]">Masuk di sini</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}