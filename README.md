# BrickBase

## Overview

BrickBase is a revolutionary blockchain-based platform that democratizes real estate investment through tokenization. This repository contains the core smart contracts that power the platform's functionality.

## Key Features

* **Fractional Ownership**: Enable partial property investment through ERC20 tokens
* **Property NFTs**: Unique digital representations of real estate assets
* **Decentralized Governance**: Community-driven property management through DAO
* **Liquid Marketplace**: Seamless trading of property tokens

## Smart Contract Architecture

Our platform is built on four primary smart contracts:

1. **PropertyToken.sol (ERC20)**
   * Manages fractional ownership tokens
   * Handles token distribution and transfers
   * Implements revenue sharing mechanisms

2. **PropertyNFT.sol (ERC721)**
   * Stores property metadata and documentation
   * Links physical properties to digital tokens
   * Maintains property history and valuations

3. **PropertyDAO.sol**
   * Enables decentralized property management
   * Handles proposal creation and voting
   * Manages property maintenance decisions

4. **PropertyMarketplace.sol**
   * Facilitates token trading
   * Manages property listings
   * Handles price discovery and transactions

## Development Setup

### Prerequisites
* Node.js >= 16.0.0
* npm >= 8.0.0
* An Ethereum wallet (e.g., MetaMask)
* Hardhat

### Installation

1. Clone the repository
```bash
git clone https://github.com/Ewid/BrickBase.git
cd BrickBase
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
# Add your environment variables
```

4. Compile contracts
```bash
npx hardhat compile
```

5. Run tests
```bash
npx hardhat test
```

### Project Structure
```
├── contracts/
│   ├── tokens/
│   │   ├── PropertyToken.sol
│   │   └── PropertyNFT.sol
│   ├── governance/
│   │   └── PropertyDAO.sol
│   └── marketplace/
│       └── PropertyMarketplace.sol
├── test/
├── scripts/
└── hardhat.config.ts
```

## Security

BrickBase prioritizes security through:
* Comprehensive test coverage
* Implementation of OpenZeppelin security standards
* Regular security audits (reports available in `/audits`)
* Best practices in smart contract development

## Testing

```
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/PropertyToken.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```
