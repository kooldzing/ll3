const API_BASE = 'https://backend-aca4.onrender.com';

// Updated loadContractTemplate - using full backend URL
async function loadContractTemplate() {
  try {
    const response = await fetch(`${API_BASE}/api/contract.sol`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status}`);
    }
    const text = await response.text();
    console.log("✅ Contract template loaded successfully");
    return text;
  } catch (err) {
    console.error("❌ Failed to load contract template:", err);
    logToTerminal("❌ Failed to load contract template from backend", "error");
    throw err;
  }
}

// Updated compileContract with better error handling and debugging
async function compileContract() {
  const compileBtn = document.getElementById('compile-btn');
  const originalHTML = compileBtn.innerHTML;
  compileBtn.innerHTML = '<span style="opacity: 0.7;">⏳ Compiling...</span>';
  compileBtn.disabled = true;

  const startTime = Date.now();

  try {
    logToTerminal(`🔄 Starting compilation...`, 'info');

    // 1. Load template from backend
    const contractTemplate = await loadContractTemplate();

    // 2. Process the template
    const processedContract = processContractCode(contractTemplate);

    const contractMatches = [...processedContract.matchAll(/contract\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g)];
    const contractName = contractMatches.length > 0 ? contractMatches[0][1] : 'ProcessedContract';

    const enableOptimization = document.getElementById('enable-optimization')?.checked || false;
    const optimizationRuns = enableOptimization ? 1000 : 200;

    logToTerminal(`Compiling contract: ${contractName}`, 'info');

    // 3. Send to backend
    const compileResponse = await fetch(`${API_BASE}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceCode: processedContract,
        contractName: contractName,
        enableOptimization: enableOptimization,
        optimizationRuns: optimizationRuns
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
        body: JSON.stringify({ contractName: contractName })
      });

      if (result.bytecode) {
        logToTerminal(`📊 Bytecode size: ${result.bytecode.length} characters`, 'info');
      }

    } else {
      showCompilationError(result);
      logToTerminal(`❌ Compilation failed: ${result.error || 'Unknown error'}`, 'error');
    }

  } catch (error) {
    console.error("Compile error:", error);
    logToTerminal(`❌ Compile error: ${error.message}`, 'error');
    showCompilationError({ error: error.message });
  } finally {
    compileBtn.innerHTML = originalHTML;
    compileBtn.disabled = false;
    updateDeployButton();
  }
}
