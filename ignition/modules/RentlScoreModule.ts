import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule(
  "RentalScoreModule",
  (m) => {
    // All parameters required for production deployment
    const renter = m.getParameter<string>("renter");
    const landlord = m.getParameter<string>("landlord");
    const location = m.getParameter<string>("location");

    // Dates as Unix timestamps, rent in wei
    const payDate = m.getParameter<number>("payDate");
    const startDate = m.getParameter<number>("startDate");
    const endDate = m.getParameter<number>("endDate");
    const expectedRent = m.getParameter<string>("expectedRent");

    const vault = m.contract("Rental", [payDate, expectedRent, renter, landlord, startDate, endDate, location]);

    return { vault };
  }
);