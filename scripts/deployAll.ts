// scripts/deployAll.ts
import { ethers } from "hardhat";
import { AddressLike } from "ethers";
import { PropertyRegistry, PropertyNFT } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const initialOwner = deployer.address; // Use deployer as initial owner
  
  // USDC token address on Base Sepolia - replace with the actual address
  // For testnet, you can use a mock USDC token or deploy one if needed
  const usdcTokenAddress = process.env.USDC_TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Mock address, replace with real one
  console.log(`Using USDC token address: ${usdcTokenAddress}`);

  // 1. Deploy PropertyTokenFactory first
  console.log("\nDeploying PropertyTokenFactory...");
  const PropertyTokenFactoryFactory = await ethers.getContractFactory("PropertyTokenFactory");
  const propertyTokenFactory = await PropertyTokenFactoryFactory.deploy(initialOwner);
  await propertyTokenFactory.waitForDeployment();
  const propertyTokenFactoryAddress = await propertyTokenFactory.getAddress();
  console.log(`PropertyTokenFactory deployed to: ${propertyTokenFactoryAddress}`);

  // 2. Deploy PropertyNFT
  console.log("\nDeploying PropertyNFT...");
  const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = await PropertyNFTFactory.deploy(initialOwner);
  await propertyNFT.waitForDeployment();
  const propertyNFTAddress = await propertyNFT.getAddress();
  console.log(`PropertyNFT deployed to: ${propertyNFTAddress}`);

  // 3. Deploy PropertyRegistry
  console.log("\nDeploying PropertyRegistry...");
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistryFactory.deploy(initialOwner);
  await propertyRegistry.waitForDeployment();
  const propertyRegistryAddress = await propertyRegistry.getAddress();
  console.log(`PropertyRegistry deployed to: ${propertyRegistryAddress}`);

  // 4. Deploy RentDistribution
  console.log("\nDeploying RentDistribution...");
  const RentDistributionFactory = await ethers.getContractFactory("RentDistribution");
  const rentDistribution = await RentDistributionFactory.deploy(initialOwner);
  await rentDistribution.waitForDeployment();
  const rentDistributionAddress = await rentDistribution.getAddress();
  console.log(`RentDistribution deployed to: ${rentDistributionAddress}`);
  
  // Set USDC token in RentDistribution using type casting to bypass TypeScript errors
  await (rentDistribution as any).setUSDCToken(usdcTokenAddress);
  console.log(`USDC token set in RentDistribution: ${usdcTokenAddress}`);

  // 5. Deploy PropertyMarketplace
  console.log("\nDeploying PropertyMarketplace...");
  const platformFeePercentage = 100; // 1% (100 basis points)
  const feeRecipient = initialOwner; // Platform fees go to deployer initially
  
  const PropertyMarketplaceFactory = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplaceFactory.deploy(
    platformFeePercentage,
    feeRecipient,
    usdcTokenAddress,
    initialOwner
  );
  
  await propertyMarketplace.waitForDeployment();
  const propertyMarketplaceAddress = await propertyMarketplace.getAddress();
  console.log(`PropertyMarketplace deployed to: ${propertyMarketplaceAddress}`);

  // 6. Create individual PropertyTokens for 4 properties
  console.log("\nCreating individual PropertyTokens for properties...");
  
  const properties = [
    {
      name: "Miami Beachfront Villa",
      symbol: "MBV",
      value: ethers.parseUnits("2500000", 6), // $2.5M
      supply: ethers.parseUnits("10000", 18)  // 10,000 tokens
    },
    {
      name: "Manhattan Luxury Condo",
      symbol: "MLC",
      value: ethers.parseUnits("3200000", 6), // $3.2M
      supply: ethers.parseUnits("10000", 18)  // 10,000 tokens
    },
    {
      name: "San Francisco Modern Townhouse",
      symbol: "SFMT",
      value: ethers.parseUnits("3800000", 6), // $3.8M
      supply: ethers.parseUnits("10000", 18)  // 10,000 tokens
    },
    {
      name: "Chicago Downtown Penthouse",
      symbol: "CDP",
      value: ethers.parseUnits("4200000", 6), // $4.2M
      supply: ethers.parseUnits("10000", 18)  // 10,000 tokens
    }
  ];

  // Define CIDs for each property - ENSURE THESE ARE CORRECT
  const propertyCIDs: Record<string, string> = {
      "Miami Beachfront Villa": "bafkreighvyg3j4ajbssvszw4kzdsovo6sbycfm3cbn6pfw6uqa2qbgmamy",
      "Manhattan Luxury Condo": "bafkreifzkvccvttmnzhpcmmuz6vwpdsqjz4fcvjwa4milc2mqmojo45roa",
      "San Francisco Modern Townhouse": "bafkreih4fcdvf5mhpjxqfwp43n2r2cq2x7qzqsqp5khxcfbvhfihl7prau",
      "Chicago Downtown Penthouse": "bafkreihha34zb3l6f3wcfrig53h6ooyarxg7fpujediqcinzgeb4ok6f5u"
  };

  const propertyTokenAddresses: string[] = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`Creating token for ${property.name}...`);
    
    // We need to cast propertyTokenFactory to any to access the custom method
    const tx = await (propertyTokenFactory as any).createPropertyToken(
      property.name,
      property.symbol,
      property.value,
      property.supply
    );
    
    const receipt = await tx.wait();
    // Filter for the PropertyTokenCreated event to get the token address
    const event = receipt.logs.find(
      (log: any) => {
        try {
          const parsedLog = propertyTokenFactory.interface.parseLog(log);
          return parsedLog?.name === "PropertyTokenCreated";
        } catch { return false; }
      }
    );
    
    let tokenAddress: string;
    if (event) {
      const parsed = propertyTokenFactory.interface.parseLog(event as any);
      if (parsed) {
        tokenAddress = parsed.args.tokenAddress as string;
        console.log(`Property token for ${property.name} created at: ${tokenAddress}`);
      } else {
        console.error(`Failed to parse event for ${property.name}`);
        continue;
      }
    } else {
      console.error(`Failed to get token address for ${property.name}`);
      continue;
    }
    
    propertyTokenAddresses.push(tokenAddress);
    
    // --- Mint the corresponding NFT for this property --- 
    const tokenIdToMint = BigInt(i); // Token ID will be 0, 1, 2, 3
    const propertyName = property.name;
    const ipfsCID = propertyCIDs[propertyName];
    if (!ipfsCID) {
      console.error(`Missing IPFS CID for ${propertyName}, cannot mint NFT.`);
      continue; // Or handle error appropriately
    }
    const metadataURI = `ipfs://${ipfsCID}`;
    // Example details - Adjust as needed or fetch from a config
    const propertyLocation = `${propertyName} Location`; 
    const squareFootage = 2000 + (i * 500);
    const constructionYear = 2020 - (i * 5); 
    const propertyType = "Residential";
    
    console.log(`Minting NFT for ${propertyName} with tokenId ${tokenIdToMint}...`);
    const mintTx = await propertyNFT.mintProperty(
        deployer.address, // Mint to deployer initially
        metadataURI,
        propertyLocation,
        BigInt(squareFootage),
        property.value, // Use property value from config
        BigInt(constructionYear),
        propertyType,
        tokenAddress // Associate with the just created token
    );
    await mintTx.wait();
    console.log(`NFT ${tokenIdToMint} minted successfully.`);
    // --- End NFT Minting ---

    // Register in PropertyRegistry
    console.log(`Registering property NFT ${tokenIdToMint} with Token ${tokenAddress} in registry...`);
    
    // Use direct function access with type casting for the 3-parameter version
    const registerTx = await (propertyRegistry as any)["registerProperty(address,uint256,address)"](
      propertyNFTAddress,
      BigInt(i), // Use index as tokenId to make each registration unique
      tokenAddress
    );
    
    await registerTx.wait();
    console.log(`Property ${i} registered in registry.`);
  }

  // 7. Deploy PropertyDAO with the first property token
  console.log("\nDeploying PropertyDAO...");
  const proposalThreshold = 500; // 5%
  const votingPeriod = 60 * 60 * 24 * 3; // 3 days (in seconds)
  const executionDelay = 60 * 60 * 24 * 1; // 1 day (in seconds)
  
  // Use the first property token for DAO governance
  const firstPropertyToken = propertyTokenAddresses[0];
  
  const PropertyDAOFactory = await ethers.getContractFactory("PropertyDAO");
  const propertyDAO = await PropertyDAOFactory.deploy(
    firstPropertyToken,
    proposalThreshold,
    votingPeriod,
    executionDelay,
    initialOwner
  );
  await propertyDAO.waitForDeployment();
  const propertyDAOAddress = await propertyDAO.getAddress();
  console.log(`PropertyDAO deployed to: ${propertyDAOAddress}`);

  console.log("\n--- Deployment Summary ---");
  console.log(`PropertyTokenFactory: ${propertyTokenFactoryAddress}`);
  console.log(`PropertyNFT: ${propertyNFTAddress}`);
  console.log(`PropertyRegistry: ${propertyRegistryAddress}`);
  console.log(`RentDistribution: ${rentDistributionAddress}`);
  console.log(`PropertyMarketplace: ${propertyMarketplaceAddress}`);
  console.log(`PropertyDAO: ${propertyDAOAddress}`);
  console.log("\n--- Property Tokens ---");
  for (let i = 0; i < properties.length; i++) {
    // Ensure propertyTokenAddresses has the entry before logging
    if (propertyTokenAddresses[i]) {
      console.log(`${properties[i].name} (${properties[i].symbol}): ${propertyTokenAddresses[i]}`);
    } else {
      console.log(`${properties[i].name} (${properties[i].symbol}): FAILED TO CREATE/RETRIEVE ADDRESS`);
    }
  }
  console.log("-------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 