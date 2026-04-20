// ============================================================================
// FILE: api/send-otp.js
// DESKRIPSI: Endpoint untuk mengirim kode OTP via WhatsApp menggunakan Fonnte.
//            Nomor pengirim: 6283174310068 (device yang terdaftar di Fonnte)
// ============================================================================
// IMPOR KONFIGURASI
import { FONNTE_TOKEN, FONNTE_CONFIG, OTP_CONFIG, isValidPhoneNumber, createOtpMessage } from '../source/config.js';

// ----------------------------------------------------------------------------
// STORAGE OTP SEMENTARA (menggunakan global object, untuk production gunakan Redis)
// ----------------------------------------------------------------------------
if (!global.otpStore) {
    global.otpStore = new Map();
}
if (!global.otpAttempts) {
    global.otpAttempts = new Map();
}

// ----------------------------------------------------------------------------
// FUNGSI PEMBANTU INTERNAL
// ----------------------------------------------------------------------------
/**
 * Membersihkan OTP yang sudah kadaluarsa dari store
 * Dipanggil setiap kali ada request untuk menjaga memori
 */
function cleanExpiredOtps() {
    const now = Date.now();
    for (const [phone, data] of global.otpStore.entries()) {
        if (data.expiry < now) {
            global.otpStore.delete(phone);
            global.otpAttempts.delete(phone);
        }
    }
}

/**
 * Menghasilkan OTP acak dengan panjang tertentu
 * @returns {string} OTP 6 digit
 */
function generateOtp() {
    let otp = '';
    for (let i = 0; i < OTP_CONFIG.length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
}

/**
 * Mengirim permintaan ke API Fonnte dengan timeout dan retry
 * @param {string} target - Nomor tujuan
 * @param {string} message - Pesan yang dikirim
 * @returns {Promise<Object>} Response dari Fonnte
 */
async function sendViaFonnte(target, message) {
    const url = `${FONNTE_CONFIG.baseUrl}${FONNTE_CONFIG.sendEndpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FONNTE_CONFIG.timeout);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: target,
                message: message,
                countryCode: '62'
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        return { success: data.status === true, data };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Timeout saat mengirim OTP');
        }
        throw error;
    }
}

/**
 * Mencoba mengirim OTP dengan mekanisme retry
 * @param {string} target - Nomor tujuan
 * @param {string} message - Pesan
 * @param {number} retries - Sisa percobaan
 * @returns {Promise<Object>}
 */
async function sendWithRetry(target, message, retries = 3) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await sendViaFonnte(target, message);
        } catch (err) {
            lastError = err;
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 1000 * (i + 1))); // delay exponential
            }
        }
    }
    throw lastError;
}

// ----------------------------------------------------------------------------
// HANDLER UTAMA (VERCEL SERVERLESS FUNCTION)
// ----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Hanya menerima method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Gunakan POST.' 
        });
    }
    
    // Bersihkan OTP kadaluarsa
    cleanExpiredOtps();
    
    // Ambil nomor telepon dari body request
    const { phoneNumber } = req.body;
    
    // Validasi input
    if (!phoneNumber) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nomor telepon wajib diisi.' 
        });
    }
    
    // Validasi format nomor Indonesia
    if (!isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Format nomor tidak valid. Gunakan format 628xxxxxxxxxx (contoh: 628123456789).' 
        });
    }
    
    // Cek apakah nomor sedang dalam cooldown (mencegah spam)
    const existingData = global.otpStore.get(phoneNumber);
    const now = Date.now();
    if (existingData && existingData.lastSent && (now - existingData.lastSent) < (OTP_CONFIG.resendCooldown * 1000)) {
        const remainingSeconds = Math.ceil((OTP_CONFIG.resendCooldown * 1000 - (now - existingData.lastSent)) / 1000);
        return res.status(429).json({
            success: false,
            error: `Harap tunggu ${remainingSeconds} detik sebelum meminta OTP lagi.`
        });
    }
    
    // Generate OTP baru
    const otp = generateOtp();
    const expiry = now + (OTP_CONFIG.expirySeconds * 1000);
    
    // Simpan OTP dan metadata
    global.otpStore.set(phoneNumber, {
        otp: otp,
        expiry: expiry,
        lastSent: now,
        attempts: 0
    });
    
    // Reset attempt counter
    global.otpAttempts.set(phoneNumber, 0);
    
    // Siapkan pesan OTP
    const message = createOtpMessage(otp);
    
    // Kirim OTP via Fonnte dengan retry
    try {
        const result = await sendWithRetry(phoneNumber, message, 3);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Kode OTP berhasil dikirim ke WhatsApp Anda.',
                expirySeconds: OTP_CONFIG.expirySeconds
            });
        } else {
            console.error('Fonnte error:', result.data);
            // Hapus OTP yang baru disimpan karena gagal kirim
            global.otpStore.delete(phoneNumber);
            return res.status(500).json({
                success: false,
                error: 'Gagal mengirim OTP. Pastikan nomor Anda benar dan terdaftar di WhatsApp.'
            });
        }
    } catch (error) {
        console.error('Send OTP exception:', error);
        // Hapus OTP yang baru disimpan
        global.otpStore.delete(phoneNumber);
        return res.status(500).json({
            success: false,
            error: error.message || 'Terjadi kesalahan internal saat mengirim OTP.'
        });
    }
}

// ----------------------------------------------------------------------------
// AKHIR FILE send-otp.js
// ----------------------------------------------------------------------------