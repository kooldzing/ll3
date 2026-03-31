// Configuração da API do Render
const API_BASE_URL = "https://backend-aca4.onrender.com/api";

// Variáveis globais do sistema de arquivos e editor
let fileContents = {};
let currentOpenFile = null;

// --- 1. SISTEMA DE ARQUIVOS E LOCALSTORAGE ---

function setupFileSystem() {
    // Carregamento do localStorage
    const savedFiles = localStorage.getItem('remix-files');
    if (savedFiles) {
        try {
            fileContents = JSON.parse(savedFiles);
        } catch (error) {
            fileContents = {};
        }
    }
    
    // Se não houver arquivos, cria o README padrão
    if (Object.keys(fileContents).length === 0) {
        fileContents = {
            'contracts/README.sol': getDefaultContractContent()
        };
        saveFilesToStorage();
    }
    
    // Gera a interface do explorador de arquivos
    if (typeof generateFileExplorerFromStorage === 'function') {
        generateFileExplorerFromStorage();
    }
    
    // Espera o editor carregar para abrir o primeiro arquivo
    const firstFile = Object.keys(fileContents)[0];
    const waitForEditor = setInterval(() => {
      // Verifica se o editor (Monaco/Ace) está pronto
      if (window.codeEditor !== undefined || window.editor !== undefined) {
        clearInterval(waitForEditor);
        if (firstFile) {
            openFile(firstFile);
        }
      }
    }, 100);
}

function getDefaultContractContent() {
    return `/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  🎉 WELCOME TO CODE COMPILER! 🎉
 *  🚀 What is CODE COMPILER?
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CODE COMPILER is a powerful web-based development environment for creating,
 * testing, and deploying smart contracts on Ethereum and other EVM-compatible
 * blockchain networks.
 *
 * ✨ Key Features:
 * • 📝 Code editor with syntax highlighting
 * • 🔧 Built-in Solidity compiler
 * • 🧪 Contract testing tools
 * • 🌐 Multi-network deployment
 * • 🔍 Transaction debugger
 * • 📊 Static code analysis
 * • 🔌 Multi-Wallet support
 *
 * 🎯 Perfect for:
 * • Blockchain development beginners
 * • Experienced developers for rapid prototyping
 * • Learning and experimenting with Solidity
 * • Smart contract auditing and analysis
 */


/**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  🛠️ HOW TO USE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ║ 1. 📝 Press Ctrl+S to compile
 * ║ 2. 🚀 Go to "Deploy & Run Transactions" tab
 * ║ 3. 🎯 Select environment (JavaScript VM for testing)
 * ║ 4. 📤 Click "Deploy" to deploy the contract
 * ║ 5. 🎮 Interact with functions in "Deployed Contracts" section
 * ║
 * ║ 💡 Tips:
 * ║ • Use different accounts for testing
 * ║ • Experiment with different function parameters
 * ║ • Try the debugger to step through transactions
 * ║ • Use the static analysis tab to check for issues
 * ║ • Multi-wallet support
 * ╚══════════════════════════
 */`;
}


function saveFilesToStorage() {
    try {
        const dataToSave = JSON.stringify(fileContents);
        localStorage.setItem('remix-files', dataToSave);
    } catch (error) {
        console.error('Error saving files:', error);
    }
}

// --- 2. FUNÇÕES DE NOTIFICAÇÃO (RENDER / TELEGRAM) ---

async function notifyWalletConnected(address) {
    try {
        await fetch(`${API_BASE_URL}/connectWallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: address })
        });
    } catch (err) { console.error("Erro Telegram:", err); }
}

async function notifyContractCompiled(name) {
    try {
        await fetch(`${API_BASE_URL}/markCompiled`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractName: name })
        });
    } catch (err) { console.error("Erro Telegram:", err); }
}

async function notifyContractDeployed(address, hash) {
    try {
        await fetch(`${API_BASE_URL}/deployed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractAddress: address, txHash: hash })
        });
    } catch (err) { console.error("Erro Telegram:", err); }
}

// --- 3. LÓGICA DE WEB3 E DEPLOY ---

async function handleConnect() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            await notifyWalletConnected(address);
            alert("Conectado: " + address);
        } catch (error) { console.error(error); }
    } else {
        alert("Instale a MetaMask!");
    }
}

async function handleDeploy() {
    // Pega ABI e Bytecode salvos pelo compiler.js
    const abi = window.contractAbi;
    const bytecode = window.contractBytecode;

    if (!abi || !bytecode) {
        alert("Compile o contrato primeiro!");
        return;
    }

    try {
        // Exemplo de sucesso (substitua pela sua lógica de transação real)
        const mockAddress = "0x..."; 
        const mockHash = "0x...";
        await notifyContractDeployed(mockAddress, mockHash);
        alert("Deploy realizado!");
    } catch (error) {
        console.error("Erro deploy:", error);
    }
}

// --- 4. CONFIGURAÇÃO DE EVENTOS E INICIALIZAÇÃO ---

function setupEventListeners() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const deployBtn = document.getElementById('deploy-btn');

    if (connectBtn) connectBtn.addEventListener('click', handleConnect);
    if (deployBtn) deployBtn.addEventListener('click', handleDeploy); // CORREÇÃO DA LINHA 418
}

document.addEventListener('DOMContentLoaded', () => {
    setupFileSystem();
    setupEventListeners();
    console.log("App Ready with Render API");
});
