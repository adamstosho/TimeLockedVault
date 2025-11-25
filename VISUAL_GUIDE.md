# 🎨 VISUAL GUIDE: How the Time-Locked Vault Works

## Simple Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER WANTS TO DEPOSIT                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  User calls: deposit(lockDuration) with Ether               │
│  Example: deposit(3600) with 1 ETH                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract Checks:                                           │
│  ✓ Is Ether amount > 0?                                     │
│  ✓ Is lock duration > 0?                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract calculates:                                       │
│  unlockTime = currentTime + lockDuration                    │
│  Example: 1704123456 + 3600 = 1704127056                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract stores in mapping:                                │
│  deposits[userAddress] = {                                  │
│    amount: 1 ETH,                                           │
│    unlockTime: 1704127056,                                  │
│    exists: true                                             │
│  }                                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract emits event:                                      │
│  Deposited(userAddress, 1 ETH, 1704127056)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Withdrawal Flow

```
┌─────────────────────────────────────────────────────────────┐
│              USER WANTS TO WITHDRAW                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  User calls: withdraw()                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract Checks:                                           │
│  ✓ Does deposit exist?                                      │
│  ✓ Is current time >= unlockTime?                           │
│  ✓ Is amount > 0?                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
              ✅ ALL PASS      ❌ ANY FAILS
                    │               │
                    ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Transaction      │  │ Transaction      │
        │ SUCCEEDS         │  │ REVERTS          │
        └────────┬─────────┘  │ (fails)          │
                 │            └──────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract saves amount and deletes deposit:                 │
│  amountToWithdraw = deposits[user].amount                   │
│  delete deposits[user]                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract sends Ether back to user:                         │
│  user.transfer(amountToWithdraw)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Contract emits event:                                      │
│  Withdrawn(userAddress, amountToWithdraw)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structure Visualization

### Before Any Deposits
```
deposits mapping: { }
(empty - no users have deposited)
```

### After Alice Deposits 1 ETH for 1 Hour
```
deposits mapping: {
  "0xAlice": {
    amount: 1000000000000000000,  // 1 ETH in Wei
    unlockTime: 1704127056,        // Timestamp 1 hour from now
    exists: true
  }
}
```

### After Bob Deposits 2 ETH for 2 Hours
```
deposits mapping: {
  "0xAlice": {
    amount: 1000000000000000000,
    unlockTime: 1704127056,
    exists: true
  },
  "0xBob": {
    amount: 2000000000000000000,  // 2 ETH in Wei
    unlockTime: 1704130656,        // Timestamp 2 hours from now
    exists: true
  }
}
```

### After Alice Withdraws
```
deposits mapping: {
  "0xBob": {
    amount: 2000000000000000000,
    unlockTime: 1704130656,
    exists: true
  }
}
// Alice's entry is deleted
```

---

## Time Progression Example

### Timeline: Alice Deposits and Withdraws

```
Time 0:00 ──────────────────────────────────────────────────
         │
         │ Alice deposits 1 ETH for 1 hour
         │ unlockTime = Time 1:00
         │
         ▼
    [LOCKED] ────────────────────────────────────────────
         │
         │ Time passes...
         │
         │ Time 0:30 (30 minutes later)
         │ Alice tries to withdraw
         │ ❌ FAILS: "Lock period has not expired yet"
         │
         │ Time 1:00 (1 hour later - unlock time!)
         │ Alice tries to withdraw
         │ ✅ SUCCESS: Gets 1 ETH back
         │
         ▼
    [UNLOCKED] Withdrawal successful!
```

---

## Multiple Users Example

### Scenario: Alice and Bob Both Deposit

```
┌─────────────────────────────────────────────────────────┐
│                    CONTRACT STATE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  deposits["0xAlice"] = {                                │
│    amount: 1 ETH                                        │
│    unlockTime: 1704127056  (in 1 hour)                  │
│    exists: true                                         │
│  }                                                       │
│                                                          │
│  deposits["0xBob"] = {                                  │
│    amount: 2 ETH                                        │
│    unlockTime: 1704130656  (in 2 hours)                 │
│    exists: true                                         │
│  }                                                       │
│                                                          │
│  Contract Balance: 3 ETH                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Each user's funds are stored separately
- ✅ Each user has their own unlock time
- ✅ Users can't access each other's funds
- ✅ Contract holds all the funds together (but tracks who owns what)

---

## Function Call Examples

### Example 1: Simple Deposit
```javascript
// User wants to deposit 1 ETH for 1 hour (3600 seconds)
vault.deposit(3600, { value: ethers.parseEther("1.0") })

// What happens:
// 1. Contract receives 1 ETH
// 2. Calculates unlockTime = now + 3600 seconds
// 3. Stores: deposits[user] = { amount: 1 ETH, unlockTime: ..., exists: true }
// 4. Emits: Deposited(user, 1 ETH, unlockTime)
```

### Example 2: Add More Funds
```javascript
// User already has a deposit, now adds 0.5 ETH more
// They want to extend lock to 2 hours total (7200 seconds)
vault.deposit(7200, { value: ethers.parseEther("0.5") })

// What happens:
// 1. Contract checks: Does deposit exist? YES
// 2. Contract checks: Is new unlockTime >= old unlockTime? YES
// 3. Updates: deposits[user].amount += 0.5 ETH
// 4. Updates: deposits[user].unlockTime = new unlockTime
// 5. Emits: LockExtended(user, newUnlockTime)
```

### Example 3: Successful Withdrawal
```javascript
// After lock time has passed
vault.withdraw()

// What happens:
// 1. Contract checks: Does deposit exist? YES
// 2. Contract checks: Is now >= unlockTime? YES
// 3. Saves: amountToWithdraw = 1.5 ETH
// 4. Deletes: deposits[user] (sets everything to 0/false)
// 5. Sends: 1.5 ETH to user
// 6. Emits: Withdrawn(user, 1.5 ETH)
```

### Example 4: Failed Withdrawal (Too Early)
```javascript
// User tries to withdraw before lock expires
vault.withdraw()

// What happens:
// 1. Contract checks: Does deposit exist? YES
// 2. Contract checks: Is now >= unlockTime? NO ❌
// 3. Transaction REVERTS with error:
//    "Lock period has not expired yet"
// 4. No money is sent, deposit remains unchanged
```

---

## Security Features Explained

### 🔒 Protection #1: Require Valid Amount
```solidity
require(msg.value > 0, "You must send some Ether to deposit");
```
**Protects against:** Someone trying to deposit 0 Ether

### 🔒 Protection #2: Require Valid Duration
```solidity
require(_lockDurationInSeconds > 0, "Lock duration must be greater than 0");
```
**Protects against:** Someone trying to lock for 0 seconds (instant withdrawal)

### 🔒 Protection #3: Check Deposit Exists
```solidity
require(deposits[msg.sender].exists, "No deposit found");
```
**Protects against:** Someone trying to withdraw without having deposited

### 🔒 Protection #4: Enforce Lock Time
```solidity
require(block.timestamp >= deposits[msg.sender].unlockTime, "Lock period has not expired yet");
```
**Protects against:** Someone trying to withdraw before lock expires

### 🔒 Protection #5: Only Owner Can Withdraw
- Each user can only access their own deposit
- `msg.sender` ensures you can only withdraw YOUR funds
- `deposits[msg.sender]` means it's automatically linked to the caller

---

## Test Structure Breakdown

```
describe("TimeLockedVault")           ← Top level: All tests for this contract
│
├── describe("Deployment")            ← Group: Tests about deploying
│   └── it("Should deploy...")        ← Test: Does it deploy?
│
├── describe("Deposits")              ← Group: Tests about depositing
│   ├── it("Should allow deposit...") ← Test: Normal deposit works?
│   ├── it("Should prevent zero...")  ← Test: Edge case handled?
│   └── ...
│
├── describe("Withdrawals")           ← Group: Tests about withdrawing
│   ├── it("Should prevent early...") ← Test: Security check works?
│   └── ...
│
└── describe("View Functions")        ← Group: Tests about reading data
    └── ...
```

---

## Common Questions Answered

### ❓ Why use `struct` instead of separate variables?
**Answer:** Because each user needs their own set of values. A struct groups them together neatly.

### ❓ Why use `mapping` instead of an array?
**Answer:** Mappings are more efficient for looking up by address. Arrays would require searching through all entries.

### ❓ What happens if someone tries to withdraw twice?
**Answer:** After first withdrawal, `deposits[user].exists` becomes `false`, so second withdrawal fails with "No deposit found"

### ❓ Can two users have the same unlock time?
**Answer:** Yes! Each user's data is stored separately, so they can have identical unlock times.

### ❓ What if the contract runs out of Ether?
**Answer:** This shouldn't happen because we only withdraw what was deposited. But if it did, the `transfer()` would fail.

---

## Memory vs Storage

### Storage (Lines 12, 33, 38, etc.)
```solidity
mapping(address => Deposit) public deposits;  // Stored on blockchain
deposits[msg.sender].amount += msg.value;     // Modifies blockchain
```
- **Persistent**: Saved on blockchain forever
- **Expensive**: Costs gas to read/write
- **Use for:** Data that needs to persist

### Memory (Line 75)
```solidity
Deposit memory depositInfo = deposits[user];  // Temporary copy
return (depositInfo.amount, ...);             // Just for reading
```
- **Temporary**: Only exists during function execution
- **Cheap**: Free (well, almost)
- **Use for:** Temporary data in functions

---

I hope this visual guide helps you understand every part of the code! 🚀

