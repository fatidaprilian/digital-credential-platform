// app/components/FeatureCards.tsx
"use client";
import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg className="w-10 h-10 text-sage group-hover:text-mint transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: "Penyimpanan Aman",
    desc: "Kredensial Anda diamankan di blockchain, terdesentralisasi, dan tidak dapat diubah selamanya.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-sage group-hover:text-peach transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
      </svg>
    ),
    title: "Verifikasi Instan",
    desc: "Validasi keaslian kredensial secara on-chain dalam hitungan detik, tanpa perantara.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-sage group-hover:text-cream transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c1.355 0 2.707-.158 4.008-.462M12 21c-1.355 0-2.707-.158-4.008-.462m12.016-11.234a9.005 9.005 0 01-16.032 0m16.032 0c.234.61.378 1.254.378 1.926 0 3.314-2.433 6.216-5.5 7.152m10.5-7.152c-.234-.61-.378-1.254-.378-1.926 0-3.314 2.433-6.216 5.5-7.152m-16.032 0a9.005 9.005 0 0016.032 0" />
      </svg>
    ),
    title: "Akses Global",
    desc: "Bagikan dan tampilkan pencapaian Anda secara global dengan standar NFT yang diakui.",
  },
];

export default function FeatureCards() {
  return (
    <section className="px-4 py-24 bg-gradient-to-b from-base-100 to-mint/10">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sage via-peach to-sage text-transparent bg-clip-text mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          Dibangun untuk Masa Depan
        </motion.h2>
        <motion.p 
          className="text-lg text-sage/80"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          CredentialVault menawarkan solusi kredensial digital yang aman, transparan, dan dimiliki sepenuhnya oleh Anda.
        </motion.p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="group p-8 rounded-2xl bg-white/50 backdrop-blur-sm shadow-lg border border-mint/30 flex flex-col items-start hover:shadow-xl hover:border-sage/40 transition-all duration-300"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            viewport={{ once: true }}
          >
            <div className="p-3 bg-white rounded-lg shadow-md mb-6">{f.icon}</div>
            <h3 className="font-bold text-2xl text-gray-700">{f.title}</h3>
            <p className="mt-2 text-base text-sage/90 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}