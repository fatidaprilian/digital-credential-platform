"use client";

import { useState, useEffect } from "react";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { Web3AuthButton } from "@/components/Web3AuthButton";

export default function HolderProfilePage() {
  const { isConnected, address, isLoading: isAuthLoading } = useWeb3Auth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Ganti dengan endpoint API backend Anda nanti
  const API_URL = `/api/holder/profile/${address}`; 

  useEffect(() => {
    if (isConnected && address) {
      // TODO: Ganti dengan logika fetch data dari API backend Anda
      // fetch(API_URL)
      //   .then(res => res.json())
      //   .then(data => {
      //     setName(data.name || "");
      //     setBio(data.bio || "");
      //   })
      //   .catch(err => console.error("Failed to fetch profile", err))
      //   .finally(() => setIsLoading(false));
      
      // Untuk sekarang, kita lewati fetch
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // TODO: Ganti dengan logika POST/PUT ke API backend Anda
    console.log("Saving profile:", { name, bio });
    // try {
    //   const response = await fetch(API_URL, {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, bio }),
    //   });
    //   if (!response.ok) throw new Error("Failed to save profile");
    //   setMessage("Profile saved successfully!");
    // } catch (error) {
    //   setMessage("Error saving profile.");
    //   console.error(error);
    // } finally {
    //   setIsLoading(false);
    // }
    
    // Simulasikan save
    setTimeout(() => {
        setMessage("Profile saved successfully! (Simulation)");
        setIsLoading(false);
    }, 1000);
  };

  if (isAuthLoading) {
    return <div className="text-center p-10">Loading authentication...</div>;
  }
  
  if (!isConnected) {
    return (
        <div className="text-center p-10">
            <h1 className="text-2xl mb-4">Please Connect Your Wallet</h1>
            <Web3AuthButton />
        </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg">
        <p className="text-sm text-gray-400 mb-4">Wallet Address: <span className="font-mono">{address}</span></p>
        <form onSubmit={handleSaveProfile}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-white mb-2">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
              placeholder="Your Name"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="bio" className="block text-white mb-2">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
              rows={4}
              placeholder="Tell us about yourself"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500"
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </button>
          {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
        </form>
      </div>
    </div>
  );
}