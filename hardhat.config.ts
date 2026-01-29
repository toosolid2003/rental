import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const config: HardhatUserConfig = {
  networks: {
    sepolia:  {
      url: "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY,
      accounts: [process.env.WALLET_KEY!],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.WALLET_KEY!],
      chainId: 84532,
    },
  },
  solidity: "0.8.28",
};

export default config;
