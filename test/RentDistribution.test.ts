import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("RentDistribution", function () {
  async function deployRentDistributionFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const RentDistribution = await ethers.getContractFactory("RentDistribution");
    const rentDist = await RentDistribution.deploy(owner.address);
    await rentDist.waitForDeployment();

    // Deploy mock ERC20 for property token
    const ERC20Mock = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await ERC20Mock.deploy(
      "Property Token",
      "PTKN",
      1_000_000,
      10000,
      owner.address
    );
    await propertyToken.waitForDeployment();

    // Mint tokens to user1 & user2
    await propertyToken.connect(owner).mint(user1.address, 500);
    await propertyToken.connect(owner).mint(user2.address, 500);

    return { rentDist, propertyToken, owner, user1, user2 };
  }

  it("Should deposit rent and distribute it among token holders", async function () {
    const { rentDist, propertyToken, owner, user1, user2 } = await loadFixture(deployRentDistributionFixture);
    const propertyTokenAddress = await propertyToken.getAddress();

    // Deposit rent
    const rentAmount = ethers.parseEther("1");
    const depositTx = await rentDist.connect(owner).depositRent(propertyTokenAddress, { value: rentAmount });
    const block = await ethers.provider.getBlock(depositTx.blockNumber!);
    const timestamp = block!.timestamp;

    await expect(depositTx)
      .to.emit(rentDist, "RentReceived")
      .withArgs(propertyTokenAddress, rentAmount, timestamp);

    // User1 claims
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    const claimTx1 = await rentDist.connect(user1).claimRent(propertyTokenAddress);
    const receipt1 = await claimTx1.wait();
    const gasUsed1 = receipt1!.gasUsed * receipt1!.gasPrice;
    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
    expect(user1BalanceAfter - user1BalanceBefore + gasUsed1).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));

    await expect(claimTx1)
      .to.emit(rentDist, "RentClaimed")
      .withArgs(propertyTokenAddress, user1.address, ethers.parseEther("0.5"));

    // User2 claims
    const user2BalanceBefore = await ethers.provider.getBalance(user2.address);
    const claimTx2 = await rentDist.connect(user2).claimRent(propertyTokenAddress);
    const receipt2 = await claimTx2.wait();
    const gasUsed2 = receipt2!.gasUsed * receipt2!.gasPrice;
    const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
    expect(user2BalanceAfter - user2BalanceBefore + gasUsed2).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));

    await expect(claimTx2)
      .to.emit(rentDist, "RentClaimed")
      .withArgs(propertyTokenAddress, user2.address, ethers.parseEther("0.5"));

    // Each had 500 tokens out of total 1000 => each gets 0.5 ETH
    const unclaimed1 = await rentDist.getUnclaimedRent(propertyTokenAddress, user1.address);
    const unclaimed2 = await rentDist.getUnclaimedRent(propertyTokenAddress, user2.address);
    expect(unclaimed1).to.equal(0);
    expect(unclaimed2).to.equal(0);

    // No new rent => next claims revert
    await expect(rentDist.connect(user1).claimRent(propertyTokenAddress))
        .to.be.revertedWith("No new rent to claim");
  });
});
