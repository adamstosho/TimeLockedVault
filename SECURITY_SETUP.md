# 🔒 Security Setup Guide

## ⚠️ IMPORTANT: Secrets Configuration

All sensitive credentials have been removed from the codebase. You **MUST** configure them using environment variables.

## Required Environment Variables

### 1. Create a `.env` file in the project root

Create a `.env` file with the following structure:

```bash
# Private Keys (NEVER commit these!)
PRIVATE_KEY=your_wallet_private_key_here

# API Keys
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Pinata IPFS Keys
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
```

### 2. How Hardhat Reads Environment Variables

Hardhat uses the `vars.get()` function which reads from:
- Environment variables (automatically)
- Hardhat's CLI prompts (if not found)
- `.env` file (via dotenv, but Hardhat's vars system handles this)

### 3. For Scripts (like uploadToIPFS.ts)

Scripts use `dotenv` to load `.env` file automatically. Make sure your `.env` file exists.

## Security Checklist

✅ **`.gitignore` already includes `.env`** - Your secrets will NOT be committed
✅ **All hardcoded secrets removed** - No API keys in code
✅ **Environment variables only** - All sensitive data read from env

## Setting Up Your .env File

1. Copy the template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace all placeholder values with your actual keys:
   - Get your **PRIVATE_KEY** from your wallet (MetaMask export, etc.)
   - Get **ALCHEMY_API_KEY** from https://www.alchemy.com/
   - Get **ETHERSCAN_API_KEY** from https://etherscan.io/apis
   - Get **PINATA_API_KEY** and **PINATA_SECRET_KEY** from https://app.pinata.cloud/

3. **NEVER commit `.env` file** - It's already in `.gitignore`

## Verification

After setting up `.env`, verify:

```bash
# This should work without errors
npx hardhat run scripts/uploadToIPFS.ts
```

If you see errors about missing keys, check your `.env` file.

## What Was Fixed

1. ❌ **Removed** hardcoded Pinata API keys from `hardhat.config.ts`
2. ❌ **Removed** hardcoded Pinata API keys from `scripts/uploadToIPFS.ts`
3. ✅ **Updated** all files to read from environment variables
4. ✅ **Created** `.env.example` template file

## Important Notes

- 🔴 **NEVER** share your `.env` file
- 🔴 **NEVER** commit `.env` to git (already ignored)
- 🔴 **NEVER** hardcode secrets in code files
- ✅ **ALWAYS** use environment variables for secrets
- ✅ **ALWAYS** use `.env.example` as a template (no real values)

