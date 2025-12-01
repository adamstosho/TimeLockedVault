import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import type { MyNFT } from "../typechain-types";

describe("MyNFT", function () {
  async function deployNFTFixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners();

    const MyNFTFactory = await hre.ethers.getContractFactory("MyNFT");
    const nft = await MyNFTFactory.deploy(
      "My Amazing NFT",
      "MANFT",
      100,
      owner.address
    ) as unknown as MyNFT;

    return { nft, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.name()).to.equal("My Amazing NFT");
      expect(await nft.symbol()).to.equal("MANFT");
    });

    it("Should set the correct max supply", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.maxSupply()).to.equal(100);
    });

    it("Should set the correct owner", async function () {
      const { nft, owner } = await loadFixture(deployNFTFixture);
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should start with zero total supply", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint NFT", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      await expect(nft.connect(owner).mint(user1.address, tokenURI))
        .to.emit(nft, "NFTMinted")
        .withArgs(user1.address, 0, tokenURI);

      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it("Should allow owner to safeMint NFT", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/2.json";

      await expect(nft.connect(owner).safeMint(user1.address, tokenURI))
        .to.emit(nft, "NFTMinted")
        .withArgs(user1.address, 0, tokenURI);

      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });

    it("Should set token URI correctly", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/3.json";

      await nft.connect(owner).mint(user1.address, tokenURI);
      expect(await nft.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should increment token ID correctly", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI1 = "https://example.com/1.json";
      const tokenURI2 = "https://example.com/2.json";

      await nft.connect(owner).mint(user1.address, tokenURI1);
      await nft.connect(owner).mint(user1.address, tokenURI2);

      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.totalSupply()).to.equal(2);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const { nft, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      await expect(
        nft.connect(user1).mint(user1.address, tokenURI)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("Should revert if max supply is reached", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      for (let i = 0; i < 100; i++) {
        await nft.connect(owner).mint(user1.address, tokenURI);
      }

      await expect(
        nft.connect(owner).mint(user1.address, tokenURI)
      ).to.be.revertedWith("Max supply reached");
    });
  });

  describe("Token URI Management", function () {
    it("Should allow owner to set token URI", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const initialURI = "https://example.com/1.json";
      const newURI = "https://example.com/new.json";

      await nft.connect(owner).mint(user1.address, initialURI);
      await nft.connect(owner).setTokenURI(0, newURI);

      expect(await nft.tokenURI(0)).to.equal(newURI);
    });

    it("Should allow owner to set base token URI", async function () {
      const { nft, owner } = await loadFixture(deployNFTFixture);
      const baseURI = "https://example.com/metadata/";

      await nft.connect(owner).setBaseTokenURI(baseURI);
      expect(await nft.baseTokenURI()).to.equal(baseURI);
    });

    it("Should revert if non-owner tries to set token URI", async function () {
      const { nft, owner, user1 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      await nft.connect(owner).mint(user1.address, tokenURI);

      await expect(
        nft.connect(user1).setTokenURI(0, "https://example.com/new.json")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("ERC721 Functions", function () {
    it("Should transfer NFT correctly", async function () {
      const { nft, owner, user1, user2 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      await nft.connect(owner).mint(user1.address, tokenURI);
      await nft.connect(user1).transferFrom(user1.address, user2.address, 0);

      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });

    it("Should approve and transfer from", async function () {
      const { nft, owner, user1, user2 } = await loadFixture(deployNFTFixture);
      const tokenURI = "https://example.com/1.json";

      await nft.connect(owner).mint(user1.address, tokenURI);
      await nft.connect(user1).approve(user2.address, 0);
      await nft.connect(user2).transferFrom(user1.address, user2.address, 0);

      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });
  });
});

