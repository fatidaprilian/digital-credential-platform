import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { polygonAmoy } from "viem/chains";

// Konfigurasi Client ID dari Web3Auth Dashboard Anda
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!;

// Inisialisasi Web3Auth
export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Ganti ke SAPPHIRE_MAINNET untuk production
  
  // Langsung teruskan chainConfig di sini
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: `0x${polygonAmoy.id.toString(16)}`,
    rpcTarget: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
    displayName: polygonAmoy.name,
    blockExplorerUrl: polygonAmoy.blockExplorers.default.url,
    ticker: polygonAmoy.nativeCurrency.symbol,
    tickerName: polygonAmoy.nativeCurrency.name,
    logo: "https://images.toruswallet.io/polygon.svg",
  },
  
  uiConfig: {
    appName: "Digital Credential Platform",
    mode: "dark",
    loginMethodsOrder: ["google", "github", "twitter", "discord"],
    logoLight: "https://web3auth.io/images/web3authlog.png",
    logoDark: "https://web3auth.io/images/web3authlogodark.png",
    defaultLanguage: "en",
    modalZIndex: "99999",
    uxMode: "popup",
  },
});