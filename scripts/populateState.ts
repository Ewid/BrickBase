// scripts/populateState.ts
import { ethers } from "hardhat";
import { 
  PropertyToken, 
  PropertyNFT, 
  PropertyRegistry, 
  RentDistribution, 
  PropertyMarketplace, 
  PropertyDAO,
  IERC20
} from "../typechain-types";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Get deployed contract addresses from environment variables
interface DeployedAddresses {
  propertyTokenFactory: string;
  propertyNFT: string;
  propertyRegistry: string;
  rentDistribution: string;
  propertyMarketplace: string;
  propertyDAO: string;
  // Map to store property token addresses by name
  propertyTokens: { [key: string]: string };
  // USDC token address
  usdcToken: string;
}

// Populate with your deployed contract addresses or use .env
const deployedAddresses: DeployedAddresses = {
  propertyTokenFactory: process.env.PROPERTY_TOKEN_FACTORY_ADDRESS || "0x4A30089743ACA139Ea15aEFfFDee64bE43af7095",
  propertyNFT: process.env.PROPERTY_NFT_ADDRESS || "0x49963ff38071Ec3B0761DaF358310C68beC60Ca1",
  propertyRegistry: process.env.PROPERTY_REGISTRY_ADDRESS || "0x0a50A499CD04880FA8ad1d090Aa3b29280289705",
  rentDistribution: process.env.RENT_DISTRIBUTION_ADDRESS || "0x70FEaB157a7551B047a9aCE9267007AE0Bc3d398",
  propertyMarketplace: process.env.PROPERTY_MARKETPLACE_ADDRESS || "0xAbb15D438f08e4b9F15bcEB1B0F9095d8eb28133",
  propertyDAO: process.env.PROPERTY_DAO_ADDRESS || "0x2a6897526D504a08645051d9a5Bd10185fDd8D18",
  propertyTokens: {
    "Miami Beachfront Villa": process.env.MBV_TOKEN_ADDRESS || "0xD7E659016259efbf6BC9595532F753BdF02f51e2",
    "Manhattan Luxury Condo": process.env.MLC_TOKEN_ADDRESS || "0x59c3D2B6186B68cfe45F5f865bF723d83Bef0C7b",
    "San Francisco Modern Townhouse": process.env.SFMT_TOKEN_ADDRESS || "0x415781420DF868fE87E2DC6b3025953E4cE71B01",
    "Chicago Downtown Penthouse": process.env.CDP_TOKEN_ADDRESS || "0x5EFC4D9A8cf3625aaE4f5337F2e9E8b1b53E52E8",
  },
  usdcToken: process.env.USDC_TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
};

// Property details
const properties = [
  {
    name: "Miami Beachfront Villa",
    symbol: "MBV",
    value: ethers.parseUnits("2500000", 6), // $2.5M
    tokenPrice: ethers.parseUnits("250", 6), // $250
    supply: 10000,  // 10,000 tokens
    monthlyRent: ethers.parseUnits("10000", 6), // $10,000/month
  },
  {
    name: "Manhattan Luxury Condo",
    symbol: "MLC",
    value: ethers.parseUnits("3200000", 6), // $3.2M
    tokenPrice: ethers.parseUnits("320", 6), // $320
    supply: 10000,  // 10,000 tokens
    monthlyRent: ethers.parseUnits("15000", 6), // $15,000/month
  },
  {
    name: "San Francisco Modern Townhouse",
    symbol: "SFMT",
    value: ethers.parseUnits("3800000", 6), // $3.8M
    tokenPrice: ethers.parseUnits("380", 6), // $380
    supply: 10000,  // 10,000 tokens
    monthlyRent: ethers.parseUnits("18000", 6), // $18,000/month
  },
  {
    name: "Chicago Downtown Penthouse",
    symbol: "CDP",
    value: ethers.parseUnits("4200000", 6), // $4.2M
    tokenPrice: ethers.parseUnits("420", 6), // $420
    supply: 10000,  // 10,000 tokens
    monthlyRent: ethers.parseUnits("20000", 6), // $20,000/month
  }
];

// Listing details for each property
const listings = [
  { 
    property: "Miami Beachfront Villa",
    tokenAmount: 50, // 50 tokens
    pricePerToken: ethers.parseUnits("255", 6), // $255 per token (2% premium)
  },
  { 
    property: "Manhattan Luxury Condo",
    tokenAmount: 75, // 75 tokens
    pricePerToken: ethers.parseUnits("330", 6), // $330 per token (3% premium)
  },
  { 
    property: "San Francisco Modern Townhouse",
    tokenAmount: 100, // 100 tokens
    pricePerToken: ethers.parseUnits("390", 6), // $390 per token (2.6% premium)
  },
  { 
    property: "Chicago Downtown Penthouse",
    tokenAmount: 120, // 120 tokens
    pricePerToken: ethers.parseUnits("440", 6), // $440 per token (4.8% premium)
  }
];

async function main() {
  try {
    // Get signers - on testnet we only have the deployer
    const [deployer] = await ethers.getSigners();
    console.log("Using deployer address:", deployer.address);
    
    // Check if addresses are configured
    if (!deployedAddresses.propertyTokenFactory || !deployedAddresses.propertyNFT ||
        !deployedAddresses.propertyRegistry || !deployedAddresses.rentDistribution || 
        !deployedAddresses.propertyMarketplace) {
      throw new Error("Contract addresses not properly configured in .env");
    }

    // Connect to deployed contracts
    console.log("\nConnecting to deployed contracts...");
    
    const propertyTokenFactory = await ethers.getContractAt(
      "PropertyTokenFactory",
      deployedAddresses.propertyTokenFactory
    );
    
    const propertyNFT = await ethers.getContractAt(
      "PropertyNFT",
      deployedAddresses.propertyNFT
    ) as PropertyNFT;
    
    const propertyRegistry = await ethers.getContractAt(
      "PropertyRegistry",
      deployedAddresses.propertyRegistry
    ) as PropertyRegistry;
    
    const rentDistribution = await ethers.getContractAt(
      "RentDistribution",
      deployedAddresses.rentDistribution
    ) as RentDistribution;
    
    const propertyMarketplace = await ethers.getContractAt(
      "PropertyMarketplace",
      deployedAddresses.propertyMarketplace
    ) as PropertyMarketplace;
    
    // Connect to PropertyDAO (only if address exists)
    let propertyDAO;
    if (deployedAddresses.propertyDAO) {
      propertyDAO = await ethers.getContractAt(
        "PropertyDAO",
        deployedAddresses.propertyDAO
      ) as PropertyDAO;
      console.log("Connected to PropertyDAO");
    }

    // Connect to PropertyToken contracts
    const propertyTokens: { [key: string]: PropertyToken } = {};
    for (const prop of properties) {
      const tokenAddress = deployedAddresses.propertyTokens[prop.name];
      if (tokenAddress) {
        propertyTokens[prop.name] = await ethers.getContractAt("PropertyToken", tokenAddress) as PropertyToken;
        console.log(`Connected to ${prop.name} token at ${tokenAddress}`);
      } else {
        console.warn(`No address found for ${prop.name} token, skipping`);
      }
    }

    // Connect to USDC token
    const usdc = await ethers.getContractAt(
      "IERC20",
      deployedAddresses.usdcToken
    ) as IERC20;
    console.log(`Connected to USDC token at ${deployedAddresses.usdcToken}`);

    // Mint NFTs for each property
    console.log("\nMinting property NFTs...");
    let mintedNFTCount = 0;
    for (const prop of properties) {
      try {
        const tokenAddress = deployedAddresses.propertyTokens[prop.name];
        if (!tokenAddress) {
          console.warn(`No token address found for ${prop.name}, skipping NFT minting`);
          continue;
        }

        // First check if the NFT actually exists in the PropertyNFT contract
        const tokenId = mintedNFTCount;
        let nftExists = false;
        
        try {
          // Try to call ownerOf to check if the NFT exists
          const owner = await propertyNFT.ownerOf(tokenId);
          console.log(`NFT for ${prop.name} already exists with tokenId ${tokenId} owned by ${owner}`);
          nftExists = true;
        } catch (error) {
          console.log(`NFT with tokenId ${tokenId} doesn't exist yet, will mint it`);
        }
        
        // If NFT exists, check if it's registered in the PropertyRegistry
        // If not, register it
        if (nftExists) {
          try {
            const registeredTokenAddress = await propertyRegistry.getPropertyToken(deployedAddresses.propertyNFT, tokenId);
            if (registeredTokenAddress.toLowerCase() !== tokenAddress.toLowerCase()) {
              console.log(`Updating registry for tokenId ${tokenId} to point to ${tokenAddress}`);
              await (propertyRegistry as any).registerProperty(deployedAddresses.propertyNFT, tokenId, tokenAddress);
            }
          } catch (error) {
            console.log(`NFT exists but not registered, registering tokenId ${tokenId} with address ${tokenAddress}`);
            await (propertyRegistry as any).registerProperty(deployedAddresses.propertyNFT, tokenId, tokenAddress);
          }
          
          mintedNFTCount++;
          continue;
        }

        // Format property location and details
        const propertyLocation = `${prop.name} Location`;
        const squareFootage = 2000 + (mintedNFTCount * 500); // Varying square footage
        const purchasePrice = prop.value; // Using the property value as purchase price
        const constructionYear = 2020 - (mintedNFTCount * 5); // Varying construction years
        const propertyType = "Residential";
        
        // Use the real IPFS CIDs for each property
        let ipfsCID = "";
        if (prop.name === "Miami Beachfront Villa") {
          ipfsCID = "bafkreih4fcdvf5mhpjxqfwp43n2r2cq2x7qzqsqp5khxcfbvhfihl7prau";
        } else if (prop.name === "Manhattan Luxury Condo") {
          ipfsCID = "bafkreighvyg3j4ajbssvszw4kzdsovo6sbycfm3cbn6pfw6uqa2qbgmamy";
        } else if (prop.name === "San Francisco Modern Townhouse") {
          ipfsCID = "bafkreifzkvccvttmnzhpcmmuz6vwpdsqjz4fcvjwa4milc2mqmojo45roa";
        } else if (prop.name === "Chicago Downtown Penthouse") {
          ipfsCID = "bafkreihha34zb3l6f3wcfrig53h6ooyarxg7fpujediqcinzgeb4ok6f5u";
        }
        const metadataURI = `ipfs://${ipfsCID}`;
        
        // Mint the NFT
        console.log(`Minting NFT for ${prop.name} with tokenId ${tokenId} and metadata ${metadataURI}`);
        const mintTx = await propertyNFT.mintProperty(
          deployer.address,
          metadataURI,
          propertyLocation,
          squareFootage,
          purchasePrice,
          constructionYear,
          propertyType,
          tokenAddress
        );
        
        await mintTx.wait();
        console.log(`Minted NFT for ${prop.name} with tokenId ${tokenId}`);
        
        // Register the NFT in the PropertyRegistry if not already registered
        try {
          const registeredTokenAddress = await propertyRegistry.getPropertyToken(deployedAddresses.propertyNFT, tokenId);
          if (registeredTokenAddress.toLowerCase() !== tokenAddress.toLowerCase()) {
            console.log(`Updating registry for tokenId ${tokenId} to point to ${tokenAddress}`);
            await (propertyRegistry as any).registerProperty(deployedAddresses.propertyNFT, tokenId, tokenAddress);
          } else {
            console.log(`Property already registered correctly in registry for tokenId ${tokenId}`);
          }
        } catch (error) {
          console.log(`Registering tokenId ${tokenId} with token address ${tokenAddress}`);
          await (propertyRegistry as any).registerProperty(deployedAddresses.propertyNFT, tokenId, tokenAddress);
        }
        
        mintedNFTCount++;
      } catch (error: any) {
        console.warn(`Error processing ${prop.name}: ${error.message}`);
      }
    }

    // After all properties are processed, update NFT metadata with IPFS CIDs
    console.log("\n--- Updating NFT metadata with IPFS CIDs ---");
    
    // Define CIDs for each property
    const propertyCIDs: Record<string, string> = {
      "Miami Beachfront Villa": "bafkreih4fcdvf5mhpjxqfwp43n2r2cq2x7qzqsqp5khxcfbvhfihl7prau",
      "Manhattan Luxury Condo": "bafkreighvyg3j4ajbssvszw4kzdsovo6sbycfm3cbn6pfw6uqa2qbgmamy",
      "San Francisco Modern Townhouse": "bafkreifzkvccvttmnzhpcmmuz6vwpdsqjz4fcvjwa4milc2mqmojo45roa",
      "Chicago Downtown Penthouse": "bafkreihha34zb3l6f3wcfrig53h6ooyarxg7fpujediqcinzgeb4ok6f5u"
    };
    
    // Loop through properties and update their token URIs
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      const tokenId = i; // Assuming tokenIds match the property index
      const ipfsCID = propertyCIDs[prop.name];
      
      if (!ipfsCID) {
        console.error(`❌ No CID found for property ${prop.name}`);
        continue;
      }
      
      const metadataURI = `ipfs://${ipfsCID}`;
      
      try {
        console.log(`Updating metadata for ${prop.name} (tokenId: ${tokenId}) to ${metadataURI}`);
        const tx = await propertyNFT.updateTokenURI(tokenId, metadataURI);
        await tx.wait();
        console.log(`✅ Metadata updated successfully for ${prop.name}`);
      } catch (error: any) {
        console.error(`❌ Error updating metadata for ${prop.name}:`, error.message || String(error));
      }
    }

    // Mint tokens to deployer first
    console.log("\nMinting tokens to deployer account...");
    for (const [propertyName, propertyToken] of Object.entries(propertyTokens)) {
      try {
        // Check if deployer already has tokens
        const deployerBalance = await propertyToken.balanceOf(deployer.address);
        if (deployerBalance == 0n) {
          // Token owner should be the deployer, so they should be able to mint
          const mintAmount = ethers.parseUnits("10000", 18); // Mint the total supply
          await propertyToken.mint(deployer.address, mintAmount);
          console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} ${propertyName} tokens to deployer`);
        } else {
          console.log(`Deployer already has ${ethers.formatUnits(deployerBalance, 18)} ${propertyName} tokens`);
        }
      } catch (error: any) {
        console.warn(`Error minting ${propertyName} tokens: ${error.message}`);
      }
    }

    // Since we're on a testnet, we'll use only the deployer account
    console.log("\nDistributing property tokens to addresses...");
    let distributedTokenCount = 0;
    
    // Create some hardcoded test addresses to transfer tokens to
    const testAddresses = [
      "0xa83126A279960797233d48488e5908d6C1E72f2F", // User's first address
      "0xcd64902df08575Df5F3499CdA6F14154fB48E362"  // User's second address
    ];
    
    for (const [propertyName, propertyToken] of Object.entries(propertyTokens)) {
      // Distribute tokens to test addresses
      for (const testAddress of testAddresses) {
        try {
          // Transfer 200 tokens to each test address for each property
          const tokenAmount = ethers.parseUnits("200", 18);
          
          // Check balance of deployer to make sure they have enough tokens
          const deployerBalance = await propertyToken.balanceOf(deployer.address);
          console.log(`Deployer balance of ${propertyName}: ${ethers.formatUnits(deployerBalance, 18)}`);
          
          if (deployerBalance >= tokenAmount) {
            await propertyToken.transfer(testAddress, tokenAmount);
            distributedTokenCount++;
            console.log(`Transferred 200 ${propertyName} tokens to ${testAddress}`);
          } else {
            console.warn(`Deployer doesn't have enough ${propertyName} tokens to transfer`);
          }
        } catch (error: any) {
          console.warn(`Error transferring ${propertyName} tokens: ${error.message}`);
        }
      }
    }
    
    // Step 2: Create listings with deployer account
    console.log("\nCreating listings on marketplace...");
    let createdListingsCount = 0;
    
    for (const listing of listings) {
      try {
        // Get the property token address
        const tokenAddress = deployedAddresses.propertyTokens[listing.property];
        if (!tokenAddress) {
          console.warn(`No token address found for ${listing.property}, skipping listing`);
          continue;
        }
        
        // Deployer creates a listing for each property
        const propertyToken = await ethers.getContractAt("PropertyToken", tokenAddress) as PropertyToken;
        
        // Approve marketplace to transfer tokens
        const tokenAmount = ethers.parseUnits(listing.tokenAmount.toString(), 18);
        
        // Check balance to ensure deployer has enough tokens
        const deployerBalance = await propertyToken.balanceOf(deployer.address);
        if (deployerBalance < tokenAmount) {
          console.warn(`Deployer doesn't have enough ${listing.property} tokens to create listing`);
          continue;
        }
        
        await propertyToken.approve(deployedAddresses.propertyMarketplace, tokenAmount);
        
        // Create listing
        const tx = await propertyMarketplace.createListing(
          tokenAddress,
          tokenAmount,
          listing.pricePerToken
        );
        await tx.wait();
        createdListingsCount++;
        console.log(`Created listing for ${listing.tokenAmount} ${listing.property} tokens at ${ethers.formatUnits(listing.pricePerToken, 6)} USDC per token`);
      } catch (error: any) {
        console.warn(`Error creating listing for ${listing.property}: ${error.message}`);
      }
    }
    
    // Step 3: Deposit rent for properties
    console.log("\nDepositing rent for properties...");
    let rentDepositsCount = 0;
    
    for (const property of properties) {
      try {
        // Get the property token address
        const tokenAddress = deployedAddresses.propertyTokens[property.name];
        if (!tokenAddress) {
          console.warn(`No token address found for ${property.name}, skipping rent deposit`);
          continue;
        }
        
        // Use USDC for rent payments
        const threeMonthsRent = property.monthlyRent * BigInt(3);
        
        // First approve USDC transfer
        await usdc.approve(rentDistribution.getAddress(), threeMonthsRent);
        
        // Then deposit rent using USDC with the new function signature
        await (rentDistribution as any).depositRent(tokenAddress, threeMonthsRent);
        rentDepositsCount++;
        console.log(`Deposited 3 months of rent (${ethers.formatUnits(threeMonthsRent, 6)} USDC) for ${property.name}`);
      } catch (error: any) {
        console.warn(`Error depositing rent for ${property.name}: ${error.message}`);
      }
    }
    
    // Step 4: Create DAO proposals (only if DAO is deployed)
    let createdProposalsCount = 0;
    if (propertyDAO) {
      console.log("\nCreating DAO proposals...");
      
      // Deployer creates a proposal
      const firstPropertyName = Object.keys(propertyTokens)[0];
      const firstPropertyToken = propertyTokens[firstPropertyName];
      const firstPropertyTokenAddress = await firstPropertyToken.getAddress();
      
      if (firstPropertyToken) {
        try {
          // Check deployer's balance
          const deployerBalance = await firstPropertyToken.balanceOf(deployer.address);
          console.log(`Deployer's ${firstPropertyName} token balance: ${ethers.formatUnits(deployerBalance, 18)}`);
          
          // Create a proposal
          const proposalDescription = `Increase monthly rent for ${firstPropertyName} by 5%`;
          
          // Mock function call data for the proposal
          const mockCalldata = "0x";
          const mockTarget = deployedAddresses.rentDistribution;
          
          // Try to create a proposal with the property token address
          await (propertyDAO as any).createProposal(
            proposalDescription,
            mockTarget,
            mockCalldata,
            firstPropertyTokenAddress // Pass the relevant property token address
          );
          
          createdProposalsCount++;
          console.log(`Created proposal: "${proposalDescription}" for property ${firstPropertyTokenAddress}`);
        } catch (error: any) {
          console.warn(`Error creating proposal: ${error.message}`);
        }
      }
    }
    
    // Summary
    console.log("\n--- Populate State Summary ---");
    console.log(`Properties with tokens distributed: ${distributedTokenCount}`);
    console.log(`Listings created: ${createdListingsCount}`);
    console.log(`Rent deposits made: ${rentDepositsCount}`);
    console.log(`DAO proposals created: ${createdProposalsCount}`);
    console.log("-----------------------------");
    
  } catch (error) {
    console.error("Error in populateState script:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
