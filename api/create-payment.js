// ============================================================================
// FILE: api/create-payment.js
// DESKRIPSI: Endpoint untuk membuat transaksi QRIS menggunakan API Pakasir.
//            Mendukung mode demo (tanpa API key) dan live.
// ============================================================================
import { 
    PAKASIR_CONFIG, 
    DEMO_MODE, 
    generateOrderId, 
    formatRupiah 
} from '../source/config.js';

// ----------------------------------------------------------------------------
// STORAGE TRANSAKSI SEMENTARA (untuk demo, production gunakan database)
// ----------------------------------------------------------------------------
if (!global.transactions) {
    global.transactions = new Map(); // key: orderId, value: transaction object
}

// ----------------------------------------------------------------------------
// FUNGSI PEMBANTU
// ----------------------------------------------------------------------------
/**
 * Membuat transaksi QRIS melalui API Pakasir (live)
 * @param {Object} params - { amount, orderId, customerEmail, productName }
 * @returns {Promise<Object>}
 */
async function createLiveQrisTransaction({ amount, orderId, customerEmail, productName }) {
    const url = `${PAKASIR_CONFIG.baseUrl}/transactioncreate/qris`;
    
    const payload = {
        project: PAKASIR_CONFIG.project,
        order_id: orderId,
        amount: amount,
        api_key: PAKASIR_CONFIG.apiKey,
        customer_email: customerEmail,
        product_name: productName
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PAKASIR_CONFIG.timeout);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.payment && data.payment.payment_number) {
            return {
                success: true,
                qrString: data.payment.payment_number,
                expiredAt: data.payment.expired_at,
                transactionId: data.transaction_id || orderId
            };
        } else {
            console.error('Pakasir error response:', data);
            throw new Error(data.message || 'Gagal membuat transaksi QRIS');
        }
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Timeout saat menghubungi server Pakasir');
        }
        throw error;
    }
}

/**
 * Membuat transaksi QRIS mode demo (tanpa API key)
 * @param {Object} params - { amount, orderId, customerEmail, productName }
 * @returns {Promise<Object>}
 */
async function createDemoQrisTransaction({ amount, orderId, customerEmail, productName }) {
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate QR code dummy (base64 gambar atau URL)
    const dummyQrString = `https://chart.googleapis.com/chart?cht=qr&chl=Dummy%20QR%20for%20${orderId}&chs=250x250`;
    
    // Expired dalam 5 menit
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    return {
        success: true,
        qrString: dummyQrString,
        expiredAt: expiredAt,
        transactionId: orderId,
        isDemo: true
    };
}

/**
 * Menyimpan transaksi ke memory store
 * @param {Object} transaction
 */
function storeTransaction(transaction) {
    global.transactions.set(transaction.orderId, {
        ...transaction,
        createdAt: new Date().toISOString(),
        status: 'pending'
    });
}

/**
 * Mendapatkan transaksi berdasarkan orderId
 * @param {string} orderId
 * @returns {Object|null}
 */
function getTransaction(orderId) {
    return global.transactions.get(orderId) || null;
}

// ----------------------------------------------------------------------------
// HANDLER UTAMA
// ----------------------------------------------------------------------------
export default async function handler(req, res) {
    // Hanya POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    // Ambil data dari body
    const { productId, productName, amount, customerEmail } = req.body;
    
    // Validasi input
    if (!productId || !productName || !amount || !customerEmail) {
        return res.status(400).json({
            success: false,
            error: 'Semua field (productId, productName, amount, customerEmail) wajib diisi.'
        });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Amount harus berupa angka positif.'
        });
    }
    
    // Generate order ID unik
    const orderId = generateOrderId();
    
    try {
        let result;
        
        if (DEMO_MODE) {
            // Mode demo
            result = await createDemoQrisTransaction({
                amount,
                orderId,
                customerEmail,
                productName
            });
        } else {
            // Mode live dengan Pakasir
            result = await createLiveQrisTransaction({
                amount,
                orderId,
                customerEmail,
                productName
            });
        }
        
        if (result.success) {
            // Simpan transaksi
            const transaction = {
                orderId: orderId,
                productId: productId,
                productName: productName,
                amount: amount,
                customerEmail: customerEmail,
                qrString: result.qrString,
                expiredAt: result.expiredAt,
                status: 'pending',
                isDemo: result.isDemo || false
            };
            storeTransaction(transaction);
            
            // Log
            console.log(`[QRIS] Transaksi dibuat: ${orderId} - ${productName} - Rp${amount} - ${customerEmail}`);
            
            return res.status(200).json({
                success: true,
                orderId: orderId,
                qrString: result.qrString,
                amount: amount,
                expiredAt: result.expiredAt,
                message: DEMO_MODE ? 'Mode demo: QRIS tidak asli. Ganti DEMO_MODE = false untuk transaksi nyata.' : 'Transaksi QRIS berhasil dibuat.'
            });
        } else {
            throw new Error(result.error || 'Gagal membuat transaksi');
        }
    } catch (error) {
        console.error('Create payment error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Terjadi kesalahan internal saat membuat pembayaran.'
        });
    }
}

// Ekspor fungsi tambahan untuk keperluan file lain (opsional)
export { getTransaction, storeTransaction };

// ----------------------------------------------------------------------------
// AKHIR FILE create-payment.js
// ----------------------------------------------------------------------------
