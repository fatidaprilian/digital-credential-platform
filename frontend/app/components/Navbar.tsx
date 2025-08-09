"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Import useWeb3Auth dan ikon yang diperlukan
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { Shield, ChevronDown, User, LogOut, LayoutDashboard, Menu, X, Copy, Check } from 'lucide-react';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const router = useRouter();
  // Ambil 'address' dan 'isLoading' dari hook
  const { user, isConnected, connect, disconnect, address, isLoading } = useWeb3Auth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
    setUserMenuOpen(false);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileDropdownOpen(false);
  };

  const handleLogout = () => {
    disconnect();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Fungsi untuk menyalin alamat ke clipboard
  const handleCopyAddress = () => {
    if (!address || isCopied) return;
    
    // Gunakan navigator.clipboard jika tersedia
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Gagal menyalin alamat:', err);
      });
    } else {
      // Fallback untuk browser lama
      const textArea = document.createElement("textarea");
      textArea.value = address;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Gagal menyalin alamat: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Fungsi bantuan untuk memotong alamat
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-24 flex items-center justify-center">
      <motion.nav
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`w-full transition-all duration-300 ${
          scrolled
            ? 'max-w-5xl rounded-full bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 shadow-xl'
            : 'max-w-7xl bg-transparent'
        }`}
      >
        <div className="flex justify-between items-center px-6 py-2">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation('/')}>
          {/* Hapus div background */}
          <Image
            src="/veritasidtrans.svg"
            alt="Logo VeritasID"
            width={100}
            height={100}
            className="w-12 h-12" // sesuaikan ukuran sesuai kebutuhan
          />
          <span className="text-xl font-bold text-[#EEEEEE]">VERITASID</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <DesktopNavLinks />
          </div>

          <div className="md:hidden flex items-center">
            <button aria-label="Open menu" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#EEEEEE] rounded-md focus:outline-none">
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:hidden absolute top-24 left-0 w-full px-4 pb-6 z-40">
              <div className="bg-[#222831]/95 backdrop-blur-lg rounded-xl shadow-xl border border-[#EEEEEE]/10 flex flex-col space-y-1 py-4">
                <MobileNavLinks />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );

  function DesktopNavLinks() {
    return (
      <>
        <button onClick={() => handleNavigation('/verify')} className="text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium">Verifikasi</button>
        
        {/* Loading state - tampilkan spinner saat sesi sedang dimuat */}
        {isLoading ? (
          <div className="flex items-center justify-center h-9 w-24">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00ADB5]"></div>
          </div>
        ) : !isConnected ? (
          <>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium">
                Untuk Institusi
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onMouseLeave={() => setDropdownOpen(false)} className="absolute right-0 mt-3 w-48 bg-[#222831]/90 backdrop-blur-xl border border-[#EEEEEE]/10 rounded-lg shadow-2xl">
                    <a onClick={() => handleNavigation('/issuer/register')} className="block px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46] transition-colors rounded-t-lg cursor-pointer">Daftar Issuer</a>
                    <a onClick={() => handleNavigation('/issuer/login')} className="block px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46] transition-colors rounded-b-lg cursor-pointer">Masuk Issuer</a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={connect} className="bg-[#00ADB5] text-[#EEEEEE] px-5 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-all text-sm">Masuk</button>
          </>
        ) : (
          <>
            <button onClick={() => handleNavigation('/holder')} className="text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium">Galeri Saya</button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#00ADB5]">
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.name || 'User Profile'} 
                      fill 
                      sizes="40px" 
                      style={{ objectFit: 'cover' }} 
                    />
                  ) : (
                    <User className="w-full h-full text-[#00ADB5] p-1" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onMouseLeave={() => setUserMenuOpen(false)} className="absolute right-0 mt-3 w-64 bg-[#222831]/90 backdrop-blur-xl border border-[#EEEEEE]/10 rounded-lg shadow-2xl">
                    <div className="p-4 border-b border-[#EEEEEE]/10">
                      <p className="font-semibold text-[#EEEEEE] text-sm">{user?.name || 'Pengguna'}</p>
                      <p className="text-[#EEEEEE]/70 text-xs truncate">{user?.email}</p>
                    </div>
                    <div className="p-2 border-b border-[#EEEEEE]/10">
                      <button onClick={handleCopyAddress} className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#EEEEEE]/80 hover:bg-[#393E46] rounded-md transition-colors">
                        <span className="truncate">{truncateAddress(address || "")}</span>
                        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#EEEEEE]/60" />}
                      </button>
                    </div>
                    <div className="p-2">
                      <button onClick={() => handleNavigation('/dashboard/holder')} className="w-full text-left flex items-center px-3 py-2 text-sm text-[#EEEEEE] hover:bg-[#393E46] rounded-md"><LayoutDashboard className="w-4 h-4 mr-3" /> Dasbor</button>
                      <button onClick={() => handleNavigation('/holder/profile')} className="w-full text-left flex items-center px-3 py-2 text-sm text-[#EEEEEE] hover:bg-[#393E46] rounded-md"><User className="w-4 h-4 mr-3" /> Profil</button>
                      <button onClick={handleLogout} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-500 hover:bg-[#393E46] rounded-md"><LogOut className="w-4 h-4 mr-3" /> Keluar</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </>
    );
  }

  function MobileNavLinks() {
    return (
      <>
        <button onClick={() => handleNavigation('/verify')} className="w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 text-left font-medium transition-colors">Verifikasi</button>
        
        {/* Loading state untuk mobile */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00ADB5]"></div>
          </div>
        ) : !isConnected ? (
          <>
            <div className="relative">
              <button onClick={() => setMobileDropdownOpen(!isMobileDropdownOpen)} className="flex justify-between items-center w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 font-medium transition-colors">
                Untuk Institusi
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="bg-[#393E46]/95 rounded-lg my-1 shadow-inner mx-4">
                    <a onClick={() => handleNavigation('/issuer/register')} className="block px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#222831] transition-colors rounded-t-lg cursor-pointer">Daftar Issuer</a>
                    <a onClick={() => handleNavigation('/issuer/login')} className="block px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#222831] transition-colors rounded-b-lg cursor-pointer">Masuk Issuer</a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="px-4 pt-2">
              <button onClick={connect} className="w-full bg-[#00ADB5] text-[#EEEEEE] px-4 py-3 rounded-md font-semibold hover:bg-opacity-90 transition-all text-center">Masuk</button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => handleNavigation('/holder')} className="w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 text-left font-medium transition-colors">Galeri Saya</button>
            <div className="px-4 py-2 border-t border-b border-[#EEEEEE]/10">
              <div className="flex items-center mb-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#00ADB5] mr-3">
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.name || 'User Profile'} 
                      fill 
                      sizes="40px" 
                      style={{ objectFit: 'cover' }} 
                    />
                  ) : (
                    <User className="w-full h-full text-[#00ADB5] p-1" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#EEEEEE] text-sm">{user?.name || 'Pengguna'}</p>
                  <p className="text-[#EEEEEE]/70 text-xs truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={handleCopyAddress} className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#EEEEEE]/80 hover:bg-[#393E46] rounded-md transition-colors bg-[#393E46]/50">
                <span className="truncate">{isCopied ? 'Alamat disalin!' : truncateAddress(address || "")}</span>
                {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#EEEEEE]/60" />}
              </button>
            </div>
            <button onClick={() => handleNavigation('/dashboard/holder')} className="w-full flex items-center px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46] rounded-md text-left"><LayoutDashboard className="w-4 h-4 mr-3" /> Dasbor</button>
            <button onClick={() => handleNavigation('/holder/profile')} className="w-full flex items-center px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46] rounded-md text-left"><User className="w-4 h-4 mr-3" /> Profil</button>
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-[#393E46] rounded-md text-left"><LogOut className="w-4 h-4 mr-3" /> Keluar</button>
          </>
        )}
      </>
    );
  }
};