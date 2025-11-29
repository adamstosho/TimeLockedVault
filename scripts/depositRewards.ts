import hre from "hardhat";

const REWARD_TOKEN_ADDRESS = "0xEa5f32ADD37aF7c53bf7ac301Aa76152d4D1F508";
const STAKING_CONTRACT_ADDRESS = "0x86Bc3c17DD55E71b9c1DEB76490f0De9af71Eb40";

async function main() {
  const [user] = await hre.ethers.getSigners();
  const amount = process.env.AMOUNT || "1000000";

  console.log("=== DEPOSITING REWARD TOKENS ===");
  console.log("Account:", user.address);
  console.log("Amount to deposit:", amount, "REWARD");
  console.log("---------------------------------------------------");

  const rewardToken = await hre.ethers.getContractAt("RewardToken", REWARD_TOKEN_ADDRESS);
  const stakingContract = await hre.ethers.getContractAt("StakingContract", STAKING_CONTRACT_ADDRESS);

  const depositAmount = hre.ethers.parseUnits(amount, 18);
  const balance = await rewardToken.balanceOf(user.address);
  
  console.log("Your RewardToken balance:", hre.ethers.formatUnits(balance, 18), "REWARD");

  if (balance < depositAmount) {
    console.error("ERROR: Insufficient balance!");
    process.exit(1);
  }

  const allowance = await rewardToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);

  if (allowance < depositAmount) {
    console.log("Approving reward tokens...");
    const approveTx = await rewardToken.approve(STAKING_CONTRACT_ADDRESS, depositAmount);
    await approveTx.wait();
    console.log("Approval confirmed!");
  }

  console.log("Depositing reward tokens to staking contract...");
  const depositTx = await stakingContract.depositRewards(depositAmount);
  const receipt = await depositTx.wait();
  
  const contractBalance = await rewardToken.balanceOf(STAKING_CONTRACT_ADDRESS);
  
  console.log("✓ Rewards deposited successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("Staking contract reward balance:", hre.ethers.formatUnits(contractBalance, 18), "REWARD");
  console.log("View on CeloScan: https://sepolia.celoscan.io/tx/" + receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

