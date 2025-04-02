const { Web3 } = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const DonationCampaign = require('../build/contracts/DonationCampaign.json');

async function testDonation() {
  try {
    // Setup provider and web3
    const provider = new HDWalletProvider({
      privateKeys: [process.env.PRIVATE_KEY],
      providerOrUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    });
    
    const web3 = new Web3(provider);
    
    // Get the contract instance
    const contract = new web3.eth.Contract(
      DonationCampaign.abi,
      process.env.CONTRACT_ADDRESS
    );

    // Get the account address
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    console.log('Sending donation from:', sender);
    
    // Check initial balance
    const initialBalance = await contract.methods.getBalance().call();
    console.log('Initial contract balance:', web3.utils.fromWei(initialBalance, 'ether'), 'ETH');

    // Send donation (0.1 ETH)
    const donationAmount = web3.utils.toWei('0.1', 'ether');
    console.log('Sending donation of 0.1 ETH...');
    
    const tx = await contract.methods.donate().send({
      from: sender,
      value: donationAmount,
      gas: 200000
    });

    console.log('Donation transaction hash:', tx.transactionHash);

    // Check new balance
    const newBalance = await contract.methods.getBalance().call();
    console.log('New contract balance:', web3.utils.fromWei(newBalance, 'ether'), 'ETH');

    // Cleanup
    provider.engine.stop();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDonation(); 