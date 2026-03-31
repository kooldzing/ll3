// metamask.js - ОНОВЛЕНІ ФУНКЦІЇ КОНТРАКТІВ З НОВИМ UI + MULTIWALLET ПІДТРИМКА

// НОВИЙ: Ініціалізація при завантаженні сторінки
function initializeWalletDetection() {
    // Додаємо невелику затримку для повного завантаження гаманців
    setTimeout(() => {
        // Детектуємо доступні гаманці одразу при завантаженні
        const wallets = detectWallets();
        
        
        if (wallets.length > 0) {
            // Встановлюємо перший знайдений гаманець як поточний для відображення
            currentWallet = wallets[0];
        }
        
        // Оновлюємо текст в environment select
        updateEnvironmentSelectText();
    }, 500); // 500ms затримка для повного завантаження extension
}

// Глобальні змінні для Web3
let web3;
let userAccount;
let currentNetworkId = null;
let deployedContracts = [];
let currentWallet = null; // Додано для відстеження поточного гаманця

// Детекція доступних гаманців
function detectWallets() {
    const wallets = [];
    
    if (!window.ethereum) {
        return wallets;
    }
    
    // Спершу перевіряємо специфічні властивості
    if (window.ethereum.isTempleWallet) {
        wallets.push({
            name: 'Temple Wallet',
            icon: '🔑',
            provider: window.ethereum,
            id: 'temple'
        });
    }else if (window.ethereum.isMetaMask) {
        wallets.push({
            name: 'MetaMask',
            icon: '🔵',
            provider: window.ethereum,
            id: 'metamask'
        });
    }
    else if (window.ethereum.isCoinbaseWallet) {
        wallets.push({
            name: 'Coinbase Wallet',
            icon: '🔵',
            provider: window.ethereum,
            id: 'coinbase'
        });
    } else if (window.ethereum.isTrust) {
        wallets.push({
            name: 'Trust Wallet',
            icon: '🛡️',
            provider: window.ethereum,
            id: 'trust'
        });
    } else if (window.ethereum.isWalletConnect) {
        wallets.push({
            name: 'WalletConnect',
            icon: '🔗',
            provider: window.ethereum,
            id: 'walletconnect'
        });
    } else {
        // Додаткові перевірки для невизначених гаманців
        const userAgent = navigator.userAgent.toLowerCase();
        let walletName = 'Ethereum Wallet';
        let walletIcon = '⚡';
        let walletId = 'ethereum';
        
        // Перевірка Trust Wallet через user agent або інші ознаки
         if (userAgent.includes('metamask') ||
            window.ethereum.isTrustWallet ||
            window.trustwallet ||
            window.ethereum._trustwallet) {
            walletName = 'MeteMask';
            walletIcon = '🛡️';
            walletId = 'trust';
        }else if (userAgent.includes('trust') ||
            window.ethereum.isTrustWallet || 
            window.trustwallet ||
            window.ethereum._trustwallet) {
            walletName = 'Trust Wallet';
            walletIcon = '🛡️';
            walletId = 'trust';
        }
        // Перевірка Coinbase через додаткові ознаки
        else if (userAgent.includes('coinbase') || 
                 window.ethereum.selectedProvider?.isCoinbaseWallet ||
                 window.ethereum.providers?.some(p => p.isCoinbaseWallet)) {
            walletName = 'Coinbase Wallet';
            walletIcon = '🔵';
            walletId = 'coinbase';
        }
        // Перевірка Brave Wallet
        else if (window.ethereum.isBraveWallet) {
            walletName = 'Brave Wallet';
            walletIcon = '🦁';
            walletId = 'brave';
        }
        
        wallets.push({
            name: walletName,
            icon: walletIcon,
            provider: window.ethereum,
            id: walletId
        });
    }
    
    // Додаткові провайдери (якщо є)
    if (window.coinbaseWalletExtension && window.coinbaseWalletExtension.request) {
        const existing = wallets.find(w => w.id === 'coinbase');
        if (!existing) {
            wallets.push({
                name: 'Coinbase Wallet',
                icon: '🔵',
                provider: window.coinbaseWalletExtension,
                id: 'coinbase'
            });
        }
    }
    
    if (window.trustWallet && window.trustWallet.request) {
        const existing = wallets.find(w => w.id === 'trust');
        if (!existing) {
            wallets.push({
                name: 'Trust Wallet',
                icon: '🛡️',
                provider: window.trustWallet,
                id: 'trust'
            });
        }
    }
    
    return wallets;
}

// Отримання URL для Etherscan
function getEtherscanUrl(chainId, type = 'tx', hash = '') {
    const baseUrls = {
        '1': 'https://etherscan.io',
        '11155111': 'https://sepolia.etherscan.io',
        '5': 'https://goerli.etherscan.io',
        '137': 'https://polygonscan.com',
        '80001': 'https://mumbai.polygonscan.com',
        '56': 'https://bscscan.com',
        '97': 'https://testnet.bscscan.com',
        '43114': 'https://snowtrace.io',
        '43113': 'https://testnet.snowtrace.io',
        '250': 'https://ftmscan.com',
        '4002': 'https://testnet.ftmscan.com',
        '42161': 'https://arbiscan.io',
        '421613': 'https://goerli.arbiscan.io',
        '10': 'https://optimistic.etherscan.io',
        '420': 'https://goerli-optimism.etherscan.io'
    };
    
    const baseUrl = baseUrls[chainId.toString()] || 'https://etherscan.io';
    
    if (type === 'tx') {
        return `${baseUrl}/tx/${hash}`;
    } else if (type === 'address') {
        return `${baseUrl}/address/${hash}`;
    }
    
    return baseUrl;
}

// Створення красивого посилання для терміналу
function createEtherscanLink(chainId, type, hash, text) {
    const url = getEtherscanUrl(chainId, type, hash);
    return `<a href="${url}" target="_blank">${text}</a>`;
}

// Отримання VALUE з Deploy & Run панелі
function getValueFromUI() {
    const valueInput = document.querySelector('.deploy-config input[placeholder="Amount"]');
    if (!valueInput) {
        return '0';
    }
    
    const value = valueInput.value.trim();
    
    if (!value || value === '') {
        return '0';
    }
    
    if (!/^\d+$/.test(value)) {
        throw new Error(`Invalid VALUE: ${value}. Please enter value in Wei (numbers only)`);
    }
    
    return value;
}

// ОНОВЛЕНО: Обробка зміни Environment з підтримкою мультигаманців
async function handleEnvironmentChange() {
    const environment = document.getElementById('environment-select').value;
    const accountSelect = document.getElementById('account-select');
    const accountBalance = document.getElementById('account-balance');
    
    
    if (environment === 'injected') {
        await connectToWallet();
    } else if (environment === 'vm') {
        accountSelect.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const option = document.createElement('option');
            option.value = `0x${i.toString().padStart(40, '0')}`;
            option.textContent = `Account ${i} (0x${i.toString().padStart(6, '0')}...${i.toString().padStart(6, '0')})`;
            accountSelect.appendChild(option);
        }
        accountBalance.textContent = '100 ETH';
        userAccount = accountSelect.value;
        currentNetworkId = null;
        currentWallet = null;
        updateNetworkStatus('Remix VM (Cancun)', true);
    }
    
    updateDeployButton();
}

// НОВИЙ: Підключення до будь-якого гаманця
async function connectToWallet() {
    const wallets = detectWallets();
    
    if (wallets.length === 0) {
        logToTerminal('❌ No Ethereum wallet detected. Please install Temple Wallet, Coinbase Wallet, or Trust Wallet.', 'error');
        showWalletModal();
        return false;
    }
    
    // Якщо тільки один гаманець - підключаємось автоматично
    if (wallets.length === 1) {
        return await connectToSpecificWallet(wallets[0]);
    }
    
    // Якщо декілька гаманців - показуємо вибір
    return await showWalletSelectionModal(wallets);
}

// НОВИЙ: Підключення до конкретного гаманця
async function connectToSpecificWallet(wallet) {
    try {
        logToTerminal(`🔗 Connecting to ${wallet.icon} ${wallet.name}...`, 'info');
        
        web3 = new Web3(wallet.provider);
        currentWallet = wallet;
        
        const accounts = await wallet.provider.request({ 
            method: 'eth_accounts' 
        });
        
        let userAccounts;
        
        if (accounts.length === 0) {
            userAccounts = await wallet.provider.request({ 
                method: 'eth_requestAccounts' 
            });
        } else {
            userAccounts = accounts;
        }
        
        if (!userAccounts || userAccounts.length === 0) {
            logToTerminal(`❌ No accounts found. Please unlock ${wallet.name} and try again.`, 'error');
            return false;
        }
        
        userAccount = userAccounts[0];
        
        if (!web3.utils.isAddress(userAccount)) {
            logToTerminal(`❌ Invalid account address received from ${wallet.name}.`, 'error');
            return false;
        }
        
        await updateAccountInfo();
        await updateNetworkInfo();
        setupWalletEventListeners(wallet);
        updateEnvironmentSelectText(); // Оновлюємо текст в environment select
        await fetch("/api/setWallet", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                wallet: userAccount
            })
        });
        logToTerminal(`${wallet.icon} Connected to ${wallet.name}: <code>${userAccount}</code>`, 'success');
        
        return true;
        
    } catch (error) {
        console.error(`${wallet.name} connection error:`, error);
        handleWalletError(error, wallet.name);
        return false;
    }
}

// НОВИЙ: Модальне вікно вибору гаманця
async function showWalletSelectionModal(wallets) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        const walletsHTML = wallets.map(wallet => `
            <button class="wallet-option" data-wallet-id="${wallet.id}">
                <span class="wallet-icon">${wallet.icon}</span>
                <span class="wallet-name">${wallet.name}</span>
            </button>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content wallet-selection-modal">
                <div class="modal-header">
                    <h2>Select Wallet</h2>
                </div>
                <div class="modal-body">
                    <div class="wallet-options">
                        ${walletsHTML}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="remix-btn remix-btn-secondary" id="cancel-wallet-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обробники подій
        modal.querySelectorAll('.wallet-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const walletId = btn.getAttribute('data-wallet-id');
                const selectedWallet = wallets.find(w => w.id === walletId);
                
                document.body.removeChild(modal);
                const result = await connectToSpecificWallet(selectedWallet);
                resolve(result);
            });
        });
        
        modal.querySelector('#cancel-wallet-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
    });
}

// НОВИЙ: Оновлення тексту в Environment Select
function updateEnvironmentSelectText() {
    const environmentSelect = document.getElementById('environment-select');
    const injectedOption = environmentSelect.querySelector('option[value="injected"]');
    
    if (!injectedOption) return;
    
    if (currentWallet && currentWallet.name) {
        injectedOption.textContent = `Injected Provider - ${currentWallet.name}`;
    } else {
        injectedOption.textContent = 'Injected Provider';
    }
}

// Підключення до MetaMask (зворотна сумісність)
async function connectToMetaMask() {
    return await connectToWallet();
}

// ОНОВЛЕНО: Обробка помилок будь-якого гаманця
function handleWalletError(error, walletName = 'Wallet') {
    let message = `Unknown ${walletName} error`;
    
    switch (error.code) {
        case 4001:
            message = `Connection rejected by user. Please approve the connection in ${walletName}.`;
            break;
        case 4100:
            message = `The requested account or method is not authorized. Please check ${walletName} permissions.`;
            break;
        case 4200:
            message = `The requested method is not supported by ${walletName}.`;
            break;
        case 4900:
            message = `${walletName} is disconnected from all chains.`;
            break;
        case 4901:
            message = `${walletName} is not connected to the requested chain.`;
            break;
        case -32002:
            message = `${walletName} request already pending. Please check ${walletName}.`;
            break;
        case -32603:
            message = `Internal ${walletName} error. Please try again.`;
            break;
        default:
            if (error.message) {
                message = error.message;
            }
    }
    
    logToTerminal(`${currentWallet?.icon || '🔗'} ${walletName} Error: ${message}`, 'error');
}

// Оновлення інформації про аккаунт
async function updateAccountInfo() {
    try {
        const accountSelect = document.getElementById('account-select');
        const accountBalance = document.getElementById('account-balance');
        
        const formattedAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        accountSelect.innerHTML = `<option value="${userAccount}">${formattedAddress}</option>`;
        
        let balance;
        let retries = 3;
        
        while (retries > 0) {
            try {
                balance = await web3.eth.getBalance(userAccount);
                break;
            } catch (balanceError) {
                retries--;
                if (retries === 0) throw balanceError;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        const balanceEth = web3.utils.fromWei(balance, 'ether');
        const formattedBalance = parseFloat(balanceEth).toFixed(4);
        accountBalance.textContent = `${formattedBalance} ETH`;
        
        logToTerminal(`💰 Account balance: ${formattedBalance} ETH`, 'info');
        
    } catch (error) {
        console.error('Error updating account info:', error);
        document.getElementById('account-balance').textContent = 'Error loading balance';
        logToTerminal('⚠️ Failed to load account balance', 'warning');
    }
}

// Оновлення інформації про мережу
async function updateNetworkInfo() {
    try {
        const chainId = await web3.eth.getChainId();
        currentNetworkId = chainId;
        const networkInfo = getNetworkInfo(chainId);
        
        updateNetworkStatus(networkInfo.name, networkInfo.isMainnet);
        
        if (networkInfo.isMainnet) {
            logToTerminal('⚠️ You are connected to MAINNET. Be careful with real funds!', 'warning');
        }
        
        logToTerminal(`🌐 Connected to ${networkInfo.name} (Chain ID: ${chainId})`, 'info');
        
    } catch (error) {
        console.error('Error getting network info:', error);
        currentNetworkId = null;
        updateNetworkStatus('Unknown Network', false);
        logToTerminal('⚠️ Failed to detect network', 'warning');
    }
}

// Отримання інформації про мережу
function getNetworkInfo(chainId) {
    const networks = {
        '1': { name: 'Ethereum Mainnet', isMainnet: true },
        '11155111': { name: 'Sepolia Testnet', isMainnet: false },
        '5': { name: 'Goerli Testnet', isMainnet: false },
        '137': { name: 'Polygon Mainnet', isMainnet: true },
        '80001': { name: 'Polygon Mumbai', isMainnet: false },
        '56': { name: 'BSC Mainnet', isMainnet: true },
        '97': { name: 'BSC Testnet', isMainnet: false },
        '43114': { name: 'Avalanche Mainnet', isMainnet: true },
        '43113': { name: 'Avalanche Fuji', isMainnet: false },
        '250': { name: 'Fantom Mainnet', isMainnet: true },
        '4002': { name: 'Fantom Testnet', isMainnet: false },
        '42161': { name: 'Arbitrum One', isMainnet: true },
        '421613': { name: 'Arbitrum Goerli', isMainnet: false },
        '10': { name: 'Optimism Mainnet', isMainnet: true },
        '420': { name: 'Optimism Goerli', isMainnet: false }
    };
    
    return networks[chainId.toString()] || { 
        name: `Unknown Network (${chainId})`, 
        isMainnet: false 
    };
}

// ОНОВЛЕНО: Налаштування слухачів подій для будь-якого гаманця
function setupWalletEventListeners(wallet) {
    if (!wallet.provider.on) return;
    
    wallet.provider.on('accountsChanged', async (accounts) => {
        try {
            if (accounts.length === 0) {
                userAccount = null;
                web3 = null;
                currentNetworkId = null;
                currentWallet = null;
                updateNetworkStatus('Not connected', false);
                updateEnvironmentSelectText(); // Скидаємо текст при відключенні
                
                const accountSelect = document.getElementById('account-select');
                accountSelect.innerHTML = '<option value="">No accounts available</option>';
                document.getElementById('account-balance').textContent = '0 ETH';
                
                logToTerminal(`${wallet.icon} ${wallet.name} disconnected`, 'warning');
            } else {
                const oldAccount = userAccount;
                userAccount = accounts[0];
                
                await updateAccountInfo();
                
                logToTerminal(`🔄 Account changed from <code>${oldAccount?.substring(0, 10)}...</code> to <code>${userAccount.substring(0, 10)}...</code>`, 'info');
            }
            
            updateDeployButton();
            
        } catch (error) {
            console.error('Error handling account change:', error);
            logToTerminal('❌ Error updating account information', 'error');
        }
    });
    
    wallet.provider.on('chainChanged', async (chainId) => {
        try {
            await updateNetworkInfo();
            logToTerminal(`🔄 Network changed to Chain ID: ${parseInt(chainId, 16)}`, 'info');
        } catch (error) {
            console.error('Error handling chain change:', error);
            logToTerminal('❌ Error updating network information', 'error');
        }
    });
    
    wallet.provider.on('disconnect', (error) => {
        userAccount = null;
        web3 = null;
        currentNetworkId = null;
        currentWallet = null;
        updateNetworkStatus('Not connected', false);
        updateEnvironmentSelectText(); // Скидаємо текст при відключенні
        
        const accountSelect = document.getElementById('account-select');
        accountSelect.innerHTML = '<option value="">No accounts available</option>';
        document.getElementById('account-balance').textContent = '0 ETH';
        
        updateDeployButton();
        logToTerminal(`${wallet.icon} ${wallet.name} connection lost`, 'error');
    });
}

// Оновлення статусу мережі
function updateNetworkStatus(networkName, isConnected) {
    const networkText = document.querySelector('.network-text');
    const networkDot = document.querySelector('.network-dot');
    
    if (networkText) networkText.textContent = networkName;
    
    if (networkDot) {
        if (isConnected) {
            networkDot.classList.add('connected');
        } else {
            networkDot.classList.remove('connected');
        }
    }
}

// Обробка зміни контракту
function handleContractChange() {
    const contractSelect = document.getElementById('contract-select');
    const selectedContract = contractSelect.value;
    
    if (selectedContract && window.compiledContract) {
        updateConstructorParams();
    }
    
    updateDeployButton();
}

// Оновлення параметрів конструктора
function updateConstructorParams() {
    const constructorParamsDiv = document.getElementById('constructor-params');
    const paramInputsDiv = document.getElementById('param-inputs');
    
    if (!window.currentContractABI) {
        constructorParamsDiv.style.display = 'none';
        return;
    }
    
    const constructor = window.currentContractABI.find(item => item.type === 'constructor');
    
    if (constructor && constructor.inputs && constructor.inputs.length > 0) {
        constructorParamsDiv.style.display = 'block';
        paramInputsDiv.innerHTML = '';
        
        constructor.inputs.forEach((input, index) => {
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.className = 'param-input';
            inputElement.placeholder = `${input.name} (${input.type})`;
            inputElement.id = `constructor-param-${index}`;
            paramInputsDiv.appendChild(inputElement);
        });
    } else {
        constructorParamsDiv.style.display = 'none';
    }
}

// Оновлення кнопки деплою
function updateDeployButton() {
    const deployBtn = document.getElementById('deploy-btn');
    const environment = document.getElementById('environment-select').value;
    const hasContract = window.compiledContract && document.getElementById('contract-select').value;
    const hasAccount = userAccount || environment === 'vm';
    
    const canDeploy = hasContract && hasAccount;
    deployBtn.disabled = !canDeploy;
    
    if (!hasContract) {
        deployBtn.textContent = 'Compile contract first';
    } else if (!hasAccount) {
        deployBtn.textContent = 'Connect wallet';
    } else {
        deployBtn.textContent = '🛡️ Secure Deploy';
    }
}

// ОНОВЛЕНО: Модальне вікно для встановлення гаманців
function showWalletModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>No Wallet Detected</h2>
            </div>
            <div class="modal-body">
                <p>To deploy contracts and interact with the blockchain, you need to install a cryptocurrency wallet.</p>
                <div class="wallet-install-options">
                    <a href="https://www.templewallet.com/" target="_blank" class="wallet-install-btn">
                        🔑 Install TempleWallet
                    </a>
                    <a href="https://www.coinbase.com/wallet" target="_blank" class="wallet-install-btn">
                        🔵 Install Coinbase Wallet
                    </a>
                    <a href="https://trustwallet.com/" target="_blank" class="wallet-install-btn">
                        🛡️ Install Trust Wallet
                    </a>
                </div>
            </div>
            <div class="modal-footer">
                <button class="remix-btn remix-btn-secondary" id="close-wallet-modal-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#close-wallet-modal-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function showMetaMaskModal() {
    showWalletModal();
}

function hideMetaMaskModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Завантаження контракту за адресою
async function loadContractAtAddress() {
    const address = document.getElementById('contract-address-input').value.trim();
    
    if (!address) {
        logToTerminal('❌ Enter contract address', 'error');
        return;
    }
    
    if (!window.currentContractABI) {
        logToTerminal('❌ Compile contract first to get ABI', 'error');
        return;
    }
    
    try {
        const environment = document.getElementById('environment-select').value;
        let contractInstance;
        
        if (environment === 'injected' && web3) {
            contractInstance = new web3.eth.Contract(window.currentContractABI, address);
        } else {
            contractInstance = {
                options: { address: address },
                methods: {}
            };
            
            window.currentContractABI.forEach(item => {
                if (item.type === 'function') {
                    contractInstance.methods[item.name] = () => ({
                        call: () => Promise.resolve('Mock result'),
                        send: () => Promise.resolve({ transactionHash: '0x' + Math.random().toString(16).substr(2, 64) })
                    });
                }
            });
        }
        
        const contractName = document.getElementById('contract-select').value || 'LoadedContract';
        addDeployedContract(contractName, address, contractInstance);
        
        if (environment === 'injected' && currentNetworkId) {
            const contractLink = createEtherscanLink(currentNetworkId, 'address', address, 'View Contract on Etherscan');
            logToTerminal(`✅ Contract loaded successfully!`, 'success');
            logToTerminal(`Contract: ${contractLink}`, 'info');
        } else {
            logToTerminal(`✅ Contract loaded: <code>${address}</code>`, 'success');
        }
        
        document.getElementById('contract-address-input').value = '';
        
    } catch (error) {
        logToTerminal(`❌ Failed to load contract: ${error.message}`, 'error');
    }
}

// Додавання деплойнутого контракту
function addDeployedContract(contractName, address, contractInstance) {
    const deployedContract = {
        name: contractName,
        address: address,
        instance: contractInstance,
        abi: window.currentContractABI,
        fileName: currentFile.split('/').pop()
    };
    
    deployedContracts.push(deployedContract);
    updateDeployedContractsList();
    
}

// Оновлення списку деплойнутих контрактів
function updateDeployedContractsList() {
    const containersList = document.getElementById('deployed-contracts-list');
    containersList.innerHTML = '';
    
    deployedContracts.forEach((contract, index) => {
        const shortAddress = `${contract.address.substring(0, 6)}...${contract.address.substring(contract.address.length - 4)}`;
        
        const contractDiv = document.createElement('div');
        contractDiv.className = 'deployed-contract';
        contractDiv.innerHTML = `
            <div class="contract-header" onclick="toggleContract(${index})">
                <div style="flex: 1; min-width: 0;">
                    <div class="contract-name" title="${contract.name}">${contract.name}</div>
                    <div class="contract-address" title="${contract.address}">${shortAddress}</div>
                </div>
                <div style="margin-left: 8px; color: #888; font-size: 12px;">
                    ${contract.abi.filter(item => item.type === 'function').length} functions
                </div>
            </div>
            <div class="contract-functions" id="contract-${index}">
                ${createContractFunctions(contract, index)}
            </div>
        `;
        
        containersList.appendChild(contractDiv);
    });
}

// НОВА ФУНКЦІЯ: Створення функцій контракту з новим стилем
function createContractFunctions(contract, contractIndex) {
    if (!contract.abi) return '';
    
    return contract.abi
        .filter(item => item.type === 'function')
        .map((func, funcIndex) => {
            const isReadOnly = func.stateMutability === 'view' || func.stateMutability === 'pure';
            const hasInputs = func.inputs && func.inputs.length > 0;
            
            if (hasInputs) {
                // Функція з параметрами - горизонтальний layout
                const parameterName = func.inputs[0].name || 'parameter';
                const parameterType = func.inputs[0].type;
                const paramDisplayText = ``;
                
                return `
                    <div class="function-item-horizontal">
                        <button class="remix-btn ${isReadOnly ? 'remix-btn-primary' : 'remix-btn-orange'} function-button" 
                                onclick="executeContractFunction(${contractIndex}, ${funcIndex}, ${isReadOnly})"
                                title="${func.name}">
                            ${func.name}
                        </button>
                        <div class="function-inputs-horizontal">
                            <div class="function-param-dropdown">
                                <div class="function-param-type" 
                                     onclick="toggleParameterInput(${contractIndex}, ${funcIndex})" 
                                     id="param-type-${contractIndex}-${funcIndex}">
                                    ${paramDisplayText}
                                </div>
                                <input type="text" 
                                       class="function-param-input" 
                                       id="param-input-${contractIndex}-${funcIndex}"
                                       placeholder="Enter amount..."
                                       onkeydown="handleParameterEnter(event, ${contractIndex}, ${funcIndex}, ${isReadOnly})">
                                <span class="function-dropdown-arrow">▼</span>
                            </div>
                        </div>
                    </div>
                    <div id="result-${contractIndex}-${funcIndex}" class="function-result" style="display: none;"></div>
                `;
            } else {
                // Функція без параметрів
                return `
                    <div class="function-item">
                        <button class="remix-btn ${isReadOnly ? 'remix-btn-primary' : 'remix-btn-orange'} function-button" 
                                onclick="executeContractFunction(${contractIndex}, ${funcIndex}, ${isReadOnly})"
                                title="${func.name}">
                            ${func.name}
                        </button>
                    </div>
                    <div id="result-${contractIndex}-${funcIndex}" class="function-result" style="display: none;"></div>
                `;
            }
        }).join('');
}

// НОВІ ФУНКЦІЇ: Робота з параметрами
function toggleParameterInput(contractIndex, funcIndex) {
    const paramType = document.getElementById(`param-type-${contractIndex}-${funcIndex}`);
    const paramInput = document.getElementById(`param-input-${contractIndex}-${funcIndex}`);
    
    if (paramInput.classList.contains('active')) {
        paramInput.classList.remove('active');
        paramType.style.display = 'flex';
    } else {
        paramInput.classList.add('active');
        paramType.style.display = 'none';
        paramInput.focus();
    }
}

function handleParameterEnter(event, contractIndex, funcIndex, isReadOnly) {
    if (event.key === 'Enter') {
        executeContractFunction(contractIndex, funcIndex, isReadOnly);
    }
    if (event.key === 'Escape') {
        const paramType = document.getElementById(`param-type-${contractIndex}-${funcIndex}`);
        const paramInput = document.getElementById(`param-input-${contractIndex}-${funcIndex}`);
        paramInput.classList.remove('active');
        paramInput.value = '';
        paramType.style.display = 'flex';
    }
}

function executeContractFunction(contractIndex, funcIndex, isReadOnly) {
    const paramInput = document.getElementById(`param-input-${contractIndex}-${funcIndex}`);
    
    if (paramInput && paramInput.classList.contains('active')) {
        // Приховати input після виконання
        paramInput.classList.remove('active');
        const paramType = document.getElementById(`param-type-${contractIndex}-${funcIndex}`);
        paramType.style.display = 'flex';
    }
    
    callContractFunction(contractIndex, funcIndex, isReadOnly);
}

// Перемикання відображення контракту
function toggleContract(contractIndex) {
    const functionsDiv = document.getElementById(`contract-${contractIndex}`);
    if (functionsDiv.classList.contains('expanded')) {
        functionsDiv.classList.remove('expanded');
    } else {
        functionsDiv.classList.add('expanded');
    }
}

// ВИПРАВЛЕНО: Виклик функції контракту з правильною обробкою параметрів
async function callContractFunction(contractIndex, funcIndex, isReadOnly) {
    const contract = deployedContracts[contractIndex];
    const func = contract.abi.filter(item => item.type === 'function')[funcIndex];
    
    const isPayable = func.stateMutability === 'payable';
    
    try {
        const args = [];
        
        if (func.inputs && func.inputs.length > 0) {
            func.inputs.forEach((input, inputIndex) => {
                if (inputIndex === 0) {
                    // Для першого параметра використовуємо новий input
                    const inputElement = document.getElementById(`param-input-${contractIndex}-${funcIndex}`);
                    let value = inputElement ? inputElement.value.trim() : '';
                    
                    if (input.type.includes('uint') || input.type.includes('int')) {
                        value = value || '0';
                    } else if (input.type === 'bool') {
                        value = value.toLowerCase() === 'true';
                    }
                    
                    args.push(value);
                } else {
                    // Для додаткових параметрів використовуємо старі input (якщо є)
                    const inputElement = document.getElementById(`input-${contractIndex}-${funcIndex}-${inputIndex}`);
                    let value = inputElement ? inputElement.value.trim() : '';
                    
                    if (input.type.includes('uint') || input.type.includes('int')) {
                        value = value || '0';
                    } else if (input.type === 'bool') {
                        value = value.toLowerCase() === 'true';
                    }
                    
                    args.push(value);
                }
            });
        }
        
        logToTerminal(`🔄 Calling ${func.name}(${args.join(', ')})`, 'info');
        
        let result;
        if (isReadOnly) {
            result = await contract.instance.methods[func.name](...args).call();
            showFunctionResult(contractIndex, funcIndex, result, true);
            logToTerminal(`📋 Result: ${result}`, 'success');
        } else {
            const environment = document.getElementById('environment-select').value;
            const txOptions = { from: userAccount };
            
            // VALUE тільки для payable функцій
            if (isPayable) {

                if (environment === 'injected') {
                    try {
                        const valueWei = getValueFromUI();
                        if (valueWei && valueWei !== '0') {
                            txOptions.value = valueWei;
                            //logToTerminal(`💰 Sending ${valueWei} Wei with payable function`, 'info');
                        }
                    } catch (error) {
                        logToTerminal(`❌ VALUE error: ${error.message}`, 'error');
                        return;
                    }
                } else {
                    try {
                        const valueWei = getValueFromUI();
                        if (valueWei && valueWei !== '0') {
                            //logToTerminal(`💰 Sending ${valueWei} Wei with payable function (VM)`, 'info');
                        }
                    } catch (error) {
                        // Ігноруємо помилки VALUE для VM
                    }
                }
            }
            
            if (environment === 'injected') {

                result = await contract.instance.methods[func.name](...args).send(txOptions);
                showFunctionResult(contractIndex, funcIndex, result.transactionHash, false);
                
                logToTerminal(`✅ Function ${func.name} executed successfully!`, 'success');
                if (result.transactionHash) {
                    logToTerminal(`🔗 Transaction Hash: <code>${result.transactionHash}</code>`, 'info');
                    
                    if (currentNetworkId) {
                        const txLink = createEtherscanLink(currentNetworkId, 'tx', result.transactionHash, 'View Transaction on Etherscan');
                        logToTerminal(`🌐 Etherscan: ${txLink}`, 'info');
                    }
                }
            } else {
                result = await contract.instance.methods[func.name](...args).send();
                showFunctionResult(contractIndex, funcIndex, result.transactionHash, false);
                
                logToTerminal(`✅ Function ${func.name} executed successfully in VM!`, 'success');
                if (result.transactionHash) {
                    logToTerminal(`🔗 Transaction Hash: <code>${result.transactionHash}</code>`, 'info');
                }
            }
        }
        
        // Очистити input після виконання
        const paramInput = document.getElementById(`param-input-${contractIndex}-${funcIndex}`);
        if (paramInput) {
            paramInput.value = '';
        }
        
    } catch (error) {
        logToTerminal(`❌ Function call failed: ${error.message}`, 'error');
        showFunctionResult(contractIndex, funcIndex, error.message, false, true);
    }
}

// Відображення результату виклику функції
function showFunctionResult(contractIndex, funcIndex, result, isView, isError = false) {
    const resultElement = document.getElementById(`result-${contractIndex}-${funcIndex}`);
    resultElement.style.display = 'block';
    resultElement.className = `function-result ${isError ? 'compilation-error' : 'compilation-success'}`;
    
    if (isError) {
        resultElement.innerHTML = `<strong>Error:</strong><br><span style="font-size: 9px;">${result}</span>`;
    } else if (isView) {
        let formattedResult = result;
        if (typeof result === 'string' && result.length > 50) {
            formattedResult = result.substring(0, 50) + '...';
        }
        resultElement.innerHTML = `<strong>Result:</strong><br><span style="font-size: 9px; word-break: break-all;">${formattedResult}</span>`;
    } else {
        const environment = document.getElementById('environment-select').value;
        if (environment === 'injected' && currentNetworkId) {
            const etherscanUrl = getEtherscanUrl(currentNetworkId, 'tx', result);
            resultElement.innerHTML = `
                <strong>Transaction:</strong><br>
                <a href="${etherscanUrl}" target="_blank" style="color: #007acc; font-size: 9px; text-decoration: none; display: inline-block; margin-top: 4px;">
                    View on Etherscan
                </a>
            `;
        } else {
            const shortHash = result.length > 20 ? `${result.substring(0, 10)}...${result.substring(result.length - 10)}` : result;
            resultElement.innerHTML = `<strong>TX:</strong><br><code style="font-size: 9px; word-break: break-all;">${shortHash}</code>`;
        }
    }
}

// Обробник кліків для закриття input полів
document.addEventListener('click', function(e) {
    if (!e.target.closest('.function-inputs-horizontal') && !e.target.closest('.function-param-type')) {
        document.querySelectorAll('.function-param-input.active').forEach(input => {
            // Якщо в полі є значення - не ховаємо його
            if (input.value.trim() !== '') {
                return; // залишаємо поле видимим
            }
            
            // Ховаємо тільки пусті поля
            const inputId = input.id;
            const match = inputId.match(/param-input-(\d+)-(\d+)/);
            if (match) {
                const contractIndex = match[1];
                const funcIndex = match[2];
                const paramType = document.getElementById(`param-type-${contractIndex}-${funcIndex}`);
                
                input.classList.remove('active');
                if (paramType) paramType.style.display = 'flex';
            }
        });
    }
});
