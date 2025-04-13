// scripts/populateState.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import {
  PropertyToken,
  PropertyNFT,
  PropertyRegistry,
  RentDistribution,
  PropertyMarketplace,
  PropertyDAO
} from "../typechain-types"; // Import types

dotenv.config();

// --- Deployed Contract Addresses (Base Sepolia) - Updated ---
const addresses = {
  propertyToken: "0x0B00bB2B901B607c718A4584dD236C310B28f49B",     // <-- New Address
  propertyNFT: "0x9F360f45e68f6B36b4a5863B7C6512D0E8789157",       // <-- New Address
  propertyRegistry: "0x04E8F7eF6AC987e55953EeB59fFB14Bb753035CE",    // <-- New Address
  rentDistribution: "0x8655e35343e0A5621577e13181da9A8F871d1985",    // <-- New Address
  propertyMarketplace: "0xB4D1F6B65fBf3f75a2A62BCb9307c695473Bb7D1",   // <-- New Address
  propertyDAO: "0xA08b643C8fB9466cc2Df94dA3bC69F3876794257",          // <-- New Address
};
// --- ABI Paths (Adjust if necessary) ---
// NOTE: Using TypeChain types makes dynamic ABI loading less critical,
// but paths are kept for reference or potential future use.
const abiPaths = {
  propertyToken: "artifacts/contracts/tokens/PropertyToken.sol/PropertyToken.json",
  propertyNFT: "artifacts/contracts/tokens/PropertyNFT.sol/PropertyNFT.json",
  propertyRegistry: "artifacts/contracts/registry/PropertyRegistry.sol/PropertyRegistry.json",
  rentDistribution: "artifacts/contracts/rent/RentDistribution.sol/RentDistribution.json",
  propertyMarketplace: "artifacts/contracts/marketplace/PropertyMarketplace.sol/PropertyMarketplace.json",
  propertyDAO: "artifacts/contracts/governance/PropertyDAO.sol/PropertyDAO.json",
};

// Define property details with updated CIDs and complete metadata
const properties = [
  {
    tokenId: 0,
    name: "Miami Beachfront Villa",
    tokenURI: "ipfs://bafkreighvyg3j4ajbssvszw4kzdsovo6sbycfm3cbn6pfw6uqa2qbgmamy",
    address: "123 Ocean Drive, Miami Beach, FL 33139",
    squareFootage: 3200,
    purchasePrice: ethers.parseUnits("2500000", 6),
    constructionYear: 2018,
    propertyType: "Residential",
    beds: 4,
    baths: 3.5
  },
  {
    tokenId: 1,
    name: "Manhattan Luxury Condo",
    tokenURI: "ipfs://bafkreifzkvccvttmnzhpcmmuz6vwpdsqjz4fcvjwa4milc2mqmojo45roa",
    address: "555 Park Avenue, New York, NY 10022",
    squareFootage: 1800,
    purchasePrice: ethers.parseUnits("3200000", 6),
    constructionYear: 2020,
    propertyType: "Residential",
    beds: 2,
    baths: 2
  },
  {
    tokenId: 2,
    name: "San Francisco Modern Townhouse",
    tokenURI: "ipfs://bafkreih4fcdvf5mhpjxqfwp43n2r2cq2x7qzqsqp5khxcfbvhfihl7prau",
    address: "789 Valencia Street, San Francisco, CA 94110",
    squareFootage: 2400,
    purchasePrice: ethers.parseUnits("3800000", 6),
    constructionYear: 2019,
    propertyType: "Residential",
    beds: 3,
    baths: 2.5
  },
  {
    tokenId: 3,
    name: "Chicago Downtown Penthouse",
    tokenURI: "ipfs://bafkreihha34zb3l6f3wcfrig53h6ooyarxg7fpujediqcinzgeb4ok6f5u",
    address: "456 Michigan Avenue, Chicago, IL 60611",
    squareFootage: 3500,
    purchasePrice: ethers.parseUnits("4200000", 6),
    constructionYear: 2017,
    propertyType: "Residential",
    beds: 5,
    baths: 4
  }
];

// Define listing details (2 per property)
const listings = [
  // Property 0 listings
  {
    propertyIndex: 0,
    amount: ethers.parseUnits("500", 18),
    pricePerToken: ethers.parseUnits("0.002", "ether")
  },
  {
    propertyIndex: 0,
    amount: ethers.parseUnits("1000", 18),
    pricePerToken: ethers.parseUnits("0.0018", "ether")
  },
  // Property 1 listings
  {
    propertyIndex: 1,
    amount: ethers.parseUnits("750", 18),
    pricePerToken: ethers.parseUnits("0.0025", "ether")
  },
  {
    propertyIndex: 1,
    amount: ethers.parseUnits("1250", 18),
    pricePerToken: ethers.parseUnits("0.0022", "ether")
  },
  // Property 2 listings
  {
    propertyIndex: 2,
    amount: ethers.parseUnits("600", 18),
    pricePerToken: ethers.parseUnits("0.0028", "ether")
  },
  {
    propertyIndex: 2,
    amount: ethers.parseUnits("900", 18),
    pricePerToken: ethers.parseUnits("0.0026", "ether")
  },
  // Property 3 listings
  {
    propertyIndex: 3,
    amount: ethers.parseUnits("800", 18),
    pricePerToken: ethers.parseUnits("0.003", "ether")
  },
  {
    propertyIndex: 3,
    amount: ethers.parseUnits("1100", 18),
    pricePerToken: ethers.parseUnits("0.0027", "ether")
  }
];

async function main() {
  const ownerPrivateKey = process.env.PRIVATE_KEY;
  const testUserPrivateKey = process.env.TEST_USER_PRIVATE_KEY;

  if (!ownerPrivateKey || !testUserPrivateKey) {
    throw new Error("Missing PRIVATE_KEY or TEST_USER_PRIVATE_KEY in .env file");
  }

  const provider = ethers.provider;

  const owner = new ethers.Wallet(ownerPrivateKey, provider);
  const testUser = new ethers.Wallet(testUserPrivateKey, provider);

  console.log(`Using Owner: ${owner.address}`);
  console.log(`Using Test User: ${testUser.address}`);

  // --- Get Contract Instances with Type Casting ---
  console.log("\nGetting contract instances...");
  // Cast the result of getContractAt to the specific TypeChain type
  const propertyToken = await ethers.getContractAt(
    "PropertyToken", // Use contract name directly with TypeChain
    addresses.propertyToken,
    owner
  ) as PropertyToken; // Cast
  const propertyNFT = await ethers.getContractAt("PropertyNFT", addresses.propertyNFT, owner) as PropertyNFT; // Cast
  const propertyRegistry = await ethers.getContractAt("PropertyRegistry", addresses.propertyRegistry, owner) as PropertyRegistry; // Cast
  const rentDistribution = await ethers.getContractAt("RentDistribution", addresses.rentDistribution, owner) as RentDistribution; // Cast
  const propertyMarketplace = await ethers.getContractAt("PropertyMarketplace", addresses.propertyMarketplace, owner) as PropertyMarketplace; // Cast
  const propertyDAO = await ethers.getContractAt("PropertyDAO", addresses.propertyDAO, owner) as PropertyDAO; // Cast
  console.log("Contracts retrieved.");

  // === 1. Reset state: Check existing tokens and delete if possible ===
  console.log("\n=== Step 1: Checking and Resetting State ===");
  
  // Check existing listings and deactivate them
  try {
    const activeListings = await propertyMarketplace.getActiveListings();
    console.log(`Found ${activeListings.length} existing listings.`);
    
    for (let i = 0; i < activeListings.length; i++) {
      const listingId = activeListings[i];
      await propertyMarketplace.cancelListing(listingId);
      console.log(`Deactivated listing ${listingId}.`);
    }
  } catch (error) {
    console.log("Error checking listings. Continuing with reset...");
  }

  // === 2. Register Properties ===
  console.log("\n=== Step 2: Registering Properties ===");

  // Register each property
  for (const property of properties) {
    console.log(`\nProcessing property: ${property.name}`);
    
    // Check if token ID already exists
    try {
      await propertyNFT.ownerOf(property.tokenId);
      console.log(`NFT ID ${property.tokenId} already exists. Checking URI...`);
      
      const currentURI = await propertyNFT.tokenURI(property.tokenId);
      if (currentURI !== property.tokenURI) {
        console.log(`Current URI ('${currentURI}') differs. Updating to '${property.tokenURI}'...`);
        const updateTx = await propertyNFT.updateTokenURI(property.tokenId, property.tokenURI);
        await updateTx.wait();
        console.log(`NFT ID ${property.tokenId} URI updated.`);
      } else {
        console.log(`NFT ID ${property.tokenId} URI is already correct.`);
      }
      
      // Update property details
      console.log(`Updating property details for NFT ID ${property.tokenId}...`);
      const updateDetailsTx = await propertyNFT.updatePropertyDetails(
        property.tokenId,
        property.address,
        property.squareFootage,
        property.purchasePrice,
        property.constructionYear,
        property.propertyType
      );
      await updateDetailsTx.wait();
      console.log(`Property details updated for NFT ID ${property.tokenId}.`);
      
    } catch (error) {
      // If ownerOf fails, the token likely doesn't exist yet
      console.log(`Minting new Property NFT (Token ID ${property.tokenId})...`);
      const mintTx = await propertyNFT.mintProperty(
        owner.address,
        property.tokenURI,
        property.address,
        property.squareFootage,
        property.purchasePrice,
        property.constructionYear,
        property.propertyType,
        addresses.propertyToken
      );
      await mintTx.wait();
      console.log(`NFT ID ${property.tokenId} minted.`);
    }
  }

  // --- Register NFT/Token Contract Pair (Owner) ---
  console.log(`\nChecking registration status for PropertyNFT contract (${addresses.propertyNFT})...`);
  const existingIndex = await propertyRegistry.propertyIndex(addresses.propertyNFT);

  // Note: propertyIndex returns 0 if not found, or length+1 if found.
  if (existingIndex === 0n) {
    console.log(`PropertyNFT contract (${addresses.propertyNFT}) not yet registered. Attempting registration...`);
    const tx3 = await propertyRegistry.registerProperty(addresses.propertyNFT, addresses.propertyToken);
    await tx3.wait();
    console.log(`Contracts registered successfully in PropertyRegistry.`);
  } else {
    console.log(`PropertyNFT contract (${addresses.propertyNFT}) already registered in PropertyRegistry at index ${existingIndex}.`);
  }

  // === 3. Reset state: Check existing tokens and delete if possible ===
  console.log("\n=== Step 3: Resetting Token Distribution ===");
  
  const maxSupply = await propertyToken.totalTokenSupply();
  console.log(`Total token supply: ${ethers.formatUnits(maxSupply, 18)}`);
  
  // Check owner and test user balances
  const ownerBalance = await propertyToken.balanceOf(owner.address);
  const testUserBalance = await propertyToken.balanceOf(testUser.address);
  
  console.log(`Owner balance: ${ethers.formatUnits(ownerBalance, 18)}`);
  console.log(`Test User balance: ${ethers.formatUnits(testUserBalance, 18)}`);
  
  // Transfer tokens to owner first if test user has them
  if (testUserBalance > 0n) {
    console.log(`Transferring ${ethers.formatUnits(testUserBalance, 18)} tokens from Test User to Owner...`);
    try {
      const transferTx = await propertyToken.connect(testUser).transfer(owner.address, testUserBalance);
      await transferTx.wait();
      console.log(`Tokens transferred from Test User to Owner.`);
    } catch (error) {
      console.error(`Failed to transfer tokens from Test User to Owner:`, error);
    }
  }
  
  // Distribute tokens: 60% to owner, 40% to test user
  const ownerAmount = maxSupply * 60n / 100n;
  const testUserAmount = maxSupply - ownerAmount;
  
  // First ensure owner has all tokens
  const updatedOwnerBalance = await propertyToken.balanceOf(owner.address);
  if (updatedOwnerBalance < maxSupply) {
    const mintAmount = maxSupply - updatedOwnerBalance;
    console.log(`Minting ${ethers.formatUnits(mintAmount, 18)} tokens to Owner...`);
    const mintTx = await propertyToken.connect(owner).mint(owner.address, mintAmount);
    await mintTx.wait();
  }
  
  // Transfer 40% to test user
  console.log(`Transferring ${ethers.formatUnits(testUserAmount, 18)} tokens to Test User...`);
  const transferTx = await propertyToken.connect(owner).transfer(testUser.address, testUserAmount);
  await transferTx.wait();
  console.log(`Tokens transferred to Test User.`);

  // === 4. Create Listings ===
  console.log("\n=== Step 4: Creating Listings ===");
  
  // Create 2 listings for each property
  for (const listing of listings) {
    console.log(`\nCreating listing for Property ${listing.propertyIndex}: ${ethers.formatUnits(listing.amount, 18)} tokens at ${ethers.formatEther(listing.pricePerToken)} ETH each...`);
    
    // Determine which user creates the listing (alternate between owner and test user)
    const isOwnerListing = listings.indexOf(listing) % 2 === 0;
    const user = isOwnerListing ? owner : testUser;
    console.log(`Listing creator: ${isOwnerListing ? 'Owner' : 'Test User'}`);
    
    // Check and approve marketplace allowance
    const userAllowance = await propertyToken.allowance(user.address, addresses.propertyMarketplace);
    if (userAllowance < listing.amount) {
      console.log(`Approving marketplace for ${ethers.formatUnits(listing.amount, 18)} tokens...`);
      const approveTx = await propertyToken.connect(user).approve(addresses.propertyMarketplace, listing.amount);
      await approveTx.wait();
      console.log(`Marketplace approved.`);
    } else {
      console.log(`Marketplace already has sufficient allowance.`);
    }
    
    // Create listing
    try {
      const createTx = await propertyMarketplace.connect(user).createListing(
        addresses.propertyToken,
        listing.amount,
        listing.pricePerToken
      );
      const receipt = await createTx.wait();
      
      // Extract listing ID from event
      const listingCreatedEvent = receipt?.logs.find(
        (log: any) => {
          try {
            const parsedLog = propertyMarketplace.interface.parseLog(log);
            return parsedLog?.name === "ListingCreated";
          } catch { return false; }
        }
      );
      
      if (listingCreatedEvent) {
        const parsed = propertyMarketplace.interface.parseLog(listingCreatedEvent as any);
        const listingId = parsed?.args.listingId;
        console.log(`Listing created with ID: ${listingId}`);
      } else {
        console.log(`Listing created, but couldn't determine ID.`);
      }
    } catch (error: any) {
      console.error(`Failed to create listing: ${error.message}`);
    }
  }

  // === 5. Deposit Rent ===
  console.log("\n=== Step 5: Depositing Rent ===");
  const rentAmountWei = ethers.parseEther("0.05"); // 0.05 ETH as rent

  console.log(`Owner depositing ${ethers.formatEther(rentAmountWei)} ETH as rent for PropertyToken ${addresses.propertyToken}...`);
  try {
    const tx = await rentDistribution.connect(owner).depositRent(
      addresses.propertyToken,
      { value: rentAmountWei }
    );
    await tx.wait();
    console.log("Rent deposited successfully.");
  } catch (error: any) {
    console.error(`Failed to deposit rent: ${error.message}`);
  }

  // === 6. Create DAO Proposals ===
  console.log("\n=== Step 6: Creating DAO Proposals ===");
  
  const proposals = [
    {
      title: "Community Pool Renovation",
      description: "Proposal to renovate the community pool with new tiling and equipment",
      creator: owner
    },
    {
      title: "Increase Security Budget",
      description: "Proposal to increase the monthly security budget by 20%",
      creator: testUser
    },
    {
      title: "Landscaping Improvements",
      description: "Proposal for quarterly landscaping improvements in common areas",
      creator: owner
    }
  ];
  
  for (const proposal of proposals) {
    console.log(`Creating proposal: ${proposal.title}...`);
    try {
      const tx = await propertyDAO.connect(proposal.creator).createProposal(
        `${proposal.title}: ${proposal.description}`, 
        ethers.ZeroAddress, 
        "0x"
      );
      await tx.wait();
      console.log(`Proposal "${proposal.title}" created.`);
    } catch (error: any) {
      console.error(`Failed to create proposal "${proposal.title}": ${error.message}`);
    }
  }

  console.log("\n=== State Population Complete ===");
  console.log("\nSummary:");
  console.log(`- ${properties.length} properties registered with complete metadata`);
  console.log(`- ${listings.length} listings created (${listings.length / properties.length} per property)`);
  console.log(`- ${ethers.formatEther(rentAmountWei)} ETH rent deposited`);
  console.log(`- ${proposals.length} DAO proposals created`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
