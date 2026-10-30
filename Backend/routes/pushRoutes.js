const express = require('express');
const pool = require('../db');
const protect = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { sendPush, refreshReceipts } = require('../services/pushService');

const router = express.Router();
router.use(protect);

router.put('/devices', asyncHandler(async (req, res) => {
  const { token, platform } = req.body || {};
  if (typeof token !== 'string' || !/^(ExponentPushToken|ExpoPushToken)\[[^\]]{10,200}\]$/.test(token) ||
      !['android', 'ios'].includes(platform)) {
    return res.status(400).json({ msg: 'Token de dispositivo inválido.' });
  }
  await pool.query(
    `INSERT INTO push_devices (user_id, expo_push_token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (expo_push_token) DO UPDATE SET user_id = EXCLUDED.user_id,
       platform = EXCLUDED.platform, disabled_at = NULL, last_seen_at = NOW()`,
    [req.user.id, token, platform]
  );
  return res.json({ registered: true });
}));

router.delete('/devices', asyncHandler(async (req, res) => {
  const token = req.body?.token;
  if (typeof token === 'string') {
    await pool.query('UPDATE push_devices SET disabled_at = NOW() WHERE user_id = $1 AND expo_push_token = $2', [req.user.id, token]);
  }
  return res.json({ registered: false });
}));

router.get('/campaigns', restrictTo('admin'), asyncHandler(async (req, res) => {
  const [messages, devices] = await Promise.all([
    pool.query(
      `SELECT m.id, m.kind, m.audience, m.title, m.body, m.order_id,
              m.recipient_count, m.created_at,
              COUNT(d.id)::int AS attempts,
              COUNT(d.id) FILTER (WHERE d.status = 'accepted_by_provider')::int AS accepted,
              COUNT(d.id) FILTER (WHERE d.status = 'failed')::int AS failed,
              COUNT(d.id) FILTER (WHERE d.status = 'ticket_sent')::int AS awaiting_receipt
       FROM push_messages m LEFT JOIN push_deliveries d ON d.message_id = m.id
       GROUP BY m.id ORDER BY m.created_at DESC LIMIT 100`
    ),
    pool.query(
      `SELECT u.rol AS audience, COUNT(DISTINCT d.id)::int AS devices,
              COUNT(DISTINCT d.user_id)::int AS users
       FROM push_devices d JOIN users u ON u.id = d.user_id
       WHERE d.disabled_at IS NULL AND u.rol IN ('comprador', 'comercio')
       GROUP BY u.rol`
    ),
  ]);
  return res.json({ messages: messages.rows, devices: devices.rows });
}));

router.post('/campaigns', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { audience, title, body } = req.body || {};
  if (!['comprador', 'comercio'].includes(audience) ||
      typeof title !== 'string' || !title.trim() || title.trim().length > 120 ||
      typeof body !== 'string' || !body.trim() || body.trim().length > 500) {
    return res.status(400).json({ msg: 'Selecciona destinatarios y escribe un título y mensaje válidos.' });
  }
  const id = await sendPush({
    kind: 'campaign', audience, title: title.trim(), body: body.trim(), createdBy: req.user.id,
  });
  return res.status(201).json({ id });
}));

router.post('/receipts/refresh', restrictTo('admin'), asyncHandler(async (req, res) => {
  const updated = await refreshReceipts();
  return res.json({ updated });
}));

module.exports = router;
