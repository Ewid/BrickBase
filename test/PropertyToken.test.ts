import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";



describe("PropertyToken", function () {
  async function deployPropertyTokenFixture() {
    const [owner, user] = await ethers.getSigners();
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const token = await PropertyToken.deploy(
      "Property Token",
      "PTKN",
      1_000_000, // totalPropertyValue
      10000,     // totalTokenSupply
      owner.address
    );
    await token.waitForDeployment();

    return { token, owner, user };
  }

  it("Should mint tokens only by owner", async function () {
    const { token, owner, user } = await loadFixture(deployPropertyTokenFixture);

    // Owner can mint
    await token.connect(owner).mint(user.address, 500);
    expect(await token.balanceOf(user.address)).to.equal(500);

    // Non-owner cannot mint
    await expect(token.connect(user).mint(user.address, 500))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
  });

  it("Should not exceed total token supply", async function () {
    const { token, owner } = await loadFixture(deployPropertyTokenFixture);
    // totalTokenSupply is 10000 (from the constructor above)

    // This is valid
    await token.connect(owner).mint(owner.address, 10000);
    await expect(token.connect(owner).mint(owner.address, 1))
        .to.be.revertedWith("Exceeds total token supply");
  });

  it("Should set Property NFT once", async function () {
    const { token, owner, user } = await loadFixture(deployPropertyTokenFixture);

    const nftAddress = ethers.Wallet.createRandom().address;
    await token.connect(owner).setPropertyNFT(nftAddress);
    expect(await token.propertyNFT()).to.equal(nftAddress);

    // Attempt to reset
    await expect(token.connect(owner).setPropertyNFT(ethers.Wallet.createRandom().address))
      .to.be.revertedWith("Property NFT already set");
  });
});
