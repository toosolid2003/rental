import { ethers } from "hardhat";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import hre from "hardhat";

// Load .env if needed
dotenv.config();

async function main() {
  // 1. Compile contracts
await hre.run("compile");

  // 2. Deploy contract
  const Rental = await ethers.getContractFactory("Rental");
  const payDate = Math.floor(new Date("2025-07-20").getTime() / 1000);
  const expectedRent = ethers.parseEther("1.4"); // 1.4 ETH
  const renter = (await ethers.getSigners())[0].address;
  const startDate = Math.floor(new Date("2025-07-10").getTime() / 1000);
  const endDate = Math.floor(new Date("2027-07-10").getTime() / 1000);

  const rentalContract = await Rental.deploy(payDate, expectedRent, renter, startDate, endDate);
  await rentalContract.waitForDeployment();

  const contractAddress = await rentalContract.getAddress();

  console.log(`✅ Contract deployed at: ${contractAddress}`);

  // 3. Copy ABI to frontend
  const artifact = await hre.artifacts.readArtifact("Rental");
  const abiPath = path.join(__dirname, "../rental-frontend/src/lib/Rental.json");
  await fs.outputJson(abiPath, { abi: artifact.abi }, { spaces: 2 });
  console.log("📄 ABI written to frontend/lib/Rental.json");

  // 4. Write address to frontend .env.local
  const envPath = path.join(__dirname, "../rental-frontend/.env.local");
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
  await fs.outputFile(envPath, envContent);
  console.log("🔑 Address written to frontend/.env.local");

  // 5. Read renter from contract
  const renterFromContract = await rentalContract.owner();
  console.log(`👤 Renter in contract: ${renterFromContract}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});