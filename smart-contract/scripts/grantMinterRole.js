// smart-contract/scripts/grantMinterRole.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not set in .env file");
  }

  // Akun yang akan menerima MINTER_ROLE adalah akun yang sama dengan deployer
  const minterAddress = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY).address;

  console.log(`Connecting to contract at: ${contractAddress}`);
  const VerifiableCredential = await ethers.getContractFactory(
    "VerifiableCredential"
  );
  const contract = VerifiableCredential.attach(contractAddress);

  console.log(`Granting MINTER_ROLE to: ${minterAddress}...`);

  const minterRole = await contract.MINTER_ROLE();
  const tx = await contract.grantRole(minterRole, minterAddress);
  await tx.wait();

  console.log("MINTER_ROLE granted successfully!");
  const hasRole = await contract.hasRole(minterRole, minterAddress);
  console.log(`Does ${minterAddress} have MINTER_ROLE? ${hasRole}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});