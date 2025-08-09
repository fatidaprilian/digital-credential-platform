"use client";

// Imports
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import {
    ChevronDown, Shield, Zap, Globe, Check, FileCheck, Users, Lock, Sparkles,
    ArrowRight, Building, Award, UserCheck, Eye, Settings, Star, TrendingUp,
    Activity, Layers, Verified, Clock
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
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full opacity-30"
                    style={{ 
                        background: `linear-gradient(45deg, #00ADB5, #393E46)`, 
                        width: Math.random() * 8 + 3, 
                        height: Math.random() * 8 + 3,
                    }}
                    animate={{
                        x: [windowSize.width * Math.random(), windowSize.width * Math.random()],
                        y: [windowSize.height * Math.random(), windowSize.height * Math.random()],
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: Math.random() * 25 + 20,
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
    return ( 
        <motion.section 
            ref={ref} 
            initial={{ opacity: 0, y: 50 }} 
            animate={isInView ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className={`py-16 px-4 md:py-20 md:px-6 ${className}`}
        >
            {children}
        </motion.section> 
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs = [
        { 
            question: "Apa itu VERITASID?", 
            answer: "VERITASID adalah platform revolusioner yang menggunakan teknologi blockchain untuk menyimpan dan memverifikasi kredensial digital secara aman, transparan, dan anti-pemalsuan. Platform ini memungkinkan institusi untuk menerbitkan kredensial digital yang dapat diverifikasi secara real-time tanpa perlu kontak langsung dengan penerbit." 
        },
        { 
            question: "Bagaimana cara kerja verifikasi blockchain?", 
            answer: "Setiap kredensial disimpan sebagai Soulbound Token (SBT) di blockchain Polygon. Data metadata tersimpan di IPFS dan dapat diverifikasi secara real-time menggunakan smart contract. Proses ini memastikan keaslian dokumen tanpa perlu menghubungi institusi penerbit." 
        },
        { 
            question: "Apakah kredensial saya aman?", 
            answer: "Ya, sangat aman. Kredensial Anda tersimpan di blockchain yang immutable dan menggunakan enkripsi tingkat enterprise. Data tidak dapat diubah atau dihapus setelah diterbitkan, dan hanya Anda yang memiliki kontrol penuh atas siapa yang dapat mengakses kredensial tersebut." 
        },
        { 
            question: "Berapa biaya menggunakan VERITASID?", 
            answer: "Untuk pemegang kredensial (holder) gratis sepenuhnya selamanya. Institusi penerbit dapat memilih paket Pay-per-Use (Rp50 per dokumen) atau berlangganan bulanan unlimited (Rp250rb/bulan). Verifikator dapat menggunakan layanan verifikasi secara gratis." 
        },
        { 
            question: "Apakah bisa digunakan di luar negeri?", 
            answer: "Tentu saja! Karena berbasis blockchain global, kredensial Anda dapat diverifikasi di mana saja di dunia tanpa batas geografis atau waktu. Platform ini dapat diakses 24/7 dari negara manapun selama memiliki koneksi internet." 
        },
        { 
            question: "Bagaimana jika saya kehilangan akses wallet?", 
            answer: "Kredensial tersimpan di blockchain dan terikat dengan wallet address Anda. Jika kehilangan akses wallet, Anda dapat menggunakan recovery phrase untuk memulihkan akses. Kami sarankan untuk selalu menyimpan backup recovery phrase di tempat yang aman." 
        }
    ];
    
    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
                <motion.div 
                    key={index} 
                    className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/20 rounded-2xl overflow-hidden hover:border-[#00ADB5]/50 transition-all duration-300" 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                    <button 
                        className="w-full p-6 text-left flex justify-between items-center hover:bg-[#EEEEEE]/5 transition-colors group" 
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                        <span className="font-semibold text-[#EEEEEE] text-base sm:text-lg pr-4">{faq.question}</span>
                        <motion.div 
                            animate={{ rotate: openIndex === index ? 180 : 0 }} 
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                        >
                            <ChevronDown className="w-5 h-5 text-[#00ADB5] group-hover:text-white transition-colors" />
                        </motion.div>
                    </button>
                    <AnimatePresence>
                        {openIndex === index && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: "auto", opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }} 
                                transition={{ duration: 0.3 }} 
                                className="overflow-hidden"
                            >
                                <div className="p-6 pt-0 text-[#EEEEEE]/80 leading-relaxed text-sm sm:text-base">
                                    {faq.answer}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

const StepCard = ({ title, description, icon: Icon, index }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
            }}
            className="bg-gradient-to-br from-[#222831]/80 to-[#393E46]/80 backdrop-blur-lg border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8 hover:border-[#00ADB5]/50 hover:shadow-lg hover:shadow-[#00ADB5]/10 transition-all duration-300 group"
        >
            <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#EEEEEE] mb-4 group-hover:text-white transition-colors">
                {title}
            </h3>
            <p className="text-[#EEEEEE]/70 leading-relaxed group-hover:text-[#EEEEEE]/90 transition-colors">
                {description}
            </p>
        </motion.div>
    );
};

// Fixed StatCard Component with better mobile visibility
const StatCard = ({ value, label, icon: Icon, index }: { value: string; label: string; icon: any; index: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
            duration: 0.6, 
            delay: 0.8 + (index * 0.1),  // Delay lebih lama agar tidak terpengaruh scroll
            type: "spring",
            stiffness: 100
        }}
        whileHover={{ 
            scale: 1.05, 
            y: -2,
            transition: { duration: 0.2 }
        }}
        className="bg-[#222831]/70 backdrop-blur-lg border border-[#EEEEEE]/20 rounded-xl p-4 sm:p-6 text-center hover:border-[#00ADB5]/50 hover:bg-[#222831]/90 transition-all duration-300 group"
    >
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#00ADB5] mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300" />
        <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 group-hover:text-[#00ADB5] transition-colors">
            {value}
        </div>
        <div className="text-xs sm:text-sm text-[#EEEEEE]/70 group-hover:text-[#EEEEEE]/90 transition-colors">
            {label}
        </div>
    </motion.div>
);

// =================================================================
// MAIN PAGE COMPONENT
// =================================================================
export default function HomePage() {
    const router = useRouter();
    const { connect, isConnected, isLoading } = useWeb3Auth();
    const { scrollY } = useScroll();

    // Reduced scroll effect untuk mobile
    const y1 = useTransform(scrollY, [0, 800], [0, -50]); // Reduced from -100 to -50
    const opacity = useTransform(scrollY, [0, 600], [1, 0.3]); // Changed dari 0 ke 0.3 agar tidak hilang total

    const handleNavigation = (path: string) => router.push(path);

    const ActionButtons = () => {
        if (isLoading) {
            return (
                <div className="h-[60px] flex justify-center items-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-[#00ADB5] border-t-transparent rounded-full"
                    />
                </div>
            );
        }
        
        const primaryButtonClass = "group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-[#00ADB5]/40 overflow-hidden";
        const secondaryButtonClass = "group w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-[#00ADB5] text-[#00ADB5] rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 hover:bg-[#00ADB5] hover:text-white";
        
        return !isConnected ? (
            <>
                <motion.button 
                    onClick={connect} 
                    className={primaryButtonClass}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                    <Sparkles className="w-5 h-5" />
                    <span>Coba Masuk</span>
                </motion.button>
                <motion.button 
                    onClick={() => handleNavigation('/verify')} 
                    className={secondaryButtonClass}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Eye className="w-5 h-5" />
                    <span>Coba Verifikasi</span>
                </motion.button>
            </>
        ) : (
            <>
                <motion.button 
                    onClick={() => handleNavigation('/holder')} 
                    className={primaryButtonClass}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                    <Award className="w-5 h-5" />
                    <span>Buka Galeri Saya</span>
                </motion.button>
                <motion.button 
                    onClick={() => handleNavigation('/verify')} 
                    className="group w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-[#EEEEEE]/30 text-[#EEEEEE]/80 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 hover:bg-[#EEEEEE]/10 hover:text-white hover:border-[#EEEEEE]/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Eye className="w-5 h-5" />
                    <span>Verifikasi</span>
                </motion.button>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-hidden text-[#EEEEEE]">
            <FloatingParticles />
            <Navbar />

            <main>
                {/* Hero Section */}
                <div className="relative z-10 pt-32 sm:pt-28">
                    <Section>
                        <div className="text-center max-w-7xl mx-auto">
                            {/* Hero Content - dengan scroll effect yang reduced */}
                            <motion.div 
                                style={{ 
                                    y: y1, 
                                    opacity: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : opacity // Disable opacity effect on mobile
                                }} 
                                className="mb-8"
                            >
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ duration: 0.8 }} 
                                >
                                    <motion.span 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00ADB5] to-[#393E46] text-white px-6 py-3 rounded-full text-sm font-semibold mb-8 hover:scale-105 transition-transform duration-300"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Platform Kredensial Digital Terdepan
                                        <Verified className="w-4 h-4" />
                                    </motion.span>
                                    
                                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                        Kredensial Digital<br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ADB5] via-white to-[#00ADB5]">
                                            Terverifikasi & Aman
                                        </span>
                                    </h1>
                                    
                                    <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-10">
                                        Platform revolusioner yang menggunakan teknologi blockchain untuk menyimpan dan memverifikasi kredensial digital Anda dengan keamanan tingkat enterprise dan aksesibilitas global.
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
                            </motion.div>

                            {/* Stats Section - DIPISAH dari scroll effect */}
                            <div className="relative z-10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                                    <StatCard value="99.9%" label="Keamanan Data" icon={Shield} index={0} />
                                    <StatCard value="24/7" label="Aksesibilitas" icon={Clock} index={1} />
                                    <StatCard value="Global" label="Jangkauan" icon={Globe} index={2} />
                                    <StatCard value="Instant" label="Verifikasi" icon={Zap} index={3} />
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
                
                <div className="relative z-20 bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831]">
                    {/* What is VERITASID Section */}
                    <Section>
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6 }}
                                    className="inline-flex items-center gap-3 mb-6"
                                >
                                    <Image
                                        src="/veritasidtrans.svg"
                                        alt="Logo VeritasID"
                                        width={48}
                                        height={48}
                                        className="w-12 h-12"
                                    />
                                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                                        Apa itu <span className="text-[#00ADB5]">VERITASID</span>?
                                    </h2>
                                </motion.div>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                    Revolusi dalam pengelolaan kredensial digital menggunakan teknologi blockchain terdepan untuk keamanan, transparansi, dan aksesibilitas global.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                                <StepCard 
                                    title="Keamanan Blockchain" 
                                    description="Kredensial tersimpan di blockchain Polygon yang immutable dan terenkripsi, memastikan data Anda tidak dapat dipalsukan atau dimanipulasi oleh pihak manapun." 
                                    icon={Shield} 
                                    index={0}
                                />
                                <StepCard 
                                    title="Verifikasi Global" 
                                    description="Verifikasi kredensial dapat dilakukan kapan saja, di mana saja di dunia tanpa perlu menghubungi institusi penerbit atau menunggu konfirmasi manual." 
                                    icon={Globe} 
                                    index={1}
                                />
                                <StepCard 
                                    title="Akses Instan" 
                                    description="Verifikasi dilakukan secara otomatis dan real-time melalui smart contract, memberikan hasil dalam hitungan detik tanpa menunggu." 
                                    icon={Zap} 
                                    index={2}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* How It Works Section */}
                    <Section className="bg-black/20">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                    Cara Kerja <span className="text-[#00ADB5]">VERITASID</span>
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                    Proses sederhana dan efisien untuk pengelolaan kredensial digital yang aman dan terverifikasi dengan teknologi blockchain.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                <StepCard 
                                    title="Institusi Mendaftar" 
                                    description="Institusi mendaftar dan melalui proses verifikasi ketat oleh admin untuk memastikan kredibilitas dan legalitas." 
                                    icon={Building} 
                                    index={0}
                                />
                                <StepCard 
                                    title="Penerbitan Kredensial" 
                                    description="Institusi menerbitkan kredensial digital sebagai Soulbound Token (SBT) yang dikirim langsung ke wallet penerima." 
                                    icon={Award} 
                                    index={1}
                                />
                                <StepCard 
                                    title="Penyimpanan Aman" 
                                    description="Kredensial tersimpan secara permanen di blockchain Polygon dengan metadata di IPFS untuk aksesibilitas maksimal." 
                                    icon={Lock} 
                                    index={2}
                                />
                                <StepCard 
                                    title="Verifikasi Instan" 
                                    description="Siapa saja dapat memverifikasi keaslian kredensial secara real-time menggunakan wallet address atau QR code." 
                                    icon={UserCheck} 
                                    index={3}
                                />
                            </div>
                        </div>
                    </Section>
                    
                    {/* User Roles Section */}
                    <Section>
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                    Siapa yang Menggunakan <span className="text-[#00ADB5]">VERITASID</span>?
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                    Platform yang dirancang untuk memenuhi kebutuhan berbagai pihak dalam ekosistem kredensial digital.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                {[
                                    { 
                                        icon: Building, 
                                        title: "Institusi Penerbit", 
                                        description: "Universitas, lembaga kursus, organisasi, dan instansi pemerintah yang menerbitkan kredensial resmi.", 
                                        features: ["Menerbitkan sertifikat digital", "Manajemen template dokumen", "Sistem revokasi kredensial"] 
                                    },
                                    { 
                                        icon: Users, 
                                        title: "Pemegang Kredensial", 
                                        description: "Mahasiswa, profesional, dan individu yang menerima serta mengelola kredensial digital mereka.", 
                                        features: ["Galeri kredensial pribadi", "Share & verifikasi mudah", "Kontrol penuh atas data"] 
                                    },
                                    { 
                                        icon: UserCheck, 
                                        title: "Verifikator", 
                                        description: "HRD, perusahaan, institusi pendidikan yang memerlukan verifikasi keaslian kredensial.", 
                                        features: ["Verifikasi instan & akurat", "Tanpa perlu registrasi", "Hasil transparan & terpercaya"] 
                                    },
                                    { 
                                        icon: Settings, 
                                        title: "Administrator", 
                                        description: "Pengelola platform yang mengawasi dan memastikan integritas sistem secara keseluruhan.", 
                                        features: ["Persetujuan institusi baru", "Monitoring sistem 24/7", "Manajemen keamanan platform"] 
                                    }
                                ].map((role, index) => (
                                    <motion.div 
                                        key={index} 
                                        initial={{ opacity: 0, scale: 0.9 }} 
                                        whileInView={{ opacity: 1, scale: 1 }} 
                                        transition={{ delay: index * 0.1, duration: 0.6 }} 
                                        whileHover={{ 
                                            scale: 1.02,
                                            y: -5,
                                            transition: { duration: 0.2 }
                                        }}
                                        className="bg-gradient-to-br from-[#222831]/80 to-[#393E46]/80 backdrop-blur-lg border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8 hover:border-[#00ADB5]/50 hover:shadow-lg hover:shadow-[#00ADB5]/10 transition-all duration-300 group"
                                    >
                                        <div className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                                            <role.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-[#00ADB5] transition-colors">
                                            {role.title}
                                        </h3>
                                        <p className="text-[#EEEEEE]/70 mb-6 min-h-[70px] group-hover:text-[#EEEEEE]/90 transition-colors">
                                            {role.description}
                                        </p>
                                        <ul className="space-y-3">
                                            {role.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start text-[#EEEEEE]/80 text-sm group-hover:text-[#EEEEEE] transition-colors">
                                                    <Check className="w-4 h-4 text-[#00ADB5] mr-3 flex-shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Section>
                    
                    {/* Benefits Section */}
                    <Section className="bg-black/20">
                         <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                    Keunggulan <span className="text-[#00ADB5]">VERITASID</span>
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                    Teknologi blockchain terdepan yang memberikan keamanan, kecepatan, dan kemudahan tak tertandingi.
                                </p>
                            </div>
                            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                                <div className="space-y-8">
                                    {[
                                        { 
                                            icon: Shield, 
                                            title: "Anti-Pemalsuan", 
                                            description: "Teknologi blockchain memastikan kredensial tidak dapat dipalsukan, dimanipulasi, atau diduplikasi. Setiap dokumen memiliki signature unik yang terverifikasi." 
                                        },
                                        { 
                                            icon: Zap, 
                                            title: "Verifikasi Instan", 
                                            description: "Verifikasi kredensial dalam hitungan detik tanpa perlu menunggu konfirmasi institusi. Proses otomatis melalui smart contract memberikan hasil real-time." 
                                        },
                                        { 
                                            icon: Globe, 
                                            title: "Aksesibilitas Global", 
                                            description: "Kredensial dapat diakses dan diverifikasi di mana saja di dunia, 24/7 tanpa batasan geografis atau zona waktu. Platform multi-bahasa dan multi-mata uang." 
                                        },
                                        { 
                                            icon: FileCheck, 
                                            title: "Kontrol Penuh", 
                                            description: "Pemegang kredensial memiliki kontrol penuh atas siapa yang dapat melihat data mereka. Privacy dan security menjadi prioritas utama platform." 
                                        }
                                    ].map((benefit, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, x: -30 }} 
                                            whileInView={{ opacity: 1, x: 0 }} 
                                            transition={{ delay: index * 0.15, duration: 0.6 }} 
                                            className="flex items-start space-x-5 group"
                                        >
                                            <div className="flex-shrink-0 bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-3 rounded-lg mt-1 group-hover:scale-110 transition-transform duration-300">
                                                <benefit.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00ADB5] transition-colors">
                                                    {benefit.title}
                                                </h3>
                                                <p className="text-[#EEEEEE]/70 leading-relaxed group-hover:text-[#EEEEEE]/90 transition-colors">
                                                    {benefit.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    whileInView={{ opacity: 1, scale: 1 }} 
                                    transition={{ duration: 0.8 }} 
                                    className="relative"
                                >
                                    <div className="bg-gradient-to-br from-[#00ADB5]/20 to-[#393E46]/20 backdrop-blur-lg border border-white/20 rounded-3xl p-8 sm:p-12 hover:border-[#00ADB5]/50 transition-all duration-300">
                                        <div className="text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                                className="bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full w-fit mx-auto mb-6"
                                            >
                                                <Sparkles className="w-16 h-16 text-white" />
                                            </motion.div>
                                            <h3 className="text-3xl font-bold text-white mb-4">Teknologi Terdepan</h3>
                                            <p className="text-gray-300 mb-8 leading-relaxed">
                                                Dibangun di atas blockchain Polygon, IPFS, dan Smart Contract untuk keamanan & keandalan maksimal dengan performa tinggi.
                                            </p>
                                            <div className="grid grid-cols-2 gap-6">
                                                <motion.div 
                                                    whileHover={{ scale: 1.05 }}
                                                    className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
                                                >
                                                    <div className="text-3xl font-bold text-[#00ADB5] mb-1">99.9%</div>
                                                    <div className="text-sm text-gray-300">Uptime</div>
                                                </motion.div>
                                                <motion.div 
                                                    whileHover={{ scale: 1.05 }}
                                                    className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
                                                >
                                                    <div className="text-3xl font-bold text-[#00ADB5] mb-1">0</div>
                                                    <div className="text-sm text-gray-300">Data Breach</div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </Section>

                    {/* FAQ Section */}
                    <Section>
                        <div className="max-w-4xl mx-auto">
                             <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                    Pertanyaan yang Sering Ditanyakan
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                    Temukan jawaban lengkap untuk pertanyaan umum tentang VERITASID dan teknologi blockchain yang kami gunakan.
                                </p>
                            </div>
                            <FAQ />
                        </div>
                    </Section>

                    {/* CTA Section */}
                    <Section>
                        <div className="max-w-4xl mx-auto text-center">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                whileInView={{ opacity: 1, scale: 1 }} 
                                transition={{ duration: 0.8 }} 
                                className="bg-gradient-to-r from-[#00ADB5]/20 to-[#393E46]/20 backdrop-blur-lg border border-white/20 rounded-3xl p-8 sm:p-12 hover:border-[#00ADB5]/50 transition-all duration-500"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="w-fit mx-auto mb-6"
                                >
                                    <Image
                                        src="/veritasidtrans.svg"
                                        alt="Logo VeritasID"
                                        width={64}
                                        height={64}
                                        className="w-16 h-16"
                                    />
                                </motion.div>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                                    Siap Memulai Perjalanan Digital?
                                </h2>
                                <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                                    Bergabunglah dengan revolusi kredensial digital dan rasakan kemudahan verifikasi yang aman, transparan, dan dapat diakses secara global.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <ActionButtons />
                                </div>
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-8 flex items-center justify-center gap-6 text-sm text-[#EEEEEE]/60"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[#00ADB5]" />
                                        <span>100% Aman</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-[#00ADB5]" />
                                        <span>Verifikasi Instan</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-[#00ADB5]" />
                                        <span>Global Access</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </Section>

                    {/* Enhanced Footer */}
                    <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12 px-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col lg:flex-row justify-between items-center text-center lg:text-left gap-8 lg:gap-6">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-3"
                                >
                                        <Image
                                            src="/veritasidtrans.svg"
                                            alt="Logo VeritasID"
                                            width={32}
                                            height={32}
                                            className="w-8 h-8"
                                        />
                                    <span className="text-2xl font-bold text-white">VERITASID</span>
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    className="text-gray-400 text-sm space-y-2"
                                >
                                    <p>© {new Date().getFullYear()} VERITASID. Semua hak dilindungi undang-undang.</p>
                                    <p className="flex items-center justify-center lg:justify-end gap-2">
                                        <span>Powered by</span>
                                        <span className="text-[#00ADB5] font-semibold">Blockchain Technology</span>
                                        <Layers className="w-4 h-4 text-[#00ADB5]" />
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}