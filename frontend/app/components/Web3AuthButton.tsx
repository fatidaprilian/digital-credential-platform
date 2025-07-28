"use client";

import { useWeb3Auth } from "@/providers/Web3AuthProvider";

export function Web3AuthButton() {
  const { connect, disconnect, isConnected, isLoading, address } = useWeb3Auth();

  if (isLoading) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-600 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm border border-green-600/30">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isLoading}
      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}