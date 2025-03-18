// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyRegistry is Ownable {
    struct RegisteredProperty {
        address propertyNFT;
        address propertyToken;
        bool isActive;
        uint256 registrationDate;
    }
    
    // Array to store all registered properties
    RegisteredProperty[] public registeredProperties;
    
    // Mapping from propertyNFT address to index in registeredProperties array
    mapping(address => uint256) public propertyIndex;
    
    // Events
    event PropertyRegistered(address indexed propertyNFT, address indexed propertyToken, uint256 timestamp);
    event PropertyStatusChanged(address indexed propertyNFT, bool isActive);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    // Register a new property
    function registerProperty(address _propertyNFT, address _propertyToken) external onlyOwner {
        // Ensure the property hasn't been registered before
        require(propertyIndex[_propertyNFT] == 0, "Property already registered");
        
        registeredProperties.push(RegisteredProperty({
            propertyNFT: _propertyNFT,
            propertyToken: _propertyToken,
            isActive: true,
            registrationDate: block.timestamp
        }));
        
        // Store the index (add 1 to handle the zero index case)
        propertyIndex[_propertyNFT] = registeredProperties.length;
        
        emit PropertyRegistered(_propertyNFT, _propertyToken, block.timestamp);
    }
    
    // Change the status of a property (active/inactive)
    function setPropertyStatus(address _propertyNFT, bool _isActive) external onlyOwner {
        uint256 index = propertyIndex[_propertyNFT];
        require(index > 0, "Property not registered");
        
        // Adjust for the +1 offset in propertyIndex
        registeredProperties[index - 1].isActive = _isActive;
        
        emit PropertyStatusChanged(_propertyNFT, _isActive);
    }
    
    // Get all registered properties
    function getAllProperties() external view returns (RegisteredProperty[] memory) {
        return registeredProperties;
    }
    
    // Get active properties count
    function getActivePropertiesCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredProperties.length; i++) {
            if (registeredProperties[i].isActive) {
                count++;
            }
        }
        return count;
    }
}