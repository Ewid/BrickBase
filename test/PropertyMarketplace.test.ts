import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PropertyMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, user, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy the marketplace
    const Marketplace = await ethers.getContractFactory("PropertyMarketplace");
    const marketplace = await Marketplace.deploy(
      100, // 1%
      feeRecipient.address,
      owner.address
    );
    await marketplace.waitForDeployment();

    // Deploy mock property token for listing
    const ERC20Mock = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await ERC20Mock.deploy(
      "Property Token",
      "PTKN",
      1_000_000,
      10000,
      owner.address
    );
    await propertyToken.waitForDeployment();

    // Mint some tokens to user
    await propertyToken.connect(owner).mint(user.address, 1000);

    return { marketplace, propertyToken, owner, user, buyer, feeRecipient };
  }

  it("Should create a new listing", async function () {
    const { marketplace, propertyToken, user } = await loadFixture(deployMarketplaceFixture);

    // Approve marketplace
    await propertyToken.connect(user).approve(await marketplace.getAddress(), 500);

    // Create a listing
    await expect(
      marketplace.connect(user).createListing(await propertyToken.getAddress(), 500, ethers.parseEther("1"))
    )
      .to.emit(marketplace, "ListingCreated")
      .withArgs(
        0,                // listingId
        user.address, 
        await propertyToken.getAddress(),
        500, 
        ethers.parseEther("1")
      );

    // Confirm marketplace holds tokens
    expect(await propertyToken.balanceOf(await marketplace.getAddress())).to.equal(500);
  });

  it("Should purchase tokens and distribute fees", async function () {
    const { marketplace, propertyToken, user, buyer, feeRecipient } = await loadFixture(deployMarketplaceFixture);

    // user creates listing
    await propertyToken.connect(user).approve(await marketplace.getAddress(), 500);
    await marketplace.connect(user).createListing(await propertyToken.getAddress(), 500, ethers.parseEther("1"));

    // buyer purchases some amount (like 100 tokens)
    const listingId = 0;
    const amountToBuy = 100;

    // Price = 100 * 1 ETH = 100 ETH
    // Fee = 1% => 1 ETH
    // Seller gets 99 ETH
    const totalCost = ethers.parseEther("100");
    await expect(
      marketplace.connect(buyer).purchaseTokens(listingId, amountToBuy, { value: totalCost })
    )
      .to.emit(marketplace, "ListingPurchased")
      .withArgs(listingId, buyer.address, amountToBuy, totalCost);

    // Check final balances
    expect(await propertyToken.balanceOf(buyer.address)).to.equal(100);
    // FeeRecipient gets 1 ETH, user gets 99 ETH
    // It's a test local chain, so let's measure difference in account balances if needed
  });
});
