// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Preparing deployment...\n");

  // Mengambil factory untuk contract VerifiableCredential
  const VerifiableCredential = await ethers.getContractFactory("VerifiableCredential");

  // Memulai proses deployment
  console.log("Deploying contract... Please wait.");
  const verifiableCredential = await VerifiableCredential.deploy();

  // Menunggu hingga deployment selesai
  await verifiableCredential.waitForDeployment();

  const contractAddress = await verifiableCredential.getAddress();
  
  console.log("\n====================================================");
  console.log("✅ Deployment Successful!");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log("====================================================\n");
  console.log("➡️  Next Action:");
  console.log(`   1. Copy the new contract address above.`);
  console.log(`   2. Paste it into your backend's .env file (CONTRACT_ADDRESS).`);
  console.log(`   3. Restart your backend server with 'docker compose up --build -d'.`);
  console.log("----------------------------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });