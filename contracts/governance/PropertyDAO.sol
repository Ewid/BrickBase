// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyDAO is Ownable {
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address targetContract;
        bytes functionCall;
        address propertyTokenAddress; // Address of the property token this proposal relates to
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool passed;
    }
    
    // Property token that determines voting power
    IERC20 public propertyToken;
    
    // Minimum ownership percentage required to create a proposal (in basis points, e.g., 500 = 5%)
    uint256 public proposalThreshold;
    
    // Voting duration in seconds
    uint256 public votingPeriod;
    
    // Execution delay after voting ends (in seconds)
    uint256 public executionDelay;
    
    // Proposals
    Proposal[] public proposals;
    
    // Mapping to track whether an address has voted on a specific proposal
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed propertyTokenAddress, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalThresholdUpdated(uint256 newThreshold);
    event VotingPeriodUpdated(uint256 newVotingPeriod);
    event ExecutionDelayUpdated(uint256 newExecutionDelay);
    
    constructor(
        address _propertyToken,
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        address initialOwner
    ) Ownable(initialOwner) {
        propertyToken = IERC20(_propertyToken);
        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
    }
    
    // Create a new proposal
    function createProposal(
        string memory _description,
        address _targetContract,
        bytes memory _functionCall,
        address _propertyTokenAddress // Address of the relevant property token
    ) external returns (uint256) {
        uint256 proposerBalance = propertyToken.balanceOf(msg.sender);
        uint256 totalSupply = propertyToken.totalSupply();
        
        // Check if proposer meets the threshold requirement
        require((proposerBalance * 10000) / totalSupply >= proposalThreshold, "Insufficient tokens to propose");
        // Check if the provided property token address is valid (optional, but good practice)
        require(_propertyTokenAddress != address(0), "Invalid property token address");
        
        uint256 proposalId = proposals.length;
        
        proposals.push(Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: _description,
            targetContract: _targetContract,
            functionCall: _functionCall,
            propertyTokenAddress: _propertyTokenAddress,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executed: false,
            passed: false
        }));
        
        emit ProposalCreated(proposalId, msg.sender, _propertyTokenAddress, _description);
        
        return proposalId;
    }
    
    // Cast a vote on a proposal
    function castVote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        
        uint256 votes = propertyToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");
        
        if (_support) {
            proposal.votesFor += votes;
        } else {
            proposal.votesAgainst += votes;
        }
        
        hasVoted[_proposalId][msg.sender] = true;
        
        emit Voted(_proposalId, msg.sender, _support, votes);
    }
    
    // Execute a passed proposal
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(!proposal.executed, "Already executed");
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(block.timestamp >= proposal.endTime + executionDelay, "Execution delay not met");
        
        // Check if the proposal passed
        if (proposal.votesFor > proposal.votesAgainst) {
            // Mark as passed and executed
            proposal.passed = true;
            proposal.executed = true;
            
            // Execute the function call
            (bool success, ) = proposal.targetContract.call(proposal.functionCall);
            require(success, "Proposal execution failed");
            
            emit ProposalExecuted(_proposalId);
        } else {
            // Mark as not passed but executed (in the sense that it's been processed)
            proposal.executed = true;
        }
    }
    
    // Update proposal threshold (only owner)
    function updateProposalThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold <= 10000, "Threshold too high"); // Max 100%
        proposalThreshold = _newThreshold;
        emit ProposalThresholdUpdated(_newThreshold);
    }
    
    // Update voting period (only owner)
    function updateVotingPeriod(uint256 _newVotingPeriod) external onlyOwner {
        votingPeriod = _newVotingPeriod;
        emit VotingPeriodUpdated(_newVotingPeriod);
    }
    
    // Update execution delay (only owner)
    function updateExecutionDelay(uint256 _newExecutionDelay) external onlyOwner {
        executionDelay = _newExecutionDelay;
        emit ExecutionDelayUpdated(_newExecutionDelay);
    }
    
    // Get all proposals
    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
    
    // Get proposal state
    function getProposalState(uint256 _proposalId) external view returns (string memory) {
        Proposal storage proposal = proposals[_proposalId];
        
        if (proposal.executed) {
            if (proposal.passed) {
                return "Executed";
            } else {
                return "Rejected";
            }
        } else if (block.timestamp < proposal.endTime) {
            return "Active";
        } else if (block.timestamp < proposal.endTime + executionDelay) {
            return "Pending";
        } else {
            if (proposal.votesFor > proposal.votesAgainst) {
                return "Ready";
            } else {
                return "Defeated";
            }
        }
    }
}