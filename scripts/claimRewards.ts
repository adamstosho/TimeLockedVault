import hre from "hardhat";

const STAKING_CONTRACT_ADDRESS = "0x86Bc3c17DD55E71b9c1DEB76490f0De9af71Eb40";

async function main() {
  const [user] = await hre.ethers.getSigners();

  console.log("=== CLAIMING REWARDS ===");
  console.log("Account:", user.address);
  console.log("---------------------------------------------------");

  const stakingContract = await hre.ethers.getContractAt("StakingContract", STAKING_CONTRACT_ADDRESS);

  const pendingRewards = await stakingContract.getPendingRewards(user.address);
  console.log("Pending Rewards:", hre.ethers.formatUnits(pendingRewards, 18), "REWARD");

  if (pendingRewards === 0n) {
    console.log("No rewards to claim!");
    return;
  }

  console.log("Claiming rewards...");
  const claimTx = await stakingContract.claimReward();
  const receipt = await claimTx.wait();
  
  console.log("✓ Rewards claimed successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("View on CeloScan: https://sepolia.celoscan.io/tx/" + receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

