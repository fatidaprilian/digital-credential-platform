'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function VerificationSuccessPage() {
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg text-center bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-8 sm:p-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
        >
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-4" style={{ color: theme.text }}>
          Email Berhasil Diverifikasi!
        </h1>
        
        <p className="text-lg mb-8" style={{ color: theme.text, opacity: 0.8 }}>
          Terima kasih telah melakukan verifikasi. Akun institusi Anda sekarang sedang dalam tahap peninjauan oleh administrator kami.
        </p>
        
        <p className="text-md" style={{ color: theme.text, opacity: 0.8 }}>
          Anda akan menerima notifikasi email selanjutnya setelah akun Anda disetujui.
        </p>

        <div className="mt-10">
          <Link href="/issuer/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl text-white transition-all duration-300" style={{ backgroundColor: theme.accent }}>
            Ke Halaman Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}