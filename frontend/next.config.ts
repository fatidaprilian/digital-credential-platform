import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'dweb.link',
    ],
  },
  webpack: (config) => {
    // Konfigurasi untuk mengatasi 'Module not found'
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      // Tambahkan baris ini untuk mengabaikan modul yang tidak perlu
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
};

export default nextConfig;