// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";


contract RentDistribution is ReentrancyGuardUpgradeable, Ownable {
    struct RentPayment {
        uint256 amount;
        uint256 timestamp;
        uint256 totalSupplySnapshot;
    }
    
    struct TokenHolder {
        uint256 lastClaimedIndex;
    }
    
    // USDC token address
    address public usdcToken;
    
    // Mapping of property token address to rent payment history
    mapping(address => RentPayment[]) public rentPayments;
    
    // Mapping of property token address to token holder address to their claim status
    mapping(address => mapping(address => TokenHolder)) public tokenHolders;
    
    // Events
    event RentReceived(address indexed propertyToken, uint256 amount, uint256 timestamp);
    event RentClaimed(address indexed propertyToken, address indexed tokenHolder, uint256 amount);
    event USDCTokenUpdated(address newUsdcToken);
    
    // Define a fallback function to reject ETH payments
    receive() external payable {
        revert("ETH payments not accepted");
    }
    
    // Define a fallback function to reject ETH payments via data
    fallback() external payable {
        revert("ETH payments not accepted");
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {
        usdcToken = address(0); // Initialize to zero address
    }
    
    // Set USDC token address
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
        emit USDCTokenUpdated(_usdcToken);
    }
    
    // Function to deposit USDC rent payments for a specific property
    function depositRent(address _propertyToken, uint256 _amount) external {
        require(_amount > 0, "No rent to deposit");
        require(usdcToken != address(0), "USDC token not set");
        
        // Transfer USDC from sender to this contract
        IERC20(usdcToken).transferFrom(msg.sender, address(this), _amount);
        
        IERC20 token = IERC20(_propertyToken);
        uint256 totalSupply = token.totalSupply();
        
        rentPayments[_propertyToken].push(RentPayment({
            amount: _amount,
            timestamp: block.timestamp,
            totalSupplySnapshot: totalSupply
        }));
        
        emit RentReceived(_propertyToken, _amount, block.timestamp);
    }
    
    // Function for token holders to claim their rent
    function claimRent(address _propertyToken) external nonReentrant {
        IERC20 token = IERC20(_propertyToken);
        uint256 balance = token.balanceOf(msg.sender);
        require(balance > 0, "No tokens owned");
        
        TokenHolder storage holder = tokenHolders[_propertyToken][msg.sender];
        uint256 startIndex = holder.lastClaimedIndex;
        uint256 endIndex = rentPayments[_propertyToken].length;
        
        require(startIndex < endIndex, "No new rent to claim");
        
        uint256 totalUsdcToClaim = 0;
        
        for (uint256 i = startIndex; i < endIndex; i++) {
            RentPayment storage payment = rentPayments[_propertyToken][i];
            
            // Calculate the share based on token ownership at the time of rent payment
            uint256 share = (payment.amount * balance) / payment.totalSupplySnapshot;
            totalUsdcToClaim += share;
        }
        
        // Update the last claimed index
        holder.lastClaimedIndex = endIndex;
        
        // Transfer USDC if any
        if (totalUsdcToClaim > 0 && usdcToken != address(0)) {
            IERC20(usdcToken).transfer(msg.sender, totalUsdcToClaim);
        }
        
        emit RentClaimed(_propertyToken, msg.sender, totalUsdcToClaim);
    }
    
    // View function to check unclaimed rent amount
    function getUnclaimedRent(address _propertyToken, address _tokenHolder) external view returns (uint256 usdcAmount) {
        IERC20 token = IERC20(_propertyToken);
        uint256 balance = token.balanceOf(_tokenHolder);
        
        if (balance == 0) {
            return 0;
        }
        
        TokenHolder storage holder = tokenHolders[_propertyToken][_tokenHolder];
        uint256 startIndex = holder.lastClaimedIndex;
        uint256 endIndex = rentPayments[_propertyToken].length;
        
        if (startIndex >= endIndex) {
            return 0;
        }
        
        uint256 totalUsdcToClaim = 0;
        
        for (uint256 i = startIndex; i < endIndex; i++) {
            RentPayment storage payment = rentPayments[_propertyToken][i];
            
            // Calculate the share based on token ownership
            uint256 share = (payment.amount * balance) / payment.totalSupplySnapshot;
            totalUsdcToClaim += share;
        }
        
        return totalUsdcToClaim;
    }
}