import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";



describe("PropertyRegistry", function () {
  async function deployPropertyRegistryFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy
    const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
    const registry = await PropertyRegistry.deploy(owner.address);
    await registry.waitForDeployment();

    return { registry, owner, otherAccount };
  }

  it("Should register a new property", async function () {
    const { registry, owner } = await loadFixture(deployPropertyRegistryFixture);

    const propertyNFT = ethers.Wallet.createRandom().address;
    const propertyToken = ethers.Wallet.createRandom().address;

    // Send the transaction and wait for it to be mined
    const tx = await registry.connect(owner).registerProperty(propertyNFT, propertyToken);
    const receipt = await tx.wait(); // Get the receipt

    // Get the timestamp from the block where the transaction was included
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    const timestamp = block!.timestamp;

    await expect(tx)
      .to.emit(registry, "PropertyRegistered")
      .withArgs(propertyNFT, propertyToken, timestamp); // Now compares with the correct block's timestamp

    // Check storage
    const allProps = await registry.getAllProperties();
    expect(allProps.length).to.equal(1);
    expect(allProps[0].propertyNFT).to.equal(propertyNFT);
    expect(allProps[0].propertyToken).to.equal(propertyToken);
    expect(allProps[0].isActive).to.be.true;
  });

  it("Should set property status (active/inactive)", async function () {
    const { registry, owner } = await loadFixture(deployPropertyRegistryFixture);

    const nft = ethers.Wallet.createRandom().address;
    const token = ethers.Wallet.createRandom().address;

    // Register first
    await registry.connect(owner).registerProperty(nft, token);

    // Deactivate it
    await expect(registry.connect(owner).setPropertyStatus(nft, false))
        .to.emit(registry, "PropertyStatusChanged")
        .withArgs(nft, false);

    const props = await registry.getAllProperties();
    expect(props[0].isActive).to.equal(false);
  });
});
