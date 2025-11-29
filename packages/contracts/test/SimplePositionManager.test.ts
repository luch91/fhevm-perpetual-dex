import { expect } from "chai";
import { ethers } from "hardhat";
import { SimplePositionManager, FundingRateManager, LiquidationKeeper, PriceOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("SimplePositionManager", function () {
  let positionManager: SimplePositionManager;
  let fundingManager: FundingRateManager;
  let liquidationKeeper: LiquidationKeeper;
  let usdc: any; // MockUSDC
  let oracle: PriceOracle;

  let owner: SignerWithAddress;
  let trader: SignerWithAddress;
  let liquidator: SignerWithAddress;

  const INITIAL_USDC = ethers.parseUnits("10000", 6); // 10,000 USDC
  const BTC_PRICE = BigInt(90000 * 1e8); // $90,000

  beforeEach(async function () {
    [owner, trader, liquidator] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Mint USDC to trader
    await usdc.mint(trader.address, INITIAL_USDC);

    // Deploy Price Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();

    // Set initial BTC price
    await oracle.updatePrice("BTC/USD", BTC_PRICE, 8);

    // Deploy Funding Rate Manager
    const FundingRateManager = await ethers.getContractFactory("FundingRateManager");
    fundingManager = await FundingRateManager.deploy();
    await fundingManager.waitForDeployment();

    // Deploy Liquidation Keeper
    const LiquidationKeeper = await ethers.getContractFactory("LiquidationKeeper");
    liquidationKeeper = await LiquidationKeeper.deploy();
    await liquidationKeeper.waitForDeployment();

    // Deploy Position Manager
    const SimplePositionManager = await ethers.getContractFactory("SimplePositionManager");
    positionManager = await SimplePositionManager.deploy(
      await oracle.getAddress(),
      await fundingManager.getAddress(),
      await liquidationKeeper.getAddress(),
      await usdc.getAddress()
    );
    await positionManager.waitForDeployment();

    // Transfer ownership of FundingManager to PositionManager
    await fundingManager.transferOwnership(await positionManager.getAddress());

    // Approve USDC for PositionManager
    await usdc.connect(trader).approve(
      await positionManager.getAddress(),
      ethers.parseUnits("100000", 6)
    );
  });

  describe("Deployment", function () {
    it("Should set the correct contract addresses", async function () {
      expect(await positionManager.priceOracle()).to.equal(await oracle.getAddress());
      expect(await positionManager.fundingRateManager()).to.equal(await fundingManager.getAddress());
      expect(await positionManager.liquidationKeeper()).to.equal(await liquidationKeeper.getAddress());
      expect(await positionManager.usdcToken()).to.equal(await usdc.getAddress());
    });

    it("Should initialize with zero positions", async function () {
      expect(await positionManager.positionCounter()).to.equal(0);
      expect(await positionManager.getPositionCount(trader.address)).to.equal(0);
    });

    it("Should set correct constants", async function () {
      expect(await positionManager.MIN_LEVERAGE()).to.equal(1);
      expect(await positionManager.MAX_LEVERAGE()).to.equal(10);
      expect(await positionManager.DEFAULT_ASSET()).to.equal("BTC/USD");
    });
  });

  describe("Opening Positions", function () {
    it("Should open a long position and transfer USDC", async function () {
      const size = 100;
      const collateral = ethers.parseUnits("1000", 6);
      const isLong = true;
      const leverage = 5;

      const traderBalanceBefore = await usdc.balanceOf(trader.address);

      const tx = await positionManager.connect(trader).openPosition(size, collateral, isLong, leverage);

      // Check USDC was transferred
      const traderBalanceAfter = await usdc.balanceOf(trader.address);
      expect(traderBalanceBefore - traderBalanceAfter).to.equal(collateral);

      // Check event emitted
      await expect(tx)
        .to.emit(positionManager, "PositionOpened")
        .withArgs(trader.address, 0, isLong, BTC_PRICE, anyValue);

      // Check position stored correctly
      const position = await positionManager.getPosition(0);
      expect(position.size).to.equal(size);
      expect(position.collateral).to.equal(collateral);
      expect(position.isLong).to.equal(isLong);
      expect(position.leverage).to.equal(leverage);
      expect(position.isOpen).to.equal(true);
      expect(position.entryPrice).to.equal(BTC_PRICE);
    });

    it("Should open a short position", async function () {
      await positionManager.connect(trader).openPosition(
        50,
        ethers.parseUnits("500", 6),
        false,
        3
      );

      const position = await positionManager.getPosition(0);
      expect(position.isLong).to.equal(false);
    });

    it("Should increment position counter and track positions", async function () {
      await positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 5);
      expect(await positionManager.positionCounter()).to.equal(1);
      expect(await positionManager.getPositionCount(trader.address)).to.equal(1);

      await positionManager.connect(trader).openPosition(50, ethers.parseUnits("500", 6), false, 3);
      expect(await positionManager.positionCounter()).to.equal(2);
      expect(await positionManager.getPositionCount(trader.address)).to.equal(2);
    });

    it("Should update funding rate when opening position", async function () {
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        true,
        5
      );

      const [rate, lastUpdate] = await fundingManager.getFundingRate("BTC/USD");
      expect(lastUpdate).to.be.gt(0);
    });

    it("Should revert if leverage is 0", async function () {
      await expect(
        positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 0)
      ).to.be.revertedWith("Invalid leverage");
    });

    it("Should revert if leverage > 10", async function () {
      await expect(
        positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 11)
      ).to.be.revertedWith("Invalid leverage");
    });

    it("Should revert if size is 0", async function () {
      await expect(
        positionManager.connect(trader).openPosition(0, ethers.parseUnits("1000", 6), true, 5)
      ).to.be.revertedWith("Size must be greater than zero");
    });

    it("Should revert if collateral is 0", async function () {
      await expect(
        positionManager.connect(trader).openPosition(100, 0, true, 5)
      ).to.be.revertedWith("Collateral must be greater than zero");
    });

    it("Should revert if insufficient USDC balance", async function () {
      const hugeCollateral = ethers.parseUnits("100000", 6);
      await expect(
        positionManager.connect(trader).openPosition(100, hugeCollateral, true, 5)
      ).to.be.revertedWithCustomError(usdc, "ERC20InsufficientBalance");
    });

    it("Should revert if insufficient USDC allowance", async function () {
      await usdc.connect(trader).approve(await positionManager.getAddress(), ethers.parseUnits("10", 6));

      await expect(
        positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 5)
      ).to.be.revertedWithCustomError(usdc, "ERC20InsufficientAllowance");
    });
  });

  describe("Closing Positions", function () {
    beforeEach(async function () {
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        true,
        5
      );
    });

    it("Should close position with profit (long, price up)", async function () {
      // Price goes up to $95,000 (5.56% gain)
      const newPrice = BigInt(95000 * 1e8);
      await oracle.updatePrice("BTC/USD", newPrice, 8);

      const traderBalanceBefore = await usdc.balanceOf(trader.address);

      const tx = await positionManager.connect(trader).closePosition(0);

      // Check event emitted with funding payment
      await expect(tx)
        .to.emit(positionManager, "PositionClosed")
        .withArgs(trader.address, 0, newPrice, anyValue, anyValue);

      const traderBalanceAfter = await usdc.balanceOf(trader.address);

      // Should receive collateral + profit
      expect(traderBalanceAfter).to.be.gt(traderBalanceBefore);

      // Position should be marked as closed
      const position = await positionManager.getPosition(0);
      expect(position.isOpen).to.equal(false);
    });

    it("Should close position with loss (long, price down)", async function () {
      // Price goes down to $85,000 (5.56% loss)
      const newPrice = BigInt(85000 * 1e8);
      await oracle.updatePrice("BTC/USD", newPrice, 8);

      const traderBalanceBefore = await usdc.balanceOf(trader.address);

      await positionManager.connect(trader).closePosition(0);

      const traderBalanceAfter = await usdc.balanceOf(trader.address);

      // Should receive less than collateral
      const returned = traderBalanceAfter - traderBalanceBefore;
      expect(returned).to.be.lt(ethers.parseUnits("1000", 6));
      expect(returned).to.be.gt(0);
    });

    it("Should handle short position profit (price down)", async function () {
      // Open short position
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        false, // short
        5
      );

      // Price goes down to $85,000 (profit for short)
      await oracle.updatePrice("BTC/USD", BigInt(85000 * 1e8), 8);

      const traderBalanceBefore = await usdc.balanceOf(trader.address);
      await positionManager.connect(trader).closePosition(1);
      const traderBalanceAfter = await usdc.balanceOf(trader.address);

      // Should profit
      expect(traderBalanceAfter - traderBalanceBefore).to.be.gt(ethers.parseUnits("1000", 6));
    });

    it("Should return zero if total loss", async function () {
      // Price crashes to $45,000 (50% loss)
      await oracle.updatePrice("BTC/USD", BigInt(45000 * 1e8), 8);

      const traderBalanceBefore = await usdc.balanceOf(trader.address);
      await positionManager.connect(trader).closePosition(0);
      const traderBalanceAfter = await usdc.balanceOf(trader.address);

      // Should get nothing back
      expect(traderBalanceAfter).to.equal(traderBalanceBefore);
    });

    it("Should revert if not position owner", async function () {
      await expect(
        positionManager.connect(liquidator).closePosition(0)
      ).to.be.revertedWith("Not position owner");
    });

    it("Should revert if position already closed", async function () {
      await positionManager.connect(trader).closePosition(0);

      await expect(
        positionManager.connect(trader).closePosition(0)
      ).to.be.revertedWith("Position not open");
    });
  });

  describe("Liquidation", function () {
    it("Should liquidate undercollateralized position", async function () {
      // Open 10x leverage position
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        true,
        10
      );

      // Price drops 15% (exceeds maintenance margin for 10x)
      const crashPrice = BigInt(76500 * 1e8);
      await oracle.updatePrice("BTC/USD", crashPrice, 8);

      await expect(
        positionManager.connect(liquidator).liquidatePosition(0)
      ).to.emit(positionManager, "PositionLiquidated");

      const position = await positionManager.getPosition(0);
      expect(position.isOpen).to.equal(false);
    });

    it("Should revert liquidation if position healthy", async function () {
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        true,
        2 // Low leverage, safer
      );

      // Small price drop (not enough to liquidate)
      await oracle.updatePrice("BTC/USD", BigInt(88000 * 1e8), 8);

      await expect(
        positionManager.connect(liquidator).liquidatePosition(0)
      ).to.be.revertedWith("Position healthy");
    });

    it("Should only allow keeper to liquidate", async function () {
      await positionManager.connect(trader).openPosition(
        100,
        ethers.parseUnits("1000", 6),
        true,
        10
      );

      await oracle.updatePrice("BTC/USD", BigInt(76500 * 1e8), 8);

      // Only liquidation keeper can call this
      await expect(
        positionManager.connect(trader).liquidatePosition(0)
      ).to.be.revertedWith("Only liquidation keeper");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple positions per user", async function () {
      await positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 5);
      await positionManager.connect(trader).openPosition(50, ethers.parseUnits("500", 6), false, 3);
      await positionManager.connect(trader).openPosition(75, ethers.parseUnits("750", 6), true, 7);

      expect(await positionManager.getPositionCount(trader.address)).to.equal(3);

      // Should be able to close them independently
      await positionManager.connect(trader).closePosition(1);

      const pos0 = await positionManager.getPosition(0);
      const pos1 = await positionManager.getPosition(1);
      const pos2 = await positionManager.getPosition(2);

      expect(pos0.isOpen).to.equal(true);
      expect(pos1.isOpen).to.equal(false);
      expect(pos2.isOpen).to.equal(true);
    });

    it("Should handle max leverage (10x)", async function () {
      await positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 10);

      const position = await positionManager.getPosition(0);
      expect(position.leverage).to.equal(10);
    });

    it("Should handle min leverage (1x)", async function () {
      await positionManager.connect(trader).openPosition(100, ethers.parseUnits("1000", 6), true, 1);

      const position = await positionManager.getPosition(0);
      expect(position.leverage).to.equal(1);
    });
  });
});
