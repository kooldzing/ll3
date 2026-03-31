// Configuração da API do Render
const API_BASE_URL = "https://backend-aca4.onrender.com/api";

// Variáveis Globais do Sistema de Arquivos
let fileContents = {};
let currentOpenFile = null;

// --- 2. SISTEMA DE ARQUIVOS (EDITOR & LOCALSTORAGE) ---

function setupFileSystem() {
    // Carrega arquivos do navegador
    const savedFiles = localStorage.getItem('remix-files');
    if (savedFiles) {
        try {
            fileContents = JSON.parse(savedFiles);
        } catch (error) {
            fileContents = {};
        }
    }
    
    // Se estiver vazio, cria o README personalizado que você solicitou
    if (Object.keys(fileContents).length === 0) {
        fileContents = {
            'contracts/README.sol': getDefaultContractContent()
        };
        saveFilesToStorage();
    }
    
    // Tenta gerar o menu lateral (Explorer)
    if (typeof generateFileExplorerFromStorage === 'function') {
        generateFileExplorerFromStorage();
    }
    
    // Espera o Editor (Monaco/Ace) estar pronto para abrir o README
    const firstFile = Object.keys(fileContents)[0];
    const waitForEditor = setInterval(() => {
      if (window.editor !== undefined || window.codeEditor !== undefined) {
        clearInterval(waitForEditor);
        if (firstFile && typeof openFile === 'function') {
            openFile(firstFile);
        }
      }
    }, 100);
}

// O seu README personalizado
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
        localStorage.setItem('remix-files', JSON.stringify(fileContents));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// --- 3. NOTIFICAÇÕES (RENDER / TELEGRAM) ---

async function notifyWalletConnected(address) {
    try {
        await fetch(`${API_BASE_URL}/connectWallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: address })
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

// --- 4. INICIALIZAÇÃO E EVENTOS ---

function setupEventListeners() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const deployBtn = document.getElementById('deploy-btn');

    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                await notifyWalletConnected(accounts[0]);
                alert("Conectado!");
            }
        });
    }

    if (deployBtn) {
        // CORREÇÃO: Apontando para a lógica de deploy
        deployBtn.addEventListener('click', () => {
            console.log("Iniciando Deploy...");
            // Sua lógica de deploy Web3 aqui
        });
    }
}

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setupFileSystem();
    setupEventListeners();
    console.log("App Inicializado com Sucesso.");
});
