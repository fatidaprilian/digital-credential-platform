// app/components/Header.tsx
"use client";
import { motion } from "framer-motion";
import { Web3AuthButton } from "./Web3AuthButton";

export default function Header() {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-base-100/60 backdrop-blur-lg border-b border-cream/50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="flex justify-between items-center max-w-7xl mx-auto p-4">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage to-peach">
          CredentialVault
        </div>
        <Web3AuthButton />
      </nav>
    </motion.header>
  );
}