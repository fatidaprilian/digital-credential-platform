// app/components/FAQAccordion.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  { q: "Apa itu CredentialVault?", a: "CredentialVault adalah sebuah platform terdesentralisasi untuk menerbitkan, menyimpan, dan memverifikasi kredensial digital (seperti ijazah, sertifikat) menggunakan teknologi blockchain dan NFT, memastikan keaslian dan kepemilikan penuh bagi pengguna." },
  { q: "Bagaimana cara verifikasi kredensial dilakukan?", a: "Setiap kredensial adalah NFT unik di blockchain. Verifikasi dilakukan dengan memeriksa data transaksi NFT tersebut langsung di blockchain melalui platform kami, membuktikan keasliannya tanpa bisa dipalsukan." },
  { q: "Apakah data saya aman di CredentialVault?", a: "Sangat aman. Kredensial Anda disimpan sebagai NFT di wallet Anda, bukan di server kami. Anda memiliki kontrol penuh. Platform kami hanya bertindak sebagai jembatan untuk melihat dan memverifikasi data yang ada di blockchain." },
  { q: "Siapa yang bisa menjadi Issuer (penerbit)?", a: "Institusi pendidikan, perusahaan, atau organisasi terverifikasi dapat mendaftar sebagai Issuer untuk menerbitkan kredensial digital resmi kepada para anggotanya." },
];

export default function FAQAccordion() {
  const [active, setActive] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActive(active === index ? null : index);
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-base-100 to-peach/10">
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          className="text-4xl font-bold mb-10 text-center text-sage"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Pertanyaan Umum
        </motion.h2>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <motion.div 
              key={idx} 
              className="bg-white/70 rounded-xl shadow-sm border border-mint/40 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.5, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <button
                className="w-full text-left py-4 px-6 font-semibold text-gray-700 focus:outline-none flex justify-between items-center cursor-pointer"
                aria-expanded={active === idx}
                onClick={() => toggleAccordion(idx)}
              >
                <span>{item.q}</span>
                <motion.div
                  animate={{ rotate: active === idx ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl text-peach"
                >
                  +
                </motion.div>
              </button>
              <AnimatePresence>
                {active === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="text-sage/90 pb-5 px-6 leading-relaxed">{item.a}</p>
                  </motion.div> 
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}