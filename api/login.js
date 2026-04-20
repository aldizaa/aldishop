// ============================================================================
// FILE: api/login.js
// DESKRIPSI: Endpoint untuk login user menggunakan email dan password.
// ============================================================================
import { SESSION_CONFIG } from '../source/config.js';

// Gunakan global.users yang sama dengan verify-otp.js
if (!global.users) {
    global.users = [];
}

// ----------------------------------------------------------------------------
// FUNGSI PEMBANTU
// ----------------------------------------------------------------------------
/**
 * Verifikasi password (cocokkan dengan hash)
 * @param {string} input
 * @param {string} stored
 * @returns {boolean}
 */
function verifyPassword(input, stored) {
    return Buffer.from(input).toString('base64') === stored;
}

/**
 * Mencari user berdasarkan email (case-insensitive)
 * @param {string} email
 * @returns {object|null}
 */
function findUserByEmail(email) {
    const lowerEmail = email.toLowerCase();
    return global.users.find(u => u.email === lowerEmail) || null;
}

/**
 * Membuat token session sederhana (untuk demo)
 * @param {object} user
 * @returns {string}
 */
function generateSessionToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 hari
    };
    // Encode base64 sederhana (TIDAK AMAN untuk production, gunakan JWT)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Log aktivitas login
 * @param {string} email
 * @param {boolean} success
 * @param {string} ip (opsional)
 */
function logLoginAttempt(email, success, ip = null) {
    const timestamp = new Date().toISOString();
    console.log(`[LOGIN] ${timestamp} - Email: ${email} - Success: ${success} - IP: ${ip || 'unknown'}`);
}

// ----------------------------------------------------------------------------
// HANDLER UTAMA
// ----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Hanya menerima POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Ambil data dari body
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        logLoginAttempt(email || 'unknown', false);
        return res.status(400).json({
            success: false,
            error: 'Email dan password wajib diisi.'
        });
    }

    // Cari user berdasarkan email
    const user = findUserByEmail(email);
    if (!user) {
        logLoginAttempt(email, false);
        return res.status(401).json({
            success: false,
            error: 'Email tidak terdaftar. Silakan daftar terlebih dahulu.'
        });
    }

    // Verifikasi password
    if (!verifyPassword(password, user.password)) {
        logLoginAttempt(email, false);
        return res.status(401).json({
            success: false,
            error: 'Password salah.'
        });
    }

    // Cek apakah user sudah diverifikasi
    if (!user.verified) {
        logLoginAttempt(email, false);
        return res.status(403).json({
            success: false,
            error: 'Akun belum diverifikasi. Silakan verifikasi melalui OTP WhatsApp.'
        });
    }

    // Login sukses, buat session token
    const sessionToken = generateSessionToken(user);

    // Update last login
    user.lastLogin = new Date().toISOString();
    // Simpan kembali ke array (sebenarnya object sudah terupdate karena referensi)

    logLoginAttempt(email, true);

    // Kirim respons sukses dengan data user (tanpa password)
    const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    };

    return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        user: userData,
        token: sessionToken // untuk demo, bisa disimpan di localStorage
    });
}

// ----------------------------------------------------------------------------
// AKHIR FILE login.js
// ----------------------------------------------------------------------------