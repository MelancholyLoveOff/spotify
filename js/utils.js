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
