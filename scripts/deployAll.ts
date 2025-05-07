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

  // 6. Create individual PropertyTokens for properties
  console.log("\nCreating individual PropertyTokens for properties...");
  
  const properties = [
    {
      name: "Miami Beachfront Villa",
      symbol: "MBV",
      value: ethers.parseUnits("10", 6), // 10 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Manhattan Luxury Condo",
      symbol: "MLC",
      value: ethers.parseUnits("12", 6), // 12 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "San Francisco Modern Townhouse",
      symbol: "SFMT",
      value: ethers.parseUnits("15", 6), // 15 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Chicago Downtown Penthouse",
      symbol: "CDP",
      value: ethers.parseUnits("13", 6), // 13 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Ewidas Workspace",
      symbol: "EWID",
      value: ethers.parseUnits("5", 6), // 5 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Iconic Tower",
      symbol: "ICON",
      value: ethers.parseUnits("8", 6), // 8 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Pyramids Hotel",
      symbol: "PYR",
      value: ethers.parseUnits("7", 6), // 7 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "Ora SilverSands",
      symbol: "ORA",
      value: ethers.parseUnits("9", 6), // 9 USDC
      supply: ethers.parseUnits("10000", 18)
    },
    {
      name: "SouthMed Villa",
      symbol: "SMV",
      value: ethers.parseUnits("6", 6), // 6 USDC
      supply: ethers.parseUnits("10000", 18)
    }
  ];

  // Define CIDs for each property - USER MUST ENSURE THESE ARE CORRECT AND MATCH THE ABOVE properties ARRAY ORDER
  const propertyCIDs: Record<string, string> = {
      "Miami Beachfront Villa": "bafkreighvyg3j4ajbssvszw4kzdsovo6sbycfm3cbn6pfw6uqa2qbgmamy", // Ensure this matches properties[0].name
      "Manhattan Luxury Condo": "bafkreifzkvccvttmnzhpcmmuz6vwpdsqjz4fcvjwa4milc2mqmojo45roa", // Ensure this matches properties[1].name
      "San Francisco Modern Townhouse": "bafkreih4fcdvf5mhpjxqfwp43n2r2cq2x7qzqsqp5khxcfbvhfihl7prau", // Ensure this matches properties[2].name
      "Chicago Downtown Penthouse": "bafkreihha34zb3l6f3wcfrig53h6ooyarxg7fpujediqcinzgeb4ok6f5u",  // Ensure this matches properties[3].name
      "Ewida's Workspace": "bafkreiamcgrtm3jlq56tpnggy7jqbpk4hsubkp5uexepxheumz6blqb2be",        // Ensure this matches properties[4].name
      "Iconic Tower": "bafkreib3k5oe323k7pvc5q2mxvxqcbr24xx3mxxezljal5wivaqmv4fgia",          // Ensure this matches properties[5].name
      "Pyramids Hotel": "bafkreiajjrv6uftvum6mnw5w5kp5wbyafie2q3q3qmvwwxncwfvfiafesq",        // Ensure this matches properties[6].name
      "Ora SilverSands": "bafkreia4gpyj4s7sbszramgvuo43srqo5noohxsjjc7xarj5oa2fg4pisu",       // Ensure this matches properties[7].name
      "SouthMed Villa": "bafkreifwzra3tsedyuvr3z2w7d2f56rqnhcdvcmzdpt2plvfezzeomf6sa"         // Ensure this matches properties[8].name
  };

  const propertyTokenAddresses: string[] = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`Creating token for ${property.name}...`);
    
    const tx = await (propertyTokenFactory as any).createPropertyToken(
      property.name,
      property.symbol,
      property.value,
      property.supply
    );
    
    const receipt = await tx.wait();
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
    
    const tokenIdToMint = BigInt(i); 
    const propertyName = property.name; // Use name from the properties array for consistency
    const ipfsCID = propertyCIDs[propertyName];
    if (!ipfsCID) {
      console.error(`Missing IPFS CID for ${propertyName} (expected key: "${propertyName}"), cannot mint NFT.`);
      continue; 
    }
    const metadataURI = `ipfs://${ipfsCID}`;
    const propertyLocation = `${propertyName} Location`; 
    const squareFootage = 1000 + (i * 200); // Adjusted to be smaller
    const constructionYear = 2024 - i; 
    const propertyType = "Residential";
    
    console.log(`Minting NFT for ${propertyName} with tokenId ${tokenIdToMint} and CID ${ipfsCID}...`);
    const mintTx = await propertyNFT.mintProperty(
        deployer.address, 
        metadataURI,
        propertyLocation,
        BigInt(squareFootage),
        property.value, 
        BigInt(constructionYear),
        propertyType,
        tokenAddress 
    );
    await mintTx.wait();
    console.log(`NFT ${tokenIdToMint} minted successfully.`);

    console.log(`Registering property NFT ${tokenIdToMint} with Token ${tokenAddress} in registry...`);
    const registerTx = await (propertyRegistry as any)["registerProperty(address,uint256,address)"](
      propertyNFTAddress,
      BigInt(i), 
      tokenAddress
    );
    await registerTx.wait();
    console.log(`Property ${i} registered in registry.`);
  }

  // 7. Deploy PropertyDAO
  console.log("\nDeploying PropertyDAO...");
  const proposalThreshold = 500; // 5%
  const votingPeriod = 60 * 90; // 1.5 hours (5400 seconds)
  const executionDelay = 60 * 30; // 30 minutes (1800 seconds)
  
  const firstPropertyToken = propertyTokenAddresses[0] || ethers.ZeroAddress; // Fallback if no tokens created
  
  const PropertyDAOFactory = await ethers.getContractFactory("PropertyDAO");
  const propertyDAO = await PropertyDAOFactory.deploy(
    firstPropertyToken, // This is the constructor arg, though our DAO logic mostly uses per-proposal tokens
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