import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying Staking System with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CELO");
  console.log("---------------------------------------------------");

  console.log("Deploying StakingToken...");
  const StakingTokenFactory = await hre.ethers.getContractFactory("StakingToken");
  const stakingToken = await StakingTokenFactory.deploy("Staking Token", "STAKE");
  await stakingToken.waitForDeployment();
  const stakingTokenAddress = await stakingToken.getAddress();
  console.log("StakingToken deployed to:", stakingTokenAddress);
  console.log("---------------------------------------------------");

  console.log("Deploying RewardToken...");
  const RewardTokenFactory = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardTokenFactory.deploy("Reward Token", "REWARD");
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed to:", rewardTokenAddress);
  console.log("---------------------------------------------------");

  console.log("Deploying StakingContract...");
  const rewardRatePerTokenPerSecond = hre.ethers.parseUnits("1", 15);
  const StakingContractFactory = await hre.ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContractFactory.deploy(
    stakingTokenAddress,
    rewardTokenAddress,
    rewardRatePerTokenPerSecond
  );
  await stakingContract.waitForDeployment();
  const stakingContractAddress = await stakingContract.getAddress();
  console.log("StakingContract deployed to:", stakingContractAddress);
  console.log("---------------------------------------------------");

  console.log("Approving StakingContract to spend RewardToken...");
  const approvalAmount = hre.ethers.parseUnits("10000000", 18);
  await rewardToken.approve(stakingContractAddress, approvalAmount);
  console.log("Approval complete");
  console.log("---------------------------------------------------");

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("StakingToken:", stakingTokenAddress);
  console.log("RewardToken:", rewardTokenAddress);
  console.log("StakingContract:", stakingContractAddress);
  console.log("Reward Rate:", hre.ethers.formatUnits(rewardRatePerTokenPerSecond, 18), "REWARD per token per second");
  console.log("Network: Celo Sepolia");
  console.log("\nView on CeloScan:");
  console.log(`StakingToken: https://sepolia.celoscan.io/address/${stakingTokenAddress}`);
  console.log(`RewardToken: https://sepolia.celoscan.io/address/${rewardTokenAddress}`);
  console.log(`StakingContract: https://sepolia.celoscan.io/address/${stakingContractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

