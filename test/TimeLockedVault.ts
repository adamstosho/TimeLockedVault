import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { TimeLockedVault } from "../typechain-types";

describe("TimeLockedVault", function () {
 
  async function deployVaultFixture() {
    // to get test accounts
    const [owner, user1, user2] = await hre.ethers.getSigners();

//to deploy the contract
    const TimeLockedVault = await hre.ethers.getContractFactory("TimeLockedVault");
    const vault = await TimeLockedVault.deploy() as unknown as TimeLockedVault;

    return { vault, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(vault.target).to.be.properAddress; 
    });
  });

  describe("Deposits", function () {
    it("Should allow a user to deposit funds", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.0"); 
      const lockDuration = 3600; 

      // to deposit funds
      await expect(
        vault.connect(user1).deposit(lockDuration, { value: depositAmount })
      ).to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount, anyValue);

      const deposit = await vault.getDeposit(user1.address);
      expect(deposit.amount).to.equal(depositAmount);
      expect(deposit.exists).to.be.true;
      
      expect(await hre.ethers.provider.getBalance(vault.target)).to.equal(depositAmount);
    });

    it("Should prevent deposit with zero amount", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const lockDuration = 3600;

      await expect(
        vault.connect(user1).deposit(lockDuration, { value: 0 })
      ).to.be.revertedWith("You must send some Ether to deposit");
    });

    it("Should prevent deposit with zero lock duration", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.0");

      await expect(
        vault.connect(user1).deposit(0, { value: depositAmount })
      ).to.be.revertedWith("Lock duration must be greater than 0");
    });

    it("Should allow multiple users to deposit separately", async function () {
      const { vault, user1, user2 } = await loadFixture(deployVaultFixture);
      const amount1 = hre.ethers.parseEther("1.0");
      const amount2 = hre.ethers.parseEther("2.0");
      const lockDuration = 3600;

      // User1 deposits
      await vault.connect(user1).deposit(lockDuration, { value: amount1 });
      
      // User2 deposits
      await vault.connect(user2).deposit(lockDuration, { value: amount2 });

      // Check both deposits
      const deposit1 = await vault.getDeposit(user1.address);
      const deposit2 = await vault.getDeposit(user2.address);

      expect(deposit1.amount).to.equal(amount1);
      expect(deposit2.amount).to.equal(amount2);
      
      expect(await hre.ethers.provider.getBalance(vault.target)).to.equal(
        amount1 + amount2
      );
    });

    it("Should allow user to add more funds and extend lock time", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const initialAmount = hre.ethers.parseEther("1.0");
      const additionalAmount = hre.ethers.parseEther("0.5");
      const initialLockDuration = 3600; 
      const extendedLockDuration = 7200; 

      
      await vault.connect(user1).deposit(initialLockDuration, { value: initialAmount });
      const firstDeposit = await vault.getDeposit(user1.address);
      const firstUnlockTime = firstDeposit.unlockTime;

      await time.increase(100);

      await expect(
        vault.connect(user1).deposit(extendedLockDuration, { value: additionalAmount })
      ).to.emit(vault, "LockExtended");

      const finalDeposit = await vault.getDeposit(user1.address);
      expect(finalDeposit.amount).to.equal(initialAmount + additionalAmount);
      expect(finalDeposit.unlockTime).to.be.greaterThan(firstUnlockTime);
    });

    it("Should prevent reducing lock time when adding more funds", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const initialAmount = hre.ethers.parseEther("1.0");
      const additionalAmount = hre.ethers.parseEther("0.5");
      const longLockDuration = 7200; 
      const shortLockDuration = 1800; 

      await vault.connect(user1).deposit(longLockDuration, { value: initialAmount });

      await expect(
        vault.connect(user1).deposit(shortLockDuration, { value: additionalAmount })
      ).to.be.revertedWith("New lock time must be equal or later than existing lock time");
    });
  });

  describe("Withdrawals", function () {
    it("Should prevent withdrawal before lock time expires", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.0");
      const lockDuration = 3600; 

      await vault.connect(user1).deposit(lockDuration, { value: depositAmount });

      await expect(
        vault.connect(user1).withdraw()
      ).to.be.revertedWith("Lock period has not expired yet");

      expect(await vault.canWithdraw(user1.address)).to.be.false;
    });

    it("Should allow withdrawal after lock time expires", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.0");
      const lockDuration = 3600; 

    
      await vault.connect(user1).deposit(lockDuration, { value: depositAmount });
      const deposit = await vault.getDeposit(user1.address);
      const unlockTime = deposit.unlockTime;

      await time.increaseTo(unlockTime);

      expect(await vault.canWithdraw(user1.address)).to.be.true;

      const initialBalance = await hre.ethers.provider.getBalance(user1.address);

      const withdrawTx = await vault.connect(user1).withdraw();
      const receipt = await withdrawTx.wait();
      
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(withdrawTx)
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, depositAmount);

      const finalBalance = await hre.ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.equal(initialBalance + depositAmount - gasUsed);

      
      const depositAfter = await vault.getDeposit(user1.address);
      expect(depositAfter.exists).to.be.false;
      expect(depositAfter.amount).to.equal(0);
    });

    it("Should prevent withdrawal by non-depositor", async function () {
      const { vault, user1, user2 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.0");
      const lockDuration = 3600;

      await vault.connect(user1).deposit(lockDuration, { value: depositAmount });
      const deposit = await vault.getDeposit(user1.address);
      const unlockTime = deposit.unlockTime;

      await time.increaseTo(unlockTime);

      await expect(
        vault.connect(user2).withdraw()
      ).to.be.revertedWith("No deposit found");
    });

    it("Should allow multiple users to withdraw their own funds independently", async function () {
      const { vault, user1, user2 } = await loadFixture(deployVaultFixture);
      const amount1 = hre.ethers.parseEther("1.0");
      const amount2 = hre.ethers.parseEther("2.0");
      const lockDuration = 3600;

      await vault.connect(user1).deposit(lockDuration, { value: amount1 });
      await vault.connect(user2).deposit(lockDuration, { value: amount2 });

      const deposit1 = await vault.getDeposit(user1.address);
      const deposit2 = await vault.getDeposit(user2.address);

      const maxUnlockTime = deposit1.unlockTime > deposit2.unlockTime 
        ? deposit1.unlockTime 
        : deposit2.unlockTime;
      await time.increaseTo(maxUnlockTime);

      await expect(vault.connect(user1).withdraw())
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, amount1);

      await expect(vault.connect(user2).withdraw())
        .to.emit(vault, "Withdrawn")
        .withArgs(user2.address, amount2);

      
      expect(await hre.ethers.provider.getBalance(vault.target)).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct deposit information", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseEther("1.5");
      const lockDuration = 7200; 

      const depositBefore = await vault.getDeposit(user1.address);
      expect(depositBefore.exists).to.be.false;

      await vault.connect(user1).deposit(lockDuration, { value: depositAmount });
      const currentTime = await time.latest();
      const expectedUnlockTime = currentTime + lockDuration;

      const depositAfter = await vault.getDeposit(user1.address);
      expect(depositAfter.exists).to.be.true;
      expect(depositAfter.amount).to.equal(depositAmount);
      expect(depositAfter.unlockTime).to.be.closeTo(expectedUnlockTime, 10);
    });

    it("Should return false for canWithdraw when no deposit exists", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      
      expect(await vault.canWithdraw(user1.address)).to.be.false;
    });
    });
});

