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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_campaignId",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const contractAddress = '0xc70a7B83D7B90AFEd24aFb03830AcD88114fbc8a';
let web3;
let contract;
let userAccount;
let campaigns = [];
let sortOrder = 'newest';
let filterStatus = 'all';
let myDonations = [];
const DONATION_HISTORY_KEY = 'donationHistory';
let donationHistory = [];

// Random campaign images (add this at the top with other constants)
const campaignImages = [
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d',
    'https://images.unsplash.com/photo-1526817575615-3685e135615d',
    'https://images.unsplash.com/photo-1507427100689-2bf8574e32d4',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
    'https://images.unsplash.com/photo-1535890696255-dd5bcd79e6df',
];

// Add DOMContentLoaded event listener at the top
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
    initializeRecentDonations();
  } catch (error) {
    console.error('Error during initialization:', error);
    showToast('Failed to initialize the application. Please refresh the page.', 'error');
  }
});

async function init() {
  if (typeof window.ethereum === 'undefined') {
    showToast('Please install MetaMask to use this application', 'error');
    return;
  }

  try {
    // Initialize Web3
    web3 = new Web3(window.ethereum);
    
    // Initialize contract
    contract = new web3.eth.Contract(contractABI, contractAddress);
    
    // Check if already connected
    const accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
      await handleAccountsChanged(accounts);
    }

    // Setup event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());
    
    // Initialize network status
    await updateNetworkStatus();
    
    // Load initial campaigns
    await loadCampaigns();
    
  } catch (error) {
    console.error('Error initializing:', error);
    throw error;
  }
}

async function updateNetworkStatus() {
  const networkStatus = document.getElementById('network-status');
  const indicator = networkStatus.querySelector('span:first-child');
  const networkName = networkStatus.querySelector('.network-name');
  
  try {
    const chainId = await web3.eth.getChainId();
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet'
    };
    
    networkName.textContent = networks[chainId] || `Chain ID: ${chainId}`;
    indicator.style.backgroundColor = '#10b981'; // green
    networkStatus.classList.remove('hidden');
  } catch (error) {
    indicator.style.backgroundColor = '#ef4444'; // red
    networkName.textContent = 'Network Error';
    networkStatus.classList.remove('hidden');
  }
}

async function updateWalletStatus() {
  const accounts = await web3.eth.getAccounts();
  handleAccountsChanged(accounts);
}

async function handleAccountsChanged(accounts) {
  const walletStatus = document.getElementById('wallet-status');
  const walletBalance = document.getElementById('wallet-balance');
  
  if (!walletStatus || !walletBalance) {
    console.error('Wallet elements not found in DOM');
    return;
  }

  if (accounts.length === 0) {
    // No accounts found or user disconnected
    userAccount = null;
    walletStatus.textContent = 'Connect Wallet';
    walletStatus.classList.add('wallet-disconnected');
    walletBalance.classList.add('hidden');
    return;
  }

  userAccount = accounts[0];
  walletStatus.textContent = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
  walletStatus.classList.remove('wallet-disconnected');
  
  try {
    const balance = await web3.eth.getBalance(userAccount);
    const ethBalance = web3.utils.fromWei(balance, 'ether');
    walletBalance.textContent = `${Number(ethBalance).toFixed(4)} ETH`;
    walletBalance.classList.remove('hidden');
  } catch (error) {
    console.error('Error fetching balance:', error);
    walletBalance.classList.add('hidden');
  }

  // Load campaigns after wallet connection
  await loadCampaigns();
}

async function connectWallet() {
  try {
    await ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    showToast('Failed to connect wallet: ' + error.message, 'error');
  }
}

function showTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function hideTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function hideToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('translate-y-full');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const icon = toast.querySelector('svg');
  
  toastMessage.textContent = message;
  
  if (type === 'success') {
    icon.classList.remove('text-red-400');
    icon.classList.add('text-green-400');
  } else {
    icon.classList.remove('text-green-400');
    icon.classList.add('text-red-400');
  }
  
  toast.classList.remove('translate-y-full');
  
  // Hide toast after 5 seconds
  setTimeout(hideToast, 5000);
}

function updateCampaignSelect(campaigns) {
    const campaignSelect = document.getElementById('campaign-select');
    if (!campaignSelect) return;

    // Clear existing options
    campaignSelect.innerHTML = '<option value="">Select a campaign</option>';

    // Filter active campaigns that haven't reached their target
    const activeCampaigns = campaigns.filter(campaign => 
        !campaign.isWithdrawn && 
        campaign.isActive && 
        Number(campaign.currentAmount) < Number(campaign.targetAmount)
    );

    // Add filtered campaigns to select dropdown
    activeCampaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign.id;
        option.textContent = `${campaign.title} (${web3.utils.fromWei(campaign.currentAmount, 'ether')}/${web3.utils.fromWei(campaign.targetAmount, 'ether')} ETH)`;
        campaignSelect.appendChild(option);
    });
}

async function loadCampaigns() {
    try {
        if (!contract) {
            console.warn('Contract not initialized');
            return;
        }

        const campaignCount = await contract.methods.getCampaignCount().call();
        const campaignPromises = [];

        for (let i = 0; i < campaignCount; i++) {
            campaignPromises.push(contract.methods.getCampaignDetails(i).call());
        }

        const campaignDetails = await Promise.all(campaignPromises);
        campaigns = campaignDetails.map((details, index) => ({
            id: index,
            title: details.title,
            description: details.description,
            targetAmount: details.targetAmount,
            currentAmount: details.currentAmount,
            creator: details.creator,
            isActive: details.isActive,
            progress: (Number(details.currentAmount) / Number(details.targetAmount)) * 100,
            isWithdrawn: !details.isActive && Number(details.currentAmount) === 0 && Number(details.targetAmount) > 0
        }));

        // Update stats after loading campaigns
        updateStats();

        // Display campaigns directly
        displayCampaigns(campaigns);
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showToast(error.message || 'Error loading campaigns', 'error');
    }
}

function calculateProgress(current, target) {
  const currentBN = BigInt(current.toString());
  const targetBN = BigInt(target.toString());
  return targetBN > 0n ? Number((currentBN * 100n) / targetBN) : 0;
}

async function sortCampaigns(campaigns, sortBy = 'newest') {
    if (!campaigns || !Array.isArray(campaigns)) return [];

    const sortedCampaigns = [...campaigns];
    
    switch (sortBy) {
        case 'target':
            sortedCampaigns.sort((a, b) => {
                const targetA = BigInt(a.targetAmount || 0);
                const targetB = BigInt(b.targetAmount || 0);
                return targetA > targetB ? -1 : targetA < targetB ? 1 : 0;
            });
            break;
        case 'progress':
            sortedCampaigns.sort((a, b) => {
                const progressA = (Number(a.currentAmount) / Number(a.targetAmount)) * 100;
                const progressB = (Number(b.currentAmount) / Number(b.targetAmount)) * 100;
                return progressB - progressA;
            });
            break;
        case 'oldest':
            sortedCampaigns.sort((a, b) => a.id - b.id);
            break;
        case 'newest':
        default:
            sortedCampaigns.sort((a, b) => b.id - a.id);
            break;
    }

    return sortedCampaigns;
}

function filterCampaigns() {
    const filterSelect = document.getElementById('campaign-status');
    const sortSelect = document.getElementById('campaign-sort');
    
    if (!filterSelect || !sortSelect) return;
    
    const filterStatus = filterSelect.value;
    const sortOrder = sortSelect.value;
    
    let filteredCampaigns = [...campaigns];
    
    // Apply status filter
    switch (filterStatus) {
        case 'active':
            filteredCampaigns = campaigns.filter(c => c.isActive && !c.isWithdrawn);
            break;
        case 'completed':
            filteredCampaigns = campaigns.filter(c => !c.isActive && !c.isWithdrawn);
            break;
        case 'withdrawn':
            filteredCampaigns = campaigns.filter(c => c.isWithdrawn);
            break;
        // 'all' case - no filtering needed
    }
    
    // Apply sorting
    sortCampaigns(filteredCampaigns, sortOrder).then(sortedCampaigns => {
        displayCampaigns(sortedCampaigns);
        updateCampaignSelect(sortedCampaigns);
    });
}

async function renderCampaigns(filteredCampaigns) {
    const campaignsList = document.getElementById('campaigns-list');
    if (!campaignsList) return;
    
    campaignsList.innerHTML = '';
    
    if (!filteredCampaigns || filteredCampaigns.length === 0) {
        campaignsList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">No campaigns found</p>
                <p class="text-sm text-gray-400 mt-2">Create a new campaign to get started!</p>
            </div>
        `;
        return;
    }

    // Only create sections based on the current filter
    if (filterStatus === 'all') {
        // Separate campaigns by status
        const activeCampaigns = filteredCampaigns.filter(c => c.isActive && !c.isWithdrawn);
        const completedCampaigns = filteredCampaigns.filter(c => !c.isActive && !c.isWithdrawn);
        const withdrawnCampaigns = filteredCampaigns.filter(c => c.isWithdrawn);

        // Create container for all sections
        campaignsList.innerHTML = '<div class="campaigns-container">';
        
        // Add active campaigns section
        if (activeCampaigns.length > 0) {
            campaignsList.innerHTML += `
                <section class="campaign-section">
                    <h2 class="section-title">Active Campaigns</h2>
                    <div class="campaign-grid" id="active-campaigns-grid"></div>
                </section>
            `;
        }
        
        // Add completed campaigns section
        if (completedCampaigns.length > 0) {
            campaignsList.innerHTML += `
                <section class="campaign-section">
                    <h2 class="section-title">Completed Campaigns</h2>
                    <div class="campaign-grid" id="completed-campaigns-grid"></div>
                </section>
            `;
        }
        
        // Add withdrawn campaigns section
        if (withdrawnCampaigns.length > 0) {
            campaignsList.innerHTML += `
                <section class="campaign-section">
                    <h2 class="section-title">Withdrawn Campaigns</h2>
                    <div class="campaign-grid" id="withdrawn-campaigns-grid"></div>
                </section>
            `;
        }

        // Close the container
        campaignsList.innerHTML += '</div>';

        // Add campaigns to their respective sections
        if (activeCampaigns.length > 0) {
            const activeGrid = document.getElementById('active-campaigns-grid');
            for (const campaign of activeCampaigns) {
                const element = await createCampaignElement(campaign);
                if (element) activeGrid.appendChild(element);
            }
        }

        if (completedCampaigns.length > 0) {
            const completedGrid = document.getElementById('completed-campaigns-grid');
            for (const campaign of completedCampaigns) {
                const element = await createCampaignElement(campaign);
                if (element) completedGrid.appendChild(element);
            }
        }

        if (withdrawnCampaigns.length > 0) {
            const withdrawnGrid = document.getElementById('withdrawn-campaigns-grid');
            for (const campaign of withdrawnCampaigns) {
                const element = await createCampaignElement(campaign);
                if (element) withdrawnGrid.appendChild(element);
            }
        }
    } else {
        // For filtered views, show a single grid
        campaignsList.innerHTML = `
            <div class="campaigns-container">
                <section class="campaign-section">
                    <h2 class="section-title">${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Campaigns</h2>
                    <div class="campaign-grid" id="filtered-campaigns-grid"></div>
                </section>
            </div>
        `;

        const grid = document.getElementById('filtered-campaigns-grid');
        for (const campaign of filteredCampaigns) {
            const element = await createCampaignElement(campaign);
            if (element) grid.appendChild(element);
        }
    }

    // Update campaign select dropdown
    updateCampaignSelect(filteredCampaigns.filter(c => c.isActive && !c.isWithdrawn));
}

function updateStats() {
    const totalCampaignsElement = document.getElementById('total-campaigns');
    const totalDonationsElement = document.getElementById('total-donations');
    const activeCampaignsElement = document.getElementById('active-campaigns');
    
    if (!totalCampaignsElement || !totalDonationsElement || !activeCampaignsElement) {
        console.warn('Stats elements not found');
        return;
    }
    
    let totalDonationAmount = BigInt(0);
    let activeCount = 0;
    
    campaigns.forEach(campaign => {
        if (campaign.currentAmount) {
            totalDonationAmount += BigInt(campaign.currentAmount);
        }
        if (campaign.isActive && !campaign.isWithdrawn) {
            activeCount++;
        }
    });
    
    totalCampaignsElement.textContent = campaigns.length;
    totalDonationsElement.textContent = `${web3.utils.fromWei(totalDonationAmount.toString(), 'ether')} ETH`;
    activeCampaignsElement.textContent = activeCount;
}

function displayCampaigns(campaigns) {
    const activeCampaignsList = document.getElementById('active-campaigns-list');
    const withdrawnCampaignsList = document.getElementById('campaigns-list');
    
    if (!activeCampaignsList || !withdrawnCampaignsList) {
        console.error('Campaign list elements not found');
        return;
    }
    
    // Clear existing campaigns
    activeCampaignsList.innerHTML = '';
    withdrawnCampaignsList.innerHTML = '';
    
    // Separate campaigns into active and withdrawn
    const activeCampaigns = campaigns.filter(campaign => !campaign.isWithdrawn);
    const withdrawnCampaigns = campaigns.filter(campaign => campaign.isWithdrawn);
    
    // Display active campaigns
    activeCampaigns.forEach(async campaign => {
        try {
            const campaignElement = await createCampaignElement(campaign);
            if (campaignElement) {
                activeCampaignsList.appendChild(campaignElement);
            }
        } catch (error) {
            console.error('Error creating campaign element:', error);
        }
    });

    // Display withdrawn campaigns
    withdrawnCampaigns.forEach(async campaign => {
        try {
            const campaignElement = await createCampaignElement(campaign);
            if (campaignElement) {
                withdrawnCampaignsList.appendChild(campaignElement);
            }
        } catch (error) {
            console.error('Error creating campaign element:', error);
        }
    });

    // Show/hide empty state messages
    if (activeCampaigns.length === 0) {
        activeCampaignsList.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <p class="text-gray-500">No active campaigns</p>
                <p class="text-sm text-gray-400 mt-2">Create a new campaign to get started!</p>
            </div>`;
    }

    if (withdrawnCampaigns.length === 0) {
        withdrawnCampaignsList.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <p class="text-gray-500">No withdrawn campaigns</p>
            </div>`;
    }

    // Update campaign select dropdown
    updateCampaignSelect(campaigns);
}

async function createCampaignElement(campaign) {
    const div = document.createElement('div');
    div.className = `campaign-card ${campaign.isWithdrawn ? 'withdrawn' : campaign.progress >= 100 ? 'completed' : ''}`;
    
    const currentAmount = web3.utils.fromWei(campaign.currentAmount.toString(), 'ether');
    const targetAmount = web3.utils.fromWei(campaign.targetAmount.toString(), 'ether');
    const progress = campaign.progress;
    const isCompleted = progress >= 100;
    
    // Get a random image URL
    const imageUrl = campaignImages[Math.floor(Math.random() * campaignImages.length)];
    
    // Add withdraw button for campaign creator
    const accounts = await web3.eth.getAccounts();
    const isCreator = accounts[0] && accounts[0].toLowerCase() === campaign.creator.toLowerCase();
    const canWithdraw = isCreator && isCompleted && !campaign.isWithdrawn;
    
    const withdrawButton = canWithdraw ? `
        <button onclick="withdrawFunds(${campaign.id})" 
                class="mt-4 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            Withdraw Funds
        </button>
    ` : '';
    
    const statusBadge = campaign.isWithdrawn ? `
        <div class="absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-500 text-white shadow-lg">
            Withdrawn
        </div>
    ` : isCompleted ? `
        <div class="absolute top-3 right-3 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-500 text-white shadow-lg">
            Completed
        </div>
    ` : '';

    div.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}?auto=format&fit=crop&w=800&q=80" alt="Campaign image" class="campaign-image">
            ${statusBadge}
        </div>
        <div class="campaign-content">
            <div class="flex items-start justify-between mb-3">
                <h3 class="font-bold text-gray-900 text-lg leading-tight truncate flex-1 mr-2">${campaign.title}</h3>
            </div>
            
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">${campaign.description}</p>
            
            <div class="mb-4">
                <div class="flex justify-between items-center text-sm mb-2">
                    <span class="font-semibold text-gray-900">${Math.round(progress)}% Funded</span>
                    <span class="text-gray-600">${Number(currentAmount).toFixed(2)}/${Number(targetAmount).toFixed(2)} ETH</span>
                </div>
                <div class="campaign-progress-bar">
                    <div class="campaign-progress-bar-fill" style="width: ${Math.min(100, Math.round(progress))}%"></div>
                </div>
            </div>
            
            <div class="mt-auto">
                <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            ${campaign.creator.substring(2, 4)}
                        </div>
                        <div class="ml-2">
                            <p class="text-xs text-gray-500">Created by</p>
                            <p class="text-sm font-medium text-gray-700">${campaign.creator.substring(0, 6)}...${campaign.creator.substring(38)}</p>
                        </div>
                    </div>
                    ${!isCompleted && !campaign.isWithdrawn ? `
                        <button onclick="selectCampaignForDonation(${campaign.id})" 
                            class="px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg">
                            Donate Now
                        </button>
                    ` : ''}
                </div>
                ${withdrawButton}
            </div>
        </div>
    `;
    
    return div;
}

function toggleDonationForm() {
  const container = document.querySelector('.donation-form-container');
  const isCollapsed = container.classList.toggle('collapsed');
  
  // Update the arrow icon direction
  const arrow = container.querySelector('.collapse-button svg');
  if (arrow) {
    arrow.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
  }
  
  // If expanding on mobile, scroll to the form
  if (!isCollapsed && window.innerWidth < 1024) {
    container.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

// Add this function to handle resize events
window.addEventListener('resize', () => {
  const container = document.querySelector('.donation-form-container');
  if (window.innerWidth >= 1024) {
    container.classList.remove('collapsed');
    const arrow = container.querySelector('.collapse-button svg');
    if (arrow) {
      arrow.style.transform = 'rotate(0deg)';
    }
  }
});

function selectCampaignForDonation(campaignId) {
  document.getElementById('campaign-select').value = campaignId;
  document.getElementById('donation-amount').focus();
  
  // Show donation form if it's collapsed
  const container = document.querySelector('.donation-form-container');
  if (container.classList.contains('collapsed')) {
    container.classList.remove('collapsed');
  }
  
  // Smooth scroll to donation form
  if (window.innerWidth < 1024) {
    container.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

function showCreateCampaignModal() {
  if (!userAccount) {
    showToast('Please connect your wallet first', 'error');
    return;
  }
  const modal = document.getElementById('create-campaign-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideCreateCampaignModal() {
  const modal = document.getElementById('create-campaign-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  // Reset form
  document.getElementById('campaign-form').reset();
}

async function createCampaign(event) {
  event.preventDefault();
  
  if (!userAccount) {
    showToast('Please connect your wallet first', 'error');
    return;
  }
  
  const title = document.getElementById('campaign-title').value;
  const description = document.getElementById('campaign-description').value;
  const targetAmount = document.getElementById('campaign-target').value;
  
  try {
    showTransactionModal();
    
    const targetAmountWei = web3.utils.toWei(targetAmount.toString(), 'ether');
    const gasEstimate = await contract.methods.createCampaign(title, description, targetAmountWei)
      .estimateGas({ from: userAccount });
    
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2).toString();
    
    await contract.methods.createCampaign(title, description, targetAmountWei)
      .send({
        from: userAccount,
        gas: gasLimit
      });
    
    showToast('Campaign created successfully!');
    hideCreateCampaignModal();
    
    // Reload campaigns
    await loadCampaigns();
  } catch (error) {
    console.error('Error creating campaign:', error);
    showToast(error.message, 'error');
  } finally {
    hideTransactionModal();
  }
}

async function donate(event) {
  event.preventDefault();
  
  if (!userAccount) {
    showToast('Please connect your wallet first', 'error');
    return;
  }
  
  const campaignId = document.getElementById('campaign-select').value;
  const amount = document.getElementById('donation-amount').value;
  const message = document.getElementById('donation-message').value;
  
  if (!campaignId) {
    showToast('Please select a campaign', 'error');
    return;
  }
  
  try {
    showTransactionModal();
    
    const amountWei = web3.utils.toWei(amount.toString(), 'ether');
    const gasEstimate = await contract.methods.donate(campaignId)
      .estimateGas({ 
        from: userAccount,
        value: amountWei.toString()
      });
    
    const gasLimit = Math.ceil(Number(gasEstimate) * 1.2).toString();
    
    const receipt = await contract.methods.donate(campaignId)
      .send({
        from: userAccount,
        value: amountWei.toString(),
        gas: gasLimit
      });
    
    // Add to recent donations
    addRecentDonation({
      campaignId,
      amount: amountWei,
      donor: userAccount,
      message,
      timestamp: Date.now()
    });
    
    showToast('Donation successful!');
    
    // Reset form
    event.target.reset();
    
    // Reload campaigns
    await loadCampaigns();
  } catch (error) {
    console.error('Error donating:', error);
    showToast(error.message, 'error');
  } finally {
    hideTransactionModal();
  }
}

function renderRecentDonations(donations) {
    const recentDonationsElement = document.getElementById('recent-donations');
    if (!recentDonationsElement) {
        console.warn('Recent donations element not found');
        return;
    }

    if (!donations || !donations.length) {
        recentDonationsElement.innerHTML = '<p class="text-gray-500 text-sm">No donations yet</p>';
        return;
    }

    const donationsList = donations.map(donation => `
        <div class="bg-white/50 rounded-lg p-3 border border-gray-100">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm font-medium text-gray-900">${formatAddress(donation.donor)}</p>
                    <p class="text-xs text-gray-500">${donation.message || 'No message'}</p>
                </div>
                <span class="text-sm font-medium text-gray-900">${web3.utils.fromWei(donation.amount, 'ether')} ETH</span>
            </div>
        </div>
    `).join('');

    recentDonationsElement.innerHTML = donationsList;
}

function addRecentDonation(donation) {
    try {
        const recentDonations = JSON.parse(localStorage.getItem('recentDonations') || '[]');
        recentDonations.unshift(donation);
        // Keep only the last 5 donations
        const limitedDonations = recentDonations.slice(0, 5);
        localStorage.setItem('recentDonations', JSON.stringify(limitedDonations));
        renderRecentDonations(limitedDonations);
    } catch (error) {
        console.error('Error adding recent donation:', error);
    }
}

// Add this to your init function or DOMContentLoaded event handler
function initializeRecentDonations() {
    try {
        const recentDonations = JSON.parse(localStorage.getItem('recentDonations') || '[]');
        renderRecentDonations(recentDonations);
    } catch (error) {
        console.error('Error initializing recent donations:', error);
        localStorage.removeItem('recentDonations'); // Reset if corrupted
    }
}

async function disconnectWallet() {
  userAccount = null;
  handleAccountsChanged([]);
  showToast('Wallet disconnected');
}

function filterCampaigns() {
  const filterSelect = document.getElementById('campaign-status');
  filterStatus = filterSelect.value;
  renderCampaigns();
}

async function showMyCampaigns() {
  if (!userAccount) {
    showToast('Please connect your wallet first', 'error');
    return;
  }
  
  const filterSelect = document.getElementById('campaign-status');
  filterSelect.value = 'all';
  filterStatus = 'all';
  
  // Filter campaigns to show only user's campaigns
  const userCampaigns = campaigns.filter(campaign => 
    campaign.creator.toLowerCase() === userAccount.toLowerCase()
  );
  
  if (userCampaigns.length === 0) {
    showToast('You haven\'t created any campaigns yet');
  }
  
  renderCampaigns(userCampaigns);
}

async function showMyDonations() {
  if (!userAccount) {
    showToast('Please connect your wallet first', 'error');
    return;
  }
  
  const recentDonations = document.getElementById('recent-donations');
  
  // Filter donations for current user
  const userDonations = donationHistory.filter(
    donation => donation.donor.toLowerCase() === userAccount.toLowerCase()
  );
  
  if (userDonations.length === 0) {
    showToast('You haven\'t made any donations yet');
  }
  
  // Render only user's donations
  recentDonations.innerHTML = '';
  userDonations.forEach(donation => {
    const donationElement = createDonationElement(donation);
    recentDonations.appendChild(donationElement);
  });
  
  recentDonations.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function withdrawFunds(campaignId) {
    try {
        if (!web3 || !contract) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        const accounts = await web3.eth.getAccounts();
        if (!accounts || accounts.length === 0) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            showToast('Campaign not found', 'error');
            return;
        }

        if (campaign.creator.toLowerCase() !== accounts[0].toLowerCase()) {
            showToast('Only the campaign creator can withdraw funds', 'error');
            return;
        }

        if (campaign.isWithdrawn) {
            showToast('Funds have already been withdrawn', 'error');
            return;
        }

        if (campaign.progress < 100) {
            showToast('Campaign has not reached its target amount', 'error');
            return;
        }

        showTransactionModal();
        showToast('Processing withdrawal...', 'info');
        
        await contract.methods.withdraw(campaignId)
            .send({ from: accounts[0] });
            
        showToast('Funds withdrawn successfully!', 'success');
        
        // Update the campaign's status locally
        campaign.isWithdrawn = true;
        campaign.currentAmount = '0';
        
        await loadCampaigns(); // Refresh the campaign list
    } catch (error) {
        console.error('Error withdrawing funds:', error);
        showToast(error.message || 'Error withdrawing funds', 'error');
    } finally {
        hideTransactionModal();
    }
}

// Add event listeners for filter and sort changes
document.addEventListener('DOMContentLoaded', () => {
    const filterSelect = document.getElementById('campaign-status');
    const sortSelect = document.getElementById('campaign-sort');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterCampaigns);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterCampaigns);
    }
}); 