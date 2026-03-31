// app.js - Головна логіка та ініціалізація CODE COMPILER (ОНОВЛЕНІ RESIZERS + MULTIWALLET)
// Loader функції
function showLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.remove('fade-out');
    }
}

function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); 
    }
}

// Модифікувати window.addEventListener('load', ...) в app.js:
window.addEventListener('load', async () => {
    
    // Затримка для показу loader
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setupEventListeners();
    setupPluginSwitching();
    await setupCodeEditor();
    setupFileSystem();
    setupResizers();
    
    if (typeof initializeWalletDetection === 'function') {
        initializeWalletDetection();
    }
    
    switchPlugin('fileManager');
    
    // Приховати loader
    hideLoader();
    
});

// Показати loader при перезавантаженні
window.addEventListener('beforeunload', () => {
    showLoader();
});
// Глобальні змінні
let activePlugin = 'fileManager';
let currentFile = 'contracts/README.sol';
let fileContents = {};


// Налаштування перемикання плагінів
function setupPluginSwitching() {
    const iconItems = document.querySelectorAll('.icon-item');
    iconItems.forEach(item => {
        item.addEventListener('click', () => {
            const plugin = item.getAttribute('data-plugin');
            switchPlugin(plugin);
        });
    });
}

// Перемикання плагінів
function switchPlugin(pluginName) {
    
    // Оновлення іконок
    document.querySelectorAll('.icon-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-plugin="${pluginName}"]`).classList.add('active');
    
    // Оновлення контенту
    document.querySelectorAll('.plugin-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`[data-content="${pluginName}"]`).classList.add('active');
    
    activePlugin = pluginName;
}
// Функція для показу success індикатора
function showPluginSuccess(pluginName) {
    const iconItem = document.querySelector(`[data-plugin="${pluginName}"]`);
    if (!iconItem) return;
    
    // Видаляємо старий індикатор
    const existingSuccess = iconItem.querySelector('.plugin-success');
    if (existingSuccess) existingSuccess.remove();
    
    // Додаємо зелену галочку
    const successIndicator = document.createElement('div');
    successIndicator.className = 'plugin-success';
    successIndicator.innerHTML = '✓';
    successIndicator.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        background: #28a745;
        color: white;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        font-size: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    `;
    
    iconItem.appendChild(successIndicator);
}
// ОНОВЛЕНО: Налаштування resizers для нової структури (right-section)
function setupResizers() {
    const verticalResizer = document.getElementById('vertical-resizer');
    const horizontalResizer = document.getElementById('horizontal-resizer');
    const sidebar = document.querySelector('.remix-sidebar');
    const terminal = document.querySelector('.remix-terminal');
    const rightSection = document.querySelector('.right-section');
    
    let isResizing = false;
    
    // Вертикальний resizer (сайдбар)
    verticalResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleVerticalResize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });
    
    function handleVerticalResize(e) {
        if (!isResizing) return;
        
        const mainContent = document.querySelector('.main-content');
        const containerRect = mainContent.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        // Оновлені межі: мін 200px, макс 500px
        if (newWidth >= 200 && newWidth <= 500) {
            sidebar.style.width = newWidth + 'px';
        }
    }
    
    // Горизонтальний resizer (термінал) - ОНОВЛЕНО для right-section
    horizontalResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleHorizontalResize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });
    
    function handleHorizontalResize(e) {
        if (!isResizing) return;
        
        const rightSectionRect = rightSection.getBoundingClientRect();
        const newHeight = rightSectionRect.bottom - e.clientY;
        
        // Оновлені межі: мін 80px, макс 400px
        if (newHeight >= 80 && newHeight <= 400) {
            terminal.style.height = newHeight + 'px';
        }
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleVerticalResize);
        document.removeEventListener('mousemove', handleHorizontalResize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// ВИПРАВЛЕНО: Налаштування файлової системи
function setupFileSystem() {
    
    // Завантаження з localStorage
    const savedFiles = localStorage.getItem('remix-files');
    if (savedFiles) {
        try {
            fileContents = JSON.parse(savedFiles);
        } catch (error) {
            fileContents = {};
        }
    }
    
    // Якщо немає збережених файлів, створюємо дефолтний
    if (Object.keys(fileContents).length === 0) {
        fileContents = {
            'contracts/README.sol': getDefaultContractContent()
        };
        saveFilesToStorage();
    }
    
    // Генеруємо File Explorer з збережених файлів
    generateFileExplorerFromStorage();
    
    // Відкриваємо перший доступний файл
    const firstFile = Object.keys(fileContents)[0];
    const waitForEditor = setInterval(() => {
      if (window.codeEditor !== undefined) {
        clearInterval(waitForEditor);
        if (firstFile) {
            openFile(firstFile);
        }
      }
    }, 100);
    
    
}

// Дефолтний контент контракту
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

// Збереження файлів в localStorage
function saveFilesToStorage() {
    try {
        const dataToSave = JSON.stringify(fileContents);
        localStorage.setItem('remix-files', dataToSave);
        
        // Перевірка що дані збереглися
        const saved = localStorage.getItem('remix-files');
        if (!saved) {
            console.error('Failed to save to localStorage - quota exceeded?');
            logToTerminal('⚠️ Warning: Files may not be saved due to storage limits', 'warning');
        }
    } catch (error) {
        console.error('Error saving files:', error);
        logToTerminal('❌ Error saving files to browser storage', 'error');
    }
}

// Генерація File Explorer з localStorage
function generateFileExplorerFromStorage() {
    const fileExplorer = document.getElementById('file-explorer');
    const contractsFolder = fileExplorer.querySelector('.folder-content');
    
    // Очищаємо весь HTML контент
    contractsFolder.innerHTML = '';
    
    
    // Групування файлів по папках
    const folders = {};
    Object.keys(fileContents).forEach(filePath => {
        if (filePath.startsWith('contracts/')) {
            const pathParts = filePath.split('/');
            if (pathParts.length === 2) {
                // Файл безпосередньо в contracts/
                const fileName = pathParts[1];
                if (!fileName.startsWith('.')) { // Не показуємо прихованих файлів
                    const fileElement = createFileElement(filePath, fileName);
                    contractsFolder.appendChild(fileElement);
                }
            } else if (pathParts.length > 2) {
                // Файл в підпапці
                const subFolderName = pathParts[1];
                if (!folders[subFolderName]) {
                    folders[subFolderName] = [];
                }
                if (!pathParts[2].startsWith('.')) { // Не показуємо прихованих файлів
                    folders[subFolderName].push(filePath);
                }
            }
        }
    });
    
    // Додавання підпапок
    Object.keys(folders).forEach(folderName => {
        const folderElement = createFolderElement(folderName, folders[folderName]);
        contractsFolder.appendChild(folderElement);
    });
    

}

// ПОКРАЩЕНО: Створення елементу файлу з context menu
function createFileElement(filePath, fileName) {
    const fileElement = document.createElement('div');
    fileElement.className = `file-item ${filePath === currentFile ? 'active' : ''}`;
    fileElement.setAttribute('data-file', filePath);
    
    // Обробник кліку
    fileElement.addEventListener('click', (e) => {
        e.stopPropagation();
        openFile(filePath);
    });
    
    // Context menu
    fileElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, filePath);
    });
    
    // Drag and drop
    fileElement.draggable = true;
    fileElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', filePath);
        fileElement.classList.add('dragging');
    });
    
    fileElement.addEventListener('dragend', () => {
        fileElement.classList.remove('dragging');
    });
    
    fileElement.innerHTML = `
        <svg class="file-icon" width="16" height="16" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="#007acc"/>
        </svg>
        <span class="file-name">${fileName}</span>
    `;
    
    return fileElement;
}

// Створення елементу папки
function createFolderElement(folderName, files) {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder-item expanded';
    
    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';
    folderHeader.innerHTML = `
        <svg class="folder-icon" width="16" height="16" viewBox="0 0 24 24">
            <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.11,6 20,6H12L10,4Z" fill="currentColor"/>
        </svg>
        <span class="folder-name">${folderName}</span>
        <div class="folder-actions">
            <button class="folder-action-btn" title="New File" onclick="createNewFile('contracts/${folderName}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
            </button>
            <button class="folder-action-btn" title="New Folder" onclick="createNewFolder('contracts/${folderName}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.11,6 20,6H12L10,4Z"/>
                </svg>
            </button>
        </div>
    `;
    
    const folderContent = document.createElement('div');
    folderContent.className = 'folder-content';
    
    files.forEach(filePath => {
        const fileName = filePath.split('/').pop();
        const fileElement = createFileElement(filePath, fileName);
        folderContent.appendChild(fileElement);
    });
    
    folderDiv.appendChild(folderHeader);
    folderDiv.appendChild(folderContent);
    
    return folderDiv;
}

// ОНОВЛЕНО: Налаштування обробників подій з підтримкою мультигаманців
function setupEventListeners() {
    
    // File Explorer - основні кнопки
    document.getElementById('create-file-main-btn').addEventListener('click', () => createNewFile('contracts'));
    document.getElementById('create-folder-main-btn').addEventListener('click', () => createNewFolder('contracts'));
    
    // File Explorer - кнопки в хедері
    const createFileBtn = document.getElementById('create-file-btn');
    const createFolderBtn = document.getElementById('create-folder-btn');
    if (createFileBtn) createFileBtn.addEventListener('click', () => createNewFile('contracts'));
    if (createFolderBtn) createFolderBtn.addEventListener('click', () => createNewFolder('contracts'));
    
    // Компіляція
    document.getElementById('compile-btn').addEventListener('click', compileContract);
    
    // Deploy & Run - ОНОВЛЕНО для підтримки мультигаманців
    document.getElementById('environment-select').addEventListener('change', handleEnvironmentChange);
    document.getElementById('contract-select').addEventListener('change', handleContractChange);
    document.getElementById('deployBtn.addEventListener('click', () => handleDeploy());
    document.getElementById('at-address-btn').addEventListener('click', loadContractAtAddress);
    
    // Термінал
    document.getElementById('clear-terminal-btn').addEventListener('click', clearTerminal);
    
    // ОНОВЛЕНО: Модальні вікна для мультигаманців
    const closeModalBtn = document.getElementById('close-modal-btn');
    const installMetaMaskBtn = document.getElementById('install-metamask-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideMetaMaskModal);
    }
    
    if (installMetaMaskBtn) {
        installMetaMaskBtn.addEventListener('click', () => {
            window.open('https://metamask.io/download/', '_blank');
        });
    }
    
    // // Глобальні hotkeys
    // document.addEventListener('keydown', (e) => {
    //     // Ctrl+S для збереження
    //     if (e.ctrlKey && e.key === 's') {
    //         e.preventDefault();
    //         saveCurrentFile();
    //     }
        
    //     // Ctrl+Shift+C для компіляції
    //     if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    //         e.preventDefault();
    //         compileContract();
    //     }
    // });
    
    // Закриття context menu при кліку
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            hideContextMenu();
        }
    });
    
}

// ПОКРАЩЕНО: Створення нового файлу з валідацією
function createNewFile(folderPath = 'contracts') {
    const fileName = prompt('Enter file name (e.g., NewContract):');
    if (!fileName) return;
    
    // Валідація назви файлу
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fileName.replace('.sol', ''))) {
        alert('Invalid file name. Use only letters, numbers, and underscores. Must start with a letter.');
        return;
    }
    
    // Автоматично додаємо .sol якщо немає
    const fullFileName = fileName.endsWith('.sol') ? fileName : fileName + '.sol';
    const fullPath = `${folderPath}/${fullFileName}`;
    
    if (fileContents[fullPath]) {
        alert('File already exists!');
        return;
    }
    
    // Створюємо пустий файл
    const defaultContent = '';
    
    // Додаємо в fileContents
    fileContents[fullPath] = defaultContent;
    saveFilesToStorage();
    
    // Оновлюємо UI
    generateFileExplorerFromStorage();

    // Примусово встановлюємо currentFile і оновлюємо редактор
    currentFile = fullPath;

    // Оновлення CodeMirror напряму
    if (window.codeEditor) {
        window.codeEditor.setValue("");
        window.codeEditor.clearHistory();
    }

    // Оновлення UI
    //document.getElementById('current-file-name').textContent = fullPath;
    updateEditorTabs();
    openFile(currentFile);

    // Оновлення активного файлу в explorer
    setTimeout(() => {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-file') === fullPath) {
                item.classList.add('active');
            }
        });
    }, 50);
    
    logToTerminal(`📁 Created new file: ${fullPath}`, 'success');
}

// Створення нової папки
function createNewFolder(parentPath = 'contracts') {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    // Валідація назви папки
    if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
        alert('Folder name can only contain letters, numbers, hyphens and underscores');
        return;
    }
    
    const folderPath = `${parentPath}/${folderName}`;
    
    // Створюємо папку шляхом додавання прихованого файлу
    fileContents[`${folderPath}/.placeholder`] = '// This is a placeholder file to create the folder structure';
    
    saveFilesToStorage();
    generateFileExplorerFromStorage();
    logToTerminal(`📂 Created new folder: ${folderPath}`, 'success');
}

// ВИПРАВЛЕНО: Відкриття файлу з кращим fallback
function openFile(filePath) {
    if (!(filePath in fileContents)) {
        logToTerminal(`❌ File not found: ${filePath}`, 'error');
        console.error('File not found in fileContents:', filePath);
        // Fallback: відкриваємо перший доступний файл
        const availableFiles = Object.keys(fileContents);
        if (availableFiles.length > 0) {
            const fallbackFile = availableFiles[0];
            openFile(fallbackFile);
        }
        return;
    }

    // Збереження поточного файлу
    if (currentFile && fileContents[currentFile] !== undefined && window.codeEditor) {
        const currentContent = window.codeEditor.getValue();
        if (currentContent !== fileContents[currentFile]) {
            fileContents[currentFile] = currentContent;
            saveFilesToStorage();
        }
    }
    
    currentFile = filePath;

    // Оновлення CodeMirror
    if (window.codeEditor) {
        window.codeEditor.setValue(fileContents[filePath]);
        window.codeEditor.clearHistory(); // Очищаємо історію undo/redo
    }
    
    // Оновлення UI
    //document.getElementById('current-file-name').textContent = filePath;
    
    // Оновлення активного файлу в explorer
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-file') === filePath) {
            item.classList.add('active');
        }
    });
    
    updateEditorTabs();
    updateCompilerVersion();
    
    // Очищення попередніх результатів компіляції
    clearCompilationResults();
    
    // Оновлення compile button
    const compileBtn = document.getElementById('compile-btn');
    const fileName = filePath.split('/').pop();
    compileBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
        </svg>
        Compile ${fileName}
    `;
}

// Оновлення табів редактора
function updateEditorTabs() {
    const tabsContainer = document.querySelector('.editor-tabs');
    const existingTabs = tabsContainer.querySelectorAll('.editor-tab');
    
    // Видалення всіх табів крім кнопки нового табу
    existingTabs.forEach(tab => {
        if (!tab.classList.contains('new-tab-btn')) {
            tab.remove();
        }
    });
    
    // Створення табу для поточного файлу
    const fileName = currentFile.split('/').pop();
    const tabElement = document.createElement('div');
    tabElement.className = 'editor-tab active';
    tabElement.setAttribute('data-file', currentFile);
    
    // Обробник кліку для перемикання між табами
    tabElement.addEventListener('click', () => {
        if (currentFile !== tabElement.getAttribute('data-file')) {
            openFile(tabElement.getAttribute('data-file'));
        }
    });
    
    tabElement.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        <span>${fileName}</span>
        <button class="tab-close" onclick="event.stopPropagation(); closeFile('${currentFile}')">×</button>
    `;
    
    // Вставка перед кнопкою нового табу
    const newTabBtn = tabsContainer.querySelector('.new-tab-btn');
    tabsContainer.insertBefore(tabElement, newTabBtn);
}

// Закриття файлу
function closeFile(filePath) {
    if (Object.keys(fileContents).length <= 1) {
        alert('Cannot close the last file');
        return;
    }
    
    delete fileContents[filePath];
    saveFilesToStorage();
    
    // Відкриття іншого файлу
    const remainingFiles = Object.keys(fileContents);
    if (remainingFiles.length > 0) {
        openFile(remainingFiles[0]);
    }
    
    generateFileExplorerFromStorage();
    logToTerminal(`❌ Closed file: ${filePath}`, 'info');
}

// Автоматичне оновлення версії компілятора
function updateCompilerVersion() {
    if (!currentFile || !fileContents[currentFile]) return;
    
    const sourceCode = fileContents[currentFile];
    const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+[\^~>=<\s]*([0-9]+\.[0-9]+\.[0-9]+)/);
    
    if (pragmaMatch) {
        const version = pragmaMatch[1];
        const compilerSelect = document.getElementById('compiler-version');
        
        // Знаходимо найближчу доступну версію
        const availableVersions = Array.from(compilerSelect.options).map(option => option.value);
        const exactMatch = availableVersions.find(v => v === version);
        
        if (exactMatch) {
            compilerSelect.value = exactMatch;
        }
    }
}

// Очищення результатів компіляції
function clearCompilationResults() {
    const compilationResult = document.getElementById('compilation-result');
    compilationResult.className = 'compilation-output';
    compilationResult.innerHTML = '<div class="output-placeholder">Select a Solidity file to compile</div>';
    
    const contractSelect = document.getElementById('contract-select');
    contractSelect.innerHTML = '<option value="">No compiled contracts</option>';
    
    window.compiledContract = null;
    window.currentContractABI = null;
    updateDeployButton();
}
