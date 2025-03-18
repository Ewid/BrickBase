// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";

contract PropertyToken is ERC20, Ownable {
    address public propertyNFT; // The NFT that represents the full property
    uint256 public totalPropertyValue; // Total valuation of the property in USD
    uint256 public totalTokenSupply; // Total number of tokens representing 100% ownership

    event RentDistributed(uint256 amount, uint256 timestamp);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalPropertyValue,
        uint256 _totalTokenSupply,
        address initialOwner
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        totalPropertyValue = _totalPropertyValue;
        totalTokenSupply = _totalTokenSupply;
    }
    
    // Only the property NFT contract can set itself as the propertyNFT
    function setPropertyNFT(address _propertyNFT) external {
        require(propertyNFT == address(0), "Property NFT already set");
        require(msg.sender == owner(), "Only owner can set property NFT");
        propertyNFT = _propertyNFT;
    }
    
    // Mint new tokens - only the owner can do this (initially the platform, later the DAO)
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= totalTokenSupply, "Exceeds total token supply");
        _mint(to, amount);
    }
    
    // Function to distribute rent to token holders
    function distributeRent() external payable {
        require(msg.value > 0, "No rent to distribute");
        
        // Record the rent distribution event
        emit RentDistributed(msg.value, block.timestamp);
        
        // Rent will be stored in the contract and claimed by token holders
        // Implementation for automatic distribution will be added later
    }
    
    // Function for token holders to claim their rent
    function claimRent() external {
        // This will be implemented to allow users to claim their portion of distributed rent
        // based on their token holdings
    }
}