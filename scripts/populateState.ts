import { ethers, network } from "hardhat";
import {
    PropertyToken,
    PropertyNFT,
    PropertyRegistry,
    RentDistribution,
    PropertyMarketplace,
    PropertyDAO,
    PropertyTokenFactory,
    IERC20
} from "../typechain-types";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Configuration ---

const USER_ADDRESSES = [
    "0xa83126A279960797233d48488e5908d6C1E72f2F", // User 0
    "0xcd64902df08575Df5F3499CdA6F14154fB48E362", // User 1
    "0x61210F2D208BaDF9101d91890C91EEC186707446", // User 2
    "0xdC6Ce97a7EB152D2f64Ae98512d3126601b74560"  // User 3
];

// Expected properties from deployAll.ts - MUST MATCH SYMBOLS AND COUNT
const EXPECTED_PROPERTY_SYMBOLS = ["MBV", "MLC", "SFMT", "CDP", "EWID", "ICON", "PYR", "ORA", "SMV"];

const TOKEN_DISTRIBUTION_PLAN: { [propertySymbol: string]: { [userIndex: number]: string } } = {
    // User 0: Strong MBV, EWID. Medium SFMT, PYR.
    // User 1: Strong MLC, ICON. Medium CDP.
    // User 2: Strong SFMT, ORA. Medium MBV, SMV.
    // User 3: Strong CDP, PYR. Medium EWID.
    // Deployer keeps the rest. All sums should be < 10000.
    "MBV":  { 0: "4000", 2: "1500", /*Deployer: 4500*/ },
    "MLC":  { 1: "5000", /*Deployer: 5000*/ },
    "SFMT": { 0: "1000", 1: "500",  2: "4000", /*Deployer: 4500*/ },
    "CDP":  { 1: "2000", 3: "4500", /*Deployer: 3500*/ },
    "EWID": { 0: "3500", 3: "1500", /*Deployer: 5000*/ },
    "ICON": { 1: "4000", 2: "1000", /*Deployer: 5000*/ },
    "PYR":  { 0: "500",  3: "3000", /*Deployer: 6500*/ },
    "ORA":  { 2: "5500", /*Deployer: 4500*/ },
    "SMV":  { 2: "2000", 3: "500", /*Deployer: 7500*/ }
};

const LISTING_SCENARIOS = [
    // User listings
    { userIndex: 0, propertySymbol: "MBV", amount: "500", pricePerTokenUsdc: "0.02" },  // User 0 lists MBV
    { userIndex: 1, propertySymbol: "MLC", amount: "300", pricePerTokenUsdc: "0.03" },  // User 1 lists MLC
    { userIndex: 2, propertySymbol: "SFMT", amount: "1000", pricePerTokenUsdc: "0.02" },// User 2 lists SFMT
    { userIndex: 3, propertySymbol: "CDP", amount: "200", pricePerTokenUsdc: "0.04" },  // User 3 lists CDP
    { userIndex: 0, propertySymbol: "EWID", amount: "100", pricePerTokenUsdc: "0.01" }, // User 0 lists EWID

    // Deployer listings (competitive pricing)
    { userIndex: -1, propertySymbol: "MBV", amount: "1000", pricePerTokenUsdc: "0.015" },
    { userIndex: -1, propertySymbol: "ICON", amount: "500", pricePerTokenUsdc: "0.025" },
    { userIndex: -1, propertySymbol: "ORA", amount: "800", pricePerTokenUsdc: "0.01" },
];

// Rent configuration: monthly USDC rent per property (total, not per token)
const PROPERTY_RENT_CONFIG: { [propertySymbol: string]: string } = {
    "MBV": "0.20", "MLC": "0.25", "SFMT": "0.30", "CDP": "0.22", "EWID": "0.10",
    "ICON": "0.15", "PYR": "0.12", "ORA": "0.18", "SMV": "0.16"
};


// --- End Configuration ---

interface DeployedAddresses {
    propertyTokenFactory: string;
    propertyNFT: string;
    propertyRegistry: string;
    rentDistribution: string;
    propertyMarketplace: string;
    propertyDAO: string;
    usdcToken: string;
}

const deployedAddresses: DeployedAddresses = {
    propertyTokenFactory: process.env.PROPERTY_TOKEN_FACTORY_ADDRESS!,
    propertyNFT: process.env.PROPERTY_NFT_ADDRESS!,
    propertyRegistry: process.env.PROPERTY_REGISTRY_ADDRESS!,
    rentDistribution: process.env.RENT_DISTRIBUTION_ADDRESS!,
    propertyMarketplace: process.env.PROPERTY_MARKETPLACE_ADDRESS!,
    propertyDAO: process.env.PROPERTY_DAO_ADDRESS!,
    usdcToken: process.env.USDC_TOKEN_ADDRESS!
};

interface PropertyTokenInfo {
    address: string;
    contract: PropertyToken;
    name: string;
    symbol: string;
}
const propertyTokens: { [symbol: string]: PropertyTokenInfo } = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const USDC_DECIMALS = 6n; // Using BigInt for clarity

async function main() {
    console.log("\n--- BrickBase Expo State Population Script ---");
    console.log(`Running on network: ${network.name}`);
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer account: ${deployer.address}`);

    if (Object.values(deployedAddresses).some(addr => !addr)) {
        throw new Error("One or more contract addresses are missing in .env. Please deploy first and update .env.");
    }

    // Get contract instances
    const propertyTokenFactory = await ethers.getContractAt("PropertyTokenFactory", deployedAddresses.propertyTokenFactory) as PropertyTokenFactory;
    const propertyNFT = await ethers.getContractAt("PropertyNFT", deployedAddresses.propertyNFT) as PropertyNFT;
    const propertyRegistry = await ethers.getContractAt("PropertyRegistry", deployedAddresses.propertyRegistry) as PropertyRegistry;
    const rentDistribution = await ethers.getContractAt("RentDistribution", deployedAddresses.rentDistribution) as RentDistribution;
    const propertyMarketplace = await ethers.getContractAt("PropertyMarketplace", deployedAddresses.propertyMarketplace) as PropertyMarketplace;
    const propertyDAO = await ethers.getContractAt("PropertyDAO", deployedAddresses.propertyDAO) as PropertyDAO;
    const usdc = await ethers.getContractAt("IERC20", deployedAddresses.usdcToken) as IERC20;

    console.log("\nFetching Property Token addresses from Factory...");
    const fetchedTokenAddresses = await propertyTokenFactory.getAllTokens();

    if (fetchedTokenAddresses.length !== EXPECTED_PROPERTY_SYMBOLS.length) {
        console.error(`CRITICAL: Factory has ${fetchedTokenAddresses.length} tokens, but deployAll.ts should have deployed ${EXPECTED_PROPERTY_SYMBOLS.length}.`);
        console.error("Please ensure deployAll.ts successfully created all property tokens and that PROPERTY_TOKEN_FACTORY_ADDRESS in .env is correct.");
        throw new Error("Property token count mismatch.");
    }

    for (let i = 0; i < EXPECTED_PROPERTY_SYMBOLS.length; i++) {
        const symbol = EXPECTED_PROPERTY_SYMBOLS[i];
        const address = fetchedTokenAddresses[i];
        const tempContract = await ethers.getContractAt("PropertyToken", address) as PropertyToken;
        const name = await tempContract.name(); // Fetch name from contract
        propertyTokens[symbol] = { address, contract: tempContract, name, symbol };
        console.log(`Fetched ${symbol} (${name}): ${address}`);
    }
    await delay(500);

    console.log("\nVerifying NFT and Registry status...");
    for (let i = 0; i < EXPECTED_PROPERTY_SYMBOLS.length; i++) {
        const symbol = EXPECTED_PROPERTY_SYMBOLS[i];
        const tokenInfo = propertyTokens[symbol];
        try {
            const nftOwner = await propertyNFT.ownerOf(i);
            const registeredTokenData = await propertyRegistry.registeredProperties(i); // Fetch by index
            const registeredTokenAddress = registeredTokenData.propertyToken;

            console.log(`NFT ${i} (${tokenInfo.name}): Owner ${nftOwner}, Registered PropertyToken ${registeredTokenAddress}`);
            if (registeredTokenAddress.toLowerCase() !== tokenInfo.address.toLowerCase()) {
                console.warn(`  Registry mismatch for NFT ${i}! Expected ${tokenInfo.address}, got ${registeredTokenAddress}. This might cause issues.`);
            }
        } catch (error: any) {
            console.error(`  Error verifying NFT ${i} (${tokenInfo.name}): ${error.message}`);
        }
        await delay(200);
    }

    console.log("\nDistributing Property Tokens...");
    for (const symbol of EXPECTED_PROPERTY_SYMBOLS) {
        const tokenInfo = propertyTokens[symbol];
        const distributionPlan = TOKEN_DISTRIBUTION_PLAN[symbol];
        if (!tokenInfo || !distributionPlan) {
            console.warn(`Skipping distribution for ${symbol}, no plan or token info.`);
            continue;
        }
        console.log(`Distributing ${tokenInfo.name} (${symbol})...`);
        const deployerBalanceInitial = await tokenInfo.contract.balanceOf(deployer.address);
        console.log(`  Deployer initial balance: ${ethers.formatUnits(deployerBalanceInitial, 18)} ${symbol}`);

        for (const userIndexStr in distributionPlan) {
            const userIndex = parseInt(userIndexStr);
            const amountStr = distributionPlan[userIndex];
            const amount = ethers.parseUnits(amountStr, 18);
            const targetUserAddress = USER_ADDRESSES[userIndex];

            if (amount === 0n) continue;

            if (deployerBalanceInitial < amount) {
                 console.warn(`  Deployer has insufficient ${symbol} (${ethers.formatUnits(deployerBalanceInitial, 18)}) to send ${amountStr} to User ${userIndex}. Check deployAll.ts minting.`);
                 // As a fallback, try to mint to deployer if total supply allows. This assumes deployer has minting rights.
                 // This is risky and ideally deployAll.ts handles initial supply correctly.
                 try {
                    const totalSupply = await tokenInfo.contract.totalSupply();
                    const maxSupply = ethers.parseUnits("10000", 18); // Assuming 10k max
                    if (totalSupply < maxSupply) {
                        const needed = amount - deployerBalanceInitial;
                        const canMint = maxSupply - totalSupply;
                        const toMint = needed < canMint ? needed : canMint;
                        if (toMint > 0n) {
                            console.log(`  Attempting to mint ${ethers.formatUnits(toMint, 18)} ${symbol} to deployer as fallback...`);
                            await (tokenInfo.contract.connect(deployer) as any).mint(deployer.address, toMint); // Cast to any if mint is not in standard IERC20 via Typechain
                            await delay(1000);
                             console.log(`  Fallback mint successful for deployer. Retrying transfer.`);
                        }
                    }
                 } catch (e:any) { console.error(`  Fallback mint failed for ${symbol}: ${e.message}`); }
            }
            
            const currentDeployerBalance = await tokenInfo.contract.balanceOf(deployer.address);
            if (currentDeployerBalance >= amount) {
                try {
                    console.log(`  Sending ${amountStr} ${symbol} to User ${userIndex} (${targetUserAddress.substring(0,6)})...`);
                    await tokenInfo.contract.connect(deployer).transfer(targetUserAddress, amount);
                    console.log(`    ✅ Transferred.`);
                    await delay(1000);
                } catch (e: any) {
                    console.error(`    ❌ Failed to transfer ${symbol} to User ${userIndex}: ${e.message}`);
                }
            } else {
                 console.warn(`  Still insufficient ${symbol} for User ${userIndex} after potential fallback mint. Skipping.`);
            }
        }
    }
    await delay(500);

    console.log("\nDepositing Rent (2 months worth)...");
    const deployerUsdcInitial = await usdc.balanceOf(deployer.address);
    console.log(`Deployer initial USDC: ${ethers.formatUnits(deployerUsdcInitial, USDC_DECIMALS)}`);

    for (const symbol of EXPECTED_PROPERTY_SYMBOLS) {
        const tokenInfo = propertyTokens[symbol];
        const rentStr = PROPERTY_RENT_CONFIG[symbol];
        if (!tokenInfo || !rentStr) {
            console.warn(`Skipping rent deposit for ${symbol}, no config or token info.`);
            continue;
        }
        const monthlyRent = ethers.parseUnits(rentStr, Number(USDC_DECIMALS));
        const rentToDeposit = monthlyRent * 2n; // 2 months

        console.log(`Depositing ${ethers.formatUnits(rentToDeposit, USDC_DECIMALS)} USDC for ${tokenInfo.name} (${symbol})...`);
        try {
            const currentUsdc = await usdc.balanceOf(deployer.address);
            if (currentUsdc < rentToDeposit) {
                console.error(`  ❌ Deployer has insufficient USDC (${ethers.formatUnits(currentUsdc, USDC_DECIMALS)}) to deposit for ${symbol}. Need ${ethers.formatUnits(rentToDeposit, USDC_DECIMALS)}.`);
                continue;
            }
            await usdc.connect(deployer).approve(deployedAddresses.rentDistribution, rentToDeposit);
            await delay(1000);
            await rentDistribution.connect(deployer).depositRent(tokenInfo.address, rentToDeposit);
            console.log(`  ✅ Rent deposited for ${symbol}.`);
            await delay(1000);
        } catch (e: any) {
            console.error(`  ❌ Failed to deposit rent for ${symbol}: ${e.message}`);
        }
    }
    await delay(500);

    console.log("\nCreating Marketplace Listings...");
    for (const scenario of LISTING_SCENARIOS) {
        const { userIndex, propertySymbol, amount, pricePerTokenUsdc } = scenario;
        const tokenInfo = propertyTokens[propertySymbol];
        if (!tokenInfo) {
            console.warn(`Skipping listing for ${propertySymbol}, token info not found.`);
            continue;
        }
        const listingAmount = ethers.parseUnits(amount, 18);
        const pricePerToken = ethers.parseUnits(pricePerTokenUsdc, Number(USDC_DECIMALS));
        const lister = userIndex === -1 ? deployer : await ethers.getSigner(USER_ADDRESSES[userIndex]);
        const listerAddress = await lister.getAddress();
        const listerName = userIndex === -1 ? "Deployer" : `User ${userIndex}`;

        console.log(`${listerName} listing ${amount} ${propertySymbol} at ${pricePerTokenUsdc} USDC/token...`);
        try {
            const balance = await tokenInfo.contract.balanceOf(listerAddress);
            if (balance < listingAmount) {
                console.warn(`  ⚠️ ${listerName} has insufficient ${propertySymbol} (${ethers.formatUnits(balance,18)}) to list ${amount}. Skipping.`);
                continue;
            }
            await tokenInfo.contract.connect(lister).approve(deployedAddresses.propertyMarketplace, listingAmount);
            await delay(1000);
            const listTx = await propertyMarketplace.connect(lister).createListing(tokenInfo.address, listingAmount, pricePerToken);
            const receipt = await listTx.wait();
            const listingId = receipt?.logs?.map(log => { try { return propertyMarketplace.interface.parseLog(log as any); } catch { return null; } }).find(event => event?.name === 'ListingCreated')?.args?.listingId;
            console.log(`  ✅ Listing created by ${listerName} (ID: ${listingId ?? 'N/A'}).`);
            await delay(1000);
        } catch (e: any) {
            console.error(`  ❌ Failed to create listing for ${propertySymbol} by ${listerName}: ${e.message}`);
        }
    }
    await delay(500);

    // --- DAO PROPOSALS ---
    console.log("\nCreating DAO Proposals for Expo Showcase...");
    const daoVotingPeriod = await propertyDAO.votingPeriod();
    const daoExecutionDelay = await propertyDAO.executionDelay();
    console.log(`DAO Config: Voting Period ${daoVotingPeriod}s, Execution Delay ${daoExecutionDelay}s`);

    const targetRentDistribution = deployedAddresses.rentDistribution;
    // Placeholder calldata (e.g., for a setMaintenanceBudget(uint256) function)
    const budgetCalldata = new ethers.Interface(["function setMaintenanceBudget(uint256 budget)"]).encodeFunctionData("setMaintenanceBudget", [ethers.parseUnits("0.01", Number(USDC_DECIMALS))]); // 0.01 USDC

    // 1. Immediate Short-Circuit (PASS) - MBV
    try {
        const propSymbol = "MBV";
        const proposerIndex = 0; // User 0 has many MBV
        const proposer = await ethers.getSigner(USER_ADDRESSES[proposerIndex]);
        const tokenInfo = propertyTokens[propSymbol];
        console.log(`\n1. Proposal: Short-circuit PASS for ${propSymbol} by User ${proposerIndex}`);
        const desc1 = `[Expo Demo] Approve emergency roof repair for ${tokenInfo.name} - 0.01 USDC`;
        const createTx1 = await propertyDAO.connect(proposer).createProposal(desc1, targetRentDistribution, budgetCalldata, tokenInfo.address);
        const receipt1 = await createTx1.wait();
        const proposalId1 = receipt1?.logs?.map(l => { try { return propertyDAO.interface.parseLog(l as any); } catch { return null; } }).find(e => e?.name === "ProposalCreated")?.args?.proposalId;
        console.log(`  Proposal 1 (${propSymbol}) ID ${proposalId1} created. Voting YES to short-circuit PASS...`);
        await delay(1000);
        if (proposalId1 !== undefined) {
            await propertyDAO.connect(proposer).castVote(proposalId1, true); // Vote YES
            console.log(`  ✅ Voted YES. Should be 'Passed' (via short-circuit).`);
        }
        await delay(1000);
    } catch (e: any) { console.error(`  ❌ Error with Short-circuit PASS proposal: ${e.message}`); }

    // 2. Immediate Short-Circuit (FAIL) - MLC
    try {
        const propSymbol = "MLC";
        const proposerIndex = 0; // User 0 (minority holder)
        const voterIndex = 1; // User 1 (majority holder)
        const proposer = await ethers.getSigner(USER_ADDRESSES[proposerIndex]);
        const voter = await ethers.getSigner(USER_ADDRESSES[voterIndex]);
        const tokenInfo = propertyTokens[propSymbol];
        console.log(`\n2. Proposal: Short-circuit FAIL for ${propSymbol} by User ${proposerIndex}, voted NO by User ${voterIndex}`);
        const desc2 = `[Expo Demo] Controversial: Repaint ${tokenInfo.name} exterior pink - 0.01 USDC`;
        const createTx2 = await propertyDAO.connect(proposer).createProposal(desc2, targetRentDistribution, budgetCalldata, tokenInfo.address);
        const receipt2 = await createTx2.wait();
        const proposalId2 = receipt2?.logs?.map(l => { try { return propertyDAO.interface.parseLog(l as any); } catch { return null; } }).find(e => e?.name === "ProposalCreated")?.args?.proposalId;
        console.log(`  Proposal 2 (${propSymbol}) ID ${proposalId2} created. User ${voterIndex} voting NO to short-circuit FAIL...`);
        await delay(1000);
        if (proposalId2 !== undefined) {
            await propertyDAO.connect(voter).castVote(proposalId2, false); // Vote NO
            console.log(`  ✅ Voted NO. Should be 'Rejected' (via short-circuit).`);
        }
        await delay(1000);
    } catch (e: any) { console.error(`  ❌ Error with Short-circuit FAIL proposal: ${e.message}`); }

    // 3. End During Expo (Natural PASS) - SFMT (Voting: 1.5hr)
    // User 2 proposes. User 0 (YES), User 2 (YES). User 1 (NO).
    try {
        const propSymbol = "SFMT";
        const proposerIndex = 2; // User 2
        const proposer = await ethers.getSigner(USER_ADDRESSES[proposerIndex]);
        const voter0 = await ethers.getSigner(USER_ADDRESSES[0]);
        const voter1 = await ethers.getSigner(USER_ADDRESSES[1]);
        const tokenInfo = propertyTokens[propSymbol];
        console.log(`\n3. Proposal: Natural PASS for ${propSymbol} (ends in ~1.5hr) by User ${proposerIndex}`);
        const desc3 = `[Expo Demo] Fund community garden at ${tokenInfo.name} - 0.01 USDC`;
        const createTx3 = await propertyDAO.connect(proposer).createProposal(desc3, targetRentDistribution, budgetCalldata, tokenInfo.address);
        const receipt3 = await createTx3.wait();
        const proposalId3 = receipt3?.logs?.map(l => { try { return propertyDAO.interface.parseLog(l as any); } catch { return null; } }).find(e => e?.name === "ProposalCreated")?.args?.proposalId;
        console.log(`  Proposal 3 (${propSymbol}) ID ${proposalId3} created. Casting votes...`);
        await delay(1000);
        if (proposalId3 !== undefined) {
            await propertyDAO.connect(voter0).castVote(proposalId3, true);    // User 0 YES
            console.log(`  User 0 voted YES.`); await delay(500);
            await propertyDAO.connect(proposer).castVote(proposalId3, true);  // User 2 (proposer) YES
            console.log(`  User 2 voted YES.`); await delay(500);
            await propertyDAO.connect(voter1).castVote(proposalId3, false);   // User 1 NO
            console.log(`  User 1 voted NO.`);
            console.log(`  ✅ Votes cast. Should pass naturally in ~1.5hr.`);
        }
        await delay(1000);
    } catch (e: any) { console.error(`  ❌ Error with Natural PASS proposal: ${e.message}`); }

    // 4. End During Expo (Natural FAIL) - CDP (Voting: 1.5hr)
    // User 3 proposes. User 1 (YES). User 0 (NO), User 2 (NO).
    try {
        const propSymbol = "CDP";
        const proposerIndex = 3; // User 3
        const proposer = await ethers.getSigner(USER_ADDRESSES[proposerIndex]);
        const voter0 = await ethers.getSigner(USER_ADDRESSES[0]);
        const voter1 = await ethers.getSigner(USER_ADDRESSES[1]);
        const voter2 = await ethers.getSigner(USER_ADDRESSES[2]);
        const tokenInfo = propertyTokens[propSymbol];
        console.log(`\n4. Proposal: Natural FAIL for ${propSymbol} (ends in ~1.5hr) by User ${proposerIndex}`);
        const desc4 = `[Expo Demo] Install gold-plated doorknobs at ${tokenInfo.name} - 0.01 USDC`;
        const createTx4 = await propertyDAO.connect(proposer).createProposal(desc4, targetRentDistribution, budgetCalldata, tokenInfo.address);
        const receipt4 = await createTx4.wait();
        const proposalId4 = receipt4?.logs?.map(l => { try { return propertyDAO.interface.parseLog(l as any); } catch { return null; } }).find(e => e?.name === "ProposalCreated")?.args?.proposalId;
        console.log(`  Proposal 4 (${propSymbol}) ID ${proposalId4} created. Casting votes...`);
        await delay(1000);
        if (proposalId4 !== undefined) {
            await propertyDAO.connect(voter1).castVote(proposalId4, true);    // User 1 YES
            console.log(`  User 1 voted YES.`); await delay(500);
            await propertyDAO.connect(voter0).castVote(proposalId4, false);   // User 0 NO
            console.log(`  User 0 voted NO.`); await delay(500);
            await propertyDAO.connect(voter2).castVote(proposalId4, false);   // User 2 NO
            console.log(`  User 2 voted NO.`);
            console.log(`  ✅ Votes cast. Should fail naturally in ~1.5hr.`);
        }
        await delay(1000);
    } catch (e: any) { console.error(`  ❌ Error with Natural FAIL proposal: ${e.message}`); }

    // 5. Become Executable During Expo - EWID (Voting: 1.5hr, Exec Delay: 30min. Total: ~2hr)
    // User 0 proposes and votes YES. User 3 votes YES.
    try {
        const propSymbol = "EWID";
        const proposerIndex = 0; // User 0
        const proposer = await ethers.getSigner(USER_ADDRESSES[proposerIndex]);
        const voter3 = await ethers.getSigner(USER_ADDRESSES[3]);
        const tokenInfo = propertyTokens[propSymbol];
        console.log(`\n5. Proposal: Executable during Expo for ${propSymbol} (Passes in ~1.5hr, Executable in ~2hr) by User ${proposerIndex}`);
        const desc5 = `[Expo Demo] Upgrade ${tokenInfo.name} internet to gigabit fiber - 0.01 USDC`;
        const createTx5 = await propertyDAO.connect(proposer).createProposal(desc5, targetRentDistribution, budgetCalldata, tokenInfo.address);
        const receipt5 = await createTx5.wait();
        const proposalId5 = receipt5?.logs?.map(l => { try { return propertyDAO.interface.parseLog(l as any); } catch { return null; } }).find(e => e?.name === "ProposalCreated")?.args?.proposalId;
        console.log(`  Proposal 5 (${propSymbol}) ID ${proposalId5} created. Casting votes...`);
        await delay(1000);
        if (proposalId5 !== undefined) {
            await propertyDAO.connect(proposer).castVote(proposalId5, true); // User 0 YES
            console.log(`  User 0 voted YES.`); await delay(500);
            await propertyDAO.connect(voter3).castVote(proposalId5, true);   // User 3 YES
            console.log(`  User 3 voted YES.`);
            console.log(`  ✅ Votes cast. Should pass in ~1.5hr, become executable ~30min later.`);
        }
        await delay(1000);
    } catch (e: any) { console.error(`  ❌ Error with 'Executable During Expo' proposal: ${e.message}`); }


    console.log("\n--- Expo State Population Complete ---");
    console.log("Summary of created items:");
    console.log("- Property Tokens Distributed: Review logs for per-property distributions.");
    console.log("- Rent Deposited: Review logs for per-property deposits.");
    console.log("- Marketplace Listings: Review logs. All listed items are active.");
    console.log("- DAO Proposals: 5 diverse proposals created with varying timelines and outcomes for demo.");
    console.log("\nSCENARIO CHECKLIST FOR EXPO:");
    console.log("  [ ] Show Property Cards for all 9 properties.");
    console.log("  [ ] Show individual user token balances for different properties (varied holdings).");
    console.log("  [ ] Show marketplace: listings by different users and deployer at low prices.");
    console.log("  [ ] Simulate a marketplace purchase (ensure a user has a tiny bit of USDC).");
    console.log("  [ ] Show rent claimable for various properties.");
    console.log("  [ ] Simulate a rent claim.");
    console.log("  [ ] DAO: Proposal 1 (MBV) - should be 'Passed' (short-circuited).");
    console.log("  [ ] DAO: Proposal 2 (MLC) - should be 'Rejected' (short-circuited).");
    console.log("  [ ] DAO: Proposal 3 (SFMT) - check state; should be 'Active', then 'Passed' later.");
    console.log("  [ ] DAO: Proposal 4 (CDP) - check state; should be 'Active', then 'Rejected' later.");
    console.log("  [ ] DAO: Proposal 5 (EWID) - check state; should be 'Active', then 'Passed', then 'Pending' (for executionDelay), then 'Executable'.");
    console.log("  [ ] If Proposal 5 becomes Executable, demonstrate calling 'executeProposal'.");
    console.log("-------------------------------------");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("CRITICAL ERROR in populateState script:", error);
        process.exit(1);
    });
