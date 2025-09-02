// app/components/Footer.tsx
"use client";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="py-8 flex justify-center items-center bg-gradient-to-t from-mint/20 to-transparent">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-sage/80 text-sm"
      >
        © {new Date().getFullYear()} CredentialVault. Dibuat dengan inovasi untuk masa depan yang terdesentralisasi.
      </motion.p>
    </footer>
  );
}