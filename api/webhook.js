// ============================================================================
// FILE: api/webhook.js
// DESKRIPSI: Endpoint untuk menerima notifikasi dari Pakasir setelah pembayaran.
//            Di sini kita akan mengupdate status transaksi dan mengirim produk.
// ============================================================================
import { ADMIN_PHONE, APP_NAME } from '../source/config.js';

// Gunakan store yang sama dengan create-payment.js
if (!global.transactions) {
    global.transactions = new Map();
}
if (!global.users) {
    global.users = [];
}

// ----------------------------------------------------------------------------
// FUNGSI PEMBANTU
// ----------------------------------------------------------------------------
/**
 * Mencari user berdasarkan email
 * @param {string} email
 * @returns {object|null}
 */
function findUserByEmail(email) {
    return global.users.find(u => u.email === email) || null;
}

/**
 * Mengirim notifikasi ke admin via WhatsApp (Fonnte)
 * @param {string} message
 */
async function notifyAdmin(message) {
    const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
    if (!FONNTE_TOKEN || !ADMIN_PHONE) return;
    
    try {
        await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: ADMIN_PHONE,
                message: `[${APP_NAME}] Notifikasi Admin:\n${message}`
            })
        });
    } catch (err) {
        console.error('Gagal mengirim notifikasi admin:', err);
    }
}

/**
 * Mengirim produk digital ke customer (simulasi email/WA)
 * @param {string} email
 * @param {string} productName
 * @param {string} orderId
 */
async function deliverDigitalProduct(email, productName, orderId) {
    // Di real implementation, kirim link download atau kode lisensi
    console.log(`[DELIVER] Produk "${productName}" dikirim ke ${email} (Order: ${orderId})`);
    
    // Simulasi pengiriman email (gunakan API email seperti Resend, Brevo, dll)
    // await fetch('https://api.resend.com/emails', {...})
    
    // Update order di database
    // ...
}

/**
 * Update status transaksi dan pesanan user
 * @param {string} orderId
 * @param {string} status
 * @param {Object} paymentDetails
 */
function updateTransactionStatus(orderId, status, paymentDetails = {}) {
    const transaction = global.transactions.get(orderId);
    if (transaction) {
        transaction.status = status;
        transaction.paymentDetails = paymentDetails;
        transaction.completedAt = new Date().toISOString();
        global.transactions.set(orderId, transaction);
        
        // Jika status completed, kirim produk
        if (status === 'completed') {
            deliverDigitalProduct(transaction.customerEmail, transaction.productName, orderId);
        }
    }
}

// ----------------------------------------------------------------------------
// HANDLER UTAMA
// ----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Pakasir mengirim webhook via POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Log raw body untuk debugging
    const rawBody = req.body;
    console.log('[WEBHOOK] Received payload:', JSON.stringify(rawBody, null, 2));
    
    // Format webhook dari Pakasir biasanya:
    // {
    //   "order_id": "INV-123456",
    //   "status": "completed",
    //   "amount": 45000,
    //   "payment_method": "qris",
    //   "transaction_id": "TRX123",
    //   "signature": "..."
    // }
    
    const { order_id, status, amount, payment_method, transaction_id, signature } = rawBody;
    
    // Validasi order_id
    if (!order_id) {
        console.error('[WEBHOOK] Missing order_id');
        return res.status(400).json({ error: 'Missing order_id' });
    }
    
    // Cek apakah transaksi ada di store
    const transaction = global.transactions.get(order_id);
    if (!transaction) {
        console.error(`[WEBHOOK] Transaksi ${order_id} tidak ditemukan di store`);
        // Tetap return 200 agar Pakasir tidak mengulang terus
        return res.status(200).json({ status: 'ignored', reason: 'transaction not found' });
    }
    
    // Jika status sudah completed, abaikan untuk mencegah duplikasi
    if (transaction.status === 'completed') {
        console.log(`[WEBHOOK] Transaksi ${order_id} sudah completed, diabaikan`);
        return res.status(200).json({ status: 'ignored', reason: 'already completed' });
    }
    
    // Proses berdasarkan status
    if (status === 'completed') {
        // Pembayaran sukses
        console.log(`[WEBHOOK] ✅ Pembayaran ${order_id} sukses! Amount: ${amount}`);
        
        // Update status
        updateTransactionStatus(order_id, 'completed', {
            payment_method,
            transaction_id,
            paidAt: new Date().toISOString()
        });
        
        // Kirim notifikasi ke admin
        await notifyAdmin(`✅ Pembayaran sukses!\nOrder: ${order_id}\nProduk: ${transaction.productName}\nAmount: Rp${amount}\nCustomer: ${transaction.customerEmail}`);
        
        // Bisa juga kirim notifikasi ke customer (opsional)
        // ...
        
    } else if (status === 'expired') {
        // Pembayaran kadaluarsa
        console.log(`[WEBHOOK] ⏰ Pembayaran ${order_id} expired`);
        updateTransactionStatus(order_id, 'expired');
        
    } else if (status === 'failed') {
        // Pembayaran gagal
        console.log(`[WEBHOOK] ❌ Pembayaran ${order_id} failed`);
        updateTransactionStatus(order_id, 'failed');
        
    } else {
        console.log(`[WEBHOOK] Status tidak dikenal: ${status} untuk ${order_id}`);
    }
    
    // Selalu return 200 agar Pakasir tidak mengirim ulang webhook
    return res.status(200).json({ status: 'ok', message: 'Webhook processed' });
}

// ----------------------------------------------------------------------------
// AKHIR FILE webhook.js
// ----------------------------------------------------------------------------