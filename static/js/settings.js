// settings.js - Плагін налаштувань

// Глобальні змінні для налаштувань
let currentSettings = {
    appearance: {
        theme: 'dark',
        terminalFontSize: 13
    },
    editor: {
        fontSize: 14,
        lineNumbers: true,
        wordWrap: false,
        autocomplete: true
    },
    compiler: {
        defaultVersion: '0.8.21',
        autoSave: true,
        optimizationDefault: true
    },
    network: {
        customRpc: '',
        defaultGasPrice: 20,
        autoGasEstimation: true
    }
};

let currentSettingsTab = 'appearance';

// Ініціалізація налаштувань
function initializeSettingsPlugin() {
    setupSettingsEventListeners();
    loadSettings();
    applySettings();
    updateSettingsUI();
}

// Налаштування обробників подій
function setupSettingsEventListeners() {
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const saveBtn = document.getElementById('save-settings');
    const resetBtn = document.getElementById('reset-settings');
    
    // Перемикання табів
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchSettingsTab(tab.getAttribute('data-tab'));
        });
    });
    
    // Збереження налаштувань
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Скидання налаштувань
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Налаштування обробників для кожної секції
    setupAppearanceListeners();
    setupEditorListeners();
    setupCompilerListeners();
    setupNetworkListeners();
}

const mq = window.matchMedia("(max-width: 950px)");

function applyRule(e) {
    if (e.matches) {
        applyTerminalFontSize(10);
        applyEditorFontSize(10);
        applyLineNumbers(false);
        applyWordWrap(true);

    } else {
       currentSettings.editor.lineNumbers = true;
        currentSettings.editor.wordWrap = false;
        currentSettings.appearance.terminalFontSize = 13;
        currentSettings.editor.fontSize = 14;
        applyTerminalFontSize(13);
        applyEditorFontSize(14);
        applyLineNumbers(true);
        applyWordWrap(false);

    }
}

// Запуск при загрузке


// Запуск при изменении ширины экрана
function waitForCodeEditor(callback) {
    const interval = setInterval(() => {
        if (window.codeEditor) {
            clearInterval(interval);
            callback(window.codeEditor);
        }
    }, 50); // Проверяем каждые 50мс
}

waitForCodeEditor((editor) => {
    applyRule(mq);
});

// Налаштування слухачів для секції Appearance
function setupAppearanceListeners() {
    const themeSelect = document.getElementById('theme-select');
    const terminalFontSize = document.getElementById('terminal-font-size');
    const terminalFontDisplay = document.getElementById('terminal-font-display');
    
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            currentSettings.appearance.theme = e.target.value;
            applyTheme(e.target.value);
        });
    }
    
    if (terminalFontSize) {
        terminalFontSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            currentSettings.appearance.terminalFontSize = size;
            if (terminalFontDisplay) {
                terminalFontDisplay.textContent = `${size}px`;
            }
            applyTerminalFontSize(size);
        });
    }
}

// Налаштування слухачів для секції Editor
function setupEditorListeners() {
    const editorFontSize = document.getElementById('editor-font-size');
    const editorFontDisplay = document.getElementById('editor-font-display');
    const lineNumbers = document.getElementById('line-numbers');
    const wordWrap = document.getElementById('word-wrap');
    const autocomplete = document.getElementById('autocomplete');
    
    if (editorFontSize) {
        editorFontSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            currentSettings.editor.fontSize = size;
            if (editorFontDisplay) {
                editorFontDisplay.textContent = `${size}px`;
            }
            applyEditorFontSize(size);
        });
    }
    
    if (lineNumbers) {
        lineNumbers.addEventListener('change', (e) => {
            currentSettings.editor.lineNumbers = e.target.checked;
            applyLineNumbers(e.target.checked);
        });
    }
    
    if (wordWrap) {
        wordWrap.addEventListener('change', (e) => {
            currentSettings.editor.wordWrap = e.target.checked;
            applyWordWrap(e.target.checked);
        });
    }
    
    if (autocomplete) {
        autocomplete.addEventListener('change', (e) => {
            currentSettings.editor.autocomplete = e.target.checked;
            applyAutocomplete(e.target.checked);
        });
    }
}

// Налаштування слухачів для секції Compiler
function setupCompilerListeners() {
    const defaultCompiler = document.getElementById('default-compiler');
    const autoSave = document.getElementById('auto-save');
    const optimizationDefault = document.getElementById('optimization-default');
    
    if (defaultCompiler) {
        defaultCompiler.addEventListener('change', (e) => {
            currentSettings.compiler.defaultVersion = e.target.value;
            applyDefaultCompiler(e.target.value);
        });
    }
    
    if (autoSave) {
        autoSave.addEventListener('change', (e) => {
            currentSettings.compiler.autoSave = e.target.checked;
        });
    }
    
    if (optimizationDefault) {
        optimizationDefault.addEventListener('change', (e) => {
            currentSettings.compiler.optimizationDefault = e.target.checked;
            applyOptimizationDefault(e.target.checked);
        });
    }
}

// Налаштування слухачів для секції Network
function setupNetworkListeners() {
    const customRpc = document.getElementById('custom-rpc');
    const defaultGasPrice = document.getElementById('default-gas-price');
    const autoGasEstimation = document.getElementById('auto-gas-estimation');
    
    if (customRpc) {
        customRpc.addEventListener('change', (e) => {
            currentSettings.network.customRpc = e.target.value;
        });
    }
    
    if (defaultGasPrice) {
        defaultGasPrice.addEventListener('change', (e) => {
            currentSettings.network.defaultGasPrice = parseInt(e.target.value);
        });
    }
    
    if (autoGasEstimation) {
        autoGasEstimation.addEventListener('change', (e) => {
            currentSettings.network.autoGasEstimation = e.target.checked;
        });
    }
}

// Перемикання табів налаштувань
function switchSettingsTab(tabName) {
    currentSettingsTab = tabName;
    
    // Оновлення активного табу
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Показ відповідної панелі
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
}

// Застосування налаштувань
function applySettings() {
    applyTheme(currentSettings.appearance.theme);
    applyTerminalFontSize(currentSettings.appearance.terminalFontSize);
    applyEditorFontSize(currentSettings.editor.fontSize);
    applyLineNumbers(currentSettings.editor.lineNumbers);
    applyWordWrap(currentSettings.editor.wordWrap);
    applyAutocomplete(currentSettings.editor.autocomplete);
    applyDefaultCompiler(currentSettings.compiler.defaultVersion);
    applyOptimizationDefault(currentSettings.compiler.optimizationDefault);
}

// Застосування теми
function applyTheme(theme) {
    const body = document.body;
    if (theme === 'light') {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    }
    //logToTerminal(`🎨 Theme changed to: ${theme}`, 'info');
}

// Застосування розміру шрифту терміналу
function applyTerminalFontSize(size) {
    const terminal = document.getElementById('terminal');
    if (terminal) {
        terminal.style.fontSize = `${size}px`;
    }
}

// Застосування розміру шрифту редактора
function applyEditorFontSize(size) {
    if (window.codeEditor) {
        const wrapper = window.codeEditor.getWrapperElement();
        wrapper.style.fontSize = `${size}px`;
        window.codeEditor.refresh();
    }
}

// Застосування показу номерів рядків
function applyLineNumbers(show) {
    if (window.codeEditor) {
        window.codeEditor.setOption('lineNumbers', show);
    }
}

// Застосування переносу рядків
function applyWordWrap(wrap) {
    if (window.codeEditor) {
        window.codeEditor.setOption('lineWrapping', wrap);
    }
}

// Застосування автодоповнення
function applyAutocomplete(enabled) {
    if (window.codeEditor) {
        const extraKeys = window.codeEditor.getOption('extraKeys') || {};
        if (enabled) {
            extraKeys['Ctrl-Space'] = 'autocomplete';
        } else {
            delete extraKeys['Ctrl-Space'];
        }
        window.codeEditor.setOption('extraKeys', extraKeys);
    }
}

// Застосування версії компілятора за замовчуванням
function applyDefaultCompiler(version) {
    const compilerSelect = document.getElementById('compiler-version');
    if (compilerSelect) {
        compilerSelect.value = version;
    }
}

// Застосування оптимізації за замовчуванням
function applyOptimizationDefault(enabled) {
    const optimizationCheckbox = document.getElementById('enable-optimization');
    if (optimizationCheckbox) {
        optimizationCheckbox.checked = enabled;
    }
}

// Оновлення UI налаштувань
function updateSettingsUI() {
    // Appearance
    const themeSelect = document.getElementById('theme-select');
    const terminalFontSize = document.getElementById('terminal-font-size');
    const terminalFontDisplay = document.getElementById('terminal-font-display');
    
    if (themeSelect) themeSelect.value = currentSettings.appearance.theme;
    if (terminalFontSize) terminalFontSize.value = currentSettings.appearance.terminalFontSize;
    if (terminalFontDisplay) terminalFontDisplay.textContent = `${currentSettings.appearance.terminalFontSize}px`;
    
    // Editor
    const editorFontSize = document.getElementById('editor-font-size');
    const editorFontDisplay = document.getElementById('editor-font-display');
    const lineNumbers = document.getElementById('line-numbers');
    const wordWrap = document.getElementById('word-wrap');
    const autocomplete = document.getElementById('autocomplete');
    
    if (editorFontSize) editorFontSize.value = currentSettings.editor.fontSize;
    if (editorFontDisplay) editorFontDisplay.textContent = `${currentSettings.editor.fontSize}px`;
    if (lineNumbers) lineNumbers.checked = currentSettings.editor.lineNumbers;
    if (wordWrap) wordWrap.checked = currentSettings.editor.wordWrap;
    if (autocomplete) autocomplete.checked = currentSettings.editor.autocomplete;
    
    // Compiler
    const defaultCompiler = document.getElementById('default-compiler');
    const autoSave = document.getElementById('auto-save');
    const optimizationDefault = document.getElementById('optimization-default');
    
    if (defaultCompiler) defaultCompiler.value = currentSettings.compiler.defaultVersion;
    if (autoSave) autoSave.checked = currentSettings.compiler.autoSave;
    if (optimizationDefault) optimizationDefault.checked = currentSettings.compiler.optimizationDefault;
    
    // Network
    const customRpc = document.getElementById('custom-rpc');
    const defaultGasPrice = document.getElementById('default-gas-price');
    const autoGasEstimation = document.getElementById('auto-gas-estimation');
    
    if (customRpc) customRpc.value = currentSettings.network.customRpc;
    if (defaultGasPrice) defaultGasPrice.value = currentSettings.network.defaultGasPrice;
    if (autoGasEstimation) autoGasEstimation.checked = currentSettings.network.autoGasEstimation;
}

// Збереження налаштувань
function saveSettings() {
    try {
        localStorage.setItem('remix-settings', JSON.stringify(currentSettings));
        logToTerminal('💾 Settings saved successfully', 'success');
        
        // Показуємо повідомлення про збереження
        showSettingsNotification('Settings saved!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        logToTerminal('❌ Failed to save settings', 'error');
        showSettingsNotification('Failed to save settings!', 'error');
    }
}

// Завантаження налаштувань
function loadSettings() {
    try {
        const saved = localStorage.getItem('remix-settings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
            // Мерджимо з дефолтними налаштуваннями
            currentSettings = {
                ...currentSettings,
                ...loadedSettings,
                appearance: { ...currentSettings.appearance, ...loadedSettings.appearance },
                editor: { ...currentSettings.editor, ...loadedSettings.editor },
                compiler: { ...currentSettings.compiler, ...loadedSettings.compiler },
                network: { ...currentSettings.network, ...loadedSettings.network }
            };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        logToTerminal('⚠️ Failed to load settings, using defaults', 'warning');
    }
}

// Скидання налаштувань
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        currentSettings = {
            appearance: {
                theme: 'dark',
                terminalFontSize: 13
            },
            editor: {
                fontSize: 14,
                lineNumbers: true,
                wordWrap: false,
                autocomplete: true
            },
            compiler: {
                defaultVersion: '0.8.21',
                autoSave: true,
                optimizationDefault: true
            },
            network: {
                customRpc: '',
                defaultGasPrice: 20,
                autoGasEstimation: true
            }
        };
        
        updateSettingsUI();
        applySettings();
        saveSettings();
        
        logToTerminal('🔄 Settings reset to defaults', 'info');
        showSettingsNotification('Settings reset to defaults!', 'info');
    }
}

// Показ повідомлення про налаштування
function showSettingsNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'settings-notification';
    notification.textContent = message;
    
    const colors = {
        success: '#51cf66',
        error: '#ff6b6b',
        info: '#74c0fc'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out forwards;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Отримання поточних налаштувань
function getCurrentSettings() {
    return { ...currentSettings };
}

// Оновлення конкретного налаштування
function updateSetting(section, key, value) {
    if (currentSettings[section]) {
        currentSettings[section][key] = value;
        saveSettings();
        
        // Застосовуємо зміни
        switch (section) {
            case 'appearance':
                if (key === 'theme') applyTheme(value);
                if (key === 'terminalFontSize') applyTerminalFontSize(value);
                break;
            case 'editor':
                if (key === 'fontSize') applyEditorFontSize(value);
                if (key === 'lineNumbers') applyLineNumbers(value);
                if (key === 'wordWrap') applyWordWrap(value);
                if (key === 'autocomplete') applyAutocomplete(value);
                break;
            case 'compiler':
                if (key === 'defaultVersion') applyDefaultCompiler(value);
                if (key === 'optimizationDefault') applyOptimizationDefault(value);
                break;
        }
    }
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeSettingsPlugin, 1000);
});

// Експорт функцій
window.settingsPlugin = {
    getCurrentSettings,
    updateSetting,
    saveSettings,
    resetSettings
};