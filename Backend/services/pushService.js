const pool = require('../db');

const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

const expoRequest = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Expo respondió ${response.status}`);
  return response.json();
};

const selectDevices = async (audience, targetUserId) => {
  const result = await pool.query(
    `SELECT d.id, d.user_id, d.expo_push_token
     FROM push_devices d JOIN users u ON u.id = d.user_id
     WHERE d.disabled_at IS NULL AND u.rol = $1
       AND ($2::bigint IS NULL OR u.id = $2)
     ORDER BY d.id`,
    [audience, targetUserId || null]
  );
  return result.rows;
};

const sendPush = async ({ kind, audience, title, body, orderId = null, createdBy = null, targetUserId = null }) => {
  let message;
  if (kind === 'order') {
    const result = await pool.query(
      `INSERT INTO push_messages (kind, audience, title, body, order_id)
       VALUES ('order', $1, $2, $3, $4)
       ON CONFLICT (order_id) WHERE kind = 'order' DO NOTHING RETURNING *`,
      [audience, title, body, orderId]
    );
    message = result.rows[0];
    if (!message) return null;
  } else {
    const result = await pool.query(
      `INSERT INTO push_messages (kind, audience, title, body, created_by)
       VALUES ('campaign', $1, $2, $3, $4) RETURNING *`,
      [audience, title, body, createdBy]
    );
    message = result.rows[0];
  }

  const devices = await selectDevices(audience, targetUserId);
  await pool.query('UPDATE push_messages SET recipient_count = $1 WHERE id = $2', [devices.length, message.id]);
  for (let offset = 0; offset < devices.length; offset += 100) {
    const batch = devices.slice(offset, offset + 100);
    const payloads = batch.map(device => ({
      to: device.expo_push_token,
      title,
      body,
      sound: 'default',
      channelId: kind === 'order' ? 'orders' : 'general',
      priority: kind === 'order' ? 'high' : 'default',
      data: kind === 'order' ? { type: 'merchant_order', orderId: String(orderId) } : { type: 'campaign' },
    }));
    let tickets;
    try {
      const response = await expoRequest(EXPO_SEND_URL, payloads);
      tickets = Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      tickets = batch.map(() => ({ status: 'error', message: error.message }));
    }
    for (let index = 0; index < batch.length; index += 1) {
      const device = batch[index];
      const ticket = tickets[index] || { status: 'error', message: 'Expo no devolvió un ticket.' };
      const status = ticket.status === 'ok' ? 'ticket_sent' : 'failed';
      await pool.query(
        `INSERT INTO push_deliveries (message_id, device_id, status, ticket_id, error)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (message_id, device_id)
         DO UPDATE SET status = EXCLUDED.status, ticket_id = EXCLUDED.ticket_id,
           error = EXCLUDED.error, updated_at = NOW()`,
        [message.id, device.id, status, ticket.id || null, status === 'failed' ? String(ticket.message || ticket.details?.error || 'Error de envío').slice(0, 500) : null]
      );
      if (ticket.details?.error === 'DeviceNotRegistered') {
        await pool.query('UPDATE push_devices SET disabled_at = NOW() WHERE id = $1', [device.id]);
      }
    }
  }
  return message.id;
};

const sendOrderPush = async ({ orderId, storeId, productName }) => {
  const owner = await pool.query('SELECT user_id FROM stores WHERE id = $1', [storeId]);
  const userId = owner.rows[0]?.user_id;
  if (!userId) return null;
  const title = 'Nuevo pedido en Delicrunch';
  const body = `Pedido DC-${String(orderId).padStart(6, '0')}: ${productName}. Abre la app para prepararlo.`;
  await pool.query(
    `INSERT INTO notifications (user_id, tipo, titulo, mensaje, data)
     VALUES ($1, 'pedido', $2, $3, $4::jsonb)`,
    [userId, title, body, JSON.stringify({ type: 'merchant_order', orderId })]
  );
  return sendPush({ kind: 'order', audience: 'comercio', title, body, orderId, targetUserId: userId });
};

const refreshReceipts = async () => {
  const pending = await pool.query(
    `SELECT d.id, d.ticket_id, d.device_id FROM push_deliveries d
     WHERE d.status = 'ticket_sent' AND d.ticket_id IS NOT NULL ORDER BY d.id LIMIT 300`
  );
  if (!pending.rows.length) return 0;
  const response = await expoRequest(EXPO_RECEIPTS_URL, { ids: pending.rows.map(row => row.ticket_id) });
  let updated = 0;
  for (const delivery of pending.rows) {
    const receipt = response.data?.[delivery.ticket_id];
    if (!receipt) continue;
    const status = receipt.status === 'ok' ? 'accepted_by_provider' : 'failed';
    await pool.query(
      `UPDATE push_deliveries SET status = $1, error = $2, updated_at = NOW() WHERE id = $3`,
      [status, status === 'failed' ? String(receipt.message || receipt.details?.error || 'Error de entrega').slice(0, 500) : null, delivery.id]
    );
    if (receipt.details?.error === 'DeviceNotRegistered') {
      await pool.query('UPDATE push_devices SET disabled_at = NOW() WHERE id = $1', [delivery.device_id]);
    }
    updated += 1;
  }
  return updated;
};

module.exports = { sendPush, sendOrderPush, refreshReceipts };
