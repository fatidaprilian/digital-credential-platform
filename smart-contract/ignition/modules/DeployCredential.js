const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VerifiableCredentialModule", (m) => {
  const credentialContract = m.contract("VerifiableCredential");

  return { credentialContract };
});