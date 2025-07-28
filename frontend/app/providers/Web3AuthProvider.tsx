"use client";

import { web3auth } from "@/lib/web3auth";
import { IWeb3Auth, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

// Definisikan tipe untuk context
interface Web3AuthContextType {
  web3auth: IWeb3Auth | null;
  provider: ethers.BrowserProvider | null;
  user: any;
  isLoading: boolean;
  isConnected: boolean;
  address: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Buat context
const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

// Buat Provider component
export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const [web3authInstance, setWeb3AuthInstance] = useState<IWeb3Auth | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        // PERBAIKAN: Ganti initModal() menjadi init()
        await web3auth.init();
        setWeb3AuthInstance(web3auth);

        if (web3auth.connected && web3auth.provider) {
          const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
          const signer = await ethersProvider.getSigner();
          const userAddress = await signer.getAddress();
          setProvider(ethersProvider);
          setAddress(userAddress);
          const userInfo = await web3auth.getUserInfo();
          setUser(userInfo);
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const connect = async () => {
    if (!web3authInstance) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      setIsLoading(true);
      const web3authProvider = await web3authInstance.connect();
      if (web3authProvider) {
        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();
        setProvider(ethersProvider);
        setAddress(userAddress);
        const userInfo = await web3auth.getUserInfo();
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

// Buat custom hook untuk menggunakan context
export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
};