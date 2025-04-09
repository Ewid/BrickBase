import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("PropertyNFT", function () {
  async function deployPropertyNFTFixture() {
    const [owner, user] = await ethers.getSigners();
    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    const nft = await PropertyNFT.deploy(owner.address);
    await nft.waitForDeployment();

    return { nft, owner, user };
  }

  it("Should mint a new property NFT", async function () {
    const { nft, owner, user } = await loadFixture(deployPropertyNFTFixture);

    const propertyTokenAddress = ethers.Wallet.createRandom().address;
    const tokenURI = "ipfs://tokenURI";
    const description = "123 Main St";

    await expect(nft.connect(owner).mintProperty(
      user.address,
      tokenURI,
      description,
      2500,
      300000,
      1999,
      "Residential",
      propertyTokenAddress
    )).to.emit(nft, "Transfer").withArgs(ethers.ZeroAddress, user.address, 0);

    const tokenId = 0;
    const propertyData = await nft.properties(tokenId);
    expect(propertyData.propertyAddress).to.equal(description);
    expect(propertyData.propertyToken).to.equal(propertyTokenAddress);
    expect(await nft.tokenURI(tokenId)).to.equal(tokenURI);
  });

  it("Should update property details if authorized", async function () {
    const { nft, owner, user } = await loadFixture(deployPropertyNFTFixture);
    const initialPropertyTokenAddress = ethers.Wallet.createRandom().address;
    const initialDescription = "123 Main St";

    const tx = await nft.connect(owner).mintProperty(
      user.address,
      "ipfs://tokenURI",
      initialDescription,
      2500,
      300000,
      1999,
      "Residential",
      initialPropertyTokenAddress
    );
    const receipt = await tx.wait();

    let tokenId: bigint | undefined;
    if (receipt?.logs) {
        const iface = nft.interface;
        for (const log of receipt.logs) {
            try {
                 const parsedLog = iface.parseLog(log);
                 if (parsedLog?.name === "Transfer" && parsedLog.args.to === user.address) {
                      tokenId = parsedLog.args.tokenId;
                      break;
                 }
            } catch (e) { /* Ignore logs that don't match the ABI */ }
        }
    }
    expect(tokenId).to.not.be.undefined;

    await nft.connect(user).approve(owner.address, tokenId!);

    const newAddress = "New Address";
    const newType = "Commercial";
    await nft.connect(owner).updatePropertyDetails(
      tokenId!,
      newAddress,
      2600,
      320000,
      2000,
      newType
    );

    const updated = await nft.properties(tokenId!);
    expect(updated.propertyAddress).to.equal(newAddress);
    expect(updated.propertyType).to.equal(newType);
  });
});
