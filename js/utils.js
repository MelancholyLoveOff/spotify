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

    toast.innerHTML = `<i class="fas ${icon}"></i> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, Math.max(4000, message.length * 50)); 
}

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