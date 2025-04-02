import { Web3 } from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import dotenv from 'dotenv';

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const NETWORK = process.env.NETWORK || 'sepolia';

const web3 = new Web3(new Web3.providers.HttpProvider(
  `https://${NETWORK}.infura.io/v3/${INFURA_PROJECT_ID}`
));

// ABI for the donation contract
const donationABI: AbiItem[] = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const getDonationContract = (contractAddress: string): Contract<typeof donationABI> => {
  return new web3.eth.Contract(donationABI, contractAddress);
};

export const getBalance = async (contractAddress: string): Promise<string> => {
  const contract = getDonationContract(contractAddress);
  const balance = await contract.methods.getBalance().call() as string;
  return web3.utils.fromWei(balance, 'ether');
};

export const sendDonation = async (
  contractAddress: string,
  fromAddress: string,
  amount: string
) => {
  const contract = getDonationContract(contractAddress);
  const amountWei = web3.utils.toWei(amount, 'ether');
  
  return contract.methods.donate().send({
    from: fromAddress,
    value: amountWei,
    gas: '300000'
  });
};

export default web3; 