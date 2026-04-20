// ============================================================================
// FILE: source/config.js
// DESKRIPSI: Konfigurasi utama ALDI PEDIA untuk API Pakasir, Fonnte, dan data toko.
// DIBUAT OLEH: ALDI PEDIA TEAM
// VERSI: 2.0.0
// TANGGAL: 2026-04-20
// ============================================================================

// ----------------------------------------------------------------------------
// 1. IMPOR MODULES (tidak ada karena ini murni konfigurasi)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 2. KONFIGURASI PAKASIR (QRIS)
// ----------------------------------------------------------------------------
// Dapatkan API Key dan Project ID dari dashboard Pakasir setelah registrasi.
// Pastikan mode sandbox atau production sesuai kebutuhan.
// ----------------------------------------------------------------------------
export const PAKASIR_CONFIG = {
    // Ganti dengan API Key asli dari akun Pakasir Anda
    apiKey: 'PAKASIR_API_KEY_ANDA',      // Contoh: 'pk_live_xxxxx' atau 'pk_sandbox_xxxxx'
    
    // Ganti dengan Project ID / Slug dari dashboard Pakasir
    project: 'NAMA_PROJECT_PAKASIR',     // Contoh: 'aldipedia-prod'
    
    // Endpoint API Pakasir (jangan diubah kecuali ada perubahan dari pihak Pakasir)
    baseUrl: 'https://app.pakasir.com/api',
    
    // Timeout request dalam milidetik
    timeout: 30000,
    
    // Retry jika gagal (jumlah percobaan ulang)
    retryCount: 3,
    
    // Interval antar retry (ms)
    retryInterval: 1000,
};

// ----------------------------------------------------------------------------
// 3. KONFIGURASI FONNTE (OTP WHATSAPP)
// ----------------------------------------------------------------------------
// Dapatkan token dari dashboard Fonnte setelah menambahkan device WhatsApp.
// Nomor device yang terhubung: 6283174310068 (akan mengirim OTP ke user).
// ----------------------------------------------------------------------------
export const FONNTE_TOKEN = 'FONNTE_TOKEN_ANDA';   // Ganti dengan token asli dari dashboard Fonnte

// Konfigurasi tambahan Fonnte
export const FONNTE_CONFIG = {
    // Base URL API Fonnte
    baseUrl: 'https://api.fonnte.com',
    
    // Endpoint send message
    sendEndpoint: '/send',
    
    // Default pesan OTP (bisa disesuaikan)
    defaultOtpMessage: (otp) => `🔐 *KODE OTP ALDI PEDIA*\n\n${otp}\n\nKode ini berlaku 10 menit.\nJANGAN berikan kode ini kepada siapapun.\n\n- ALDI PEDIA`,
    
    // Timeout request (ms)
    timeout: 15000,
};

// ----------------------------------------------------------------------------
// 4. NOMOR ADMIN / OWNER
// ----------------------------------------------------------------------------
// Nomor WhatsApp yang akan ditampilkan di halaman kontak.
// Juga bisa digunakan untuk menerima notifikasi admin jika diperlukan.
// ----------------------------------------------------------------------------
export const ADMIN_PHONE = '6283174310068';        // Nomor WhatsApp owner (pengirim OTP juga)

// ----------------------------------------------------------------------------
// 5. MODE DEMO (UNTUK TESTING QRIS TANPA API KEY)
// ----------------------------------------------------------------------------
// true  = Menggunakan QRIS dummy (fallback) - tidak perlu API key Pakasir
// false = Menggunakan API Pakasir asli (wajib isi PAKASIR_CONFIG di atas)
// ----------------------------------------------------------------------------
export const DEMO_MODE = false;   // Set ke false jika sudah memiliki API key Pakasir

// ----------------------------------------------------------------------------
// 6. INFORMASI TOKO / APLIKASI
// ----------------------------------------------------------------------------
export const APP_NAME = 'ALDI PEDIA';
export const APP_DESCRIPTION = 'Premium Digital Products & Source Code — Solusi Bisnis Digital Anda';
export const APP_VERSION = '2.0.0';
export const APP_URL = 'https://aldipedia.vercel.app';
export const SUPPORT_EMAIL = 'support@aldipedia.com';
export const INSTAGRAM = '@aldipedia';
export const COMPANY_NAME = 'ALDI PEDIA Official';
export const COMPANY_LEGAL = 'ALDI PEDIA (PT. Website Karya Anak Bangsa)';
export const YEAR = new Date().getFullYear();
export const COPYRIGHT_TEXT = `© ${YEAR} ${COMPANY_NAME}. All rights reserved.`;

// ----------------------------------------------------------------------------
// 7. PENGATURAN OTP
// ----------------------------------------------------------------------------
export const OTP_CONFIG = {
    // Panjang digit OTP (biasanya 6)
    length: 6,
    
    // Masa berlaku OTP dalam detik (10 menit = 600 detik)
    expirySeconds: 600,
    
    // Maksimal percobaan verifikasi sebelum OTP dihapus
    maxAttempts: 3,
    
    // Waktu cooldown untuk mengirim ulang OTP (detik)
    resendCooldown: 60,
    
    // Karakter yang diizinkan untuk OTP (hanya angka)
    allowedChars: '0123456789',
};

// ----------------------------------------------------------------------------
// 8. PENGATURAN PRODUK DEFAULT
// ----------------------------------------------------------------------------
export const DEFAULT_PRODUCTS = [
    { id: 1, name: '🚀 WEBSITE INI', price: 45000, description: '150+ endpoint, JWT auth, dokumentasi lengkap', stock: 999 },
    { id: 2, name: '🤖 Script Bot WhatsApp Premium', price: 149000, description: 'Auto reply, AI response, multi-device support', stock: 999 },
    { id: 3, name: '⚡ Panel Auto Responder', price: 89000, description: 'Response instan untuk customer service', stock: 999 },
    { id: 4, name: '💳 Aplikasi Kasir Digital', price: 199000, description: 'Laporan keuangan, print struk, manajemen stok', stock: 999 },
    { id: 5, name: '🌐 Landing Page Builder', price: 129000, description: 'Drag & drop, template modern, responsive', stock: 999 },
    { id: 6, name: '📊 Dashboard Admin Premium', price: 99000, description: 'Analytics, user management, dark mode', stock: 999 },
];

// ----------------------------------------------------------------------------
// 9. PENGATURAN SESSION (UNTUK LOCALSTORAGE / COOKIE)
// ----------------------------------------------------------------------------
export const SESSION_CONFIG = {
    // Nama key di localStorage untuk menyimpan user login
    userStorageKey: 'loggedInUser',
    
    // Nama key untuk menyimpan pesanan user
    ordersStorageKey: 'userOrders',
    
    // Apakah menggunakan cookie sebagai fallback (opsional)
    useCookieFallback: false,
    
    // Durasi session dalam hari (jika menggunakan cookie)
    sessionDays: 7,
};

// ----------------------------------------------------------------------------
// 10. PENGATURAN TAMPILAN & WARNA
// ----------------------------------------------------------------------------
export const THEME = {
    primary: '#06b6d4',      // Cyan utama
    primaryDark: '#0891b2',  // Cyan gelap
    secondary: '#22d3ee',    // Cyan terang
    background: '#0a2f44',   // Biru tua latar
    cardBg: '#0a4c66',       // Biru kehijauan untuk card
    text: '#e0f2fe',         // Teks terang
    textMuted: '#bae6fd',    // Teks redup
    border: '#0891b2',       // Warna border
    success: '#10b981',      // Hijau untuk sukses
    error: '#ef4444',        // Merah untuk error
    warning: '#f59e0b',      // Kuning untuk warning
};

// ----------------------------------------------------------------------------
// 11. FUNGSI VALIDASI KONFIGURASI
// ----------------------------------------------------------------------------
/**
 * Memeriksa apakah konfigurasi yang diperlukan sudah diisi dengan benar.
 * Dipanggil saat server start atau saat modul dimuat di environment Node.js.
 * @returns {boolean} True jika konfigurasi valid, false jika ada error.
 */
export function validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Cek mode demo
    if (DEMO_MODE) {
        warnings.push('DEMO_MODE aktif. QRIS hanya simulasi. Set DEMO_MODE = false untuk transaksi nyata.');
    } else {
        // Mode live, cek API key Pakasir
        if (!PAKASIR_CONFIG.apiKey || PAKASIR_CONFIG.apiKey === 'PAKASIR_API_KEY_ANDA') {
            errors.push('PAKASIR_CONFIG.apiKey belum diisi dengan benar');
        }
        if (!PAKASIR_CONFIG.project || PAKASIR_CONFIG.project === 'NAMA_PROJECT_PAKASIR') {
            errors.push('PAKASIR_CONFIG.project belum diisi dengan benar');
        }
    }
    
    // Cek token Fonnte
    if (!FONNTE_TOKEN || FONNTE_TOKEN === 'FONNTE_TOKEN_ANDA') {
        errors.push('FONNTE_TOKEN belum diisi dengan benar. OTP WhatsApp tidak akan berfungsi.');
    }
    
    // Cek nomor admin
    if (!ADMIN_PHONE || !/^62[0-9]{9,13}$/.test(ADMIN_PHONE)) {
        warnings.push('ADMIN_PHONE tidak valid. Halaman kontak mungkin menampilkan nomor salah.');
    }
    
    // Tampilkan hasil validasi
    if (errors.length > 0) {
        console.error('[Konfigurasi] ERROR: ', errors.join('; '));
        return false;
    }
    if (warnings.length > 0) {
        console.warn('[Konfigurasi] PERINGATAN: ', warnings.join('; '));
    }
    console.log('[Konfigurasi] ✅ Semua kredensial valid. Sistem siap digunakan.');
    return true;
}

// ----------------------------------------------------------------------------
// 12. EKSPOR SEMUA FUNGSI PEMBANTU
// ----------------------------------------------------------------------------
/**
 * Mendapatkan header standar untuk fetch API (JSON)
 * @returns {Object} Header dengan Content-Type application/json
 */
export function getJsonHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
}

/**
 * Membuat order ID unik dengan format INV-timestamp-random
 * @returns {string} Order ID
 */
export function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${timestamp}-${random}`;
}

/**
 * Format angka ke Rupiah
 * @param {number} amount - Jumlah dalam integer (tanpa desimal)
 * @returns {string} Format Rupiah contoh: Rp 45.000
 */
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

/**
 * Validasi nomor WhatsApp Indonesia
 * @param {string} phone - Nomor telepon (contoh: 628123456789)
 * @returns {boolean} True jika valid
 */
export function isValidPhoneNumber(phone) {
    const regex = /^62[0-9]{9,13}$/;
    return regex.test(phone);
}

/**
 * Membuat pesan OTP
 * @param {string} otp - Kode OTP 6 digit
 * @returns {string} Pesan lengkap
 */
export function createOtpMessage(otp) {
    return `🔐 *KODE OTP ALDI PEDIA*\n\n${otp}\n\nKode ini berlaku ${OTP_CONFIG.expirySeconds / 60} menit.\nJANGAN berikan kode ini kepada siapapun.\n\n- ${APP_NAME}`;
}

// Panggil validasi saat modul dimuat (hanya di server-side Node.js)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    validateConfig();
}

// ----------------------------------------------------------------------------
// AKHIR FILE config.js
// ----------------------------------------------------------------------------