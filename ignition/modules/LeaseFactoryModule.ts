import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LeaseFactoryModule", (m) => {
  const leaseFactory = m.contract("LeaseFactory");

  return { leaseFactory };
});
