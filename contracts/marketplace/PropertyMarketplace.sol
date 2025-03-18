// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyMarketplace is ReentrancyGuard, Ownable {
    // Platform fee percentage (in basis points, e.g., 100 = 1%)
    uint256 public platformFeePercentage;
    
    // Platform fee recipient address
    address public feeRecipient;
    
    // Listing structure
    struct Listing {
        address seller;
        address propertyToken;
        uint256 tokenAmount;
        uint256 pricePerToken;
        bool isActive;
    }
    
    // Array of all listings
    Listing[] public listings;
    
    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed propertyToken, uint256 tokenAmount, uint256 pricePerToken);
    event ListingCancelled(uint256 indexed listingId);
    event ListingPurchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event FeeRecipientUpdated(address newFeeRecipient);
    
    constructor(uint256 _platformFeePercentage, address _feeRecipient, address initialOwner) Ownable(initialOwner) {
        platformFeePercentage = _platformFeePercentage;
        feeRecipient = _feeRecipient;
    }
    
    // Create a new listing
    function createListing(address _propertyToken, uint256 _tokenAmount, uint256 _pricePerToken) external returns (uint256) {
        require(_tokenAmount > 0, "Token amount must be greater than 0");
        require(_pricePerToken > 0, "Price must be greater than 0");
        
        // Transfer tokens to this contract
        IERC20(_propertyToken).transferFrom(msg.sender, address(this), _tokenAmount);
        
        listings.push(Listing({
            seller: msg.sender,
            propertyToken: _propertyToken,
            tokenAmount: _tokenAmount,
            pricePerToken: _pricePerToken,
            isActive: true
        }));
        
        uint256 listingId = listings.length - 1;
        emit ListingCreated(listingId, msg.sender, _propertyToken, _tokenAmount, _pricePerToken);
        
        return listingId;
    }
    
    // Cancel a listing
    function cancelListing(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");
        
        listing.isActive = false;
        
        // Return tokens to the seller
        IERC20(listing.propertyToken).transfer(listing.seller, listing.tokenAmount);
        
        emit ListingCancelled(_listingId);
    }
    
    // Purchase tokens from a listing
    function purchaseTokens(uint256 _listingId, uint256 _amount) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(_amount > 0 && _amount <= listing.tokenAmount, "Invalid amount");
        
        uint256 totalPrice = _amount * listing.pricePerToken;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 sellerProceeds = totalPrice - platformFee;
        
        // Update listing
        listing.tokenAmount -= _amount;
        if (listing.tokenAmount == 0) {
            listing.isActive = false;
        }
        
        // Transfer tokens to buyer
        IERC20(listing.propertyToken).transfer(msg.sender, _amount);
        
        // Transfer funds to seller and platform
        payable(listing.seller).transfer(sellerProceeds);
        payable(feeRecipient).transfer(platformFee);
        
        // Refund excess ETH to buyer if any
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit ListingPurchased(_listingId, msg.sender, _amount, totalPrice);
    }
    
    // Update platform fee percentage (only owner)
    function updatePlatformFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _newFeePercentage;
        emit PlatformFeeUpdated(_newFeePercentage);
    }
    
    // Update fee recipient address (only owner)
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid address");
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(_newFeeRecipient);
    }
    
    // Get all active listings
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active listing IDs
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].isActive) {
                activeListings[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return activeListings;
    }
}