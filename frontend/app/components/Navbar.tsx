"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Import useWeb3Auth dan ikon yang diperlukan
import { useWeb3Auth } from '@/providers/Web3AuthProvider';
import { Shield, ChevronDown, User, LogOut, LayoutDashboard, Menu, X, Copy, Check } from 'lucide-react';

// Enhanced SafeImage Component dengan better cropping
const SafeImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = "",
  fill = false,
  sizes = "40px"
}: {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state jika src berubah
  useEffect(() => {
    if (src) {
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  // Jika tidak ada src atau ada error, tampilkan fallback yang lebih baik
  if (!src || hasError) {
    return (
      <div 
        className={`bg-gradient-to-br from-[#00ADB5]/20 to-[#393E46]/20 border border-[#00ADB5]/30 rounded-full flex items-center justify-center ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <User className="w-5 h-5 text-[#00ADB5]" />
      </div>
    );
  }

  return (
    <div className={fill ? "relative w-full h-full rounded-full overflow-hidden" : "relative rounded-full overflow-hidden"}>
      {isLoading && (
        <div 
          className={`${fill ? 'absolute inset-0' : ''} bg-gradient-to-br from-[#00ADB5]/20 to-[#393E46]/20 border border-[#00ADB5]/30 rounded-full flex items-center justify-center animate-pulse ${className}`}
          style={!fill ? { width, height } : undefined}
        >
          <User className="w-5 h-5 text-[#00ADB5]" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 rounded-full`}
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        unoptimized
        priority={false}
      />
    </div>
  );
};

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const router = useRouter();
  const { user, isConnected, connect, disconnect, address, isLoading } = useWeb3Auth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setDropdownOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
    setUserMenuOpen(false);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await disconnect();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      handleNavigation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCopyAddress = async () => {
    if (!address || isCopied) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = address;
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

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
        <div className="flex justify-between items-center px-6 py-3">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => handleNavigation('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image
              src="/veritasidtrans.svg"
              alt="Logo VeritasID"
              width={48}
              height={48}
              className="w-12 h-12"
              priority
            />
            <span className="text-xl font-bold text-[#EEEEEE]">VERITASID</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <DesktopNavLinks />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.button 
              aria-label="Toggle menu" 
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-[#EEEEEE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00ADB5]/50"
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-7 h-7" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-7 h-7" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.95 }} 
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 z-40"
            >
              <div className="bg-[#222831]/95 backdrop-blur-lg rounded-xl shadow-xl border border-[#EEEEEE]/10 overflow-hidden">
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
        {/* Verifikasi Button */}
        <motion.button 
          onClick={() => handleNavigation('/verify')} 
          className="text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Verifikasi
        </motion.button>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-10 w-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-[#00ADB5] border-t-transparent rounded-full"
            />
          </div>
        ) : !isConnected ? (
          // Not Connected State
          <>
            {/* Institusi Dropdown */}
            <div className="relative dropdown-container">
              <motion.button 
                onClick={() => {
                  setDropdownOpen(!isDropdownOpen);
                  setUserMenuOpen(false);
                }} 
                className="flex items-center text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Untuk Institusi
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 ml-1" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-[#222831]/95 backdrop-blur-xl border border-[#EEEEEE]/20 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <motion.button 
                      onClick={() => handleNavigation('/issuer/register')} 
                      className="w-full text-left px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46]/70 transition-colors border-b border-[#EEEEEE]/10"
                      whileHover={{ x: 4 }}
                    >
                      Daftar Issuer
                    </motion.button>
                    <motion.button 
                      onClick={() => handleNavigation('/issuer/login')} 
                      className="w-full text-left px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46]/70 transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      Masuk Issuer
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Connect Button */}
            <motion.button 
              onClick={handleConnect} 
              className="bg-[#00ADB5] text-[#EEEEEE] px-6 py-2.5 rounded-lg font-semibold hover:bg-[#00ADB5]/90 transition-all text-sm"
              whileHover={{ scale: 1.05, boxShadow: '0 4px 20px rgba(0, 173, 181, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Masuk
            </motion.button>
          </>
        ) : (
          // Connected State
          <>
            {/* Galeri Button */}
            <motion.button 
              onClick={() => handleNavigation('/holder')} 
              className="text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Galeri Saya
            </motion.button>
            
            {/* User Menu */}
            <div className="relative dropdown-container">
              <motion.button 
                onClick={() => {
                  setUserMenuOpen(!isUserMenuOpen);
                  setDropdownOpen(false);
                }} 
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Enhanced Profile Picture Container */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#00ADB5] hover:border-[#00ADB5]/80 transition-all duration-300 hover:shadow-lg hover:shadow-[#00ADB5]/20">
                  <SafeImage
                    src={user?.profileImage}
                    alt={user?.name || 'User Profile'}
                    fill={true}
                    sizes="40px"
                    className="w-full h-full"
                  />
                </div>
              </motion.button>
              
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-[#222831]/95 backdrop-blur-xl border border-[#EEEEEE]/20 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* Enhanced User Info */}
                    <div className="p-4 border-b border-[#EEEEEE]/10">
                      <div className="flex items-center space-x-3">
                        {/* Larger Profile Picture dengan Better Styling */}
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#00ADB5]/50 shadow-lg">
                          <SafeImage
                            src={user?.profileImage}
                            alt={user?.name || 'User Profile'}
                            fill={true}
                            sizes="56px"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#EEEEEE] text-base truncate">{user?.name || 'Pengguna'}</p>
                          <p className="text-[#EEEEEE]/70 text-sm truncate">{user?.email}</p>
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="text-xs text-green-400">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Address Copy */}
                    <div className="p-3 border-b border-[#EEEEEE]/10">
                      <motion.button 
                        onClick={handleCopyAddress} 
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-[#EEEEEE]/80 hover:bg-[#393E46]/50 rounded-lg transition-colors bg-[#393E46]/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex-1 text-left">
                          <div className="text-xs text-[#EEEEEE]/60 mb-1">Wallet Address</div>
                          <div className="font-mono text-xs">
                            {isCopied ? 'Berhasil disalin!' : truncateAddress(address || "")}
                          </div>
                        </div>
                        <motion.div
                          animate={{ scale: isCopied ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isCopied ? 
                            <Check className="w-4 h-4 text-green-400" /> : 
                            <Copy className="w-4 h-4 text-[#EEEEEE]/60" />
                          }
                        </motion.div>
                      </motion.button>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-2">
                      <motion.button 
                        onClick={() => handleNavigation('/holder/profile')} 
                        className="w-full text-left flex items-center px-3 py-2.5 text-sm text-[#EEEEEE] hover:bg-[#393E46]/50 rounded-lg transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <User className="w-4 h-4 mr-3" /> Profil
                      </motion.button>
                      <motion.button 
                        onClick={handleLogout} 
                        className="w-full text-left flex items-center px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <LogOut className="w-4 h-4 mr-3" /> Keluar
                      </motion.button>
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
      <div className="flex flex-col py-2">
        {/* Verifikasi */}
        <motion.button 
          onClick={() => handleNavigation('/verify')} 
          className="w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 text-left font-medium transition-colors"
          whileHover={{ x: 4, backgroundColor: 'rgba(57, 62, 70, 0.3)' }}
        >
          Verifikasi
        </motion.button>
        
        {/* Loading State Mobile */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-[#00ADB5] border-t-transparent rounded-full"
            />
          </div>
        ) : !isConnected ? (
          <>
            {/* Institusi Dropdown Mobile */}
            <div className="border-t border-[#EEEEEE]/10">
              <motion.button 
                onClick={() => setMobileDropdownOpen(!isMobileDropdownOpen)} 
                className="flex justify-between items-center w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 font-medium transition-colors"
                whileHover={{ x: 4, backgroundColor: 'rgba(57, 62, 70, 0.3)' }}
              >
                Untuk Institusi
                <motion.div
                  animate={{ rotate: isMobileDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {isMobileDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    transition={{ duration: 0.2 }}
                    className="bg-[#393E46]/30 border-t border-[#EEEEEE]/10 overflow-hidden"
                  >
                    <motion.button 
                      onClick={() => handleNavigation('/issuer/register')} 
                      className="w-full text-left px-6 py-3 text-sm text-[#EEEEEE] hover:bg-[#222831]/50 transition-colors border-b border-[#EEEEEE]/5"
                      whileHover={{ x: 4 }}
                    >
                      Daftar Issuer
                    </motion.button>
                    <motion.button 
                      onClick={() => handleNavigation('/issuer/login')} 
                      className="w-full text-left px-6 py-3 text-sm text-[#EEEEEE] hover:bg-[#222831]/50 transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      Masuk Issuer
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Connect Button Mobile */}
            <div className="p-4 border-t border-[#EEEEEE]/10">
              <motion.button 
                onClick={handleConnect} 
                className="w-full bg-[#00ADB5] text-[#EEEEEE] px-4 py-3 rounded-lg font-semibold hover:bg-[#00ADB5]/90 transition-all text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Masuk
              </motion.button>
            </div>
          </>
        ) : (
          <>
            {/* Galeri Mobile */}
            <motion.button 
              onClick={() => handleNavigation('/holder')} 
              className="w-full text-[#EEEEEE]/80 hover:text-[#00ADB5] px-4 py-3 text-left font-medium transition-colors"
              whileHover={{ x: 4, backgroundColor: 'rgba(57, 62, 70, 0.3)' }}
            >
              Galeri Saya
            </motion.button>
            
            {/* Enhanced User Info Mobile */}
            <div className="p-4 border-t border-[#EEEEEE]/10">
              <div className="flex items-center mb-4">
                {/* Enhanced Mobile Profile Picture */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#00ADB5] mr-3 shadow-lg">
                  <SafeImage
                    src={user?.profileImage}
                    alt={user?.name || 'User Profile'}
                    fill={true}
                    sizes="56px"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#EEEEEE] text-base truncate">{user?.name || 'Pengguna'}</p>
                  <p className="text-[#EEEEEE]/70 text-sm truncate">{user?.email}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              </div>
              
              {/* Address Copy Mobile */}
              <motion.button 
                onClick={handleCopyAddress} 
                className="w-full flex items-center justify-between px-3 py-3 text-sm text-[#EEEEEE]/80 hover:bg-[#393E46]/50 rounded-lg transition-colors bg-[#393E46]/20 mb-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-1 text-left">
                  <div className="text-xs text-[#EEEEEE]/60 mb-1">Wallet Address</div>
                  <div className="font-mono text-xs">
                    {isCopied ? 'Alamat berhasil disalin!' : truncateAddress(address || "")}
                  </div>
                </div>
                <motion.div
                  animate={{ scale: isCopied ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isCopied ? 
                    <Check className="w-4 h-4 text-green-400" /> : 
                    <Copy className="w-4 h-4 text-[#EEEEEE]/60" />
                  }
                </motion.div>
              </motion.button>
            </div>
            
            {/* Menu Items Mobile */}
            <div className="border-t border-[#EEEEEE]/10">
              <motion.button 
                onClick={() => handleNavigation('/holder/profile')} 
                className="w-full flex items-center px-4 py-3 text-sm text-[#EEEEEE] hover:bg-[#393E46]/50 transition-colors text-left"
                whileHover={{ x: 4 }}
              >
                <User className="w-4 h-4 mr-3" /> Profil
              </motion.button>
              <motion.button 
                onClick={handleLogout} 
                className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                whileHover={{ x: 4 }}
              >
                <LogOut className="w-4 h-4 mr-3" /> Keluar
              </motion.button>
            </div>
          </>
        )}
      </div>
    );
  }
};