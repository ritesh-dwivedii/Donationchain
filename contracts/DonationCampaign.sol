// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationCampaign {
    struct Campaign {
        string title;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        address creator;
        bool isActive;
    }

    Campaign[] public campaigns;
    
    event CampaignCreated(uint256 indexed campaignId, address indexed creator);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _targetAmount
    ) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        
        Campaign memory newCampaign = Campaign({
            title: _title,
            description: _description,
            targetAmount: _targetAmount,
            currentAmount: 0,
            creator: msg.sender,
            isActive: true
        });
        
        campaigns.push(newCampaign);
        emit CampaignCreated(campaigns.length - 1, msg.sender);
    }
    
    function donate(uint256 _campaignId) public payable {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        require(campaigns[_campaignId].isActive, "Campaign is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        Campaign storage campaign = campaigns[_campaignId];
        campaign.currentAmount += msg.value;
        
        if (campaign.currentAmount >= campaign.targetAmount) {
            campaign.isActive = false;
        }
        
        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }
    
    function getCampaignCount() public view returns (uint256) {
        return campaigns.length;
    }
    
    function getCampaignDetails(uint256 _campaignId) public view returns (
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 currentAmount,
        address creator,
        bool isActive
    ) {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        
        return (
            campaign.title,
            campaign.description,
            campaign.targetAmount,
            campaign.currentAmount,
            campaign.creator,
            campaign.isActive
        );
    }
    
    function withdraw(uint256 _campaignId) public {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only campaign creator can withdraw");
        require(!campaign.isActive || campaign.currentAmount >= campaign.targetAmount, "Campaign is still active");
        require(campaign.currentAmount > 0, "No funds to withdraw");
        
        uint256 amount = campaign.currentAmount;
        campaign.currentAmount = 0;
        
        (bool sent, ) = campaign.creator.call{value: amount}("");
        require(sent, "Failed to send funds");
    }
} 