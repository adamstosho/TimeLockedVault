import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import type { StakingToken, RewardToken, StakingContract } from "../typechain-types";

describe("Staking System", function () {
  async function deployStakingSystemFixture() {
    const [owner, user1, user2, user3] = await hre.ethers.getSigners();

    const StakingTokenFactory = await hre.ethers.getContractFactory("StakingToken");
    const stakingToken = await StakingTokenFactory.deploy("Staking Token", "STAKE") as unknown as StakingToken;

    const RewardTokenFactory = await hre.ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardTokenFactory.deploy("Reward Token", "REWARD") as unknown as RewardToken;

    const rewardRatePerTokenPerSecond = hre.ethers.parseUnits("1", 15);

    const StakingContractFactory = await hre.ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContractFactory.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      rewardRatePerTokenPerSecond
    ) as unknown as StakingContract;

    await rewardToken.connect(owner).approve(await stakingContract.getAddress(), hre.ethers.parseUnits("10000000", 18));

    return {
      stakingToken,
      rewardToken,
      stakingContract,
      owner,
      user1,
      user2,
      user3,
      rewardRatePerTokenPerSecond,
    };
  }

  describe("Deployment", function () {
    it("Should deploy StakingToken successfully", async function () {
      const { stakingToken } = await loadFixture(deployStakingSystemFixture);
      expect(await stakingToken.getAddress()).to.be.properAddress;
    });

    it("Should deploy RewardToken successfully", async function () {
      const { rewardToken } = await loadFixture(deployStakingSystemFixture);
      expect(await rewardToken.getAddress()).to.be.properAddress;
    });

    it("Should deploy StakingContract successfully", async function () {
      const { stakingContract } = await loadFixture(deployStakingSystemFixture);
      expect(await stakingContract.getAddress()).to.be.properAddress;
    });

    it("Should set correct token addresses in StakingContract", async function () {
      const { stakingToken, rewardToken, stakingContract } = await loadFixture(deployStakingSystemFixture);
      expect(await stakingContract.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await stakingContract.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("Should set correct owner in StakingContract", async function () {
      const { stakingContract, owner } = await loadFixture(deployStakingSystemFixture);
      expect(await stakingContract.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("Should allow user to stake tokens", async function () {
      const { stakingToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);

      await expect(stakingContract.connect(user1).stake(stakeAmount))
        .to.emit(stakingContract, "Staked")
        .withArgs(user1.address, stakeAmount);

      expect(await stakingContract.getUserStake(user1.address)).to.equal(stakeAmount);
      expect(await stakingContract.totalStaked()).to.equal(stakeAmount);
    });

    it("Should revert if staking zero amount", async function () {
      const { stakingContract, user1 } = await loadFixture(deployStakingSystemFixture);

      await expect(stakingContract.connect(user1).stake(0))
        .to.be.revertedWith("Cannot stake zero amount");
    });

    it("Should update total staked correctly", async function () {
      const { stakingToken, stakingContract, user1, user2, owner } = await loadFixture(deployStakingSystemFixture);

      const amount1 = hre.ethers.parseUnits("1000", 18);
      const amount2 = hre.ethers.parseUnits("500", 18);

      await stakingToken.connect(owner).transfer(user1.address, amount1);
      await stakingToken.connect(owner).transfer(user2.address, amount2);

      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), amount1);
      await stakingToken.connect(user2).approve(await stakingContract.getAddress(), amount2);

      await stakingContract.connect(user1).stake(amount1);
      await stakingContract.connect(user2).stake(amount2);

      expect(await stakingContract.totalStaked()).to.equal(amount1 + amount2);
    });

    it("Should revert if user has insufficient balance", async function () {
      const { stakingToken, stakingContract, user1 } = await loadFixture(deployStakingSystemFixture);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      await expect(stakingContract.connect(user1).stake(stakeAmount))
        .to.be.reverted;
    });
  });

  describe("Unstaking", function () {
    it("Should allow user to unstake tokens", async function () {
      const { stakingToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stake(stakeAmount);

      const unstakeAmount = hre.ethers.parseUnits("500", 18);
      await expect(stakingContract.connect(user1).unstake(unstakeAmount))
        .to.emit(stakingContract, "Unstaked")
        .withArgs(user1.address, unstakeAmount);

      expect(await stakingContract.getUserStake(user1.address)).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should revert if unstaking zero amount", async function () {
      const { stakingContract, user1 } = await loadFixture(deployStakingSystemFixture);

      await expect(stakingContract.connect(user1).unstake(0))
        .to.be.revertedWith("Cannot unstake zero amount");
    });

    it("Should revert if unstaking more than staked", async function () {
      const { stakingToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stake(stakeAmount);

      const unstakeAmount = hre.ethers.parseUnits("2000", 18);
      await expect(stakingContract.connect(user1).unstake(unstakeAmount))
        .to.be.revertedWith("Insufficient staked balance");
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly over time", async function () {
      const { stakingToken, rewardToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

      await stakingContract.connect(user1).stake(stakeAmount);

      await time.increase(3600);

      const pendingRewards = await stakingContract.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.greaterThan(0);
    });

    it("Should allow user to claim rewards", async function () {
      const { stakingToken, rewardToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const rewardDeposit = hre.ethers.parseUnits("1000000", 18);
      await rewardToken.connect(owner).transfer(await stakingContract.getAddress(), rewardDeposit);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stake(stakeAmount);

      await time.increase(3600);

      const initialRewardBalance = await rewardToken.balanceOf(user1.address);
      const pendingRewards = await stakingContract.getPendingRewards(user1.address);

      const tx = await stakingContract.connect(user1).claimReward();
      await expect(tx)
        .to.emit(stakingContract, "RewardClaimed");

      const finalRewardBalance = await rewardToken.balanceOf(user1.address);
      expect(finalRewardBalance).to.be.closeTo(initialRewardBalance + pendingRewards, hre.ethers.parseUnits("1", 15));
    });

    it("Should revert if claiming with no rewards", async function () {
      const { stakingContract, user1 } = await loadFixture(deployStakingSystemFixture);

      await expect(stakingContract.connect(user1).claimReward())
        .to.be.revertedWith("No rewards to claim");
    });

    it("Should accumulate rewards correctly for multiple users", async function () {
      const { stakingToken, rewardToken, stakingContract, user1, user2, owner } = await loadFixture(deployStakingSystemFixture);

      const rewardDeposit = hre.ethers.parseUnits("1000000", 18);
      await rewardToken.connect(owner).transfer(await stakingContract.getAddress(), rewardDeposit);

      const amount1 = hre.ethers.parseUnits("1000", 18);
      const amount2 = hre.ethers.parseUnits("500", 18);

      await stakingToken.connect(owner).transfer(user1.address, amount1);
      await stakingToken.connect(owner).transfer(user2.address, amount2);

      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), amount1);
      await stakingToken.connect(user2).approve(await stakingContract.getAddress(), amount2);

      await stakingContract.connect(user1).stake(amount1);
      await stakingContract.connect(user2).stake(amount2);

      await time.increase(3600);

      const rewards1 = await stakingContract.getPendingRewards(user1.address);
      const rewards2 = await stakingContract.getPendingRewards(user2.address);

      expect(rewards1).to.be.greaterThan(rewards2);
    });
  });

  describe("Exit Function", function () {
    it("Should allow user to exit and claim all rewards", async function () {
      const { stakingToken, rewardToken, stakingContract, user1, owner } = await loadFixture(deployStakingSystemFixture);

      const rewardDeposit = hre.ethers.parseUnits("1000000", 18);
      await rewardToken.connect(owner).transfer(await stakingContract.getAddress(), rewardDeposit);

      const stakeAmount = hre.ethers.parseUnits("1000", 18);
      await stakingToken.connect(owner).transfer(user1.address, stakeAmount);
      await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
      await stakingContract.connect(user1).stake(stakeAmount);

      await time.increase(3600);

      const initialTokenBalance = await stakingToken.balanceOf(user1.address);
      const initialRewardBalance = await rewardToken.balanceOf(user1.address);
      const pendingRewards = await stakingContract.getPendingRewards(user1.address);

      await stakingContract.connect(user1).exit();

      const finalTokenBalance = await stakingToken.balanceOf(user1.address);
      const finalRewardBalance = await rewardToken.balanceOf(user1.address);

      expect(finalTokenBalance).to.equal(initialTokenBalance + stakeAmount);
      expect(finalRewardBalance).to.be.closeTo(initialRewardBalance + pendingRewards, hre.ethers.parseUnits("1", 15));
      expect(await stakingContract.getUserStake(user1.address)).to.equal(0);
    });
  });

  describe("Reward Rate Management", function () {
    it("Should allow owner to update reward rate", async function () {
      const { stakingContract, owner } = await loadFixture(deployStakingSystemFixture);

      const newRate = hre.ethers.parseUnits("2", 15);
      await expect(stakingContract.connect(owner).setRewardRate(newRate))
        .to.emit(stakingContract, "RewardRateUpdated")
        .withArgs(newRate);

      expect(await stakingContract.rewardRatePerTokenPerSecond()).to.equal(newRate);
    });

    it("Should revert if non-owner tries to update reward rate", async function () {
      const { stakingContract, user1 } = await loadFixture(deployStakingSystemFixture);

      const newRate = hre.ethers.parseUnits("2", 15);
      await expect(stakingContract.connect(user1).setRewardRate(newRate))
        .to.be.revertedWith("Only owner can call this function");
    });
  });
});

