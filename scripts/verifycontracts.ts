import { ethers } from "hardhat";
import { execSync } from "child_process";

// Define the type for our addresses and arguments
interface ContractAddresses {
  [key: string]: string;
}

interface ContractArgs {
  [key: string]: (string | number)[];
}

// Contract addresses from populateState.ts (updated)
const addresses: ContractAddresses = {
  propertyToken: "0x0B00bB2B901B607c718A4584dD236C310B28f49B",
  propertyNFT: "0x9F360f45e68f6B36b4a5863B7C6512D0E8789157",
  propertyRegistry: "0x04E8F7eF6AC987e55953EeB59fFB14Bb753035CE",
  rentDistribution: "0x8655e35343e0A5621577e13181da9A8F871d1985",
  propertyMarketplace: "0xB4D1F6B65fBf3f75a2A62BCb9307c695473Bb7D1",
  propertyDAO: "0xA08b643C8fB9466cc2Df94dA3bC69F3876794257"
};

// Get owner address from .env
const ownerAddress = process.env.OWNER_ADDRESS || "0xa83126A279960797233d48488e5908d6C1E72f2F"; // Replace with your owner address

// Constructor arguments - update these based on your deployment parameters
const args: ContractArgs = {
  propertyToken: ["BrickBase Property Example", "BPE", "1000000000000", "10000000000000000000000", ownerAddress],
  propertyNFT: [ownerAddress],
  propertyRegistry: [ownerAddress],
  rentDistribution: [ownerAddress],
  propertyMarketplace: ["100", ownerAddress, ownerAddress], // 1% fee, owner as fee recipient
  propertyDAO: [
    "0x0B00bB2B901B607c718A4584dD236C310B28f49B", // propertyToken address
    "500", // proposalThreshold (5%)
    "259200", // votingPeriod (3 days in seconds)
    "86400", // executionDelay (1 day in seconds)
    ownerAddress
  ]
};

async function main() {
  const contracts = Object.keys(addresses);
  
  for (const contract of contracts) {
    console.log(`Verifying ${contract}...`);
    try {
      const command = `npx hardhat verify --network baseSepolia ${addresses[contract]} ${args[contract].join(' ')}`;
      console.log(`Running command: ${command}`);
      execSync(command, { stdio: 'inherit' });
      console.log(`${contract} verified successfully!\n`);
    } catch (error) {
      console.error(`Error verifying ${contract}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });