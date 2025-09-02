// app/components/HowToUse.tsx
"use client";
import { motion } from "framer-motion";

const steps = [
  { title: "Hubungkan Wallet", desc: "Mulai dengan menghubungkan wallet Web3 Anda seperti MetaMask atau menggunakan login sosial." },
  { title: "Terima Kredensial", desc: "Issuer (institusi) akan mengirimkan kredensial dalam bentuk NFT langsung ke alamat wallet Anda." },
  { title: "Kelola di Dashboard", desc: "Lihat, kelola, dan bagikan semua kredensial digital Anda dari satu dashboard yang aman." },
  { title: "Verifikasi Keaslian", desc: "Siapapun dapat memverifikasi keaslian kredensial Anda secara instan melalui platform kami." },
];

export default function HowToUse() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-mint/10 to-base-100">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sage via-peach to-sage text-transparent bg-clip-text mb-4">
            Cara Kerjanya
          </h2>
          <p className="mt-3 text-lg text-sage/80">Empat langkah mudah untuk mengamankan masa depan prestasi Anda.</p>
        </motion.div>
        
        <motion.div 
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-5 h-[calc(100%-2rem)] w-0.5 bg-gradient-to-b from-mint via-peach to-cream/50 -translate-x-1/2"></div>

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className="relative flex items-center mb-12"
              variants={itemVariants}
            >
              <div className="absolute left-6 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
                <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border-2 border-mint">
                  <span className="font-bold text-xl text-sage">{idx + 1}</span>
                </div>
              </div>
              <div className={`w-full p-6 rounded-xl bg-white/60 backdrop-blur-md shadow-md border border-gray-200/50
                ${idx % 2 === 0 ? 'md:ml-[55%]' : 'md:mr-[55%] md:text-right'}`}>
                  <h3 className="font-bold text-xl text-gray-700">{step.title}</h3>
                  <p className="mt-2 text-sage/90">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}