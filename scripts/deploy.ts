import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account: ", deployer.address);

  console.log("-------------------------------------------------");

  // check balance first
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(
    "Account balance (Celo Sepolia): ",
    hre.ethers.formatEther(balance),
    "CELO"
  );

  console.log("---------------------------------------------------");

  // deploy the ERC20Token contract
  console.log("Deploying Cohort2 Token to Celo Sepolia network");
  const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
  const erc20token = await ERC20Token.deploy("LFG Token", "LFG");

  await erc20token.waitForDeployment();

  const contractAddress = await erc20token.getAddress();
  console.log(
    "Cohort2 Token deployed to:",
    `https://sepolia.celoscan.io/address/${contractAddress}`
  );
  console.log("Contract Address:", contractAddress);

  console.log("-------------------------------------------------");
  console.log("Waiting for block confirmations...");
  
  // Wait for 5 block confirmations
  if (erc20token.deploymentTransaction()) {
    await erc20token.deploymentTransaction()?.wait(5);
  }
  
  // Give the network a moment to index the contract
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Getting deployer's token balance...");
  const deployerTokenBal = await erc20token.balanceOf(deployer.address);
  console.log(
    "Owner Balance: ",
    hre.ethers.formatUnits(deployerTokenBal, 18),
    "COH2"
  );

  const arrayOfAddresses = [
    "0xc1c92aa2ad8d929748090fee7e88e245725af3c5",
    "0x1a0a85fd9e79562e85a0861c509e0c2239a6d0d5",
    "0x7e6a38d86e4a655086218c1648999e509b40e391",
    "0x460798d5432d2eb30d33b769a227a551e9e45aa6",
  ];

  const amountToMint = hre.ethers.parseUnits("1000", 18); // 1000 tokens with 18 decimals

  console.log("------------------------------------------------");
  console.log("Minting to addresses");

  for (const address of arrayOfAddresses) {
    const tx = await erc20token.mint(address, amountToMint);
    await tx.wait();
    console.log(
      "Minted ",
      hre.ethers.formatUnits(amountToMint, 18),
      "to ",
      address
    );
  }

  console.log("Minting done");
  console.log("------------------------------------------------");

  console.log("Making transfer to ", arrayOfAddresses[1]);
  const txTransfer = await erc20token.transfer(
    arrayOfAddresses[1],
    hre.ethers.parseUnits("100", 18)
  );

  await txTransfer.wait();

  const recipientBal = await erc20token.balanceOf(arrayOfAddresses[1]);
  console.log(
    arrayOfAddresses[1],
    "balance: ",
    hre.ethers.formatUnits(recipientBal, 18)
  );

  console.log("Transfer complete");
  console.log("All done");
  console.log("------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

