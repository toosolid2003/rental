import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Default timestamps for local development (Oct 2025 - Oct 2027)
const DEFAULT_PAY_DATE = Math.floor(new Date("10/05/2025").getTime() / 1000);
const DEFAULT_START_DATE = Math.floor(new Date("10/02/2025").getTime() / 1000);
const DEFAULT_END_DATE = Math.floor(new Date("10/02/2027").getTime() / 1000);
const DEFAULT_RENT_WEI = "10000000000000000"; // 0.01 ETH in wei

export default buildModule(
  "LocalRentalScoreModule",
  (m) => {
    // For local development, use Hardhat's default accounts
    const renter = m.getParameter<string>("renter", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const landlord = m.getParameter<string>("landlord", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0");
    const location = m.getParameter<string>("location", "Test Location");

    // Dates as Unix timestamps, rent in wei
    const payDate = m.getParameter<number>("payDate", DEFAULT_PAY_DATE);
    const startDate = m.getParameter<number>("startDate", DEFAULT_START_DATE);
    const endDate = m.getParameter<number>("endDate", DEFAULT_END_DATE);
    const expectedRent = m.getParameter<string>("expectedRent", DEFAULT_RENT_WEI);

    const vault = m.contract("Rental", [payDate, expectedRent, renter, landlord, startDate, endDate, location]);

    return { vault };
  }
);