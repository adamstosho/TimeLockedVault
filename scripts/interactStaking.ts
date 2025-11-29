import hre from "hardhat";

const STAKING_TOKEN_ADDRESS = "0x87d6420c929CDfb53709af82e887c146c1C4910C";
const REWARD_TOKEN_ADDRESS = "0xEa5f32ADD37aF7c53bf7ac301Aa76152d4D1F508";
const STAKING_CONTRACT_ADDRESS = "0x86Bc3c17DD55E71b9c1DEB76490f0De9af71Eb40";

async function main() {
  const [user] = await hre.ethers.getSigners();

  console.log("Interacting with Staking System as:", user.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(user.address)), "CELO");
  console.log("---------------------------------------------------");

  if (
    STAKING_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000" ||
    REWARD_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000" ||
    STAKING_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
  ) {
    console.error("ERROR: Please update the contract addresses in the script!");
    process.exit(1);
  }

  const stakingToken = await hre.ethers.getContractAt("StakingToken", STAKING_TOKEN_ADDRESS);
  const rewardToken = await hre.ethers.getContractAt("RewardToken", REWARD_TOKEN_ADDRESS);
  const stakingContract = await hre.ethers.getContractAt("StakingContract", STAKING_CONTRACT_ADDRESS);

  console.log("\n=== CURRENT STATE ===");
  const userStakeBalance = await stakingContract.getUserStake(user.address);
  const userStakingTokenBalance = await stakingToken.balanceOf(user.address);
  const userRewardTokenBalance = await rewardToken.balanceOf(user.address);
  const pendingRewards = await stakingContract.getPendingRewards(user.address);
  const totalStaked = await stakingContract.totalStaked();

  console.log("Your Staked Amount:", hre.ethers.formatUnits(userStakeBalance, 18), "STAKE");
  console.log("Your StakingToken Balance:", hre.ethers.formatUnits(userStakingTokenBalance, 18), "STAKE");
  console.log("Your RewardToken Balance:", hre.ethers.formatUnits(userRewardTokenBalance, 18), "REWARD");
  console.log("Your Pending Rewards:", hre.ethers.formatUnits(pendingRewards, 18), "REWARD");
  console.log("Total Staked in Contract:", hre.ethers.formatUnits(totalStaked, 18), "STAKE");

  console.log("\n=== AVAILABLE ACTIONS ===");
  console.log("1. Stake tokens");
  console.log("2. Unstake tokens");
  console.log("3. Claim rewards");
  console.log("4. Exit (unstake all + claim rewards)");
  console.log("5. Check status");

  const action = process.argv[2];

  if (!action) {
    console.log("\nUsage: npx hardhat run scripts/interactStaking.ts --network celoSepolia [action] [amount]");
    console.log("Actions: stake, unstake, claim, exit, status");
    return;
  }

  switch (action) {
    case "stake": {
      const amount = process.argv[3] || "1000";
      const stakeAmount = hre.ethers.parseUnits(amount, 18);

      console.log(`\n=== STAKING ${amount} STAKE TOKENS ===`);
      const allowance = await stakingToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);

      if (allowance < stakeAmount) {
        console.log("Approving staking tokens...");
        await stakingToken.approve(STAKING_CONTRACT_ADDRESS, stakeAmount);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log("Staking tokens...");
      const tx = await stakingContract.stake(stakeAmount);
      await tx.wait();
      console.log("Staked successfully! TX:", tx.hash);
      break;
    }

    case "unstake": {
      const amount = process.argv[3] || "500";
      const unstakeAmount = hre.ethers.parseUnits(amount, 18);

      console.log(`\n=== UNSTAKING ${amount} STAKE TOKENS ===`);
      const tx = await stakingContract.unstake(unstakeAmount);
      await tx.wait();
      console.log("Unstaked successfully! TX:", tx.hash);
      break;
    }

    case "claim": {
      console.log("\n=== CLAIMING REWARDS ===");
      const rewards = await stakingContract.getPendingRewards(user.address);
      console.log("Claiming", hre.ethers.formatUnits(rewards, 18), "REWARD tokens...");
      const tx = await stakingContract.claimReward();
      await tx.wait();
      console.log("Rewards claimed successfully! TX:", tx.hash);
      break;
    }

    case "exit": {
      console.log("\n=== EXITING (UNSTAKE ALL + CLAIM REWARDS) ===");
      const tx = await stakingContract.exit();
      await tx.wait();
      console.log("Exited successfully! TX:", tx.hash);
      break;
    }

    case "status": {
      console.log("\n=== CURRENT STATUS ===");
      const stake = await stakingContract.getUserStake(user.address);
      const rewards = await stakingContract.getPendingRewards(user.address);
      const stakingBalance = await stakingToken.balanceOf(user.address);
      const rewardBalance = await rewardToken.balanceOf(user.address);

      console.log("Staked:", hre.ethers.formatUnits(stake, 18), "STAKE");
      console.log("Pending Rewards:", hre.ethers.formatUnits(rewards, 18), "REWARD");
      console.log("StakingToken Balance:", hre.ethers.formatUnits(stakingBalance, 18), "STAKE");
      console.log("RewardToken Balance:", hre.ethers.formatUnits(rewardBalance, 18), "REWARD");
      break;
    }

    default:
      console.log("Unknown action. Use: stake, unstake, claim, exit, or status");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

