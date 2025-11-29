// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IERC20.sol";

contract StakingContract {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    address public owner;

    uint256 public rewardRatePerTokenPerSecond;
    uint256 public totalStaked;
    uint256 public lastUpdateTime;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            rewards[account] = earned(account);
            rewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    uint256 public rewardPerTokenStored;

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRatePerTokenPerSecond) {
        require(_stakingToken != address(0), "Invalid staking token address");
        require(_rewardToken != address(0), "Invalid reward token address");
        require(_rewardRatePerTokenPerSecond > 0, "Reward rate must be greater than zero");

        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRatePerTokenPerSecond = _rewardRatePerTokenPerSecond;
        lastUpdateTime = block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        uint256 reward = timeElapsed * rewardRatePerTokenPerSecond;
        return rewardPerTokenStored + (reward * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        uint256 currentRewardPerToken = rewardPerToken();
        uint256 rewardPerTokenDelta = currentRewardPerToken - rewardPerTokenPaid[account];
        uint256 earnedReward = (stakedBalance[account] * rewardPerTokenDelta) / 1e18;
        return rewards[account] + earnedReward;
    }

    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot stake zero amount");

        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake zero amount");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        stakingToken.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

    function exit() external updateReward(msg.sender) {
        uint256 staked = stakedBalance[msg.sender];
        require(staked > 0, "No staked tokens");

        stakedBalance[msg.sender] = 0;
        totalStaked -= staked;

        stakingToken.transfer(msg.sender, staked);

        emit Unstaked(msg.sender, staked);

        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function setRewardRate(uint256 _newRate) external onlyOwner updateReward(address(0)) {
        require(_newRate > 0, "Reward rate must be greater than zero");
        rewardRatePerTokenPerSecond = _newRate;
        emit RewardRateUpdated(_newRate);
    }

    function depositRewards(uint256 amount) external {
        require(amount > 0, "Cannot deposit zero amount");
        rewardToken.transferFrom(msg.sender, address(this), amount);
    }

    function getUserStake(address user) external view returns (uint256) {
        return stakedBalance[user];
    }

    function getPendingRewards(address user) external view returns (uint256) {
        return earned(user);
    }
}

