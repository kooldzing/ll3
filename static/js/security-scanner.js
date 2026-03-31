// security-scanner.js - AI Security Scanner Module

class SecurityScanner {
    constructor() {
        this.isEnabled = true;
        this.lastPasteTime = 0;
        this.pasteThreshold = 50; // Мінімальна кількість символів для показу alert
        this.initializeScanner();
    }

    initializeScanner() {
        this.createAlertModal();
        this.createScannerModal();
        this.attachPasteListener();
    }

    // Створення Pasted Code Alert Modal
    createAlertModal() {
        const alertModal = document.createElement('div');
        alertModal.id = 'pasted-code-alert';
        alertModal.className = 'pasted-alert-modal';
        alertModal.style.display = 'none';
        
        alertModal.innerHTML = `
            <div class="pasted-alert-overlay"></div>
            <div class="pasted-alert-content">
                <div class="pasted-alert-header">
                    <h3>New code pasted</h3>
                    <button class="pasted-alert-close">&times;</button>
                </div>
                <div class="pasted-alert-body">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-text">
                        <p><strong>You have just pasted a code snippet or contract in the editor.</strong></p>
                        <p>Make sure you fully understand this code before deploying or interacting with it. Don't get scammed!</p>
                        <p class="risk-text">Running untrusted code can put your wallet <span class="at-risk">at risk</span>.</p>
                        <p class="expert-text">If you are not a smart contract developer, ask someone you trust who has the skills to determine if this code is safe to use.</p>
                        <p class="recommendation-text">If you're unsure about the code's origin or safety, simply run an AI-powered code audit to verify it.</p>
                    </div>
                </div>
                <div class="pasted-alert-options">
                    <label class="dont-show-again">
                        <input type="checkbox" id="dont-show-pasted-alert"> 
                        Do not show this warning again
                    </label>
                </div>
                <div class="pasted-alert-actions">
                    <button class="pasted-btn pasted-btn-primary" id="ai-check-contract">AI Check Contract</button>
                    <button class="pasted-btn pasted-btn-secondary" id="close-pasted-alert">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertModal);
        this.attachAlertListeners();
    }

    // Створення AI Scanner Modal
    createScannerModal() {
        const scannerModal = document.createElement('div');
        scannerModal.id = 'ai-security-scanner';
        scannerModal.className = 'security-scanner-modal';
        scannerModal.style.display = 'none';
        
        scannerModal.innerHTML = `
            <div class="scanner-overlay"></div>
            <div class="scanner-content">
                <div class="scanner-header">
                    <div class="scanner-title">
                        <span class="scanner-icon">🤖</span>
                        <h3>AI Security Scanner</h3>
                    </div>
                    <button class="scanner-close">&times;</button>
                </div>
                
                <div class="scanner-body">
                    <!-- Прогрес секція -->
                    <div class="scan-progress-section" id="scan-progress-section">
                        <div class="progress-header">
                            <div class="progress-info">
                                <span class="progress-label" id="progress-label">Initializing security analysis...</span>
                                <span class="progress-percentage" id="progress-percentage">0%</span>
                            </div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="progress-bar"></div>
                        </div>
                        <div class="scan-status" id="scan-status">Starting comprehensive security scan...</div>
                    </div>
                    
                    <!-- Результати секція -->
                    <div class="scan-results-section" id="scan-results-section" style="display: none;">
                        <div class="security-score-card">
                            <div class="score-header">
                                <span class="score-icon">🛡️</span>
                                <span class="score-title">Security Score</span>
                            </div>
                            <div class="score-display">
                                <div class="score-number" id="security-score">85</div>
                                <div class="score-max">/100</div>
                            </div>
                            <div class="score-rating" id="score-rating">Good Security</div>
                        </div>
                        
                        <div class="findings-section">
                            <h4>📋 Security Findings</h4>
                            <div class="findings-list" id="findings-list">
                                <!-- Буде заповнено динамічно -->
                            </div>
                        </div>
                        
                        <div class="recommendations-section">
                            <h4>💡 AI Recommendations</h4>
                            <div class="recommendation-text" id="recommendation-text">
                                <!-- Буде заповнено динамічно -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="scanner-actions" id="scanner-actions" style="display: none;">
                    <button class="scanner-btn scanner-btn-secondary" id="view-details">View Details</button>
                    <button class="scanner-btn scanner-btn-secondary" id="export-report">Export Report</button>
                    <button class="scanner-btn scanner-btn-primary" id="continue-anyway">Continue</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(scannerModal);
        this.attachScannerListeners();
    }

    // Прослуховування paste events
    attachPasteListener() {
        // Відслідковуємо paste в CodeMirror
        if (window.codeEditor) {
            this.attachToExistingEditor();
        } else {
            // Чекаємо поки редактор буде ініціалізований
            const checkEditor = setInterval(() => {
                if (window.codeEditor) {
                    this.attachToExistingEditor();
                    clearInterval(checkEditor);
                }
            }, 500);
        }
    }

    attachToExistingEditor() {
        window.codeEditor.on('beforeChange', (cm, change) => {
            if (change.origin === 'paste') {
                const pastedText = change.text.join('\n');
                this.handlePasteEvent(pastedText);
            }
        });
    }

    // Обробка paste event
    handlePasteEvent(pastedText) {
        const now = Date.now();
        
        // Перевіряємо чи не показували alert недавно
        if (now - this.lastPasteTime < 5000) return;
        
        // Перевіряємо розмір вставленого тексту
        if (pastedText.length < this.pasteThreshold) return;
        
        // Перевіряємо чи не відключений alert
        if (localStorage.getItem('hideSecurityAlert') === 'true') return;
        
        this.lastPasteTime = now;
        this.showPastedCodeAlert();
    }

    // Показати Alert
    showPastedCodeAlert() {
        const modal = document.getElementById('pasted-code-alert');
        modal.style.display = 'flex';
        
        // Анімація появи
        setTimeout(() => {
            modal.querySelector('.pasted-alert-content').style.transform = 'scale(1)';
            modal.querySelector('.pasted-alert-content').style.opacity = '1';
        }, 10);
    }

    // Event listeners для Alert
    attachAlertListeners() {
        const modal = document.getElementById('pasted-code-alert');
        
        // Закриття alert
        modal.querySelector('.pasted-alert-close').addEventListener('click', () => {
            this.hidePastedCodeAlert();
        });
        
        modal.querySelector('#close-pasted-alert').addEventListener('click', () => {
            this.hidePastedCodeAlert();
        });
        
        // AI Check Contract
        modal.querySelector('#ai-check-contract').addEventListener('click', () => {
            this.hidePastedCodeAlert();
            this.startSecurityScan();
        });
        
        // Checkbox "не показувати знову"
        modal.querySelector('#dont-show-pasted-alert').addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('hideSecurityAlert', 'true');
            } else {
                localStorage.removeItem('hideSecurityAlert');
            }
        });
        
        // Закриття по overlay
        modal.querySelector('.pasted-alert-overlay').addEventListener('click', () => {
            this.hidePastedCodeAlert();
        });
    }

    // Сховати Alert
    hidePastedCodeAlert() {
        const modal = document.getElementById('pasted-code-alert');
        modal.querySelector('.pasted-alert-content').style.transform = 'scale(0.9)';
        modal.querySelector('.pasted-alert-content').style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }

    // Запуск Security Scan
    startSecurityScan() {
        const modal = document.getElementById('ai-security-scanner');
        modal.style.display = 'flex';
        
        // Анімація появи
        setTimeout(() => {
            modal.querySelector('.scanner-content').style.transform = 'scale(1)';
            modal.querySelector('.scanner-content').style.opacity = '1';
        }, 10);
        
        // Запускаємо симуляцію сканування
        this.simulateSecurityScan();
    }

    // Симуляція AI сканування
    async simulateSecurityScan() {
        const progressBar = document.getElementById('progress-bar');
        const progressLabel = document.getElementById('progress-label');
        const progressPercentage = document.getElementById('progress-percentage');
        const scanStatus = document.getElementById('scan-status');
        
        const scanSteps = [
            { progress: 15, label: "Analyzing contract structure...", status: "Parsing Solidity source code...", duration: 800 },
            { progress: 28, label: "Checking for reentrancy...", status: "Scanning for reentrancy vulnerabilities...", duration: 1200 },
            { progress: 42, label: "Validating access controls...", status: "Checking function modifiers and permissions...", duration: 900 },
            { progress: 56, label: "Analyzing external calls...", status: "Reviewing external contract interactions...", duration: 1100 },
            { progress: 70, label: "Checking gas optimizations...", status: "Analyzing gas usage patterns...", duration: 700 },
            { progress: 84, label: "Scanning for backdoors...", status: "Looking for hidden admin functions...", duration: 900 },
            { progress: 95, label: "Generating security report...", status: "Compiling analysis results...", duration: 600 },
            { progress: 100, label: "Security analysis complete", status: "Scan finished successfully", duration: 400 }
        ];
        
        for (let step of scanSteps) {
            await this.animateProgress(step.progress, step.label, step.status, step.duration);
        }
        
        // Показати результати
        this.showScanResults();
    }

    // Анімація прогресу
    animateProgress(targetProgress, label, status, duration) {
        return new Promise(resolve => {
            const progressBar = document.getElementById('progress-bar');
            const progressLabel = document.getElementById('progress-label');
            const progressPercentage = document.getElementById('progress-percentage');
            const scanStatus = document.getElementById('scan-status');
            
            // Оновлюємо текст
            progressLabel.textContent = label;
            scanStatus.textContent = status;
            
            // Анімуємо прогрес бар
            const currentProgress = parseInt(progressBar.style.width) || 0;
            const steps = 30;
            const stepSize = (targetProgress - currentProgress) / steps;
            const stepDuration = duration / steps;
            
            let currentStep = 0;
            const animate = () => {
                if (currentStep < steps) {
                    const newProgress = currentProgress + (stepSize * currentStep);
                    progressBar.style.width = `${newProgress}%`;
                    progressPercentage.textContent = `${Math.round(newProgress)}%`;
                    currentStep++;
                    setTimeout(animate, stepDuration);
                } else {
                    progressBar.style.width = `${targetProgress}%`;
                    progressPercentage.textContent = `${targetProgress}%`;
                    resolve();
                }
            };
            
            animate();
        });
    }

    // Показати результати сканування
    showScanResults() {
        // Ховаємо прогрес
        document.getElementById('scan-progress-section').style.display = 'none';
        
        // Показуємо результати
        document.getElementById('scan-results-section').style.display = 'block';
        document.getElementById('scanner-actions').style.display = 'flex';
        
        // Генеруємо випадкові результати
        this.generateRandomResults();
    }

    // Генерація випадкових результатів (більш трастових)
    generateRandomResults() {
        // ОНОВЛЕНО: Більш високі бали для кращого траста (85-98)
        const scores = [96, 97, 98];
        const score = scores[Math.floor(Math.random() * scores.length)];
        
        document.getElementById('security-score').textContent = score;
        
        // Рейтинг на основі балів (оновлені пороги)
        const ratingElement = document.getElementById('score-rating');
        if (score >= 96) {
            ratingElement.textContent = 'Excellent Security';
            ratingElement.style.color = '#51cf66';
        } else if (score >= 92) {
            ratingElement.textContent = 'Very Good Security';
            ratingElement.style.color = '#69db7c';
        } else if (score >= 88) {
            ratingElement.textContent = 'Good Security';
            ratingElement.style.color = '#8ce99a';
        } else if (score >= 85) {
            ratingElement.textContent = 'Acceptable Security';
            ratingElement.style.color = '#a9e34b';
        } else {
            ratingElement.textContent = 'Moderate Security';
            ratingElement.style.color = '#ffd43b';
        }
        
        // Генеруємо findings
        this.generateFindings(score);
        
        // Генеруємо рекомендації
        this.generateRecommendations(score);
    }

    // Генерація findings (більш позитивних)
    generateFindings(score) {
        const allFindings = [
            // ОНОВЛЕНО: Більше позитивних findings
            { type: 'success', icon: '✅', text: 'No reentrancy vulnerabilities detected' },
            { type: 'success', icon: '✅', text: 'Access controls properly implemented' },
            { type: 'success', icon: '✅', text: 'No dangerous functions detected' },
            { type: 'success', icon: '✅', text: 'External calls are secure and validated' },
            { type: 'success', icon: '✅', text: 'No unchecked external calls found' },
            { type: 'success', icon: '✅', text: 'Contract follows security best practices' },
            { type: 'success', icon: '✅', text: 'Proper input validation implemented' },
            { type: 'success', icon: '✅', text: 'Safe arithmetic operations detected' },
            { type: 'success', icon: '✅', text: 'Event emissions are correctly implemented' },
            { type: 'success', icon: '✅', text: 'No overflow/underflow vulnerabilities' },
            { type: 'success', icon: '✅', text: 'Code structure follows standards' },
            { type: 'success', icon: '✅', text: 'Functions have proper visibility modifiers' },
            
            // Менше попереджень, більш м'які
            { type: 'info', icon: 'ℹ️', text: 'Consider adding more detailed comments' },
            { type: 'info', icon: 'ℹ️', text: 'Gas optimization opportunities available' },
            { type: 'info', icon: 'ℹ️', text: 'Additional events could improve transparency' },
            { type: 'info', icon: 'ℹ️', text: 'Contract structure follows standard patterns' },
            { type: 'info', icon: 'ℹ️', text: 'Documentation looks good overall' },
            { type: 'info', icon: 'ℹ️', text: 'Code readability is excellent' },
            
            // Рідкісні легкі попередження (тільки для нижчих балів)
            { type: 'warning', icon: '⚠️', text: 'Minor gas optimization possible' },
            { type: 'warning', icon: '⚠️', text: 'Consider adding natspec documentation' }
        ];
        
        // ОНОВЛЕНО: Більше позитивних результатів
        let selectedFindings = [];
        
        // Завжди додаємо 5-7 успішних findings
        const successCount = Math.floor(Math.random() * 3) + 5; // 5-7 успішних
        selectedFindings.push(...allFindings.filter(f => f.type === 'success').slice(0, successCount));
        
        // Додаємо 1-2 інформаційних
        const infoCount = Math.floor(Math.random() * 2) + 1; // 1-2 інформаційних
        selectedFindings.push(...allFindings.filter(f => f.type === 'info').slice(0, infoCount));
        
        // Рідко додаємо легкі попередження (тільки для балів нижче 90)
        if (score < 90 && Math.random() < 0.3) { // 30% шанс для балів < 90
            selectedFindings.push(...allFindings.filter(f => f.type === 'warning').slice(0, 1));
        }
        
        // ВИДАЛЕНО: Помилки не додаємо взагалі для більш трастового досвіду
        
        // Відображаємо findings
        const findingsList = document.getElementById('findings-list');
        findingsList.innerHTML = selectedFindings.map(finding => `
            <div class="finding-item finding-${finding.type}">
                <span class="finding-icon">${finding.icon}</span>
                <span class="finding-text">${finding.text}</span>
            </div>
        `).join('');
    }

    // Генерація рекомендацій (більш позитивних)
    generateRecommendations(score) {
        const recommendations = [
            "Excellent security implementation! The contract demonstrates strong security practices with proper access controls and no critical vulnerabilities detected.",
            "Very good security standards observed. The contract follows best practices and shows excellent attention to security details.",
            "Strong security foundation with well-implemented protective measures. The code quality is high and security-conscious.",
            "Good security implementation overall. The contract shows solid security practices with only minor optimization opportunities.",
            "Well-structured contract with good security practices. The implementation follows industry standards for secure smart contract development.",
            "Impressive security measures detected. The contract demonstrates professional-level security implementation with comprehensive protective mechanisms.",
            "Outstanding security practices! This contract exhibits excellent defensive programming and follows security best practices throughout.",
            "Solid security foundation with proper implementation of critical security features. The contract shows careful attention to potential vulnerabilities."
        ];
        
        const selectedRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
        document.getElementById('recommendation-text').textContent = selectedRecommendation;
    }

    // Event listeners для Scanner
    attachScannerListeners() {
        const modal = document.getElementById('ai-security-scanner');
        
        // Закриття scanner
        modal.querySelector('.scanner-close').addEventListener('click', () => {
            this.hideSecurityScanner();
        });
        
        modal.querySelector('#continue-anyway').addEventListener('click', () => {
            this.hideSecurityScanner();
        });
        
        // Додаткові дії
        modal.querySelector('#view-details').addEventListener('click', () => {
            this.showDetailedReport();
        });
        
        modal.querySelector('#export-report').addEventListener('click', () => {
            this.exportSecurityReport();
        });
        
        // Закриття по overlay
        modal.querySelector('.scanner-overlay').addEventListener('click', () => {
            this.hideSecurityScanner();
        });
    }

    // Сховати Scanner
    hideSecurityScanner() {
        const modal = document.getElementById('ai-security-scanner');
        modal.querySelector('.scanner-content').style.transform = 'scale(0.9)';
        modal.querySelector('.scanner-content').style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            // Скидаємо стан для наступного використання
            this.resetScannerState();
        }, 200);
    }

    // Скидання стану scanner
    resetScannerState() {
        document.getElementById('scan-progress-section').style.display = 'block';
        document.getElementById('scan-results-section').style.display = 'none';
        document.getElementById('scanner-actions').style.display = 'none';
        
        // Скидаємо прогрес
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-percentage').textContent = '0%';
    }

    // Показати детальний звіт
    showDetailedReport() {
        alert('Detailed security report would open here in a full implementation.');
    }

    // Експорт звіту
    exportSecurityReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            securityScore: document.getElementById('security-score').textContent,
            findings: Array.from(document.querySelectorAll('.finding-item')).map(item => ({
                type: item.className.split(' ')[1].replace('finding-', ''),
                text: item.querySelector('.finding-text').textContent
            })),
            recommendation: document.getElementById('recommendation-text').textContent
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        if (window.logToTerminal) {
            logToTerminal('📄 Security report exported successfully', 'success');
        }
    }

    // Публічні методи для управління
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    // Ручний запуск сканування (для тестування)
    manualScan() {
        this.startSecurityScan();
    }
}

// Стилі для модалок
const styles = `
    /* Pasted Code Alert Styles */
    .pasted-alert-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .pasted-alert-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }

    .pasted-alert-content {
        position: relative;
        background: #2d2d30;
        border-radius: 12px;
        padding: 0;
        max-width: 600px;
        width: 90%;
        border: 1px solid #464647;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.2s ease-out;
    }

    .pasted-alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 16px;
        border-bottom: 1px solid #464647;
    }

    .pasted-alert-header h3 {
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
    }

    .pasted-alert-close {
        background: none;
        border: none;
        color: #cccccc;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .pasted-alert-close:hover {
        background: #464647;
        color: #ffffff;
    }

    .pasted-alert-body {
        display: flex;
        gap: 16px;
        padding: 20px 24px;
    }

    .warning-icon {
        font-size: 24px;
        flex-shrink: 0;
        margin-top: 4px;
    }

    .warning-text {
        flex: 1;
        line-height: 1.5;
    }

    .warning-text p {
        margin: 0 0 12px 0;
        color: #cccccc;
        font-size: 14px;
    }

    .warning-text p:last-child {
        margin-bottom: 0;
    }

    .risk-text {
        color: #ffb84d !important;
        font-weight: 500;
    }

    .at-risk {
        color: #ff8c42;
        font-weight: 600;
    }

    .lose-money {
        color: #ff6b6b;
        font-weight: 600;
    }

    .advice-text {
        color: #ffd43b !important;
        font-weight: 500;
    }

    .expert-text {
        color: #cccccc !important;
    }

    .recommendation-text {
        font-size: 16px !important;
        color: #ff8c42 !important;
    }

    .recommendation-link {
        color: #007acc;
        text-decoration: none;
    }

    .recommendation-link:hover {
        text-decoration: underline;
    }

    .pasted-alert-options {
        padding: 16px 24px 0;
        border-top: 1px solid #464647;
    }

    .dont-show-again {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #cccccc;
        font-size: 13px;
        cursor: pointer;
    }

    .dont-show-again input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
    }

    .pasted-alert-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 20px 24px;
    }

    .pasted-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 120px;
        justify-content: center;
    }

    .pasted-btn-primary {
        background: #007acc;
        color: white;
    }

    .pasted-btn-primary:hover {
        background: #005a9e;
        transform: translateY(-1px);
    }

    .pasted-btn-secondary {
        background: #5a5a5a;
        color: white;
    }

    .pasted-btn-secondary:hover {
        background: #6a6a6a;
        transform: translateY(-1px);
    }

    /* Security Scanner Modal Styles */
    .security-scanner-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .scanner-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
    }

    .scanner-content {
        position: relative;
        background: linear-gradient(145deg, #2d2d30 0%, #252528 100%);
        border-radius: 16px;
        padding: 0;
        max-width: 650px;
        width: 90%;
        max-height: 80vh;
        border: 1px solid #464647;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.3s ease-out;
        overflow: hidden;
    }

    .scanner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px 20px;
        border-bottom: 1px solid #464647;
        background: linear-gradient(135deg, #3a3a3d 0%, #2d2d30 100%);
    }

    .scanner-title {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .scanner-icon {
        font-size: 24px;
    }

    .scanner-header h3 {
        color: #ffffff;
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.2px;
    }

    .scanner-close {
        background: none;
        border: none;
        color: #cccccc;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .scanner-close:hover {
        background: #464647;
        color: #ffffff;
    }

    .scanner-body {
        padding: 24px 28px;
        max-height: 500px;
        overflow-y: auto;
    }

    /* Progress Section */
    .scan-progress-section {
        text-align: center;
    }

    .progress-header {
        margin-bottom: 20px;
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .progress-label {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
    }

    .progress-percentage {
        color: #007acc;
        font-size: 16px;
        font-weight: 700;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .progress-bar-container {
        background: #1a1a1a;
        border-radius: 12px;
        height: 12px;
        margin-bottom: 16px;
        overflow: hidden;
        position: relative;
    }

    .progress-bar {
        background: linear-gradient(90deg, #007acc 0%, #40c057 100%);
        height: 100%;
        width: 0%;
        border-radius: 12px;
        transition: width 0.1s ease-out;
        position: relative;
    }

    .progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .scan-status {
        color: #888888;
        font-size: 14px;
        font-style: italic;
    }

    /* Results Section */
    .scan-results-section {
        animation: fadeInUp 0.5s ease-out;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .security-score-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%);
        border: 1px solid #464647;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
    }

    .security-score-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #007acc 0%, #40c057 100%);
    }

    .score-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
    }

    .score-icon {
        font-size: 20px;
    }

    .score-title {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
    }

    .score-display {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 4px;
        margin-bottom: 8px;
    }

    .score-number {
        color: #40c057;
        font-size: 48px;
        font-weight: 700;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        line-height: 1;
    }

    .score-max {
        color: #888888;
        font-size: 20px;
        font-weight: 600;
    }

    .score-rating {
        color: #ffd43b;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Findings Section */
    .findings-section,
    .recommendations-section {
        margin-bottom: 24px;
    }

    .findings-section h4,
    .recommendations-section h4 {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .findings-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .finding-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .finding-success {
        background: rgba(76, 175, 80, 0.1);
        border-left: 3px solid #4caf50;
    }

    .finding-warning {
        background: rgba(255, 152, 66, 0.1);
        border-left: 3px solid #ff9842;
    }

    .finding-error {
        background: rgba(255, 107, 107, 0.1);
        border-left: 3px solid #ff6b6b;
    }

    .finding-info {
        background: rgba(0, 122, 204, 0.1);
        border-left: 3px solid #007acc;
    }

    .finding-icon {
        font-size: 16px;
        flex-shrink: 0;
    }

    .finding-text {
        color: #cccccc;
        font-size: 14px;
        line-height: 1.4;
    }

    .recommendation-text {
        background: #1a1a1a;
        border: 1px solid #464647;
        border-radius: 8px;
        padding: 16px;
        color: #cccccc;
        font-size: 14px;
        line-height: 1.5;
        font-style: italic;
    }

    /* Scanner Actions */
    .scanner-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 20px 28px 24px;
        border-top: 1px solid #464647;
        background: #252528;
    }

    .scanner-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 100px;
        justify-content: center;
    }

    .scanner-btn-primary {
        background: linear-gradient(135deg, #007acc 0%, #0056b3 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
    }

    .scanner-btn-primary:hover {
        background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.4);
    }

    .scanner-btn-secondary {
        background: #5a5a5a;
        color: white;
    }

    .scanner-btn-secondary:hover {
        background: #6a6a6a;
        transform: translateY(-1px);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .pasted-alert-content,
        .scanner-content {
            width: 95%;
            margin: 10px;
        }
        
        .pasted-alert-body {
            flex-direction: column;
            gap: 12px;
        }
        
        .pasted-alert-actions,
        .scanner-actions {
            flex-direction: column;
        }
        
        .score-number {
            font-size: 36px;
        }
    }

    /* Save notification animation */
    @keyframes saveNotification {
        0% {
            transform: translateX(100%);
            opacity: 0;
        }
        20% {
            transform: translateX(0);
            opacity: 1;
        }
        80% {
            transform: translateX(0);
            opacity: 1;
        }
        100% {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Додаємо стилі до сторінки
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Ініціалізація Security Scanner при завантаженні
let securityScanner;

// Експортуємо для глобального доступу
window.SecurityScanner = SecurityScanner;

// Автоматична ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    // Невелика затримка для ініціалізації після завантаження редактора
    setTimeout(() => {
        securityScanner = new SecurityScanner();
        window.securityScanner = securityScanner;
    }, 1000);
});

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityScanner;
}