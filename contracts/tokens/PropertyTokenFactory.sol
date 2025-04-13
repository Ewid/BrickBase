// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PropertyToken.sol";

/**
 * @title PropertyTokenFactory
 * @dev Factory contract to create separate PropertyToken contracts for each property
 */
contract PropertyTokenFactory is Ownable {
    // Events
    event PropertyTokenCreated(address indexed tokenAddress, string name, string symbol, uint256 propertyValue);
    
    // Mapping to keep track of all created property tokens
    address[] public createdTokens;
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Creates a new PropertyToken contract for a specific property
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param totalPropertyValue The total value of the property in USD (x10^6)
     * @param totalTokenSupply The total number of tokens to represent 100% ownership
     * @return The address of the newly created PropertyToken contract
     */
    function createPropertyToken(
        string memory name,
        string memory symbol,
        uint256 totalPropertyValue,
        uint256 totalTokenSupply
    ) external onlyOwner returns (address) {
        PropertyToken newToken = new PropertyToken(
            name,
            symbol,
            totalPropertyValue,
            totalTokenSupply,
            owner()
        );
        
        address tokenAddress = address(newToken);
        createdTokens.push(tokenAddress);
        
        emit PropertyTokenCreated(tokenAddress, name, symbol, totalPropertyValue);
        return tokenAddress;
    }
    
    /**
     * @dev Returns the number of tokens created by this factory
     */
    function getTokenCount() external view returns (uint256) {
        return createdTokens.length;
    }
    
    /**
     * @dev Returns all tokens created by this factory
     */
    function getAllTokens() external view returns (address[] memory) {
        return createdTokens;
    }
} 