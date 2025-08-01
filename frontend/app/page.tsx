"use client";

// Imports
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
    ChevronDown, Shield, Zap, Globe, Check, FileCheck, Users, Lock, Sparkles,
    ArrowRight, Building, Award, UserCheck, Eye, Settings
} from "lucide-react";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { Navbar } from "@/components/Navbar";

// =================================================================
// PAGE-SPECIFIC COMPONENTS (Disatukan dalam satu file)
// =================================================================

const FloatingParticles = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setIsMounted(true);
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isMounted || windowSize.width === 0) {
        return null;
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full opacity-20"
                    style={{ background: `linear-gradient(45deg, #00ADB5, #393E46)`, width: Math.random() * 6 + 4, height: Math.random() * 6 + 4, }}
                    animate={{
                        x: [windowSize.width * Math.random(), windowSize.width * Math.random()],
                        y: [windowSize.height * Math.random(), windowSize.height * Math.random()],
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: Math.random() * 20 + 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    initial={{
                        x: Math.random() * windowSize.width,
                        y: Math.random() * windowSize.height,
                    }}
                />
            ))}
        </div>
    );
};

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, threshold: 0.1 });
    return ( <motion.section ref={ref} initial={{ opacity: 0, y: 50 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: "easeOut" }} className={`py-16 px-4 md:py-20 md:px-6 ${className}`}>{children}</motion.section> );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs = [
        { question: "Apa itu CredentialVault?", answer: "CredentialVault adalah platform revolusioner yang menggunakan teknologi blockchain untuk menyimpan dan memverifikasi kredensial digital secara aman, transparan, dan anti-pemalsuan." },
        { question: "Bagaimana cara kerja verifikasi blockchain?", answer: "Setiap kredensial disimpan sebagai Soulbound Token (SBT) di blockchain Polygon. Data tersimpan di IPFS dan dapat diverifikasi secara real-time tanpa perlu menghubungi institusi penerbit." },
        { question: "Apakah kredensial saya aman?", answer: "Ya, sangat aman. Kredensial Anda tersimpan di blockchain yang immutable dan menggunakan enkripsi tingkat enterprise. Hanya Anda yang memiliki kontrol penuh atas data tersebut." },
        { question: "Berapa biaya menggunakan CredentialVault?", answer: "Untuk pemegang kredensial (holder) gratis sepenuhnya. Institusi penerbit dikenakan biaya Rp50 per dokumen atau berlangganan Rp250rb/bulan unlimited." },
        { question: "Apakah bisa digunakan di luar negeri?", answer: "Tentu saja! Karena berbasis blockchain, kredensial Anda dapat diverifikasi di mana saja di dunia tanpa batas geografis atau waktu." }
    ];
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
                <motion.div key={index} className="bg-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/10 rounded-xl overflow-hidden" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: index * 0.1, duration: 0.5 }}>
                    <button className="w-full p-5 sm:p-6 text-left flex justify-between items-center hover:bg-[#EEEEEE]/10 transition-colors" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                        <span className="font-semibold text-[#EEEEEE] text-base sm:text-lg">{faq.question}</span>
                        <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronDown className="w-5 h-5 text-[#00ADB5]" /></motion.div>
                    </button>
                    <AnimatePresence>
                        {openIndex === index && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                <div className="p-5 sm:p-6 pt-0 text-[#EEEEEE]/70 leading-relaxed">{faq.answer}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

const StepCard = ({ title, description, icon: Icon }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8 hover:border-[#00ADB5]/50 transition-all duration-300"
        >
            <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-xl w-fit mb-6"><Icon className="w-8 h-8 text-white" /></div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#EEEEEE] mb-4">{title}</h3>
            <p className="text-[#EEEEEE]/70 leading-relaxed">{description}</p>
        </motion.div>
    );
};


// =================================================================
// MAIN PAGE COMPONENT
// =================================================================
export default function HomePage() {
    const router = useRouter();
    const { connect, isConnected, isLoading } = useWeb3Auth();
    const { scrollY } = useScroll();

    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);

    const handleNavigation = (path: string) => router.push(path);

    const ActionButtons = () => {
        if (isLoading) {
            return (
                <div className="h-[52px] flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EEEEEE]"></div>
                </div>
            );
        }
        
        const buttonClass = "w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2";
        
        return !isConnected ? (
            <>
                <button onClick={connect} className={`${buttonClass} bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE]`}>
                    Connect Wallet
                </button>
                <button onClick={() => handleNavigation('/verify')} className={`${buttonClass} bg-transparent border-2 border-[#00ADB5] text-[#00ADB5] hover:bg-[#00ADB5] hover:text-white`}>
                    <Eye className="w-5 h-5" /><span>Coba Verifikasi</span>
                </button>
            </>
        ) : (
            <>
                <button onClick={() => handleNavigation('/dashboard/holder')} className={`${buttonClass} bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE]`}>
                    Buka Galeri Saya
                </button>
                 <button onClick={() => handleNavigation('/verify')} className={`${buttonClass} bg-transparent border-2 border-[#EEEEEE]/50 text-[#EEEEEE]/80 hover:bg-[#EEEEEE]/10 hover:text-white`}>
                    <Eye className="w-5 h-5" /><span>Verifikasi</span>
                </button>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-hidden text-[#EEEEEE]">
            <FloatingParticles />
            <Navbar />

            <main>
                <motion.div style={{ y: y1, opacity }} className="relative z-10 pt-28 sm:pt-24">
                    <Section>
                        <div className="text-center">
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8">
                                <span className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] text-white px-6 py-3 rounded-full text-sm font-semibold mb-6">🚀 Platform Kredensial Digital Terdepan</span>
                                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                    Kredensial Digital<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADB5] to-[#EEEEEE]">Terverifikasi & Aman</span>
                                </h1>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10">
                                    Platform revolusioner yang menggunakan teknologi blockchain untuk menyimpan dan memverifikasi kredensial digital Anda.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: 0.4, duration: 0.8 }} 
                                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 px-4"
                            >
                               <ActionButtons />
                            </motion.div>
                        </div>
                    </Section>
                </motion.div>
                
                <div className="relative z-20 bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831]">
                    {/* What is CredentialVault Section */}
                    <Section>
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Apa itu <span className="text-[#00ADB5]">CredentialVault</span>?</h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">Revolusi dalam pengelolaan kredensial digital menggunakan teknologi blockchain terdepan.</p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                                <StepCard title="Keamanan Blockchain" description="Kredensial tersimpan di blockchain Polygon yang immutable dan terenkripsi, memastikan data Anda tidak dapat dipalsukan." icon={Shield} />
                                <StepCard title="Verifikasi Global" description="Verifikasi kredensial dapat dilakukan kapan saja, di mana saja di dunia tanpa perlu menghubungi institusi penerbit." icon={Globe} />
                                <StepCard title="Akses Instan" description="Verifikasi dilakukan secara otomatis dan real-time melalui smart contract, tanpa menunggu konfirmasi." icon={Zap} />
                            </div>
                        </div>
                    </Section>

                    {/* How It Works Section */}
                    <Section className="bg-black/20">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Cara Kerja <span className="text-[#00ADB5]">CredentialVault</span></h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">Proses sederhana untuk pengelolaan kredensial digital yang aman dan terverifikasi.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                <StepCard title="Institusi Mendaftar" description="Institusi mendaftar dan diverifikasi oleh admin untuk memastikan kredibilitas." icon={Building} />
                                <StepCard title="Penerbitan Kredensial" description="Institusi menerbitkan kredensial digital sebagai Soulbound Token (SBT) ke wallet penerima." icon={Award} />
                                <StepCard title="Penyimpanan Aman" description="Kredensial tersimpan di blockchain Polygon dan metadata di IPFS." icon={Lock} />
                                <StepCard title="Verifikasi Instan" description="Siapa saja dapat memverifikasi kredensial secara real-time menggunakan wallet address." icon={UserCheck} />
                            </div>
                        </div>
                    </Section>
                    
                    {/* [KONTEN BARU] User Roles Section */}
                    <Section>
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                    Siapa yang Menggunakan <span className="text-[#00ADB5]">CredentialVault</span>?
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                {[
                                    { icon: Building, title: "Institusi Penerbit", description: "Universitas, lembaga kursus, pemerintah yang menerbitkan kredensial.", features: ["Menerbitkan sertifikat", "Manajemen template", "Revokasi dokumen"] },
                                    { icon: Users, title: "Pemegang Kredensial", description: "Mahasiswa & profesional yang menerima dan mengelola kredensial.", features: ["Galeri kredensial", "Share & verifikasi", "Kontrol penuh data"] },
                                    { icon: UserCheck, title: "Verifikator", description: "HRD, perusahaan, institusi yang memverifikasi keaslian kredensial.", features: ["Verifikasi instan", "Tanpa registrasi", "Hasil transparan"] },
                                    { icon: Settings, title: "Administrator", description: "Pengelola platform yang mengawasi dan menyetujui pendaftaran institusi.", features: ["Persetujuan institusi", "Monitoring sistem", "Manajemen platform"] }
                                ].map((role, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.6 }} className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8 hover:border-[#00ADB5]/50 transition-all duration-300">
                                        <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-xl w-fit mb-6"><role.icon className="w-8 h-8 text-white" /></div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{role.title}</h3>
                                        <p className="text-[#EEEEEE]/70 mb-6 min-h-[70px]">{role.description}</p>
                                        <ul className="space-y-2">
                                            {role.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-center text-[#EEEEEE]/80 text-sm"><Check className="w-4 h-4 text-[#00ADB5] mr-3 flex-shrink-0" />{feature}</li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Section>
                    
                    {/* [KONTEN BARU] Benefits Section */}
                    <Section className="bg-black/20">
                         <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Keunggulan <span className="text-[#00ADB5]">CredentialVault</span></h2>
                            </div>
                            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                                <div className="space-y-8">
                                    {[
                                        { icon: Shield, title: "Anti-Pemalsuan", description: "Teknologi blockchain memastikan kredensial tidak dapat dipalsukan atau dimanipulasi." },
                                        { icon: Zap, title: "Verifikasi Instan", description: "Verifikasi kredensial dalam hitungan detik tanpa perlu menunggu konfirmasi institusi." },
                                        { icon: Globe, title: "Aksesibilitas Global", description: "Kredensial dapat diakses dan diverifikasi di mana saja di dunia, 24/7." },
                                        { icon: FileCheck, title: "Kontrol Penuh", description: "Pemegang kredensial memiliki kontrol penuh atas siapa yang dapat melihat data mereka." }
                                    ].map((benefit, index) => (
                                        <motion.div key={index} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.15, duration: 0.6 }} className="flex items-start space-x-5">
                                            <div className="flex-shrink-0 bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-3 rounded-lg mt-1"><benefit.icon className="w-6 h-6 text-white" /></div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                                                <p className="text-[#EEEEEE]/70 leading-relaxed">{benefit.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
                                    <div className="bg-gradient-to-br from-[#00ADB5]/20 to-[#393E46]/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8 sm:p-12">
                                        <div className="text-center">
                                            <Sparkles className="w-16 h-16 text-[#00ADB5] mx-auto mb-6" />
                                            <h3 className="text-3xl font-bold text-white mb-4">Teknologi Terdepan</h3>
                                            <p className="text-gray-300 mb-8">Dibangun di atas blockchain Polygon, IPFS, dan Smart Contract untuk keamanan & keandalan maksimal.</p>
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div className="bg-white/10 rounded-xl p-4"><div className="text-2xl font-bold text-[#00ADB5]">99.9%</div><div className="text-sm text-gray-300">Uptime</div></div>
                                                <div className="bg-white/10 rounded-xl p-4"><div className="text-2xl font-bold text-[#00ADB5]">0</div><div className="text-sm text-gray-300">Data Breach</div></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </Section>

                    {/* [KONTEN BARU] FAQ Section */}
                    <Section>
                        <div className="max-w-4xl mx-auto">
                             <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Pertanyaan yang Sering Ditanyakan</h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">Temukan jawaban untuk pertanyaan umum tentang CredentialVault.</p>
                            </div>
                            <FAQ />
                        </div>
                    </Section>

                    {/* CTA Section */}
                    <Section>
                        <div className="max-w-4xl mx-auto text-center">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="bg-gradient-to-r from-[#00ADB5]/20 to-[#393E46]/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8 sm:p-12">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">Siap Memulai Perjalanan Digital?</h2>
                                <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">Bergabunglah dengan revolusi kredensial digital dan rasakan kemudahan verifikasi yang aman dan transparan.</p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <ActionButtons />
                                </div>
                            </motion.div>
                        </div>
                    </Section>

                    {/* Footer */}
                    <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12 px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col lg:flex-row justify-between items-center text-center lg:text-left gap-8 lg:gap-6">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-3 rounded-xl">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-2xl font-bold text-white">CredentialVault</span>
                                </div>
                                <div className="text-gray-400 text-sm">
                                    <p>© {new Date().getFullYear()} CredentialVault. Semua hak dilindungi undang-undang.</p>
                                    <p className="mt-1">Powered by Blockchain Technology</p>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}