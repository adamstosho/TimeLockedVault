import hre from "hardhat";

const NFT_CONTRACT_ADDRESS: string = "0xc8380827DdCcc405F27F39dCA60328b8fC9E4fBA";

async function main() {
  const [user] = await hre.ethers.getSigners();

  if (!NFT_CONTRACT_ADDRESS || NFT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("ERROR: Please update NFT_CONTRACT_ADDRESS in the script!");
    process.exit(1);
  }

  const nft = await hre.ethers.getContractAt("MyNFT", NFT_CONTRACT_ADDRESS);

  console.log("=== NFT COLLECTION INFO ===");
  console.log("Contract:", NFT_CONTRACT_ADDRESS);
  console.log("=============================================");

  const name = await nft.name();
  const symbol = await nft.symbol();
  const totalSupply = await nft.totalSupply();
  const maxSupply = await nft.maxSupply();
  const owner = await nft.owner();

  console.log("\nCollection Details:");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Total Minted:", totalSupply.toString());
  console.log("Max Supply:", maxSupply.toString());
  console.log("Owner:", owner);
  console.log("\n=============================================");

  console.log("\nYour NFTs:");
  const tokenCount = Number(totalSupply);
  let ownedCount = 0;

  for (let i = 0; i < tokenCount; i++) {
    try {
      const ownerAddress = await nft.ownerOf(i);
      if (ownerAddress.toLowerCase() === user.address.toLowerCase()) {
        const tokenURI = await nft.tokenURI(i);
        console.log(`\nToken #${i}:`);
        console.log("  Owner:", ownerAddress);
        console.log("  URI:", tokenURI);
        ownedCount++;
      }
    } catch (error) {
      continue;
    }
  }

  if (ownedCount === 0) {
    console.log("\nYou don't own any NFTs from this collection.");
  } else {
    console.log(`\nTotal NFTs owned: ${ownedCount}`);
  }

  console.log("\n=============================================");
  console.log("View on CeloScan:");
  console.log(`https://sepolia.celoscan.io/address/${NFT_CONTRACT_ADDRESS}`);
  console.log("\nView on Rarible:");
  console.log(`https://testnet.rarible.com/collection/${NFT_CONTRACT_ADDRESS}`);
  console.log("=============================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

