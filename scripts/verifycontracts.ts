import { ethers } from "hardhat";
import { execSync } from "child_process";

// Define the type for our addresses and arguments
interface ContractAddresses {
  [key: string]: string;
}

interface ContractArgs {
  [key: string]: (string | number)[];
}

// Contract addresses from the latest deployment
const addresses: ContractAddresses = {
  propertyTokenFactory: "0x40e30cf089F379fcfbfaa5af508105968C66abEB",
  propertyNFT: "0x9262a0D1cd71eb8DA5ff353dfeEd0C94EBd75E83",
  propertyRegistry: "0xCD23507e412F22bE818dfD8A3B61542f87A950Af",
  rentDistribution: "0x83093a257d419cdeb50917FA91df7A23eA59e71A",
  propertyMarketplace: "0x5866533Eb5AD5dDd583c7A91F98A70A8397e61C0",
  propertyDAO: "0xc6410148a595D41aa69Af8f602d01e206a3FF883",
  // Property tokens
  "MBVToken": "0x2292fb1601A7D3E504ECa31e142A2Ac67aa9b3cA",
  "MLCToken": "0xDAfD2b191C749002FEfACE20Adb01C9772965a15",
  "SFMTToken": "0x72fE06FBe2E47422c07586418aCF704AA82FD246",
  "CDPToken": "0x0DF7E350030E1b4e17643A918B9D9D439e8C2eC2"
};

// Get owner address from .env
const ownerAddress = process.env.OWNER_ADDRESS || "0xa83126A279960797233d48488e5908d6C1E72f2F"; // Current deployer address

// Constructor arguments - update these based on your deployment parameters
const args: ContractArgs = {
  propertyTokenFactory: [ownerAddress],
  propertyNFT: [ownerAddress],
  propertyRegistry: [ownerAddress],
  rentDistribution: [ownerAddress],
  propertyMarketplace: ["100", ownerAddress, ownerAddress], // 1% fee, owner as fee recipient
  propertyDAO: [
    "0x2292fb1601A7D3E504ECa31e142A2Ac67aa9b3cA", // Miami Beachfront Villa token address
    "500", // proposalThreshold (5%)
    "259200", // votingPeriod (3 days in seconds)
    "86400", // executionDelay (1 day in seconds)
    ownerAddress
  ],
  // Property tokens
  "MBVToken": ["Miami Beachfront Villa", "MBV", "2500000000000", "10000000000000000000000", ownerAddress],
  "MLCToken": ["Manhattan Luxury Condo", "MLC", "3200000000000", "10000000000000000000000", ownerAddress],
  "SFMTToken": ["San Francisco Modern Townhouse", "SFMT", "3800000000000", "10000000000000000000000", ownerAddress],
  "CDPToken": ["Chicago Downtown Penthouse", "CDP", "4200000000000", "10000000000000000000000", ownerAddress]
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