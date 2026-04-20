// Global utilities untuk ALDI PEDIA
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function showNotification(message, type = 'info') {
    // Fallback ke alert jika toast tidak tersedia
    alert(`[${type.toUpperCase()}] ${message}`);
}

function checkAuthAndRedirect() {
    const user = localStorage.getItem('loggedInUser');
    const protectedPages = ['dashboard.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage) && !user) {
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', checkAuthAndRedirect);