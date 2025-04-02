const DonationCampaign = artifacts.require("DonationCampaign");

module.exports = function(deployer) {
  // Deploy with a target amount of 1 ETH (1000000000000000000 wei)
  deployer.deploy(DonationCampaign, '1000000000000000000');
}; 