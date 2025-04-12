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
  propertyToken: "0x8359C4B3185b7456f0318E607c37C9eaa3071A54",     // <-- New Address
  propertyNFT: "0xda988e1D11748E6589ac8a256A6cb61A3dd4F9D2",       // <-- New Address
  propertyRegistry: "0x6807d1F14275CCCC3b3b7258C8af5Dc317AfC9b7",    // <-- New Address
  rentDistribution: "0x2059065Edb9a1D7d48103fC9C04f68Fd521C0d27",    // <-- New Address
  propertyMarketplace: "0xE2222aE22195e4414052613e6fDA69B141Aa61aC",   // <-- New Address
  propertyDAO: "0x6434590195F96517b66b81f8556fa2e2CE3046d2",          // <-- New Address
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

  // === 1. Register Properties ===
  console.log("\n=== Step 1: Registering Properties ===");

  // --- Define Token URIs (Using actual CIDs from Pinata uploads - Updated) ---
  const tokenURI_0 = "ipfs://bafkreidbqd3jbwk4pdayn3veiefbhcl5qqwbhooyxzggbkpfxoa4engora"; // Actual CID for Property 0 (Miami Villa)
  const tokenURI_1 = "ipfs://bafkreiey25azlq2hwzdzwlmqyg4uoucqtsiibxpgmdnnoocjhc6nyktezm"; // Actual CID for Property 1 (Other Property)

  // --- Mint/Update NFTs (Owner) ---

  // --- Token ID 0 ---
  console.log("Attempting to mint or update Property NFT 1 (Token ID 0)...");
  try {
    // Check if token ID 0 already exists
    await propertyNFT.ownerOf(0);
    console.log("NFT 1 (ID 0) already exists. Checking URI...");
    const currentURI_0 = await propertyNFT.tokenURI(0);
    if (currentURI_0 !== tokenURI_0) {
      console.log(`Current URI ('${currentURI_0}') differs. Updating to '${tokenURI_0}'...`);
      const updateTx = await propertyNFT.updateTokenURI(0, tokenURI_0);
      await updateTx.wait();
      console.log("NFT 1 (ID 0) URI updated. Tx:", updateTx.hash);
    } else {
      console.log("NFT 1 (ID 0) URI is already correct. Skipping update.");
    }
  } catch (error) {
    // If ownerOf fails, the token likely doesn't exist yet
    console.log("Minting Property NFT 1 (Token ID 0)...");
    const tx1 = await propertyNFT.mintProperty(
      owner.address,
      tokenURI_0,
      "1 Property Lane", 1000,
      ethers.parseUnits("500000", 6), 2020, "Residential",
      addresses.propertyToken // Ensure this is the correct associated token address
    );
    await tx1.wait();
    console.log("NFT 1 (ID 0) minted. Tx:", tx1.hash);
  }

  // --- Token ID 1 ---
  console.log("\nAttempting to mint or update Property NFT 2 (Token ID 1)...");
  try {
    // Check if token ID 1 already exists
    await propertyNFT.ownerOf(1);
    console.log("NFT 2 (ID 1) already exists. Checking URI...");
    const currentURI_1 = await propertyNFT.tokenURI(1);
    if (currentURI_1 !== tokenURI_1) {
      console.log(`Current URI ('${currentURI_1}') differs. Updating to '${tokenURI_1}'...`);
      const updateTx = await propertyNFT.updateTokenURI(1, tokenURI_1);
      await updateTx.wait();
      console.log("NFT 2 (ID 1) URI updated. Tx:", updateTx.hash);
    } else {
      console.log("NFT 2 (ID 1) URI is already correct. Skipping update.");
    }
  } catch (error) {
    // If ownerOf fails, the token likely doesn't exist yet
    console.log("Minting Property NFT 2 (Token ID 1)...");
    const tx2 = await propertyNFT.mintProperty(
      owner.address,
      tokenURI_1,
      "2 Asset Avenue", 1500,
      ethers.parseUnits("750000", 6), 2021, "Commercial",
      addresses.propertyToken // Ensure this is the correct associated token address
    );
    await tx2.wait();
    console.log("NFT 2 (ID 1) minted. Tx:", tx2.hash);
  }

  // --- Register NFT/Token Contract Pair (Owner) ---
  console.log(`\nChecking registration status for PropertyNFT contract (${addresses.propertyNFT})...`);
  const existingIndex = await propertyRegistry.propertyIndex(addresses.propertyNFT);

  // Note: propertyIndex returns 0 if not found, or length+1 if found.
  if (existingIndex === 0n) {
      console.log(`PropertyNFT contract (${addresses.propertyNFT}) not yet registered. Attempting registration...`);
      const tx3 = await propertyRegistry.registerProperty(addresses.propertyNFT, addresses.propertyToken);
      console.log(`Registration transaction sent. Waiting for confirmation... Tx Hash: ${tx3.hash}`);
      await tx3.wait();
      console.log(`Contracts registered successfully in PropertyRegistry. Tx Confirmed: ${tx3.hash}`);
  } else {
      console.log(`PropertyNFT contract (${addresses.propertyNFT}) already registered in PropertyRegistry at index ${existingIndex}. Skipping registration.`);
  }


  // --- Mint PropertyTokens to Test User (Owner) - Conditional Mint ---
  const maxSupply = await propertyToken.totalTokenSupply(); // Read from contract
  const currentSupply = await propertyToken.totalSupply();
  const amountToMint = maxSupply - currentSupply;

  console.log(`Max Supply: ${ethers.formatUnits(maxSupply, 18)}, Current Supply: ${ethers.formatUnits(currentSupply, 18)}`);

  if (amountToMint > 0n) { // Use BigInt literal 0n
    console.log(`Minting remaining ${ethers.formatUnits(amountToMint, 18)} PropertyTokens to Test User (${testUser.address})...`);
    const tx4 = await propertyToken.connect(owner).mint(testUser.address, amountToMint); // Mint the calculated difference
    await tx4.wait();
    console.log("PropertyTokens minted to Test User. Tx:", tx4.hash);
  } else {
    console.log(`Token supply is already at maximum (${ethers.formatUnits(maxSupply, 18)}). Skipping mint.`);
  }

  // --- Ensure Test User has Tokens (Transfer if Necessary) ---
  console.log("\nEnsuring Test User has tokens...");
  const requiredBalance = ethers.parseUnits("1000", 18); // Min balance needed for listing
  let testUserBalanceCheck = await propertyToken.balanceOf(testUser.address);
  console.log(`Current Test User balance: ${ethers.formatUnits(testUserBalanceCheck, 18)}`);

  if (testUserBalanceCheck < requiredBalance) {
    console.log(`Test User balance is insufficient. Attempting to transfer ${ethers.formatUnits(maxSupply, 18)} tokens from Owner (${owner.address})...`);
    try {
      // Assuming owner holds the tokens if they weren't minted to testUser
      const transferTx = await propertyToken.connect(owner).transfer(testUser.address, maxSupply);
      await transferTx.wait();
      testUserBalanceCheck = await propertyToken.balanceOf(testUser.address);
      console.log(`Transfer successful. New Test User balance: ${ethers.formatUnits(testUserBalanceCheck, 18)}`);
      if (testUserBalanceCheck < requiredBalance) {
           console.error(`ERROR: Transfer seemed successful but Test User balance is still insufficient. Stopping.`);
           return;
      }
    } catch (error: any) {
      console.error(`ERROR: Failed to transfer tokens from Owner to Test User. Does Owner (${owner.address}) hold the tokens?`, error.message);
      // Optional: Check owner balance
       const ownerBalance = await propertyToken.balanceOf(owner.address);
       console.error(`Current Owner balance: ${ethers.formatUnits(ownerBalance, 18)}`);
       return; // Stop script if transfer fails
    }
  }


  // === 2. Create a Listing ===
  console.log("\n=== Step 2: Creating a Listing ===");
  const listAmount = ethers.parseUnits("1000", 18); // List 1,000 tokens (Reduced)
  const pricePerTokenWei = ethers.parseUnits("0.001", "ether"); // 0.001 ETH per token

  // --- Approve Marketplace (Test User) ---
  console.log(`Test User checking allowance and approving Marketplace if needed for ${ethers.formatUnits(listAmount, 18)} tokens...`);
  const currentAllowance = await propertyToken.allowance(testUser.address, addresses.propertyMarketplace);
  if (currentAllowance < listAmount) {
      const tx5 = await propertyToken.connect(testUser).approve(addresses.propertyMarketplace, listAmount);
      await tx5.wait();
      console.log("Marketplace approved. Tx:", tx5.hash);
  } else {
      console.log("Marketplace already has sufficient allowance.");
  }

  // --- Add Pre-Checks for Listing ---
  const testUserBalance = await propertyToken.balanceOf(testUser.address);
  const marketplaceAllowance = await propertyToken.allowance(testUser.address, addresses.propertyMarketplace);
  console.log(`Pre-Listing Check: TestUser Balance=${ethers.formatUnits(testUserBalance, 18)}, Marketplace Allowance=${ethers.formatUnits(marketplaceAllowance, 18)}`);

  if (testUserBalance < listAmount) {
      console.error(`ERROR: TestUser balance (${ethers.formatUnits(testUserBalance, 18)}) is less than required list amount (${ethers.formatUnits(listAmount, 18)}). Stopping.`);
      return;
  }
  if (marketplaceAllowance < listAmount) {
       console.error(`ERROR: Marketplace allowance (${ethers.formatUnits(marketplaceAllowance, 18)}) is less than required list amount (${ethers.formatUnits(listAmount, 18)}). Stopping.`);
      return;
  }

  // --- Create Listing (Test User) ---
  // Ideally, check if a similar listing already exists to avoid duplicates if the script is run multiple times
  console.log(`Test User creating listing for ${ethers.formatUnits(listAmount, 18)} tokens at ${ethers.formatEther(pricePerTokenWei)} ETH each...`);
  let listingId = 0n; // Default assumption
  try {
      const tx6 = await propertyMarketplace.connect(testUser).createListing(
          addresses.propertyToken,
          listAmount,
          pricePerTokenWei
      );
      const receipt6 = await tx6.wait();
      // Extract listing ID from event
      const listingCreatedEvent = receipt6?.logs.find(
          (log: any) => {
              try {
                  const parsedLog = propertyMarketplace.interface.parseLog(log);
                  return parsedLog?.name === "ListingCreated";
              } catch { return false; } // Ignore logs that don't match the ABI
          }
      );
      if (listingCreatedEvent) {
          const parsed = propertyMarketplace.interface.parseLog(listingCreatedEvent as any);
          listingId = parsed?.args.listingId;
          console.log(`Listing created with ID: ${listingId}`);
      } else {
          console.warn("Could not find ListingCreated event to determine listing ID, assuming 0 for purchase attempt.");
      }
  } catch (error: any) {
      console.error(`ERROR: Failed to create listing: ${error.message}`);
      // Decide if we should stop or continue without a listing ID
      console.log("Skipping purchase step due to listing creation failure.");
      listingId = -1n; // Indicate failure
  }


  // === 3. Purchase from Listing ===
  console.log("\n=== Step 3: Purchasing from Listing ===");
  if (listingId < 0n) {
      console.log("Skipping purchase because listing creation failed or ID was not found.");
  } else {
      const purchaseAmount = ethers.parseUnits("10", 18); // Buy 10 tokens (Reduced)
      try {
          const listingInfo = await propertyMarketplace.listings(listingId); // Fetch current listing state

          if (!listingInfo.isActive) {
              console.log(`Listing ${listingId} is inactive. Skipping purchase.`);
          } else if (listingInfo.tokenAmount < purchaseAmount) {
              console.log(`Listing ${listingId} has insufficient tokens (${ethers.formatUnits(listingInfo.tokenAmount, 18)} < ${ethers.formatUnits(purchaseAmount, 18)}). Skipping purchase.`);
          } else {
              const calculatedPricePerToken = listingInfo.pricePerToken; // Use price from listing
              const totalCostWei = purchaseAmount * calculatedPricePerToken / (10n**18n);

              console.log(`Owner purchasing ${ethers.formatUnits(purchaseAmount, 18)} tokens from listing ${listingId} for ${ethers.formatEther(totalCostWei)} ETH...`);
              const tx7 = await propertyMarketplace.connect(owner).purchaseTokens(
                  listingId,
                  purchaseAmount,
                  { value: totalCostWei }
              );
              await tx7.wait();
              console.log("Tokens purchased. Tx:", tx7.hash);
          }
      } catch (error: any) {
          console.error(`ERROR: Failed to purchase from listing ${listingId}: ${error.message}`);
      }
  }

  // === 4. Deposit Rent ===
  console.log("\n=== Step 4: Depositing Rent ===");
  const rentAmountWei = ethers.parseEther("0.01"); // Reduce rent deposit amount

  console.log(`Owner depositing ${ethers.formatEther(rentAmountWei)} ETH as rent for PropertyToken ${addresses.propertyToken}...`);
  try {
      const tx8 = await rentDistribution.connect(owner).depositRent(
          addresses.propertyToken,
          { value: rentAmountWei }
      );
      await tx8.wait();
      console.log("Rent deposited. Tx:", tx8.hash);
  } catch (error: any) {
      console.error(`ERROR: Failed to deposit rent: ${error.message}`);
  }

  // === 5. Create a DAO Proposal ===
  console.log("\n=== Step 5: Creating DAO Proposals ===");
  // Check if Test User has voting power
  const testUserVotes = await propertyToken.balanceOf(testUser.address);
  if (testUserVotes === 0n) {
      console.log("Test User has no voting power. Skipping proposal creation.");
  } else {
      // --- Generic Proposal (Test User) ---
      console.log("Test User creating generic DAO proposal...");
      try {
          const tx9 = await propertyDAO.connect(testUser).createProposal(
              "Test Proposal 1: General discussion", ethers.ZeroAddress, "0x"
          );
          await tx9.wait();
          console.log("Generic proposal created. Tx:", tx9.hash);
      } catch (e: any) {
          console.error("Failed to create generic proposal:", e.message);
      }

      // --- \"Expense" Proposal (Test User) ---
      console.log("Test User creating 'Expense' DAO proposal...");
      try {
          const tx10 = await propertyDAO.connect(testUser).createProposal(
              "Expense: Pay janitor bill $50", ethers.ZeroAddress, "0x"
          );
          await tx10.wait();
          console.log("\'Expense\' proposal created. Tx:", tx10.hash);
      } catch (e: any) {
          console.error("Failed to create expense proposal:", e.message);
      }
  }

  console.log("\n=== State Population Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
