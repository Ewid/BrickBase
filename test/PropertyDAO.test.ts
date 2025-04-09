import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("PropertyDAO", function () {
  async function deployDAOFixture() {
    const [owner, user, anotherUser] = await ethers.getSigners();

    // First, deploy a mock propertyToken so we can give voting power
    const ERC20Mock = await ethers.getContractFactory("PropertyToken");
    // Or deploy a minimal mock if you want to skip property logic
    // but let's go with the actual one for demonstration

    const propertyToken = await ERC20Mock.deploy(
      "Property Token",
      "PTKN",
      1_000_000, 
      10000,
      owner.address
    );
    await propertyToken.waitForDeployment();

    // Mint tokens to users
    await propertyToken.connect(owner).mint(user.address, 1000);
    await propertyToken.connect(owner).mint(anotherUser.address, 500);

    // Deploy the DAO
    const PropertyDAO = await ethers.getContractFactory("PropertyDAO");
    const dao = await PropertyDAO.deploy(
      await propertyToken.getAddress(),
      500,   // 5% proposal threshold
      60,    // voting period (60s)
      30,    // execution delay (30s)
      owner.address
    );
    await dao.waitForDeployment();

    return { dao, propertyToken, owner, user, anotherUser };
  }

  it("Should create a proposal if threshold is met", async function () {
    const { dao, user } = await loadFixture(deployDAOFixture);

    // user has 1000 tokens, total supply is 10000 => 10% => can propose if threshold is 5%
    const description = "Proposal #1: do something";
    const targetAddress = ethers.Wallet.createRandom().address;
    const calldata = "0x";

    await expect(dao.connect(user).createProposal(description, targetAddress, calldata))
        .to.emit(dao, "ProposalCreated")
        .withArgs(0, user.address, description);

    // Verify proposal details (optional, as emit checks args)
    const proposals = await dao.getAllProposals();
    expect(proposals.length).to.equal(1);
    expect(proposals[0].id).to.equal(0);
    expect(proposals[0].proposer).to.equal(user.address);
    expect(proposals[0].description).to.equal(description);
  });

  it("Should allow voting", async function () {
    const { dao, user, anotherUser } = await loadFixture(deployDAOFixture);

    // Create proposal
    await dao.connect(user).createProposal(
      "Proposal #1: test voting",
      ethers.Wallet.createRandom().address,
      "0x"
    );

    // The user can vote
    await dao.connect(user).castVote(0, true); // for
    await dao.connect(anotherUser).castVote(0, false); // against

    const proposals = await dao.getAllProposals();
    const proposal = proposals[0];

    // user had 1000 tokens -> votesFor
    // anotherUser had 500 tokens -> votesAgainst
    expect(proposal.votesFor).to.equal(1000);
    expect(proposal.votesAgainst).to.equal(500);
  });
});
