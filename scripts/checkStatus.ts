import hre from "hardhat";

const STAKING_TOKEN_ADDRESS = "0x87d6420c929CDfb53709af82e887c146c1C4910C";
const REWARD_TOKEN_ADDRESS = "0xEa5f32ADD37aF7c53bf7ac301Aa76152d4D1F508";
const STAKING_CONTRACT_ADDRESS = "0x86Bc3c17DD55E71b9c1DEB76490f0De9af71Eb40";

async function main() {
  const [user] = await hre.ethers.getSigners();

  console.log("=== STAKING SYSTEM STATUS ===");
  console.log("Account:", user.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(user.address)), "CELO");
  console.log("---------------------------------------------------");

  const stakingToken = await hre.ethers.getContractAt("StakingToken", STAKING_TOKEN_ADDRESS);
  const rewardToken = await hre.ethers.getContractAt("RewardToken", REWARD_TOKEN_ADDRESS);
  const stakingContract = await hre.ethers.getContractAt("StakingContract", STAKING_CONTRACT_ADDRESS);

  const userStakeBalance = await stakingContract.getUserStake(user.address);
  const userStakingTokenBalance = await stakingToken.balanceOf(user.address);
  const userRewardTokenBalance = await rewardToken.balanceOf(user.address);
  const pendingRewards = await stakingContract.getPendingRewards(user.address);
  const totalStaked = await stakingContract.totalStaked();

  console.log("\n=== YOUR STATUS ===");
  console.log("Staked Amount:", hre.ethers.formatUnits(userStakeBalance, 18), "STAKE");
  console.log("StakingToken Balance:", hre.ethers.formatUnits(userStakingTokenBalance, 18), "STAKE");
  console.log("RewardToken Balance:", hre.ethers.formatUnits(userRewardTokenBalance, 18), "REWARD");
  console.log("Pending Rewards:", hre.ethers.formatUnits(pendingRewards, 18), "REWARD");
  console.log("\n=== CONTRACT STATUS ===");
  console.log("Total Staked:", hre.ethers.formatUnits(totalStaked, 18), "STAKE");
  console.log("Reward Rate:", hre.ethers.formatUnits(await stakingContract.rewardRatePerTokenPerSecond(), 18), "REWARD per token per second");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

