// app/components/HeroSection.tsx
"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Komponen untuk bentuk-bentuk blur yang melayang di background
const FloatingShape = ({ className, animate, transition }: any) => (
  <motion.div
    className={`absolute blur-3xl opacity-50 w-[400px] h-[300px] rounded-full ${className}`}
    animate={animate}
    transition={transition}
  />
);

const CTAMotionButton = ({ text, color, onClick }: { text: string, color: string, onClick: () => void }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2, boxShadow: `0 10px 20px -5px rgba(153, 167, 153, 0.4)` }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={`relative inline-flex items-center justify-center px-8 py-3 font-bold rounded-xl text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${color}`}
      onClick={onClick}
    >
      {text}
    </motion.button>
  );
}

export default function HeroSection({ isWalletConnected }: { isWalletConnected: boolean }) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-base-100 pt-20">
      {/* Efek visual background */}
      <FloatingShape
        className="bg-mint/50 -top-20 -left-40"
        animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      />
      <FloatingShape
        className="bg-peach/40 -bottom-20 -right-40"
        animate={{ y: [0, -30, 0], x: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 2 }}
      />
      <FloatingShape
        className="bg-cream/30 bottom-1/4 left-1/3"
        animate={{ scale: [1, 1.2, 1]}}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
      />

      <div className="relative z-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sage via-peach to-mint bg-[size:200%_auto] animate-gradient-anim"
          style={{ lineHeight: "1.1" }}
        >
          CredentialVault
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mt-6 text-center text-lg md:text-xl font-medium text-sage/90"
        >
          Simpan, verifikasi, dan tampilkan prestasi digital berbasis blockchain & NFT.
          <br />
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-peach to-sage">
            Masa depan kredensial yang aman dan terdesentralisasi.
          </span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center"
        >
          {isWalletConnected && (
            <CTAMotionButton
              text="View My Credentials"
              color="from-mint to-sage"
              onClick={() => router.push("/holder")}
            />
          )}
          <CTAMotionButton
            text="Verifikasi Credential"
            color="from-sage to-peach"
            onClick={() => router.push("/verify")}
          />
          <CTAMotionButton
            text="Daftar sebagai Issuer"
            color="from-peach to-cream"
            onClick={() => router.push("/issuer/register")}
          />
        </motion.div>
      </div>
    </section>
  );
}