// smart-contract/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Ambil variabel dari .env
const amoyRpcUrl = process.env.POLYGON_AMOY_RPC_URL || "";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Konfigurasi untuk jaringan Amoy Testnet
    amoy: {
      url: amoyRpcUrl,
      accounts: [privateKey],
    },
  },
};