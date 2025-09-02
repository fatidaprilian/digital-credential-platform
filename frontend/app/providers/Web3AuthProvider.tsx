"use client";

import { web3auth } from "@/lib/web3auth";
import { IWeb3Auth, UserInfo } from "@web3auth/base";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

// Definisikan tipe untuk Context
interface Web3AuthContextType {
  web3auth: IWeb3Auth | null;
  provider: ethers.BrowserProvider | null;
  user: Partial<UserInfo> | null;
  isLoading: boolean;
  isConnected: boolean;
  address: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Buat Context
const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

// Custom Hook untuk menggunakan Context
export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
};

// Komponen Provider
export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const [web3authInstance, setWeb3AuthInstance] = useState<IWeb3Auth | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [user, setUser] = useState<Partial<UserInfo> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        // Inisialisasi hanya jika belum pernah dilakukan
        if (!web3auth.isInitialized) {
          await web3auth.init();
        }
        setWeb3AuthInstance(web3auth);

        // ==================================================================
        // BAGIAN KUNCI YANG DIPERBAIKI: Memulihkan Sesi Login
        // ==================================================================
        // Jika web3auth.provider ada setelah init, berarti pengguna sudah login.
        // Kita perlu mengisi state dengan data sesi yang ada.
        if (web3auth.provider) {
          const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
          const signer = await ethersProvider.getSigner();
          const userAddress = await signer.getAddress();
          const userInfo = await web3auth.getUserInfo();

          setProvider(ethersProvider);
          setAddress(userAddress);
          setUser(userInfo);
        }
      } catch (error) {
        console.error("Web3Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const connect = async () => {
    if (!web3authInstance) {
      console.error("Web3Auth not initialized yet");
      return;
    }
    try {
      setIsLoading(true);
      const web3authProvider = await web3authInstance.connect();
      if (web3authProvider) {
        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();
        const userInfo = await web3auth.getUserInfo();

        setProvider(ethersProvider);
        setAddress(userAddress);
        setUser(userInfo);
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!web3authInstance) return;
    try {
      setIsLoading(true);
      await web3authInstance.logout();
      setProvider(null);
      setUser(null);
      setAddress("");
    } catch (error) {
      console.error("Disconnect failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    web3auth: web3authInstance,
    provider,
    user,
    isLoading,
    isConnected: !!provider && !!address,
    address,
    connect,
    disconnect,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}