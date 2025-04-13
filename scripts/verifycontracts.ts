import { ethers } from "hardhat";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

// Define the type for our addresses and arguments
interface ContractAddresses {
  [key: string]: string;
}

interface ContractArgs {
  [key: string]: (string | number)[];
}

// Get addresses from .env
const addresses: ContractAddresses = {
  propertyTokenFactory: process.env.PROPERTY_TOKEN_FACTORY_ADDRESS || "0x67410f8784eA3447c4f20A60840D3269F1c5e135",
  propertyNFT: process.env.PROPERTY_NFT_ADDRESS || "0x2923f8C35aBC526041A64e8885ec61E1c654DFf1",
  propertyRegistry: process.env.PROPERTY_REGISTRY_ADDRESS || "0x9f5bA89EACeCeA215c9fF948068c1F923ab8E068",
  rentDistribution: process.env.RENT_DISTRIBUTION_ADDRESS || "0xECfC4AEA8DF2aeFd6a292F9bE37E4F8cDd913b7D",
  propertyMarketplace: process.env.PROPERTY_MARKETPLACE_ADDRESS || "0xAd6e864BEaD48b9DdEcc0cE53CA25cAEdeBEC064",
  propertyDAO: process.env.PROPERTY_DAO_ADDRESS || "0xdDD158d7cb2cC650e54E2fa4E57B7d2494F5297F",
  // Property tokens
  "MBVToken": process.env.MBV_TOKEN_ADDRESS || "0x55E6e92C51B7E9d94a90dB539B0636a7BB713325",
  "MLCToken": process.env.MLC_TOKEN_ADDRESS || "0x13690b78E6d8C40019ce71e7902AFdB1d287Ff47",
  "SFMTToken": process.env.SFMT_TOKEN_ADDRESS || "0xA06C5216a8a0Bf26a7E09c47e2211215a058a3d5",
  "CDPToken": process.env.CDP_TOKEN_ADDRESS || "0x1038Da4f080Df159e9bdc6b47d6268B060d0586C"
};

// Get owner address from .env
const ownerAddress = process.env.OWNER_ADDRESS || "0xa83126A279960797233d48488e5908d6C1E72f2F"; // Current deployer address

// Get USDC token address from .env
const usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Constructor arguments - update these based on your deployment parameters
const args: ContractArgs = {
  propertyTokenFactory: [ownerAddress],
  propertyNFT: [ownerAddress],
  propertyRegistry: [ownerAddress],
  rentDistribution: [ownerAddress],
  propertyMarketplace: ["100", ownerAddress, usdcTokenAddress, ownerAddress], // 1% fee, fee recipient, USDC token, owner
  propertyDAO: [
    addresses["MBVToken"], // Use the first property token for DAO governance
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
  console.log("Verifying contracts with the following addresses:");
  console.log(addresses);
  
  const contracts = Object.keys(addresses);
  
  for (const contract of contracts) {
    console.log(`\nVerifying ${contract}...`);
    try {
      const contractArgs = args[contract];
      if (!contractArgs) {
        console.warn(`No constructor arguments found for ${contract}, skipping verification`);
        continue;
      }
      
      const command = `npx hardhat verify --network baseSepolia ${addresses[contract]} ${contractArgs.join(' ')}`;
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