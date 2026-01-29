import { ethers } from "hardhat";

async function main() {
  const factory = await ethers.getContractAt(
    "LeaseFactory",
    "0xcd348F2209aBB7f2f3382e897E27EDA761371eeA"
  );

  const signer = (await ethers.getSigners())[0];
  console.log("Your address:", signer.address);

  const tenantLeases = await factory.getLeasesByTenant(signer.address);
  const landlordLeases = await factory.getLeasesByLandlord(signer.address);

  console.log("Leases as tenant:", tenantLeases);
  console.log("Leases as landlord:", landlordLeases);
}

main().catch(console.error);
