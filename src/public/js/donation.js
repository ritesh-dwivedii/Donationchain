const contractABI = [
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
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "campaignId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_targetAmount",
        "type": "uint256"
      }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_campaignId",
        "type": "uint256"
      }
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCampaignCount",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_campaignId",
        "type": "uint256"
      }
    ],
    "name": "getCampaignDetails",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentAmount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = '0xc70a7B83D7B90AFEd24aFb03830AcD88114fbc8a';
let web3;
let contract;
let userAccount;

async function init() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError) {
          console.error('Failed to switch to Sepolia network:', switchError);
          document.getElementById('wallet-status').textContent = 'Please switch to Sepolia network';
          return;
        }
      }
      
      web3 = new Web3(window.ethereum);
      contract = new web3.eth.Contract(contractABI, contractAddress);
      
      const accounts = await web3.eth.getAccounts();
      userAccount = accounts[0];
      
      document.getElementById('wallet-status').textContent = `Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
      
      await loadCampaigns();
      
      window.ethereum.on('accountsChanged', function (accounts) {
        userAccount = accounts[0];
        document.getElementById('wallet-status').textContent = `Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        loadCampaigns();
      });

      window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
      });
    } catch (error) {
      console.error('User denied account access or other error:', error);
      document.getElementById('wallet-status').textContent = 'Connection failed';
    }
  } else {
    console.log('Please install MetaMask!');
    document.getElementById('wallet-status').textContent = 'Please install MetaMask';
  }
}

async function loadCampaigns() {
  try {
    const campaignCount = await contract.methods.getCampaignCount().call();
    const campaignsList = document.getElementById('campaigns-list');
    const campaignSelect = document.getElementById('campaign-select');
    
    // Clear existing content
    campaignsList.innerHTML = '';
    campaignSelect.innerHTML = '<option value="">Select a campaign</option>';
    
    for (let i = 0; i < campaignCount; i++) {
      const campaign = await contract.methods.getCampaignDetails(i).call();
      
      if (campaign.isActive) {
        // Add to campaigns list
        const campaignElement = createCampaignElement(i, campaign);
        campaignsList.appendChild(campaignElement);
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = i;
        option.textContent = campaign.title;
        campaignSelect.appendChild(option);
      }
    }
  } catch (error) {
    console.error('Error loading campaigns:', error);
  }
}

function createCampaignElement(id, campaign) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 campaign-card';
  
  let progress = 0;
  try {
    const currentAmountBN = BigInt(campaign.currentAmount.toString());
    const targetAmountBN = BigInt(campaign.targetAmount.toString());
    if (targetAmountBN > BigInt(0)) {
      // Convert to number after BigInt calculation
      progress = Number((currentAmountBN * BigInt(100)) / targetAmountBN);
    }
  } catch (error) {
    console.error('Error calculating progress:', error);
  }
  
  const currentAmount = web3.utils.fromWei(campaign.currentAmount.toString(), 'ether');
  const targetAmount = web3.utils.fromWei(campaign.targetAmount.toString(), 'ether');
  
  div.innerHTML = `
    <div class="flex flex-col h-full">
      <div class="flex-grow">
        <h3 class="text-xl font-bold text-gray-900 mb-2">${campaign.title}</h3>
        <p class="text-gray-600 mb-4">${campaign.description}</p>
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-500">Progress</span>
            <span class="text-sm font-medium text-gray-900">${Math.round(progress)}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.round(progress))}%"></div>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-sm text-gray-500">Current</span>
            <span class="text-sm font-medium text-gray-900">${currentAmount} ETH</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-sm text-gray-500">Target</span>
            <span class="text-sm font-medium text-gray-900">${targetAmount} ETH</span>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">${campaign.creator.substring(2, 4)}</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">Created by</p>
              <p class="text-sm text-gray-500">${campaign.creator.substring(0, 6)}...${campaign.creator.substring(38)}</p>
            </div>
          </div>
          <button onclick="selectCampaignForDonation(${id})" 
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Donate
          </button>
        </div>
      </div>
    </div>
  `;
  
  return div;
}

function selectCampaignForDonation(campaignId) {
  document.getElementById('campaign-select').value = campaignId;
  document.getElementById('donation-amount').focus();
  // Smooth scroll to donation section
  const donationSection = document.getElementById('campaign-select').closest('.bg-white');
  donationSection.scrollIntoView({ behavior: 'smooth' });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  // Set message and icon
  toastMessage.textContent = message;
  const icon = toast.querySelector('svg');
  if (type === 'success') {
    icon.classList.remove('text-red-400');
    icon.classList.add('text-green-400');
  } else {
    icon.classList.remove('text-green-400');
    icon.classList.add('text-red-400');
  }
  
  // Show toast
  toast.classList.remove('translate-y-full');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-full');
  }, 3000);
}

async function createCampaign() {
  const title = document.getElementById('campaign-title').value;
  const description = document.getElementById('campaign-description').value;
  const targetAmount = document.getElementById('campaign-target').value;
  
  if (!title || !description || !targetAmount) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (title.trim().length === 0 || description.trim().length === 0) {
    showToast('Title and description cannot be empty', 'error');
    return;
  }

  if (parseFloat(targetAmount) <= 0) {
    showToast('Target amount must be greater than 0', 'error');
    return;
  }
  
  try {
    const createButton = document.querySelector('button[onclick="createCampaign()"]');
    createButton.textContent = 'Creating...';
    createButton.disabled = true;
    createButton.classList.add('loading');

    const targetAmountWei = web3.utils.toWei(targetAmount.toString(), 'ether');
    
    try {
      await contract.methods.getCampaignCount().call();
    } catch (error) {
      throw new Error('Cannot access the contract. Please make sure you are connected to the correct network.');
    }
    
    let gasEstimate;
    try {
      gasEstimate = await contract.methods.createCampaign(title, description, targetAmountWei)
        .estimateGas({ 
          from: userAccount,
          value: '0'
        });
    } catch (error) {
      if (error.message.includes('revert')) {
        throw new Error('Campaign creation was rejected. Please check your inputs.');
      }
      throw error;
    }
    
    // Convert gasEstimate to string before calculations
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2).toString();
    
    const receipt = await contract.methods.createCampaign(title, description, targetAmountWei)
      .send({
        from: userAccount,
        gas: gasLimit,
        value: '0'
      });
    
    console.log('Transaction receipt:', receipt);
    showToast('Campaign created successfully!');
    await loadCampaigns();
    
    document.getElementById('campaign-title').value = '';
    document.getElementById('campaign-description').value = '';
    document.getElementById('campaign-target').value = '';
  } catch (error) {
    console.error('Error creating campaign:', error);
    if (error.message.includes('gas')) {
      showToast('Transaction failed: Gas estimation failed', 'error');
    } else if (error.message.includes('insufficient funds')) {
      showToast('Transaction failed: Insufficient funds for gas', 'error');
    } else if (error.message.includes('User denied')) {
      showToast('Transaction cancelled by user', 'error');
    } else if (error.message.includes('revert')) {
      showToast('Transaction reverted by the contract', 'error');
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    const createButton = document.querySelector('button[onclick="createCampaign()"]');
    createButton.textContent = 'Create Campaign';
    createButton.disabled = false;
    createButton.classList.remove('loading');
  }
}

async function donate() {
  const campaignId = document.getElementById('campaign-select').value;
  const amount = document.getElementById('donation-amount').value;
  
  if (!campaignId || !amount || amount <= 0) {
    showToast('Please select a campaign and enter a valid amount', 'error');
    return;
  }
  
  try {
    const donateButton = document.querySelector('button[onclick="donate()"]');
    donateButton.textContent = 'Processing...';
    donateButton.disabled = true;
    donateButton.classList.add('loading');

    const amountWei = web3.utils.toWei(amount.toString(), 'ether');
    
    const gasEstimate = await contract.methods.donate(campaignId)
      .estimateGas({ 
        from: userAccount,
        value: amountWei.toString()
      });
    
    const gasLimit = Math.round(gasEstimate * 1.2);
    
    await contract.methods.donate(campaignId).send({
      from: userAccount,
      value: amountWei.toString(),
      gas: gasLimit
    });
    
    showToast('Donation successful!');
    await loadCampaigns();
    document.getElementById('donation-amount').value = '';
  } catch (error) {
    console.error('Error donating:', error);
    if (error.message.includes('gas')) {
      showToast('Transaction failed: Gas estimation failed', 'error');
    } else if (error.message.includes('insufficient funds')) {
      showToast('Transaction failed: Insufficient funds', 'error');
    } else {
      showToast('Error processing donation: ' + error.message, 'error');
    }
  } finally {
    const donateButton = document.querySelector('button[onclick="donate()"]');
    donateButton.textContent = 'Make Donation';
    donateButton.disabled = false;
    donateButton.classList.remove('loading');
  }
}

window.addEventListener('load', init); 