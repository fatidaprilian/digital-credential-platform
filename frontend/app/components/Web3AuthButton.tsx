// app/components/Web3AuthButton.tsx
"use client";

import { useWeb3Auth } from "@/providers/Web3AuthProvider";

export function Web3AuthButton() {
  const { connect, disconnect, isConnected, isLoading, address } = useWeb3Auth();

  // Loading State
  if (isLoading) {
    return (
      <button
        disabled
        className="px-5 py-2.5 bg-[#393E46]/50 text-[#EEEEEE] rounded-xl cursor-not-allowed flex items-center gap-2"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#EEEEEE]"></div>
        Loading...
      </button>
    );
  }

  // Connected State
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Address Display */}
        <div className="px-4 py-2 bg-white/80 text-[#393E46] font-semibold rounded-xl text-sm border border-gray-200">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        {/* Disconnect Button */}
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-[#393E46] hover:bg-[#222831] text-[#EEEEEE] rounded-xl font-semibold transition-colors duration-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Disconnected State (Connect Button)
  return (
    <button
      id="web3auth-button" // ID for programmatic click from other components
      onClick={connect}
      disabled={isLoading}
      className="px-6 py-2.5 bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE] font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      Connect Wallet
    </button>
  );
}
