// ============================================================================
// FILE: api/verify-otp.js
// DESKRIPSI: Endpoint untuk memverifikasi kode OTP yang dikirim ke WhatsApp user.
//            Setelah OTP benar, user akan didaftarkan ke sistem.
// ============================================================================
import { OTP_CONFIG, isValidPhoneNumber, SESSION_CONFIG } from '../source/config.js';

// ----------------------------------------------------------------------------
// STORAGE (menggunakan global object, untuk production gunakan database)
// ----------------------------------------------------------------------------
if (!global.otpStore) {
    global.otpStore = new Map();
}
if (!global.otpAttempts) {
    global.otpAttempts = new Map();
}
if (!global.users) {
    global.users = []; // Array of user objects
}

// ----------------------------------------------------------------------------
// FUNGSI PEMBANTU
// ----------------------------------------------------------------------------
/**
 * Membersihkan OTP kadaluarsa dari store
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
 * Cek apakah user sudah terdaftar berdasarkan email
 * @param {string} email
 * @returns {boolean}
 */
function isEmailExists(email) {
    return global.users.some(u => u.email === email);
}

/**
 * Cek apakah username sudah digunakan
 * @param {string} username
 * @returns {boolean}
 */
function isUsernameExists(username) {
    return global.users.some(u => u.username === username);
}

/**
 * Hash password sederhana (untuk demo, production gunakan bcrypt)
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
    // Ini hanya encoding base64, TIDAK AMAN untuk production!
    // Gunakan bcrypt atau scrypt di production.
    return Buffer.from(password).toString('base64');
}

/**
 * Verifikasi password (cocokkan hash)
 * @param {string} input
 * @param {string} stored
 * @returns {boolean}
 */
function verifyPassword(input, stored) {
    return Buffer.from(input).toString('base64') === stored;
}

// ----------------------------------------------------------------------------
// HANDLER UTAMA
// ----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Hanya menerima POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Bersihkan OTP kadaluarsa
    cleanExpiredOtps();

    // Ambil data dari request body
    const { phoneNumber, otp, email, username, password } = req.body;

    // Validasi input
    if (!phoneNumber || !otp || !email || !username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Semua field (phoneNumber, otp, email, username, password) wajib diisi.'
        });
    }

    // Validasi format nomor
    if (!isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Format nomor telepon tidak valid. Gunakan 628xxxxxxxxxx.'
        });
    }

    // Validasi email sederhana
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Format email tidak valid.'
        });
    }

    // Validasi username (min 3 karakter, alfanumerik + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            success: false,
            error: 'Username harus 3-20 karakter, hanya huruf, angka, dan underscore.'
        });
    }

    // Validasi password (min 6 karakter)
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password minimal 6 karakter.'
        });
    }

    // Cek apakah email sudah terdaftar
    if (isEmailExists(email)) {
        return res.status(409).json({
            success: false,
            error: 'Email sudah terdaftar. Silakan login.'
        });
    }

    // Cek apakah username sudah terdaftar
    if (isUsernameExists(username)) {
        return res.status(409).json({
            success: false,
            error: 'Username sudah digunakan. Pilih username lain.'
        });
    }

    // Ambil data OTP dari store
    const storedOtpData = global.otpStore.get(phoneNumber);
    if (!storedOtpData) {
        return res.status(400).json({
            success: false,
            error: 'Kode OTP tidak ditemukan. Silakan minta OTP baru.'
        });
    }

    // Cek percobaan verifikasi
    let attempts = global.otpAttempts.get(phoneNumber) || 0;
    if (attempts >= OTP_CONFIG.maxAttempts) {
        global.otpStore.delete(phoneNumber);
        global.otpAttempts.delete(phoneNumber);
        return res.status(400).json({
            success: false,
            error: `Terlalu banyak percobaan. Silakan minta OTP baru.`
        });
    }

    // Cek kecocokan OTP
    if (storedOtpData.otp !== otp) {
        attempts++;
        global.otpAttempts.set(phoneNumber, attempts);
        const remainingAttempts = OTP_CONFIG.maxAttempts - attempts;
        return res.status(400).json({
            success: false,
            error: `Kode OTP salah. Sisa percobaan: ${remainingAttempts}.`
        });
    }

    // Cek kadaluarsa
    if (Date.now() > storedOtpData.expiry) {
        global.otpStore.delete(phoneNumber);
        global.otpAttempts.delete(phoneNumber);
        return res.status(400).json({
            success: false,
            error: 'Kode OTP sudah kadaluarsa. Silakan minta OTP baru.'
        });
    }

    // OTP valid, hapus dari store
    global.otpStore.delete(phoneNumber);
    global.otpAttempts.delete(phoneNumber);

    // Hash password
    const hashedPassword = hashPassword(password);

    // Buat user baru
    const newUser = {
        id: global.users.length + 1,
        email: email.toLowerCase(),
        username: username,
        phoneNumber: phoneNumber,
        password: hashedPassword,
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        orders: []
    };

    global.users.push(newUser);

    // Log untuk debugging (di Vercel akan muncul di fungsi logs)
    console.log(`[REGISTER] User baru: ${email} (${username}) dengan nomor ${phoneNumber}`);

    // Kirim respons sukses
    return res.status(200).json({
        success: true,
        message: 'Verifikasi berhasil! Akun Anda telah terdaftar. Silakan login.',
        user: {
            email: newUser.email,
            username: newUser.username,
            phoneNumber: newUser.phoneNumber
        }
    });
}

// ----------------------------------------------------------------------------
// AKHIR FILE verify-otp.js
// ----------------------------------------------------------------------------