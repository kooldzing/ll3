// terminal.js - Логування та термінал

// ОНОВЛЕНО: Красиве логування в термінал з підтримкою HTML та емодзі
function logToTerminal(message, type = 'log') {
    const terminal = document.getElementById('terminal');
    if (!terminal) {
        return;
    }
    
    const logDiv = document.createElement('div');
    logDiv.className = `terminal-log terminal-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logDiv.innerHTML = `<span style="opacity: 0.7;">[${timestamp}]</span> ${message}`;
    
    terminal.appendChild(logDiv);
    terminal.scrollTop = terminal.scrollHeight;
    
    // Також логуємо в консоль для розробки
    
    // Обмеження кількості логів для продуктивності
    const logs = terminal.querySelectorAll('.terminal-log');
    if (logs.length > 1000) {
        // Видаляємо старі логи
        for (let i = 0; i < 100; i++) {
            if (logs[i]) {
                logs[i].remove();
            }
        }
    }
}

// Очищення терміналу
function clearTerminal() {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    
    terminal.innerHTML = '';
    logToTerminal('🧹 Terminal cleared', 'info');
}

// Логування з різними типами та форматуванням
const Terminal = {
    // Успішні операції
    success: (message) => logToTerminal(message, 'success'),
    
    // Помилки
    error: (message) => logToTerminal(message, 'error'),
    
    // Інформаційні повідомлення
    info: (message) => logToTerminal(message, 'info'),
    
    // Попередження
    warning: (message) => logToTerminal(message, 'warning'),
    
    // Звичайні логи
    log: (message) => logToTerminal(message, 'log'),
    
    // Логування об'єктів з форматуванням
    object: (obj, label = 'Object') => {
        try {
            const formatted = JSON.stringify(obj, null, 2);
            logToTerminal(`${label}: <pre style="margin: 4px 0; font-size: 10px; background: rgba(255,255,255,0.1); padding: 4px; border-radius: 2px; overflow-x: auto;">${formatted}</pre>`, 'info');
        } catch (error) {
            logToTerminal(`${label}: [Object - cannot stringify]`, 'warning');
        }
    },
    
    // Логування з кодом
    code: (code, language = '') => {
        logToTerminal(`<pre style="margin: 4px 0; font-size: 10px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; border-left: 3px solid #007acc; overflow-x: auto;"><code>${code}</code></pre>`, 'info');
    },
    
    // Логування транзакційних хешів з посиланнями
    transaction: (txHash, description = 'Transaction', chainId = null) => {
        if (chainId && getEtherscanUrl) {
            const link = createEtherscanLink(chainId, 'tx', txHash, 'View on Etherscan');
            logToTerminal(`🔗 ${description}: ${link}`, 'success');
        } else {
            logToTerminal(`📋 ${description}: <code>${txHash}</code>`, 'success');
        }
    },
    
    // Логування адрес контрактів
    contract: (address, name = 'Contract', chainId = null) => {
        if (chainId && getEtherscanUrl) {
            const link = createEtherscanLink(chainId, 'address', address, 'View Contract on Etherscan');
            logToTerminal(`📄 ${name}: ${link}`, 'info');
        } else {
            logToTerminal(`📄 ${name}: <code>${address}</code>`, 'info');
        }
    },
    
    // Логування з прогрес-баром (для довгих операцій)
    progress: (message, percentage = null) => {
        let progressHtml = message;
        if (percentage !== null) {
            const progressBar = `<div style="width: 100px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 4px 0; overflow: hidden;"><div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #007acc, #00d4aa); border-radius: 2px; transition: width 0.3s;"></div></div>`;
            progressHtml += progressBar;
        }
        logToTerminal(progressHtml, 'info');
    },
    
    // Логування важливих подій з виділенням
    highlight: (message) => {
        logToTerminal(`<div style="background: linear-gradient(135deg, rgba(0,122,204,0.2), rgba(0,212,170,0.2)); padding: 8px; border-radius: 6px; border-left: 4px solid #007acc; margin: 4px 0;">${message}</div>`, 'info');
    },
    
    // Логування таблиць
    table: (data, title = 'Data') => {
        if (!Array.isArray(data) || data.length === 0) {
            logToTerminal(`${title}: No data to display`, 'warning');
            return;
        }
        
        try {
            const headers = Object.keys(data[0]);
            let tableHtml = `<div style="margin: 8px 0;"><strong>${title}:</strong><table style="margin-top: 4px; border-collapse: collapse; font-size: 10px; width: 100%;">`;
            
            // Заголовки
            tableHtml += '<tr>';
            headers.forEach(header => {
                tableHtml += `<th style="border: 1px solid #444; padding: 4px; background: rgba(255,255,255,0.1); text-align: left;">${header}</th>`;
            });
            tableHtml += '</tr>';
            
            // Дані (обмежуємо до 10 рядків)
            data.slice(0, 10).forEach(row => {
                tableHtml += '<tr>';
                headers.forEach(header => {
                    const value = row[header] || '';
                    const displayValue = String(value).length > 20 ? String(value).substring(0, 20) + '...' : value;
                    tableHtml += `<td style="border: 1px solid #444; padding: 4px;">${displayValue}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            if (data.length > 10) {
                tableHtml += `<tr><td colspan="${headers.length}" style="padding: 4px; text-align: center; font-style: italic;">... and ${data.length - 10} more rows</td></tr>`;
            }
            
            tableHtml += '</table></div>';
            logToTerminal(tableHtml, 'info');
        } catch (error) {
            logToTerminal(`${title}: Error displaying table data`, 'error');
        }
    },
    
    // Очищення терміналу
    clear: clearTerminal
};

// Експортуємо Terminal об'єкт глобально для зручності
window.Terminal = Terminal;

// Логування стартапу системи
function logStartupInfo() {
    logToTerminal('🚀 CODE COMPILER Terminal initialized', 'success');
    /*logToTerminal('💡 Available methods: Terminal.success(), Terminal.error(), Terminal.info(), Terminal.warning()', 'info');
    
    // Інформація про браузер та систему
    const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    };
    
    logToTerminal(`🌐 Browser: ${browserInfo.userAgent.split(' ').slice(-2).join(' ')}`, 'info');
    logToTerminal(`🗣️ Language: ${browserInfo.language}`, 'info');
    
    // Перевірка доступних API
    const apis = {
        localStorage: typeof Storage !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        webSockets: typeof WebSocket !== 'undefined',
        webGL: !!document.createElement('canvas').getContext('webgl'),
        ethereum: typeof window.ethereum !== 'undefined'
    };
    
    Object.entries(apis).forEach(([api, available]) => {
        const status = available ? '✅' : '❌';
        logToTerminal(`${status} ${api}: ${available ? 'Available' : 'Not available'}`, 'info');
    });*/
}

// Статистика терміналу
function getTerminalStats() {
    const terminal = document.getElementById('terminal');
    if (!terminal) return null;
    
    const logs = terminal.querySelectorAll('.terminal-log');
    const stats = {
        total: logs.length,
        success: terminal.querySelectorAll('.terminal-success').length,
        error: terminal.querySelectorAll('.terminal-error').length,
        warning: terminal.querySelectorAll('.terminal-warning').length,
        info: terminal.querySelectorAll('.terminal-info').length
    };
    
    return stats;
}

// Команда для показу статистики
Terminal.stats = () => {
    const stats = getTerminalStats();
    if (stats) {
        Terminal.table([stats], 'Terminal Statistics');
    } else {
        Terminal.error('Cannot get terminal statistics');
    }
};

// Команда для експорту логів
Terminal.export = () => {
    const terminal = document.getElementById('terminal');
    if (!terminal) {
        Terminal.error('Terminal not found');
        return;
    }
    
    const logs = Array.from(terminal.querySelectorAll('.terminal-log')).map(log => {
        return log.textContent.trim();
    });
    
    const logData = logs.join('\n');
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `remix-ide-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Terminal.success('Logs exported successfully');
};

// Автоматичне логування помилок JavaScript
window.addEventListener('error', (event) => {
    Terminal.error(`JavaScript Error: ${event.message} at ${event.filename}:${event.lineno}`);
});

// Автоматичне логування необроблених promise rejections
window.addEventListener('unhandledrejection', (event) => {
    Terminal.error(`Unhandled Promise Rejection: ${event.reason}`);
});

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    // Невелика затримка для забезпечення завантаження всього DOM
    setTimeout(logStartupInfo, 500);
});

// Додаткові утиліти для форматування
const TerminalUtils = {
    // Форматування розміру файлу
    formatFileSize: (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    // Форматування часу
    formatDuration: (ms) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    },
    
    // Форматування числа з комами
    formatNumber: (num) => {
        return num.toLocaleString();
    },
    
    // Форматування Ethereum адреси
    formatAddress: (address) => {
        if (!address || address.length < 10) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    
    // Форматування hash
    formatHash: (hash) => {
        if (!hash || hash.length < 10) return hash;
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
    }
};

// Експортуємо утиліти
window.TerminalUtils = TerminalUtils;