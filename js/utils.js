// js/utils.js

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    // Adicionado o X de fechar e flex-grow para empurrar o X para a direita
    toast.innerHTML = `
        <i class="fas ${icon}"></i> 
        <div style="flex-grow: 1;">${message}</div>
        <i class="fas fa-times close-toast-btn" style="cursor:pointer; margin-left: 12px; font-size: 16px; opacity: 0.7;"></i>
    `;
    
    container.appendChild(toast);

    // Funcionalidade de fechar ao clicar no X
    const closeBtn = toast.querySelector('.close-toast-btn');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    });

    // Fecha automaticamente após um tempo, se não for fechada antes
    setTimeout(() => {
        if(document.body.contains(toast)) {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }
    }, Math.max(4000, message.length * 50)); 
}

// AS FUNÇÕES ABAIXO SÃO OBRIGATÓRIAS PARA O RPG FUNCIONAR:
function getRandomInt(min, max) { return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min); }
function getRandomFloat(min, max) { return Math.random() * (max - min) + min; }
function getRandomPunishment() { const c = PUNISHMENT_CONFIG[Math.floor(Math.random() * PUNISHMENT_CONFIG.length)]; return { message: c.message, value: -getRandomInt(c.minLoss, c.maxLoss) }; }
function getRandomBonus() { const c = BONUS_CONFIG[Math.floor(Math.random() * BONUS_CONFIG.length)]; return { message: c.message, value: getRandomInt(c.minGain, c.maxGain) }; }

function parseDurationToSeconds(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return 0;
    const parts = durationStr.split(':'); if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10), secs = parseInt(parts[1], 10);
    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs > 59) return 0;
    return (mins * 60) + secs;
}

function formatTime(totalSeconds) { 
    if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00"; 
    const minutes = Math.floor(totalSeconds / 60), seconds = Math.floor(totalSeconds % 60); 
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; 
}

function startAlbumCountdown(releaseDate, timerElementId) {
    const timerElement = document.getElementById(timerElementId);
    if (!timerElement) return;

    const targetDate = new Date(releaseDate).getTime();
    
    if (albumCountdownInterval) clearInterval(albumCountdownInterval);

    albumCountdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(albumCountdownInterval);
            timerElement.innerHTML = '<span style="font-size:24px; font-weight:bold; color: var(--spotify-green);">Lançado!</span>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const format = (num) => (num < 10 ? '0' + num : num);

        timerElement.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center;">
                <span style="font-size:24px; font-weight:bold;">${format(days)}</span>
                <span style="font-size:10px; color:var(--text-secondary);">DIAS</span>
            </div>
            <span style="font-size:24px; font-weight:bold; padding-top: 4px;">:</span>
            <div style="display:flex; flex-direction:column; align-items:center;">
                <span style="font-size:24px; font-weight:bold;">${format(hours)}</span>
                <span style="font-size:10px; color:var(--text-secondary);">HRS</span>
            </div>
            <span style="font-size:24px; font-weight:bold; padding-top: 4px;">:</span>
            <div style="display:flex; flex-direction:column; align-items:center;">
                <span style="font-size:24px; font-weight:bold;">${format(minutes)}</span>
                <span style="font-size:10px; color:var(--text-secondary);">MIN</span>
            </div>
            <span style="font-size:24px; font-weight:bold; padding-top: 4px;">:</span>
            <div style="display:flex; flex-direction:column; align-items:center;">
                <span style="font-size:24px; font-weight:bold;">${format(seconds)}</span>
                <span style="font-size:10px; color:var(--text-secondary);">SEG</span>
            </div>
        `;
    }, 1000);
}

// Adicione no final do js/utils.js
function extractYouTubeID(url) {
    if (!url) return null;
    url = url.trim();
    // Se a pessoa já colou apenas o ID de 11 caracteres sem querer:
    if (url.length === 11 && !url.includes('/') && !url.includes('http')) return url; 
    
    // Regex mágico que encontra o ID em qualquer link do YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}


