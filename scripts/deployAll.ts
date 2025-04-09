// scripts/deployAll.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const initialOwner = deployer.address; // Use deployer as initial owner

  // 1. Deploy PropertyToken (No dependencies)
  console.log("\nDeploying PropertyToken...");
  const propertyTokenValue = ethers.parseUnits("1000000", 6); // Example: $1M valuation (using 6 decimals like USDC)
  const propertyTokenSupply = ethers.parseUnits("10000", 18); // Example: 10,000 tokens (standard 18 decimals)
  const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyTokenFactory.deploy(
    "BrickBase Property Example", // Name
    "BPE",                      // Symbol
    propertyTokenValue,
    propertyTokenSupply,
    initialOwner
  );
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log(`PropertyToken deployed to: ${propertyTokenAddress}`);

  // 2. Deploy PropertyNFT (Needs PropertyToken address in minting, but not constructor)
  console.log("\nDeploying PropertyNFT...");
  const PropertyNFTFactory = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = await PropertyNFTFactory.deploy(initialOwner);
  await propertyNFT.waitForDeployment();
  const propertyNFTAddress = await propertyNFT.getAddress();
  console.log(`PropertyNFT deployed to: ${propertyNFTAddress}`);

  // Optional: Set the PropertyNFT address in the PropertyToken contract
  // console.log("Setting PropertyNFT address in PropertyToken...");
  // await propertyToken.connect(deployer).setPropertyNFT(propertyNFTAddress);
  // console.log("PropertyNFT address set.");
  // Note: The PropertyNFT contract *also* stores the token address, but
  // that's done during minting, not deployment.

  // 3. Deploy PropertyRegistry (No runtime dependencies)
  console.log("\nDeploying PropertyRegistry...");
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistryFactory.deploy(initialOwner);
  await propertyRegistry.waitForDeployment();
  const propertyRegistryAddress = await propertyRegistry.getAddress();
  console.log(`PropertyRegistry deployed to: ${propertyRegistryAddress}`);

  // 4. Deploy RentDistribution (No runtime dependencies)
  console.log("\nDeploying RentDistribution...");
  const RentDistributionFactory = await ethers.getContractFactory("RentDistribution");
  const rentDistribution = await RentDistributionFactory.deploy(initialOwner);
  await rentDistribution.waitForDeployment();
  const rentDistributionAddress = await rentDistribution.getAddress();
  console.log(`RentDistribution deployed to: ${rentDistributionAddress}`);

  // 5. Deploy PropertyMarketplace (Needs fee recipient)
  console.log("\nDeploying PropertyMarketplace...");
  const platformFeePercentage = 100; // 1% (100 basis points)
  const feeRecipient = initialOwner; // Platform fees go to deployer initially
  const PropertyMarketplaceFactory = await ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplaceFactory.deploy(
    platformFeePercentage,
    feeRecipient,
    initialOwner
  );
  await propertyMarketplace.waitForDeployment();
  const propertyMarketplaceAddress = await propertyMarketplace.getAddress();
  console.log(`PropertyMarketplace deployed to: ${propertyMarketplaceAddress}`);

  // 6. Deploy PropertyDAO (Needs PropertyToken address)
  console.log("\nDeploying PropertyDAO...");
  const proposalThreshold = 500; // 5%
  const votingPeriod = 60 * 60 * 24 * 3; // 3 days (in seconds)
  const executionDelay = 60 * 60 * 24 * 1; // 1 day (in seconds)
  const PropertyDAOFactory = await ethers.getContractFactory("PropertyDAO");
  const propertyDAO = await PropertyDAOFactory.deploy(
    propertyTokenAddress,
    proposalThreshold,
    votingPeriod,
    executionDelay,
    initialOwner
  );
  await propertyDAO.waitForDeployment();
  const propertyDAOAddress = await propertyDAO.getAddress();
  console.log(`PropertyDAO deployed to: ${propertyDAOAddress}`);

  console.log("\n--- Deployment Summary ---");
  console.log(`PropertyToken: ${propertyTokenAddress}`);
  console.log(`PropertyNFT: ${propertyNFTAddress}`);
  console.log(`PropertyRegistry: ${propertyRegistryAddress}`);
  console.log(`RentDistribution: ${rentDistributionAddress}`);
  console.log(`PropertyMarketplace: ${propertyMarketplaceAddress}`);
  console.log(`PropertyDAO: ${propertyDAOAddress}`);
  console.log("-------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 