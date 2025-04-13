// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyRegistry
 * @dev Registry for mapping PropertyNFT tokens to their corresponding PropertyToken contracts
 */
contract PropertyRegistry is Ownable {
    struct RegisteredProperty {
        address propertyNFT;
        uint256 tokenId;       // Added tokenId to track individual NFTs
        address propertyToken;
        bool isActive;
        uint256 registrationDate;
    }
    
    // Array to store all registered properties
    RegisteredProperty[] public registeredProperties;
    
    // Mapping from (propertyNFT address, tokenId) to index in registeredProperties array
    // Using a nested mapping to properly track each NFT token
    mapping(address => mapping(uint256 => uint256)) public propertyIndexByTokenId;
    
    // Keeping the old mapping for backward compatibility, but marking it as deprecated
    mapping(address => uint256) public propertyIndex;
    
    // Events
    event PropertyRegistered(address indexed propertyNFT, uint256 indexed tokenId, address indexed propertyToken, uint256 timestamp);
    event PropertyStatusChanged(address indexed propertyNFT, uint256 indexed tokenId, bool isActive);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Register a new property with its own token
     * @param _propertyNFT The NFT contract address
     * @param _tokenId The specific token ID within the NFT contract
     * @param _propertyToken The dedicated ERC20 token for this property
     */
    function registerProperty(address _propertyNFT, uint256 _tokenId, address _propertyToken) external onlyOwner {
        // Ensure the property hasn't been registered before
        require(propertyIndexByTokenId[_propertyNFT][_tokenId] == 0, "Property already registered");
        
        registeredProperties.push(RegisteredProperty({
            propertyNFT: _propertyNFT,
            tokenId: _tokenId,
            propertyToken: _propertyToken,
            isActive: true,
            registrationDate: block.timestamp
        }));
        
        // Store the index (add 1 to handle the zero index case)
        uint256 newIndex = registeredProperties.length;
        propertyIndexByTokenId[_propertyNFT][_tokenId] = newIndex;
        
        // Update old index for backward compatibility
        if (propertyIndex[_propertyNFT] == 0) {
            propertyIndex[_propertyNFT] = newIndex;
        }
        
        emit PropertyRegistered(_propertyNFT, _tokenId, _propertyToken, block.timestamp);
    }
    
    /**
     * @dev Change the status of a property (active/inactive)
     */
    function setPropertyStatus(address _propertyNFT, uint256 _tokenId, bool _isActive) external onlyOwner {
        uint256 index = propertyIndexByTokenId[_propertyNFT][_tokenId];
        require(index > 0, "Property not registered");
        
        // Adjust for the +1 offset in propertyIndex
        registeredProperties[index - 1].isActive = _isActive;
        
        emit PropertyStatusChanged(_propertyNFT, _tokenId, _isActive);
    }
    
    /**
     * @dev Legacy version for backward compatibility
     */
    function setPropertyStatus(address _propertyNFT, bool _isActive) external onlyOwner {
        uint256 index = propertyIndex[_propertyNFT];
        require(index > 0, "Property not registered");
        
        // Adjust for the +1 offset in propertyIndex
        registeredProperties[index - 1].isActive = _isActive;
        
        emit PropertyStatusChanged(_propertyNFT, registeredProperties[index - 1].tokenId, _isActive);
    }
    
    /**
     * @dev Get the token address for a specific property NFT and token ID
     */
    function getPropertyToken(address _propertyNFT, uint256 _tokenId) external view returns (address) {
        uint256 index = propertyIndexByTokenId[_propertyNFT][_tokenId];
        require(index > 0, "Property not registered");
        
        return registeredProperties[index - 1].propertyToken;
    }
    
    /**
     * @dev Get all registered properties
     */
    function getAllProperties() external view returns (RegisteredProperty[] memory) {
        return registeredProperties;
    }
    
    /**
     * @dev Get active properties count
     */
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