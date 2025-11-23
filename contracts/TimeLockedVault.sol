// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract TimeLockedVault {
    struct Deposit {
        uint256 amount;        
        uint256 unlockTime;    
        bool exists;           
    }

    mapping(address => Deposit) public deposits;

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount);
    event LockExtended(address indexed user, uint256 newUnlockTime);

   
    //to deposit
    function deposit(uint256 _lockDurationInSeconds) external payable {
        require(msg.value > 0, "You must send some Ether to deposit");

        require(_lockDurationInSeconds > 0, "Lock duration must be greater than 0");

        uint256 unlockTime = block.timestamp + _lockDurationInSeconds;

        if (deposits[msg.sender].exists) {
            require(
                unlockTime >= deposits[msg.sender].unlockTime,
                "New lock time must be equal or later than existing lock time"
            );
            
            deposits[msg.sender].amount += msg.value;
            deposits[msg.sender].unlockTime = unlockTime;
            
            emit LockExtended(msg.sender, unlockTime);
        } else {
            deposits[msg.sender] = Deposit({
                amount: msg.value,
                unlockTime: unlockTime,
                exists: true
            });
            
            emit Deposited(msg.sender, msg.value, unlockTime);
        }
    }

   //to withdraw
    function withdraw() external {
        require(deposits[msg.sender].exists, "No deposit found");

        require(
            block.timestamp >= deposits[msg.sender].unlockTime,
            "Lock period has not expired yet"
        );

        require(deposits[msg.sender].amount > 0, "No funds to withdraw");

        uint256 amountToWithdraw = deposits[msg.sender].amount;

        delete deposits[msg.sender];

        
        payable(msg.sender).transfer(amountToWithdraw);

        emit Withdrawn(msg.sender, amountToWithdraw);
    }

    //to get deposit information
    function getDeposit(address user) external view returns (
        uint256 amount,
        uint256 unlockTime,
        bool exists
    ) {
        Deposit memory depositInfo = deposits[user];
        return (depositInfo.amount, depositInfo.unlockTime, depositInfo.exists);
    }

    // to check if a user can withdraw
    function canWithdraw(address user) external view returns (bool) {
        if (!deposits[user].exists) {
            return false;
        }
        return block.timestamp >= deposits[user].unlockTime;
    }
}

