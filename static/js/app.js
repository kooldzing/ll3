// Configuração da API do Render
const API_BASE_URL = "https://onrender.com";

// Variáveis globais para o estado da aplicação
let provider;
let signer;
let userAddress;
let networkId;
let contractInstance;

// --- FUNÇÕES DE INTERFACE (UI) ---

function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
    }
}

function showLoader(show = true) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// --- FUNÇÕES DE NOTIFICAÇÃO (RENDER / TELEGRAM) ---

async function notifyWalletConnected(address) {
    try {
        await fetch(`${API_BASE_URL}/connectWallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: address })
        });
        console.log("Telegram: Carteira conectada notificada.");
    } catch (err) {
        console.error("Erro ao notificar carteira:", err);
    }
}

async function notifyContractCompiled(name) {
    try {
        await fetch(`${API_BASE_URL}/markCompiled`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractName: name })
        });
    } catch (err) {
        console.error("Erro ao notificar compilação:", err);
    }
}

async function notifyContractDeployed(address, hash) {
    try {
        await fetch(`${API_BASE_URL}/deployed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contractAddress: address, 
                txHash: hash 
            })
        });
    } catch (err) {
        console.error("Erro ao notificar deploy:", err);
    }
}

// --- LÓGICA DE WEB3 ---

async function handleConnect() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            showLoader(true);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            // Atualiza UI
            const btn = document.getElementById('connect-wallet-btn');
            if (btn) btn.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            
            updateStatus("Carteira conectada com sucesso!", "success");
            
            // Notifica o Backend/Telegram
            await notifyWalletConnected(userAddress);
            
        } catch (error) {
            updateStatus("Erro ao conectar carteira: " + error.message, "error");
        } finally {
            showLoader(false);
        }
    } else {
        alert("Por favor, instale a MetaMask!");
    }
}

async function handleDeploy() {
    // Verifica se o compilador salvou o ABI e Bytecode no objeto window
    const abi = window.contractAbi;
    const bytecode = window.contractBytecode;

    if (!abi || !bytecode) {
        updateStatus("Erro: Compile o contrato antes de realizar o deploy.", "error");
        return;
    }

    try {
        showLoader(true);
        updateStatus("Aguardando confirmação na MetaMask...", "info");

        // Aqui entraria sua lógica real de deploy com Ethers.js ou Web3.js
        // Exemplo de fluxo para notificação após sucesso da transação:
        
        /* 
        const factory = new ethers.ContractFactory(abi, bytecode, signer);
        const contract = await factory.deploy();
        await contract.deployed();
        */

        const deployedAddress = "0x..."; // Endereço retornado após o deploy
        const txHash = "0x..."; // Hash da transação

        await notifyContractDeployed(deployedAddress, txHash);
        updateStatus("Contrato deployado com sucesso!", "success");

    } catch (error) {
        updateStatus("Erro no deploy: " + error.message, "error");
    } finally {
        showLoader(false);
    }
}

// --- CONFIGURAÇÃO DOS EVENTOS ---

function setupEventListeners() {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const deployBtn = document.getElementById('deploy-btn');

    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
    }

    if (deployBtn) {
        // CORREÇÃO DA LINHA 418: de deployContract() para handleDeploy()
        deployBtn.addEventListener('click', handleDeploy);
    }

    // Tabs e navegação
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.style.display = 'block';
        });
    });
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
    console.log("App inicializado.");
    setupEventListeners();
});
