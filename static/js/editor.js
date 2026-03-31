// editor.js - CodeMirror та робота з редактором коду

// Глобальні змінні для редактора
let codeEditor; // CodeMirror instance
let contextMenuTarget = null;

// НОВИЙ: Кастомний Solidity mode з кращою підсвіткою (офіційні кольори Remix)
function createCustomSolidityMode() {
    CodeMirror.defineMode("solidity", function() {
        // Solidity keywords з правильною категоризацією
        const keywords = {
            // Основні ключові слова - зелений
            "contract": "keyword", "library": "keyword", "interface": "keyword",
            "function": "keyword", "modifier": "keyword", "event": "keyword",
            "struct": "keyword", "enum": "keyword", "mapping": "keyword",
            "constructor": "keyword", "fallback": "keyword", "receive": "keyword",
            "require": "keyword", "assert": "keyword", "revert": "keyword",
            "return": "keyword", "returns": "keyword", "emit": "keyword",
            
            // Модифікатори видимості - зелений
            "public": "keyword", "private": "keyword", "internal": "keyword", "external": "keyword",
            
            // Модифікатори стану - фіолетовий (builtin)
            "view": "builtin", "pure": "builtin", "payable": "builtin", "constant": "builtin",
            "virtual": "builtin", "override": "builtin", "abstract": "builtin",
            
            // Типи даних - світло-синій
            "bool": "type", "string": "type", "address": "type", "bytes": "type",
            "uint": "type", "int": "type", "fixed": "type", "ufixed": "type",
            "uint8": "type", "uint16": "type", "uint32": "type", "uint64": "type",
            "uint128": "type", "uint256": "type", "int8": "type", "int16": "type",
            "int32": "type", "int64": "type", "int128": "type", "int256": "type",
            "bytes1": "type", "bytes2": "type", "bytes4": "type", "bytes8": "type",
            "bytes16": "type", "bytes32": "type",
            
            // Локації пам'яті - зелений
            "storage": "keyword", "memory": "keyword", "calldata": "keyword",
            
            // Контрольні структури - зелений
            "if": "keyword", "else": "keyword", "for": "keyword", "while": "keyword",
            "do": "keyword", "break": "keyword", "continue": "keyword",
            "try": "keyword", "catch": "keyword", "throw": "keyword",
            
            // Інше - зелений
            "pragma": "meta", "import": "meta", "using": "keyword", "is": "keyword",
            "assembly": "keyword", "delete": "keyword", "new": "keyword",
            
            // this, super - червоний (atom)
            "this": "atom", "super": "atom",
            
            // Глобальні змінні - фіолетовий (builtin)
            "msg": "builtin", "tx": "builtin", "block": "builtin", "now": "builtin",
            "selfdestruct": "builtin", "suicide": "builtin",
            
            // Криптографічні функції - фіолетовий (builtin)
            "keccak256": "builtin", "sha256": "builtin", "ripemd160": "builtin",
            "ecrecover": "builtin", "addmod": "builtin", "mulmod": "builtin",
            
            // Логічні значення - червоний (atom)
            "true": "atom", "false": "atom", "null": "atom"
        };
        
        return {
            token: function(stream, state) {
                // Пропуск пробілів
                if (stream.eatSpace()) return null;
                
                // Однорядкові коментарі
                if (stream.match(/\/\/.*/)) {
                    return "comment";
                }
                
                // Багаторядкові коментарі
                if (stream.match(/\/\*/)) {
                    state.inComment = true;
                    return "comment";
                }
                if (state.inComment) {
                    if (stream.match(/\*\//)) {
                        state.inComment = false;
                    } else {
                        stream.next();
                    }
                    return "comment";
                }
                
                // Рядки - жовтий
                if (stream.match(/^"([^"\\]|\\.)*"/)) return "string";
                if (stream.match(/^'([^'\\]|\\.)*'/)) return "string";
                
                // Hex числа - світло-синій
                if (stream.match(/^0x[a-fA-F0-9]+/)) return "number";
                
                // Десяткові числа - світло-синій
                if (stream.match(/^\d+(\.\d+)?(e[+-]?\d+)?/)) return "number";
                
                // Ether одиниці - світло-синій
                if (stream.match(/\b\d+(\.\d+)?\s*(wei|gwei|ether)\b/)) return "number";
                
                // Часові одиниці - світло-синій
                if (stream.match(/\b\d+\s*(seconds|minutes|hours|days|weeks|years)\b/)) return "number";
                
                // Адреси - жовтий (як рядки)
                if (stream.match(/^0x[a-fA-F0-9]{40}/)) return "string";
                
                // Ідентифікатори та ключові слова
                if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
                    const word = stream.current();
                    return keywords[word] || "variable";
                }
                
                // Оператори
                if (stream.match(/^[+\-*/%=<>!&|^~?:]/)) return "operator";
                
                // Пунктуація та дужки
                if (stream.match(/^[{}()\[\];,\.]/)) return "bracket";
                
                // Інші символи
                stream.next();
                return null;
            },
            
            startState: function() {
                return {
                    inComment: false
                };
            }
        };
    });
}

// ПОКРАЩЕНО: Налаштування CodeMirror редактора з красивими фічами
async function setupCodeEditor() {
    return new Promise((resolve) => {
        
        // Додаємо custom Solidity mode якщо його немає
        if (typeof CodeMirror.modes.solidity === 'undefined') {
            createCustomSolidityMode();
        }
        
        setTimeout(() => {
            initializeCodeMirror();
            resolve();
        }, 100);
    });
}
function initializeCodeMirror() {
    // Ініціалізація CodeMirror з покращеними налаштуваннями
    codeEditor = CodeMirror(document.getElementById('code-editor'), {
        mode: 'solidity',
        theme: 'material-darker',
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        styleActiveLine: true, // Підсвічування активного рядка
        selectionPointer: true,
        cursorBlinkRate: 530,
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-S": function(cm) {
                saveCurrentFile();
            },
            "Ctrl-Shift-C": function(cm) {
                compileContract();
            },
            "Ctrl-/": "toggleComment", // Коментування рядків
            "Ctrl-D": "duplicateLine", // Дублювання рядка
            "Alt-Up": "swapLineUp", // Переміщення рядка вгору
            "Alt-Down": "swapLineDown", // Переміщення рядка вниз
            "Ctrl-F": "findPersistent", // Пошук
            "F11": function(cm) {
                cm.setOption("fullScreen", !cm.getOption("fullScreen"));
            },
            "Esc": function(cm) {
                if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
            }
        },
        value: getDefaultContractContent()
    });
    
    // Налаштування додаткових фіч
    setupEditorFeatures();
    
    // Обробники подій для CodeMirror
    codeEditor.on('change', handleCodeChange);
    codeEditor.on('cursorActivity', updateEditorStatus);
    codeEditor.on('focus', handleEditorFocus);
    codeEditor.on('blur', handleEditorBlur);
    
    // Експортуємо в window для доступу з інших модулів
    window.codeEditor = codeEditor;
    
}

// НОВИЙ: Налаштування додаткових фіч редактора
function setupEditorFeatures() {
    // Додаємо command для дублювання рядка
    CodeMirror.commands.duplicateLine = function(cm) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        cm.replaceRange('\n' + line, { line: cursor.line, ch: line.length });
        cm.setCursor(cursor.line + 1, cursor.ch);
    };
    
    // Додаємо command для переміщення рядків
    CodeMirror.commands.swapLineUp = function(cm) {
        const cursor = cm.getCursor();
        if (cursor.line > 0) {
            const line = cm.getLine(cursor.line);
            const prevLine = cm.getLine(cursor.line - 1);
            cm.replaceRange(line + '\n' + prevLine, 
                { line: cursor.line - 1, ch: 0 }, 
                { line: cursor.line + 1, ch: 0 });
            cm.setCursor(cursor.line - 1, cursor.ch);
        }
    };
    
    CodeMirror.commands.swapLineDown = function(cm) {
        const cursor = cm.getCursor();
        if (cursor.line < cm.lastLine()) {
            const line = cm.getLine(cursor.line);
            const nextLine = cm.getLine(cursor.line + 1);
            cm.replaceRange(nextLine + '\n' + line, 
                { line: cursor.line, ch: 0 }, 
                { line: cursor.line + 2, ch: 0 });
            cm.setCursor(cursor.line + 1, cursor.ch);
        }
    };
    
    // Автодоповнення для Solidity
    setupSolidityAutocomplete();
    
    // Покращена підсвітка помилок
    setupErrorHighlighting();
}

// НОВИЙ: Автодоповнення для Solidity
function setupSolidityAutocomplete() {
    const solidityHints = [
        // Ключові слова
        'contract', 'library', 'interface', 'function', 'modifier', 'event',
        'struct', 'enum', 'mapping', 'constructor', 'fallback', 'receive',
        'public', 'private', 'internal', 'external', 'view', 'pure', 'payable',
        'virtual', 'override', 'abstract', 'storage', 'memory', 'calldata',
        
        // Типи
        'bool', 'string', 'address', 'bytes', 'uint', 'int', 'uint256', 'uint8',
        'uint16', 'uint32', 'uint64', 'uint128', 'int8', 'int16', 'int32',
        'int64', 'int128', 'int256', 'bytes1', 'bytes2', 'bytes4', 'bytes8',
        'bytes16', 'bytes32',
        
        // Глобальні змінні
        'msg.sender', 'msg.value', 'msg.data', 'msg.sig', 'msg.gas',
        'tx.origin', 'tx.gasprice', 'block.number', 'block.timestamp',
        'block.difficulty', 'block.coinbase', 'block.gaslimit', 'block.blockhash',
        
        // Функції
        'require', 'assert', 'revert', 'keccak256', 'sha256', 'ripemd160',
        'ecrecover', 'addmod', 'mulmod', 'selfdestruct', 'suicide',
        
        // Шаблони
        'pragma solidity ^0.8.0;',
        '// SPDX-License-Identifier: MIT',
        'constructor() {}',
        'function () public {}',
        'function () public view returns () {}',
        'modifier () { _; }',
        'event ()',
        'struct {}',
        'enum {}',
        'mapping(address => uint256)',
        'require(, "");',
        'emit ();'
    ];
    
    CodeMirror.registerHelper("hint", "solidity", function(cm) {
        const cursor = cm.getCursor();
        const token = cm.getTokenAt(cursor);
        const start = token.start;
        const end = cursor.ch;
        const word = token.string.slice(0, end - start);
        
        const completions = solidityHints.filter(hint => 
            hint.toLowerCase().startsWith(word.toLowerCase())
        );
        
        return {
            list: completions,
            from: CodeMirror.Pos(cursor.line, start),
            to: CodeMirror.Pos(cursor.line, end)
        };
    });
}

// НОВИЙ: Покращена підсвітка помилок
function setupErrorHighlighting() {
    let errorMarkers = [];
    
    // Функція для очищення помилок
    window.clearEditorErrors = function() {
        errorMarkers.forEach(marker => marker.clear());
        errorMarkers = [];
    };
    
    // Функція для додавання помилок
    window.highlightEditorErrors = function(errors) {
        clearEditorErrors();
        
        errors.forEach(error => {
            if (error.sourceLocation) {
                const start = error.sourceLocation.start;
                const end = error.sourceLocation.end;
                
                const startPos = codeEditor.posFromIndex(start);
                const endPos = codeEditor.posFromIndex(end);
                
                const marker = codeEditor.markText(startPos, endPos, {
                    className: 'syntax-error',
                    title: error.message,
                    css: 'background: rgba(255, 107, 107, 0.2); border-bottom: 2px wavy #ff6b6b;'
                });
                
                errorMarkers.push(marker);
            }
        });
    };
}

// НОВИЙ: Обробка фокусу редактора
function handleEditorFocus() {
    document.querySelector('.editor-content').classList.add('editor-focused');
}

function handleEditorBlur() {
    document.querySelector('.editor-content').classList.remove('editor-focused');
}

// ПОКРАЩЕНО: Обробка змін у коді з додатковими фічами
function handleCodeChange(cm, change) {
    if (currentFile) {
        fileContents[currentFile] = cm.getValue();
        saveFilesToStorage();
        
        // Позначаємо файл як змінений
        markFileAsModified(currentFile, true);
        
        // Очищаємо помилки при зміні коду
        if (window.clearEditorErrors) {
            clearEditorErrors();
        }
    }
    
    // Auto-compile з debounce
    if (document.getElementById('auto-compile')?.checked) {
        clearTimeout(window.autoCompileTimeout);
        window.autoCompileTimeout = setTimeout(compileContract, 2000);
    }
    

    if (currentFile) {
        saveCurrentFile();
    }
    
}

// ПОКРАЩЕНО: Оновлення статусу редактора з додатковою інформацією
function updateEditorStatus() {
    const cursor = codeEditor.getCursor();
    const selection = codeEditor.getSelection();
    const doc = codeEditor.getDoc();
    
    let statusText = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    
    if (selection) {
        const selectionLength = selection.length;
        statusText += ` | Selected: ${selectionLength} chars`;
    }
    
    const totalLines = doc.lineCount();
    const totalChars = doc.getValue().length;
    statusText += ` | Total: ${totalLines} lines, ${totalChars} chars`;
    
    const statusElement = document.getElementById('editor-status');
    if (statusElement) {
        statusElement.textContent = statusText;
    }
}

// ПОКРАЩЕНО: Збереження файлу з додатковими перевірками
function saveCurrentFile() {
    if (currentFile && codeEditor) {
        const currentContent = codeEditor.getValue();
        fileContents[currentFile] = currentContent;
        saveFilesToStorage();
        markFileAsModified(currentFile, false);
        
        // Додаємо timestamp збереження
        const timestamp = new Date().toLocaleTimeString();
        logToTerminal(`💾 File saved: ${currentFile} at ${timestamp}`, 'success');
        
        // Показуємо повідомлення про збереження
     
    }
}

// НОВИЙ: Показати повідомлення про збереження
function showSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = 'Saved!';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #51cf66, #40c057);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(64, 192, 87, 0.3);
        animation: saveNotification 2s ease-in-out forwards;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Позначення файлів як змінених
function markFileAsModified(filePath, isModified) {
    const fileElement = document.querySelector(`[data-file="${filePath}"]`);
    if (!fileElement) return;
    
    const existingIndicator = fileElement.querySelector('.file-modified');
    
    if (isModified && !existingIndicator) {
        const indicator = document.createElement('span');
        indicator.className = 'file-modified';
        indicator.textContent = '●';
        indicator.style.color = '#f6851b';
        indicator.style.marginLeft = '4px';
        fileElement.appendChild(indicator);
    } else if (!isModified && existingIndicator) {
        existingIndicator.remove();
    }
    
    // Оновлюємо також tab
    updateTabModifiedState(filePath, isModified);
}

function updateTabModifiedState(filePath, isModified) {
    const tab = document.querySelector(`[data-file="${filePath}"].editor-tab`);
    if (!tab) return;
    
    const existingIndicator = tab.querySelector('.tab-modified');
    
    if (isModified && !existingIndicator) {
        const indicator = document.createElement('span');
        indicator.className = 'tab-modified';
        indicator.textContent = '●';
        indicator.style.color = '#f6851b';
        indicator.style.marginLeft = '4px';
        tab.insertBefore(indicator, tab.querySelector('.tab-close'));
    } else if (!isModified && existingIndicator) {
        existingIndicator.remove();
    }
}

// Context menu функції
function showContextMenu(event, filePath) {
    const contextMenu = document.getElementById('file-context-menu');
    contextMenuTarget = filePath;
    
    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    // Закриття при кліку поза меню
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 10);
}

function hideContextMenu() {
    document.getElementById('file-context-menu').style.display = 'none';
    contextMenuTarget = null;
}

// Context menu actions
function renameFile() {
    if (!contextMenuTarget) return;
    
    const oldPath = contextMenuTarget;
    const oldName = oldPath.split('/').pop();
    const newName = prompt('Enter new name:', oldName);
    
    if (!newName || newName === oldName) return;
    
    // Валідація назви
    if (!/^[a-zA-Z][a-zA-Z0-9_]*\.sol$/.test(newName)) {
        alert('Invalid file name. Use format: ContractName.sol');
        return;
    }
    
    const newPath = oldPath.replace(oldName, newName);
    
    if (fileContents[newPath]) {
        alert('File with this name already exists!');
        return;
    }
    
    // Копіюємо контент
    fileContents[newPath] = fileContents[oldPath];
    delete fileContents[oldPath];
    
    // Оновлюємо поточний файл якщо він був перейменований
    if (currentFile === oldPath) {
        currentFile = newPath;
    }
    
    saveFilesToStorage();
    generateFileExplorerFromStorage();
    updateEditorTabs();
    
    logToTerminal(`✏️ Renamed: ${oldPath} → ${newPath}`, 'success');
    hideContextMenu();
}

function duplicateFile() {
    if (!contextMenuTarget) return;
    
    const originalPath = contextMenuTarget;
    const originalName = originalPath.split('/').pop();
    const baseName = originalName.replace('.sol', '');
    const extension = '.sol';
    
    let counter = 1;
    let newPath;
    
    // Знаходимо вільне ім'я
    do {
        const newName = `${baseName}_copy${counter}${extension}`;
        newPath = originalPath.replace(originalName, newName);
        counter++;
    } while (fileContents[newPath]);
    
    // Копіюємо контент
    fileContents[newPath] = fileContents[originalPath];
    
    saveFilesToStorage();
    generateFileExplorerFromStorage();
    openFile(newPath);
    
    logToTerminal(`📋 Duplicated: ${originalPath} → ${newPath}`, 'success');
    hideContextMenu();
}

function deleteFile() {
    if (!contextMenuTarget) return;
    
    const filePath = contextMenuTarget;
    
    if (Object.keys(fileContents).length <= 1) {
        alert('Cannot delete the last file!');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;
    
    delete fileContents[filePath];
    
    // Якщо це поточний файл, відкриваємо інший
    if (currentFile === filePath) {
        const remainingFiles = Object.keys(fileContents);
        if (remainingFiles.length > 0) {
            openFile(remainingFiles[0]);
        }
    }
    
    saveFilesToStorage();
    generateFileExplorerFromStorage();
    updateEditorTabs();
    
    logToTerminal(`🗑️ Deleted: ${filePath}`, 'warning');
    hideContextMenu();
}