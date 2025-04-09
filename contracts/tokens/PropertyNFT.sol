// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./PropertyToken.sol";

contract PropertyNFT is ERC721URIStorage, Ownable {
    struct PropertyDetails {
        string propertyAddress;
        uint256 squareFootage;
        uint256 purchasePrice;
        uint256 constructionYear;
        string propertyType; // Residential, Commercial, etc.
        address propertyToken; // Associated ERC20 token address
    }
    
    // Mapping from token ID to property details
    mapping(uint256 => PropertyDetails) public properties;
    uint256 private _tokenIdCounter;
    
    constructor(address initialOwner) ERC721("RealEstateProperty", "REP") Ownable(initialOwner) {}
    
    // Function to mint a new property NFT
    function mintProperty(
        address to,
        string memory _tokenURI,
        string memory _propertyAddress,
        uint256 _squareFootage,
        uint256 _purchasePrice,
        uint256 _constructionYear,
        string memory _propertyType,
        address _propertyToken
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        properties[tokenId] = PropertyDetails({
            propertyAddress: _propertyAddress,
            squareFootage: _squareFootage,
            purchasePrice: _purchasePrice,
            constructionYear: _constructionYear,
            propertyType: _propertyType,
            propertyToken: _propertyToken
        });
        
        return tokenId;
    }
    
    // Update property details
    function updatePropertyDetails(
        uint256 tokenId,
        string memory _propertyAddress,
        uint256 _squareFootage,
        uint256 _purchasePrice,
        uint256 _constructionYear,
        string memory _propertyType
    ) external {
        // Check if the sender is the owner or approved
        require(
            _ownerOf(tokenId) == msg.sender || 
            getApproved(tokenId) == msg.sender || 
            isApprovedForAll(_ownerOf(tokenId), msg.sender),
            "Not approved or owner"
        );
        
        PropertyDetails storage property = properties[tokenId];
        property.propertyAddress = _propertyAddress;
        property.squareFootage = _squareFootage;
        property.purchasePrice = _purchasePrice;
        property.constructionYear = _constructionYear;
        property.propertyType = _propertyType;
    }
}