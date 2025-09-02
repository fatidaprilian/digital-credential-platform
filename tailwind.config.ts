// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna Netral & Latar
        background: '#ffffff',       // Putih
        foreground: '#1e293b',       // Abu-abu Gelap (Teks Utama)
        card: '#f8fafc',             // Abu-abu Terang (Background Card)
        
        // Teks Sekunder
        muted: {
          DEFAULT: '#f8fafc',         // Background untuk elemen muted
          foreground: '#64748b',     // Abu-abu Medium (Teks Sekunder)
        },
        
        // Warna Brand
        primary: {
          DEFAULT: '#628ce7ff',         // Biru
          foreground: '#ffffff',     // Teks di atas warna primer
        },
        secondary: {
          DEFAULT: '#10b981',         // Hijau
          foreground: '#ffffff',     // Teks di atas warna sekunder
        },
        accent: {
          DEFAULT: '#f59e0b',         // Oranye
          foreground: '#ffffff',     // Teks di atas warna aksen
        },

        // Warna Fungsional
        destructive: '#dc2626',      // Merah Error
        success: '#22c55e',          // Hijau Sukses
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;