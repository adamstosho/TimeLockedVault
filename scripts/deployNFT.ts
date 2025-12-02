import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying NFT contract with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CELO");
  console.log("=============================================");

  const MyNFTFactory = await hre.ethers.getContractFactory("MyNFT");
  
  const nft = await MyNFTFactory.deploy(
    "ARTRedox",
    "RDX",
    1000,
    deployer.address
  );

  await nft.waitForDeployment();

  const nftAddress = await nft.getAddress();
  
  console.log("\n✓ NFT Contract deployed successfully!");
  console.log("Contract Address:", nftAddress);
  console.log("Name:", await nft.name());
  console.log("Symbol:", await nft.symbol());
  console.log("Max Supply:", (await nft.maxSupply()).toString());
  console.log("\nView on CeloScan:");
  console.log(`https://sepolia.celoscan.io/address/${nftAddress}`);
  
  console.log("\n=============================================");
  console.log("Next steps:");
  console.log("1. Upload metadata to IPFS using: npx hardhat run scripts/uploadToIPFS.ts");
  console.log("2. Mint NFTs using: npx hardhat run scripts/mintNFT.ts --network celoSepolia");
  console.log("=============================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

