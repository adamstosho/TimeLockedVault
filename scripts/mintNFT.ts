import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

const NFT_CONTRACT_ADDRESS = "0xEb829C293A06b4AE7C8Baf3442A29795C44C0D92";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  if (NFT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("ERROR: Please update NFT_CONTRACT_ADDRESS in the script!");
    process.exit(1);
  }

  const nft = await hre.ethers.getContractAt("MyNFT", NFT_CONTRACT_ADDRESS);

  const urisFile = path.join(__dirname, "../ipfs-uris.json");
  
  if (!fs.existsSync(urisFile)) {
    console.error("ERROR: ipfs-uris.json not found. Please upload metadata first using uploadToIPFS.ts");
    process.exit(1);
  }

  const uris = JSON.parse(fs.readFileSync(urisFile, "utf-8"));
  const recipient = deployer.address;

  console.log("=== MINTING NFTs ===");
  console.log("Contract:", NFT_CONTRACT_ADDRESS);
  console.log("Recipient:", recipient);
  console.log("=============================================");

  const metadataFiles = Object.keys(uris).sort();

  for (const file of metadataFiles) {
    const tokenURI = uris[file];
    const tokenId = file.replace(".json", "");

    console.log(`\nMinting NFT #${tokenId}...`);
    console.log("Token URI:", tokenURI);

    try {
      const mintTx = await nft.connect(deployer).mint(recipient, tokenURI);
      const receipt = await mintTx.wait();

      console.log(`✓ NFT #${tokenId} minted successfully!`);
      console.log("Transaction:", receipt?.hash);
    } catch (error: any) {
      console.error(`✗ Failed to mint NFT #${tokenId}:`, error.message);
    }
  }

  console.log("\n=============================================");
  console.log("Minting complete!");
  console.log("Total Supply:", (await nft.totalSupply()).toString());
  console.log("=============================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

