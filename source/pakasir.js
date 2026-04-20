import { PAKASIR_CONFIG } from './config.js';

export async function createQrisTransaction({ amount, orderId, customerEmail, productName }) {
  // Implementasi asli panggil API Pakasir
  const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: PAKASIR_CONFIG.project,
      order_id: orderId,
      amount: amount,
      api_key: PAKASIR_CONFIG.apiKey
    })
  });
  const data = await response.json();
  return { qrString: data.payment?.payment_number, expiredAt: data.payment?.expired_at };
}