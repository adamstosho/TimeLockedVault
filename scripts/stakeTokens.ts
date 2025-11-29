import hre from "hardhat";

const STAKING_TOKEN_ADDRESS = "0x87d6420c929CDfb53709af82e887c146c1C4910C";
const STAKING_CONTRACT_ADDRESS = "0x86Bc3c17DD55E71b9c1DEB76490f0De9af71Eb40";

async function main() {
  const [user] = await hre.ethers.getSigners();
  const amount = process.env.AMOUNT || "1000";

  console.log("=== STAKING TOKENS ===");
  console.log("Account:", user.address);
  console.log("Amount to stake:", amount, "STAKE");
  console.log("---------------------------------------------------");

  const stakingToken = await hre.ethers.getContractAt("StakingToken", STAKING_TOKEN_ADDRESS);
  const stakingContract = await hre.ethers.getContractAt("StakingContract", STAKING_CONTRACT_ADDRESS);

  const stakeAmount = hre.ethers.parseUnits(amount, 18);
  const balance = await stakingToken.balanceOf(user.address);
  
  console.log("Your StakingToken balance:", hre.ethers.formatUnits(balance, 18), "STAKE");

  if (balance < stakeAmount) {
    console.error("ERROR: Insufficient balance!");
    process.exit(1);
  }

  const allowance = await stakingToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);

  if (allowance < stakeAmount) {
    console.log("Approving staking tokens...");
    const approveTx = await stakingToken.approve(STAKING_CONTRACT_ADDRESS, stakeAmount);
    await approveTx.wait();
    console.log("Approval confirmed!");
  }

  console.log("Staking tokens...");
  const stakeTx = await stakingContract.stake(stakeAmount);
  const receipt = await stakeTx.wait();
  
  console.log("✓ Staked successfully!");
  console.log("Transaction hash:", receipt?.hash);
  console.log("View on CeloScan: https://sepolia.celoscan.io/tx/" + receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

