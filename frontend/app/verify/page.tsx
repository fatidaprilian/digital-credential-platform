"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import VerifiableCredential from "../abi/VerifiableCredential.json";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldAlert, Search, Loader2, ExternalLink, User, Info, Hash, CalendarDays } from "lucide-react";

// --- Types ---
interface VerificationResult {
  isRevoked: boolean;
  owner: string;
}

interface CredentialMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

interface IssuanceLog {
    transactionHash: string;
    issuedAt: string;
}

// --- Environment Variables & Constants ---
const abi = VerifiableCredential.abi;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const rpcUrl = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL;
const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// --- Helper Functions ---
const formatIpfsUrl = (ipfsUri: string) => {
  if (!ipfsUri || !ipfsUri.startsWith("ipfs://")) return ipfsUri;
  const cid = ipfsUri.substring(7);
  return `${IPFS_GATEWAY}${cid}`;
};

const FloatingParticles = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);
    if (!isMounted) return null;
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ background: `linear-gradient(45deg, #00ADB5, #393E46)`, opacity: 0.2, width: Math.random() * 6 + 4, height: Math.random() * 6 + 4, }}
                    animate={{ x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth], y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight], opacity: [0, 0.4, 0],}}
                    transition={{ duration: Math.random() * 20 + 15, repeat: Infinity, ease: "easeInOut",}}
                    initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, }}
                />
            ))}
        </div>
    );
};

// --- Main Component ---
export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [metadata, setMetadata] = useState<CredentialMetadata | null>(null);
  const [issuanceLog, setIssuanceLog] = useState<IssuanceLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerification = async () => {
    if (!tokenId) {
      setError("Please enter a Token ID.");
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setMetadata(null);
    setIssuanceLog(null);
    setError(null);

    try {
      // Step 1: Verify on-chain data
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const [tokenURI, isRevoked, owner] = await Promise.all([
        contract.tokenURI(BigInt(tokenId)),
        contract.isRevoked(BigInt(tokenId)),
        contract.ownerOf(BigInt(tokenId)),
      ]);
      setResult({ isRevoked, owner });

      // Step 2: Fetch metadata from IPFS
      const metadataUrl = formatIpfsUrl(tokenURI);
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) throw new Error("Could not fetch credential metadata.");
      const fetchedMetadata: CredentialMetadata = await metadataResponse.json();
      setMetadata(fetchedMetadata);

      // Step 3: Fetch issuance log from our backend API
      const logResponse = await fetch(`${backendApiUrl}/credentials/log/${tokenId}`);
      if (logResponse.ok) {
        const fetchedLog: IssuanceLog = await logResponse.json();
        setIssuanceLog(fetchedLog);
      } else {
        console.warn(`Could not fetch issuance log for token ${tokenId}. Status: ${logResponse.status}`);
      }

    } catch (e: any) {
      console.error("Error details:", e);
      setResult(null);
      setMetadata(null);
      setIssuanceLog(null);
      if (e.code === 'CALL_EXCEPTION' || (e.info && e.info.error && e.info.error.message.includes("nonexistent token"))) {
        setError(`Verification failed. Token ID "${tokenId}" does not exist.`);
      } else {
        setError(e.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderResultCard = () => {
    if (!result || !metadata) return null;

    const imageUrl = formatIpfsUrl(metadata.image);
    const textAttributes = metadata.attributes.filter(
      attr => !(typeof attr.value === 'string' && attr.value.startsWith('data:image/'))
    );

    return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-8 w-full max-w-4xl bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-6 sm:p-8 z-10"
        >
          <div className={`flex items-center justify-center gap-3 p-3 rounded-lg mb-6 text-lg font-bold ${result.isRevoked ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
            {result.isRevoked ? <ShieldAlert className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />}
            <span>Credential is {result.isRevoked ? "REVOKED" : "VALID"}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold text-white md:hidden mb-4 text-center">{metadata.name}</h2>
              <img src={imageUrl} alt="Credential Image" className="rounded-lg shadow-lg w-full h-auto border-2 border-[#00ADB5]/50"/>
            </div>

            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold text-white hidden md:block">{metadata.name}</h2>
              <p className="text-[#EEEEEE]/70 text-sm">{metadata.description}</p>
              
              {textAttributes.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-2 border-b-2 border-[#00ADB5]/30 pb-1">Attributes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {textAttributes.map(attr => (
                            <div key={attr.trait_type} className="bg-[#393E46]/30 p-2 rounded-md">
                                <p className="font-semibold text-[#EEEEEE]/60">{attr.trait_type}</p>
                                <p className="font-mono break-words">{String(attr.value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}
              
              <div>
                  <h3 className="font-bold text-lg mb-2 border-b-2 border-[#00ADB5]/30 pb-1">Blockchain Details</h3>
                  <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2"><Hash size={14}/>Token ID</span>
                          <span className="font-mono text-[#00ADB5]">{tokenId}</span>
                      </div>
                      {issuanceLog ? (
                        <>
                          <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2"><CalendarDays size={14}/>Issued On</span>
                              <span className="font-mono">{new Date(issuanceLog.issuedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2"><Info size={14}/>Transaction Hash</span>
                              <a href={`https://www.oklink.com/amoy/tx/${issuanceLog.transactionHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[#00ADB5] hover:underline flex items-center gap-1">
                                  {`${issuanceLog.transactionHash.substring(0,6)}...${issuanceLog.transactionHash.substring(issuanceLog.transactionHash.length-4)}`} <ExternalLink size={12}/>
                              </a>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                           <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2"><Info size={14}/>Transaction Hash</span>
                           <span className="font-mono text-sm text-[#EEEEEE]/50">Not Found</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                           <span className="font-semibold text-[#EEEEEE]/60 flex items-center gap-2"><User size={14}/>Current Owner</span>
                           <span className="font-mono truncate" title={result.owner}>{`${result.owner.substring(0,6)}...${result.owner.substring(result.owner.length-4)}`}</span>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingParticles />
        
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="flex items-center gap-2 text-[#EEEEEE]/70 hover:text-[#00ADB5] transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
            </Link>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-[#222831]/80 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-6 sm:p-8 z-10"
        >
            <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-[#00ADB5] to-[#393E46] p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Credential Verification
                </h1>
                <p className="text-[#EEEEEE]/70 mt-2">
                    Enter the Token ID to verify the authenticity and status of a credential.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter Token ID (e.g., 1)"
                    min="0"
                    className="w-full px-4 py-3 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:ring-2 focus:ring-[#00ADB5] focus:border-[#00ADB5] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    disabled={isLoading}
                    onKeyUp={(e) => e.key === 'Enter' && handleVerification()}
                />
                <button
                    onClick={handleVerification}
                    disabled={isLoading || !tokenId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00ADB5] text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                        </>
                    ) : (
                        "Verify"
                    )}
                </button>
            </div>
        </motion.div>

        {error && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full max-w-md bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center z-10"
            >
                {error}
            </motion.div>
        )}
        
        {result && metadata && renderResultCard()}
    </main>
  );
}