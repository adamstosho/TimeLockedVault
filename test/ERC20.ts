import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import type { ERC20Token } from "../typechain-types";

describe("ERC20Token", function () {
  // Setup fixture function
  async function deployERC20TokenFixture() {
    const tokenName = "DLTAfrica Token";
    const tokenSymbol = "DLT";

    // get accounts from ethers
    const [owner, account1, account2, account3] = await hre.ethers.getSigners();

    const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
    const erc20token = await ERC20Token.deploy(tokenName, tokenSymbol) as unknown as ERC20Token;

    return {
      tokenName,
      tokenSymbol,
      erc20token,
      owner,
      account1,
      account2,
      account3,
    };
  }

  describe("Deployment Test", function () {
    it("Should set the right token name and symbol", async function () {
      const { tokenName, tokenSymbol, erc20token } = await loadFixture(
        deployERC20TokenFixture
      );

      expect(await erc20token.name()).to.equal(tokenName);
      expect(await erc20token.symbol()).to.equal(tokenSymbol);
    });

    it("Should assign owner at deployment", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20token.owner()).to.equal(owner.address);
    });

    it("Should update total supply after deployment", async function () {
      const { erc20token } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20token.totalSupply()).to.be.greaterThan(0);
    });

    it("Owner should have the total supply after deployment", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      const totalSupply = await erc20token.totalSupply();
      const ownerBal = await erc20token.balanceOf(owner.address);

      expect(ownerBal).to.equal(totalSupply);
    });
  });

  describe("Transfer Tests", function () {
    it("Should revert if sender is address zero", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        erc20token.connect(zeroSigner).transfer(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if recipient is address zero", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        erc20token.connect(owner).transfer(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount zero or less", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await expect(
        erc20token.connect(owner).transfer(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        erc20token.connect(owner).transfer(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should transfer tokens successfully", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const initialBalancOfAccount1 = await erc20token.balanceOf(
        account1.address
      );
      const initialbalanceOfOwner = await erc20token.balanceOf(owner.address);
      const amountToTransfer = hre.ethers.parseUnits("100", 18); //100 tokens

      const tx = await erc20token
        .connect(owner)
        .transfer(account1.address, amountToTransfer);

      const account1BalanceAfterTransfer = await erc20token.balanceOf(
        account1.address
      );
      const ownerBalanceAfterTransfer = await erc20token.balanceOf(
        owner.address
      );

      expect(account1BalanceAfterTransfer).to.be.greaterThan(
        initialBalancOfAccount1
      );
      expect(ownerBalanceAfterTransfer).to.be.lessThan(initialbalanceOfOwner);
      expect(account1BalanceAfterTransfer).to.equal(
        initialBalancOfAccount1 + amountToTransfer
      );
    });

    it("Should emit Transfer event on successful transfer", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token.connect(owner).transfer(account1.address, amountToTransfer)
      )
        .to.emit(erc20token, "Transfer")
        .withArgs(owner.address, account1.address, amountToTransfer);
    });
  });

  describe("Approve Tests", function () {
    it("Should revert if sender is address zero", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        erc20token.connect(zeroSigner).approve(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if spender is address zero", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        erc20token.connect(owner).approve(zeroAddr, 100)
      ).to.be.revertedWith("Invalid spender address");
    });

    it("Should revert if amount is zero or less", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await expect(
        erc20token.connect(owner).approve(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { erc20token, account1, account2 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        erc20token.connect(account1).approve(account2.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should approve tokens successfully", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("100", 18);

      const initialAllowance = await erc20token.allowance(
        owner.address,
        account1.address
      );

      await erc20token.connect(owner).approve(account1.address, amountToApprove);

      const newAllowance = await erc20token.allowance(
        owner.address,
        account1.address
      );

      expect(newAllowance).to.equal(initialAllowance + amountToApprove);
    });

    it("Should add to existing allowance when approving again", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const firstAmount = hre.ethers.parseUnits("100", 18);
      const secondAmount = hre.ethers.parseUnits("50", 18);

      await erc20token.connect(owner).approve(account1.address, firstAmount);
      const allowanceAfterFirst = await erc20token.allowance(
        owner.address,
        account1.address
      );

      await erc20token.connect(owner).approve(account1.address, secondAmount);
      const allowanceAfterSecond = await erc20token.allowance(
        owner.address,
        account1.address
      );

      expect(allowanceAfterSecond).to.equal(allowanceAfterFirst + secondAmount);
    });

    it("Should emit Approval event on successful approve", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token.connect(owner).approve(account1.address, amountToApprove)
      )
        .to.emit(erc20token, "Approval")
        .withArgs(owner.address, account1.address, amountToApprove);
    });
  });

  describe("Allowance Tests", function () {
    it("Should return zero allowance when no approval exists", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const allowance = await erc20token.allowance(owner.address, account1.address);

      expect(allowance).to.equal(0);
    });

    it("Should return correct allowance after approval", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("200", 18);

      await erc20token.connect(owner).approve(account1.address, amountToApprove);

      const allowance = await erc20token.allowance(owner.address, account1.address);

      expect(allowance).to.equal(amountToApprove);
    });

    it("Should return updated allowance after multiple approvals", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const firstAmount = hre.ethers.parseUnits("100", 18);
      const secondAmount = hre.ethers.parseUnits("50", 18);

      await erc20token.connect(owner).approve(account1.address, firstAmount);
      await erc20token.connect(owner).approve(account1.address, secondAmount);

      const totalAllowance = await erc20token.allowance(
        owner.address,
        account1.address
      );

      expect(totalAllowance).to.equal(firstAmount + secondAmount);
    });
  });

  describe("TransferFrom Tests", function () {
    it("Should revert if caller is address zero", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;
      const amount = hre.ethers.parseUnits("100", 18);

      await erc20token.connect(owner).approve(account1.address, amount);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        erc20token
          .connect(zeroSigner)
          .transferFrom(owner.address, account1.address, amount)
      ).to.be.revertedWith("Invalid caller address");
    });

    it("Should revert if from address is address zero", async function () {
      const { erc20token, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;
      const amount = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token
          .connect(account1)
          .transferFrom(zeroAddr, account1.address, amount)
      ).to.be.revertedWith("Invalid owner address");
    });

    it("Should revert if recipient is address zero", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;
      const amount = hre.ethers.parseUnits("100", 18);

      await erc20token.connect(owner).approve(account1.address, amount);

      await expect(
        erc20token
          .connect(account1)
          .transferFrom(owner.address, zeroAddr, amount)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await erc20token.connect(owner).approve(account1.address, 100);

      await expect(
        erc20token
          .connect(account1)
          .transferFrom(owner.address, account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if from has insufficient balance", async function () {
      const { erc20token, owner, account1, account2 } = await loadFixture(
        deployERC20TokenFixture
      );
      
      // First approve account1 for a reasonable amount
      const amountToApprove = hre.ethers.parseUnits("200", 18);
      await erc20token.connect(owner).approve(account1.address, amountToApprove);
      
      // Then transfer most of owner's tokens away, leaving less than approved amount
      const ownerBalance = await erc20token.balanceOf(owner.address);
      const amountToTransferAway = ownerBalance - hre.ethers.parseUnits("100", 18);
      await erc20token.connect(owner).transfer(account2.address, amountToTransferAway);
      
      // Now try to transferFrom the approved amount - should fail because owner doesn't have enough balance
      const amountToTransfer = hre.ethers.parseUnits("200", 18);
      await expect(
        erc20token
          .connect(account1)
          .transferFrom(owner.address, account2.address, amountToTransfer)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if allowance is exceeded", async function () {
      const { erc20token, owner, account1, account2 } = await loadFixture(
        deployERC20TokenFixture
      );
      const approvedAmount = hre.ethers.parseUnits("100", 18);
      const transferAmount = hre.ethers.parseUnits("200", 18);

      await erc20token.connect(owner).approve(account1.address, approvedAmount);

      await expect(
        erc20token
          .connect(account1)
          .transferFrom(owner.address, account2.address, transferAmount)
      ).to.be.revertedWith("allownce exceeded");
    });

    it("Should transfer tokens successfully using transferFrom", async function () {
      const { erc20token, owner, account1, account2 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("200", 18);
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      const initialBalanceOfOwner = await erc20token.balanceOf(owner.address);
      const initialBalanceOfAccount2 = await erc20token.balanceOf(
        account2.address
      );

      await erc20token
        .connect(owner)
        .approve(account1.address, amountToApprove);

      await erc20token
        .connect(account1)
        .transferFrom(owner.address, account2.address, amountToTransfer);

      const balanceOfOwnerAfter = await erc20token.balanceOf(owner.address);
      const balanceOfAccount2After = await erc20token.balanceOf(
        account2.address
      );
      const remainingAllowance = await erc20token.allowance(
        owner.address,
        account1.address
      );

      expect(balanceOfOwnerAfter).to.equal(
        initialBalanceOfOwner - amountToTransfer
      );
      expect(balanceOfAccount2After).to.equal(
        initialBalanceOfAccount2 + amountToTransfer
      );
      expect(remainingAllowance).to.equal(amountToApprove - amountToTransfer);
    });

    it("Should emit Transfer event on successful transferFrom", async function () {
      const { erc20token, owner, account1, account2 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("200", 18);
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      await erc20token
        .connect(owner)
        .approve(account1.address, amountToApprove);

      await expect(
        erc20token
          .connect(account1)
          .transferFrom(owner.address, account2.address, amountToTransfer)
      )
        .to.emit(erc20token, "Transfer")
        .withArgs(owner.address, account2.address, amountToTransfer);
    });
  });

  describe("Mint Tests", function () {
    it("Should revert if caller is not owner", async function () {
      const { erc20token, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToMint = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token.connect(account1).mint(account1.address, amountToMint)
      ).to.be.revertedWith("Only owner can mint token");
    });

    it("Should revert if recipient is address zero", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;
      const amountToMint = hre.ethers.parseUnits("100", 18);

      await expect(
        erc20token.connect(owner).mint(zeroAddr, amountToMint)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await expect(
        erc20token.connect(owner).mint(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should mint tokens successfully", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToMint = hre.ethers.parseUnits("500", 18);

      const initialTotalSupply = await erc20token.totalSupply();
      const initialBalanceOfAccount1 = await erc20token.balanceOf(
        account1.address
      );

      await erc20token.connect(owner).mint(account1.address, amountToMint);

      const newTotalSupply = await erc20token.totalSupply();
      const newBalanceOfAccount1 = await erc20token.balanceOf(
        account1.address
      );

      expect(newTotalSupply).to.equal(initialTotalSupply + amountToMint);
      expect(newBalanceOfAccount1).to.equal(
        initialBalanceOfAccount1 + amountToMint
      );
    });

    it("Should emit Transfer event on successful mint", async function () {
      const { erc20token, owner, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToMint = hre.ethers.parseUnits("500", 18);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        erc20token.connect(owner).mint(account1.address, amountToMint)
      )
        .to.emit(erc20token, "Transfer")
        .withArgs(zeroAddr, account1.address, amountToMint);
    });
  });

  describe("Burn Tests", function () {
    it("Should revert if amount is zero or less", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      await expect(erc20token.connect(owner).burn(0)).to.be.revertedWith(
        "Amount must be greater than zero"
      );
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { erc20token, account1 } = await loadFixture(
        deployERC20TokenFixture
      );
      const amountToBurn = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        erc20token.connect(account1).burn(amountToBurn)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should burn tokens successfully", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const amountToBurn = hre.ethers.parseUnits("100", 18);

      const initialTotalSupply = await erc20token.totalSupply();
      const initialBalanceOfOwner = await erc20token.balanceOf(owner.address);

      await erc20token.connect(owner).burn(amountToBurn);

      const newTotalSupply = await erc20token.totalSupply();
      const newBalanceOfOwner = await erc20token.balanceOf(owner.address);

      expect(newTotalSupply).to.equal(initialTotalSupply - amountToBurn);
      expect(newBalanceOfOwner).to.equal(initialBalanceOfOwner - amountToBurn);
    });

    it("Should emit Transfer event on successful burn", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);
      const amountToBurn = hre.ethers.parseUnits("100", 18);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(erc20token.connect(owner).burn(amountToBurn))
        .to.emit(erc20token, "Transfer")
        .withArgs(owner.address, zeroAddr, amountToBurn);
    });

    it("Should allow burning all tokens", async function () {
      const { erc20token, owner } = await loadFixture(deployERC20TokenFixture);

      const ownerBalance = await erc20token.balanceOf(owner.address);
      const initialTotalSupply = await erc20token.totalSupply();

      await erc20token.connect(owner).burn(ownerBalance);

      const newBalanceOfOwner = await erc20token.balanceOf(owner.address);
      const newTotalSupply = await erc20token.totalSupply();

      expect(newBalanceOfOwner).to.equal(0);
      expect(newTotalSupply).to.equal(initialTotalSupply - ownerBalance);
    });
  });
});