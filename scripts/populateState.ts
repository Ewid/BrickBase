// scripts/populateState.ts
import { ethers } from "hardhat";
import {
    PropertyToken,
    PropertyNFT,
    PropertyRegistry,
    RentDistribution,
    PropertyMarketplace,
    PropertyDAO,
    PropertyTokenFactory, // Added Factory type
    IERC20 // Keep IERC20 for USDC
} from "../typechain-types";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Configuration ---

const USER_ADDRESSES = [
    "0xa83126A279960797233d48488e5908d6C1E72f2F",
    "0xcd64902df08575Df5F3499CdA6F14154fB48E362",
    "0x61210F2D208BaDF9101d91890C91EEC186707446",
    "0xdC6Ce97a7EB152D2f64Ae98512d3126601b74560"
];

// Define desired token distribution (Property Symbol -> User Index -> Amount (as string for parseUnits))
// Make sure the total distributed per property doesn't exceed the total supply (10000)
const TOKEN_DISTRIBUTION_PLAN: { [propertySymbol: string]: { [userIndex: number]: string } } = {
    "MBV": { // Miami
        0: "3000", // User A gets 3000
        1: "0",  // User B gets 500
        2: "1500", // User C gets 1000
        3: "200"   // User D gets 200
        // Deployer keeps remaining ~5300
    },
    "MLC": { // Manhattan
        0: "1000",
        1: "2500",
        2: "1000",
        3: "0"     // User D gets none
        // Deployer keeps remaining ~5500
    },
    "SFMT": { // San Francisco
        0: "500",
        1: "2500",
        2: "2000",
        3: "500"
        // Deployer keeps remaining ~4500
    },
    "CDP": { // Chicago
        0: "200",
        1: "4500",
        2: "1000",
        3: "0"
        // Deployer keeps remaining ~4300
    }
};

// Define marketplace listing scenarios (who lists what) - REDUCED PRICES
const LISTING_SCENARIOS = [
    { userIndex: 0, propertySymbol: "MBV", amount: "500", pricePerTokenUsdc: "0.10" }, // User A lists Miami tokens ($0.10/token)
    { userIndex: 1, propertySymbol: "MLC", amount: "300", pricePerTokenUsdc: "0.15" }, // User B lists Manhattan ($0.15/token)
    { userIndex: 2, propertySymbol: "SFMT", amount: "1000", pricePerTokenUsdc: "0.20" }, // User C lists San Fran ($0.20/token)
    { userIndex: 1, propertySymbol: "CDP", amount: "250", pricePerTokenUsdc: "0.22" }, // User B lists Chicago ($0.22/token)
    // Deployer also lists some
    { userIndex: -1, propertySymbol: "MBV", amount: "1000", pricePerTokenUsdc: "0.09" }, // -1 indicates deployer ($0.09/token)
    { userIndex: -1, propertySymbol: "CDP", amount: "500", pricePerTokenUsdc: "0.21" }  // ($0.21/token)
];

// Define DAO proposal scenarios
const PROPOSAL_SCENARIOS = [
    { userIndex: 0, propertySymbol: "MBV", description: "Proposal 1 (MBV): Reduce management fee by 0.5%", targetContractKey: "rentDistribution", calldata: "0x" }, // User A proposes for Miami
    { userIndex: 1, propertySymbol: "CDP", description: "Proposal 2 (CDP): Special assessment for lobby renovation - 1000 USDC", targetContractKey: "rentDistribution", calldata: "0x" }, // User B proposes for Chicago
    { userIndex: 2, propertySymbol: "SFMT", description: "Proposal 3 (SFMT): Approve new insurance provider", targetContractKey: "propertyRegistry", calldata: "0x" }, // User C proposes for SF
    { userIndex: -1, propertySymbol: "MBV", description: "Proposal 4 (MBV): Increase reserve fund allocation", targetContractKey: "rentDistribution", calldata: "0x" },
];

// --- End Configuration ---


// Get deployed contract addresses from environment variables
interface DeployedAddresses {
    propertyTokenFactory: string;
    propertyNFT: string;
    propertyRegistry: string;
    rentDistribution: string;
    propertyMarketplace: string;
    propertyDAO: string;
    usdcToken: string;
    // We will fetch property token addresses dynamically
}

// Populate with your deployed contract addresses or use .env
const deployedAddresses: DeployedAddresses = {
    propertyTokenFactory: process.env.PROPERTY_TOKEN_FACTORY_ADDRESS!,
    propertyNFT: process.env.PROPERTY_NFT_ADDRESS!,
    propertyRegistry: process.env.PROPERTY_REGISTRY_ADDRESS!,
    rentDistribution: process.env.RENT_DISTRIBUTION_ADDRESS!,
    propertyMarketplace: process.env.PROPERTY_MARKETPLACE_ADDRESS!,
    propertyDAO: process.env.PROPERTY_DAO_ADDRESS!,
    usdcToken: process.env.USDC_TOKEN_ADDRESS!
};

// Property details (used for identifying tokens, supply, and rent) - REDUCED RENT
const properties = [
    { name: "Miami Beachfront Villa", symbol: "MBV", supply: 10000, monthlyRent: ethers.parseUnits("0.5", 6) },   // $0.50/month
    { name: "Manhattan Luxury Condo", symbol: "MLC", supply: 10000, monthlyRent: ethers.parseUnits("0.75", 6) }, // $0.75/month
    { name: "San Francisco Modern Townhouse", symbol: "SFMT", supply: 10000, monthlyRent: ethers.parseUnits("0.90", 6) },// $0.90/month
    { name: "Chicago Downtown Penthouse", symbol: "CDP", supply: 10000, monthlyRent: ethers.parseUnits("1.0", 6) }    // $1.00/month
];

// Function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("--- Starting Populate State Script ---");
    console.log("Using deployer address:", deployer.address);
    console.log("Target User Addresses:", USER_ADDRESSES);

    // Validate essential addresses are present
    for (const [key, value] of Object.entries(deployedAddresses)) {
        if (!value) {
            throw new Error(`Missing address for ${key} in environment variables or config.`);
        }
        console.log(`Using ${key}: ${value}`);
    }

    // --- Connect to Deployed Contracts ---
    console.log("\nConnecting to deployed contracts...");
    const propertyTokenFactory = await ethers.getContractAt("PropertyTokenFactory", deployedAddresses.propertyTokenFactory) as PropertyTokenFactory;
    const propertyNFT = await ethers.getContractAt("PropertyNFT", deployedAddresses.propertyNFT) as PropertyNFT;
    const propertyRegistry = await ethers.getContractAt("PropertyRegistry", deployedAddresses.propertyRegistry) as PropertyRegistry;
    const rentDistribution = await ethers.getContractAt("RentDistribution", deployedAddresses.rentDistribution) as RentDistribution;
    const propertyMarketplace = await ethers.getContractAt("PropertyMarketplace", deployedAddresses.propertyMarketplace) as PropertyMarketplace;
    const propertyDAO = await ethers.getContractAt("PropertyDAO", deployedAddresses.propertyDAO) as PropertyDAO;
    const usdc = await ethers.getContractAt("IERC20", deployedAddresses.usdcToken) as IERC20;
    console.log("Successfully connected to core contracts.");

    // --- Fetch Property Token Addresses Dynamically ---
    console.log("\nFetching Property Token addresses from Factory...");
    const fetchedTokenAddresses = await propertyTokenFactory.getAllTokens();
    const propertyTokens: { [symbol: string]: { address: string, contract: PropertyToken, name: string } } = {};

    if (fetchedTokenAddresses.length !== properties.length) {
        console.warn(`Mismatch: Factory has ${fetchedTokenAddresses.length} tokens, expected ${properties.length}. Check deployment.`);
        // Attempt to match by order, assuming deployment order matches `properties` array
        for (let i = 0; i < Math.min(fetchedTokenAddresses.length, properties.length); i++) {
            const prop = properties[i];
            const address = fetchedTokenAddresses[i];
            propertyTokens[prop.symbol] = {
                address: address,
                contract: await ethers.getContractAt("PropertyToken", address) as PropertyToken,
                name: prop.name
            };
            console.log(`Fetched ${prop.symbol} (${prop.name}): ${address}`);
        }
    } else {
        // Assuming order matches properties array
         for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            const address = fetchedTokenAddresses[i];
            propertyTokens[prop.symbol] = {
                address: address,
                contract: await ethers.getContractAt("PropertyToken", address) as PropertyToken,
                name: prop.name
            };
            console.log(`Fetched ${prop.symbol} (${prop.name}): ${address}`);
        }
    }
     if (Object.keys(propertyTokens).length === 0) {
        throw new Error("Could not fetch any property token addresses from the factory. Ensure tokens were created.");
    }


    // --- Verify NFT Minting & Registration (Optional Check) ---
    console.log("\nVerifying NFT and Registry status (optional)...");
    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        const tokenInfo = propertyTokens[prop.symbol];
        if (!tokenInfo) {
            console.warn(`Skipping verification for ${prop.name}, token address not found.`);
            continue;
        }
        try {
            const owner = await propertyNFT.ownerOf(i);
            const registeredToken = await propertyRegistry.getPropertyToken(deployedAddresses.propertyNFT, i);
            console.log(`NFT ${i} (${prop.name}): Owner ${owner}, Registered Token ${registeredToken} (Expected: ${tokenInfo.address})`);
            if (registeredToken.toLowerCase() !== tokenInfo.address.toLowerCase()) {
                console.warn(`Registry mismatch for NFT ${i}! Expected ${tokenInfo.address}, got ${registeredToken}. Consider re-registering.`);
                // Optional: Add re-registration logic here if needed
                // console.log(`Attempting to re-register NFT ${i}...`);
                // const registerTx = await (propertyRegistry as any)["registerProperty(address,uint256,address)"](
                //     deployedAddresses.propertyNFT,
                //     BigInt(i),
                //     tokenInfo.address
                // );
                // await registerTx.wait();
                // console.log(`Re-registration complete for NFT ${i}.`);
                // await delay(1000); // Add delay after transaction
            }
        } catch (error: any) {
            console.warn(`Could not verify NFT ${i} (${prop.name}): ${error.message}. Was it minted and registered?`);
        }
         await delay(500); // Small delay between reads
    }

    // --- Ensure Deployer has Initial Tokens ---
    console.log("\nEnsuring deployer has initial tokens...");
    for (const symbol in propertyTokens) {
        const tokenInfo = propertyTokens[symbol];
        try {
            const deployerBalance = await tokenInfo.contract.balanceOf(deployer.address);
            const totalSupply = await tokenInfo.contract.totalSupply(); // Fetch total supply for context
            const expectedTotalSupply = ethers.parseUnits(properties.find(p => p.symbol === symbol)!.supply.toString(), 18);

            console.log(`Deployer balance for ${symbol}: ${ethers.formatUnits(deployerBalance, 18)} / ${ethers.formatUnits(expectedTotalSupply, 18)}`);

            // Mint only if balance is zero and total supply is less than expected (indicating incomplete initial mint)
             if (deployerBalance === 0n && totalSupply < expectedTotalSupply) {
                const amountToMint = expectedTotalSupply - totalSupply;
                if (amountToMint > 0n) {
                    console.log(`Minting initial ${ethers.formatUnits(amountToMint, 18)} ${symbol} tokens to deployer ${deployer.address}...`);
                    const mintTx = await tokenInfo.contract.mint(deployer.address, amountToMint);
                    await mintTx.wait();
                    console.log(`Minted ${symbol} tokens.`);
                    await delay(1000); // Add delay after transaction
                }
             } else if (deployerBalance < expectedTotalSupply && deployerBalance > 0n) {
                 console.log(`Deployer already has some ${symbol} tokens, assuming initial mint occurred.`);
             } else if (deployerBalance.toString() === expectedTotalSupply.toString()){
                 console.log(`Deployer holds the total supply for ${symbol}.`);
             }
        } catch (error: any) {
            console.error(`Error checking/minting for ${symbol}: ${error.message}`);
        }
         await delay(500); // Small delay between reads/writes
    }

    // --- Distribute Tokens to Users ---
    console.log("\nDistributing tokens to users...");
    let successfulTransfers = 0;
    for (const symbol in TOKEN_DISTRIBUTION_PLAN) {
        const distribution = TOKEN_DISTRIBUTION_PLAN[symbol];
        const tokenInfo = propertyTokens[symbol];
        if (!tokenInfo) {
            console.warn(`Cannot distribute ${symbol} tokens, address not found.`);
            continue;
        }

        console.log(`Distributing ${symbol} (${tokenInfo.name})...`);
        const deployerBalanceStart = await tokenInfo.contract.balanceOf(deployer.address);
        let totalToDistribute = 0n;

        for (const userIndexStr in distribution) {
             const userIndex = parseInt(userIndexStr, 10);
             const amountStr = distribution[userIndex];
             const amount = ethers.parseUnits(amountStr, 18);
             totalToDistribute += amount;
        }

        console.log(`Deployer needs ${ethers.formatUnits(totalToDistribute, 18)} ${symbol} to distribute. Has: ${ethers.formatUnits(deployerBalanceStart, 18)}`);

        if (deployerBalanceStart < totalToDistribute) {
             console.error(`Deployer has insufficient ${symbol} balance (${ethers.formatUnits(deployerBalanceStart, 18)}) to distribute ${ethers.formatUnits(totalToDistribute, 18)}. Skipping distribution for ${symbol}.`);
             continue;
        }

        for (const userIndexStr in distribution) {
            const userIndex = parseInt(userIndexStr, 10);
            const targetUserAddress = USER_ADDRESSES[userIndex];
            const amountStr = distribution[userIndex];
            const amount = ethers.parseUnits(amountStr, 18);

            if (amount === 0n) {
                console.log(` - Skipping 0 amount for User ${userIndex} (${targetUserAddress.substring(0, 6)}...)`);
                continue;
            }

            try {
                console.log(` - Transferring ${amountStr} ${symbol} to User ${userIndex} (${targetUserAddress})...`);
                const transferTx = await tokenInfo.contract.transfer(targetUserAddress, amount);
                await transferTx.wait();
                console.log(`   ✅ Transferred successfully.`);
                successfulTransfers++;
                await delay(1000); // Add delay
            } catch (error: any) {
                console.error(`   ❌ Error transferring ${amountStr} ${symbol} to User ${userIndex} (${targetUserAddress}): ${error.message}`);
            }
        }
         await delay(500); // Small delay between properties
    }

    // --- Deposit Rent ---
    console.log("\nDepositing rent (using deployer account)...");
    let rentDepositsCount = 0;
    const usdcDecimals = 6n; // Standard USDC decimals = 6 (use BigInt notation 'n')
     const deployerUsdcBalance = await usdc.balanceOf(deployer.address);
     console.log(`Deployer USDC Balance: ${ethers.formatUnits(deployerUsdcBalance, usdcDecimals)}`);

    for (const symbol in propertyTokens) {
        const tokenInfo = propertyTokens[symbol];
        const prop = properties.find(p => p.symbol === symbol)!;
        const rentAmount = prop.monthlyRent * 2n; // Deposit 2 months' rent

        console.log(`Depositing ${ethers.formatUnits(rentAmount, usdcDecimals)} USDC rent for ${symbol}...`);

        try {
             // Check deployer's USDC balance
             const currentDeployerUsdcBalance = await usdc.balanceOf(deployer.address);
             if (currentDeployerUsdcBalance < rentAmount) {
                 console.warn(`   ⚠️ Deployer has insufficient USDC (${ethers.formatUnits(currentDeployerUsdcBalance, usdcDecimals)}) to deposit ${ethers.formatUnits(rentAmount, usdcDecimals)} for ${symbol}. Skipping.`);
                 continue;
             }

            // Approve RentDistribution contract to spend USDC
            console.log(`   Approving RentDistribution contract (${await rentDistribution.getAddress()}) to spend ${ethers.formatUnits(rentAmount, usdcDecimals)} USDC...`);
            const approveTx = await usdc.approve(await rentDistribution.getAddress(), rentAmount);
            await approveTx.wait();
            console.log(`   Approval successful.`);
            await delay(1000); // Delay after approval

            // Deposit rent
            console.log(`   Depositing rent...`);
            const depositTx = await rentDistribution.depositRent(tokenInfo.address, rentAmount);
            await depositTx.wait();
            console.log(`   ✅ Rent deposited successfully for ${symbol}.`);
            rentDepositsCount++;
            await delay(1000); // Delay after deposit

        } catch (error: any) {
            console.error(`   ❌ Error depositing rent for ${symbol}: ${error.message}`);
        }
         await delay(500); // Small delay between properties
    }

    // --- Prepare Marketplace Listings ---
    console.log("\nPreparing Marketplace Listings (User actions required)...");
    let listingsPrepared = 0;
    let listingsCreatedByDeployer = 0;

    const usdcDecimalsForListing = 6n; // Use hardcoded 6 for USDC

    for (const scenario of LISTING_SCENARIOS) {
        const { userIndex, propertySymbol, amount, pricePerTokenUsdc } = scenario;
        const tokenInfo = propertyTokens[propertySymbol];
        const listingAmount = ethers.parseUnits(amount, 18);
        // Price per token needs to be formatted based on 18 decimals for PropertyToken and USDC decimals for price
        const pricePerToken = ethers.parseUnits(pricePerTokenUsdc, Number(usdcDecimalsForListing)); // Price is in USDC units

        if (!tokenInfo) {
            console.warn(`Cannot prepare listing for ${propertySymbol}, token info not found.`);
            continue;
        }

        const actorAddress = userIndex === -1 ? deployer.address : USER_ADDRESSES[userIndex];
        const actorName = userIndex === -1 ? "Deployer" : `User ${userIndex}`;

        console.log(`\nPreparing listing: ${actorName} lists ${amount} ${propertySymbol} at ${pricePerTokenUsdc} USDC/token.`);

        try {
            // Check actor's balance
            const balance = await tokenInfo.contract.balanceOf(actorAddress);
            console.log(` - ${actorName} balance of ${propertySymbol}: ${ethers.formatUnits(balance, 18)}`);

            if (balance < listingAmount) {
                console.warn(`   ⚠️ Insufficient balance for ${actorName} to list ${amount} ${propertySymbol}. Skipping.`);
                continue;
            }

            // If deployer, execute the approval and listing
            if (userIndex === -1) {
                console.log(`   Executing listing creation for Deployer...`);
                // Approve marketplace
                console.log(`   Approving marketplace (${await propertyMarketplace.getAddress()}) for ${amount} ${propertySymbol}...`);
                const approveTx = await tokenInfo.contract.connect(deployer).approve(await propertyMarketplace.getAddress(), listingAmount);
                await approveTx.wait();
                 console.log(`   Approval successful.`);
                 await delay(1000);

                // Create listing
                 console.log(`   Creating listing...`);
                const listTx = await propertyMarketplace.connect(deployer).createListing(
                    tokenInfo.address,
                    listingAmount,
                    pricePerToken
                );
                const receipt = await listTx.wait();
                 // Find ListingCreated event if possible to get listingId (optional)
                 const listingCreatedEvent = receipt?.logs?.map(log => { try { return propertyMarketplace.interface.parseLog(log as any); } catch { return null; } }).find(event => event?.name === 'ListingCreated');
                 const listingId = listingCreatedEvent?.args?.listingId;
                console.log(`   ✅ Listing created successfully by Deployer (Listing ID: ${listingId ?? 'N/A'}).`);
                listingsCreatedByDeployer++;
                 await delay(1000);
            } else {
                // Log action required for other users
                console.log(`   ➡️ ACTION REQUIRED for ${actorName} (${actorAddress}):`);
                console.log(`      1. Approve Marketplace (${await propertyMarketplace.getAddress()}) to spend ${amount} ${propertySymbol} tokens (${tokenInfo.address}).`);
                console.log(`      2. Call createListing on Marketplace (${await propertyMarketplace.getAddress()}) with:`);
                console.log(`         - _propertyToken: ${tokenInfo.address}`);
                console.log(`         - _tokenAmount: ${listingAmount.toString()}`);
                console.log(`         - _pricePerToken: ${pricePerToken.toString()}`);
                listingsPrepared++;
            }
        } catch (error: any) {
            console.error(`   ❌ Error preparing/creating listing for ${propertySymbol} by ${actorName}: ${error.message}`);
        }
         await delay(500); // Delay between scenarios
    }

    // --- Prepare DAO Proposals ---
    console.log("\nPreparing DAO Proposals (User actions required)...");
    let proposalsPrepared = 0;
    let proposalsCreatedByDeployer = 0;
    const daoThreshold = await propertyDAO.proposalThreshold();
     // Assuming the DAO uses the first property token (MBV) for initial governance checks if not specified differently
     const primaryDaoGovTokenSymbol = properties[0].symbol; // e.g., MBV
     const primaryDaoGovTokenAddress = propertyTokens[primaryDaoGovTokenSymbol].address;
    console.log(`DAO Proposal Threshold: ${daoThreshold.toString()} basis points.`);


    for (const scenario of PROPOSAL_SCENARIOS) {
        const { userIndex, propertySymbol, description, targetContractKey, calldata } = scenario;
        const tokenInfo = propertyTokens[propertySymbol]; // The token relevant TO THE PROPOSAL itself
        const govTokenToCheck = propertyTokens[primaryDaoGovTokenSymbol].contract; // Token used for threshold check
        const govTokenAddr = primaryDaoGovTokenAddress;


        if (!tokenInfo) {
            console.warn(`Cannot prepare proposal targeting ${propertySymbol}, token info not found.`);
            continue;
        }

        const actorAddress = userIndex === -1 ? deployer.address : USER_ADDRESSES[userIndex];
        const actorName = userIndex === -1 ? "Deployer" : `User ${userIndex}`;
        const targetContractAddress = deployedAddresses[targetContractKey as keyof DeployedAddresses] || ethers.ZeroAddress; // Get address based on key

        console.log(`\nPreparing proposal: "${description}" by ${actorName} targeting property ${propertySymbol}.`);
        console.log(` - Target Contract (${targetContractKey}): ${targetContractAddress}`);
        console.log(` - Governance Token for Threshold Check: ${primaryDaoGovTokenSymbol} (${govTokenAddr})`);


        try {
            // Check proposer's balance of the GOVERNANCE token
            const balance = await govTokenToCheck.balanceOf(actorAddress);
            const totalSupply = await govTokenToCheck.totalSupply();
            console.log(` - ${actorName}'s Governance Token Balance (${primaryDaoGovTokenSymbol}): ${ethers.formatUnits(balance, 18)}`);
            console.log(` - Total Supply of ${primaryDaoGovTokenSymbol}: ${ethers.formatUnits(totalSupply, 18)}`);


            const hasEnoughTokens = totalSupply > 0n ? (balance * 10000n) / totalSupply >= daoThreshold : false;

            if (!hasEnoughTokens) {
                console.warn(`   ⚠️ Insufficient governance tokens for ${actorName} to create proposal. Needs >= ${daoThreshold.toString()} basis points. Skipping.`);
                continue;
            }
             console.log(`   ✅ ${actorName} meets the proposal threshold.`);

            // If deployer, execute the proposal creation
            if (userIndex === -1) {
                 console.log(`   Executing proposal creation for Deployer...`);
                 try {
                    const proposeTx = await propertyDAO.connect(deployer).createProposal(
                        description,
                        targetContractAddress,
                        calldata,
                        tokenInfo.address // The specific property token this proposal relates to
                    );
                    const receipt = await proposeTx.wait();
                     const proposalCreatedEvent = receipt?.logs?.map(log => { try { return propertyDAO.interface.parseLog(log as any); } catch { return null; } }).find(event => event?.name === 'ProposalCreated');
                     const proposalId = proposalCreatedEvent?.args?.proposalId;
                    console.log(`   ✅ Proposal created successfully by Deployer (Proposal ID: ${proposalId ?? 'N/A'}).`);
                    proposalsCreatedByDeployer++;
                    await delay(1000);
                 } catch(creationError: any) {
                      console.error(`  ❌ Error during deployer's proposal creation tx: ${creationError.message}`);
                 }
            } else {
                // Log action required for other users
                console.log(`   ➡️ ACTION REQUIRED for ${actorName} (${actorAddress}):`);
                console.log(`      Call createProposal on DAO (${await propertyDAO.getAddress()}) with:`);
                console.log(`         - _description: "${description}"`);
                console.log(`         - _targetContract: ${targetContractAddress}`);
                console.log(`         - _functionCall: "${calldata}"`);
                console.log(`         - _propertyTokenAddress: ${tokenInfo.address}`); // Crucial: address of the token the proposal is *about*
                proposalsPrepared++;
            }
        } catch (error: any) {
            console.error(`   ❌ Error preparing/creating proposal for ${propertySymbol} by ${actorName}: ${error.message}`);
        }
         await delay(500); // Delay between scenarios
    }


    // --- Summary ---
    console.log("\n--- Populate State Summary ---");
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Target Users: ${USER_ADDRESSES.join(', ')}`);
    console.log(`Token Transfers Attempted/Successful: Check logs above (${successfulTransfers} successful transfers logged)`);
    console.log(`Rent Deposits Successful: ${rentDepositsCount} / ${Object.keys(propertyTokens).length}`);
    console.log(`Marketplace Listings Created by Deployer: ${listingsCreatedByDeployer}`);
    console.log(`Marketplace Listings Prepared (Require User Action): ${listingsPrepared}`);
    console.log(`DAO Proposals Created by Deployer: ${proposalsCreatedByDeployer}`);
    console.log(`DAO Proposals Prepared (Require User Action): ${proposalsPrepared}`);
    console.log("\n--- Manual Actions Required ---");
    console.log("Review the 'ACTION REQUIRED' logs above for steps needed by test users:");
    console.log(" - Users need to approve the Marketplace and call createListing for their prepared listings.");
    console.log(" - Users need to call createProposal for their prepared proposals.");
    console.log(" - Users may need USDC funds deposited to purchase from listings.");
    console.log(" - Users can now test 'claimRent' for properties where rent was deposited.");
    console.log("-----------------------------");
    console.log("Script finished.");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in populateState script:", error);
        process.exit(1);
    });