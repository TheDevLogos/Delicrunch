const router = require('express').Router();
const pool = require('../db');
const protect = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
router.use(protect);
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const before = req.query.before;
  if (before && !/^\d+$/.test(before)) return res.status(400).json({ msg: 'Cursor inválido.' });
  const [items, count] = await Promise.all([
    pool.query(`SELECT id, tipo, titulo, mensaje, leido, data, created_at FROM notifications
      WHERE user_id=$1 AND visible_at<=NOW() AND ($2::bigint IS NULL OR id<$2) ORDER BY id DESC LIMIT $3`, [req.user.id, before || null, limit]),
    pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND leido=false AND visible_at<=NOW()', [req.user.id]),
  ]);
  res.json({ notifications: items.rows, unread: count.rows[0].count,
    nextCursor: items.rows.length === limit ? items.rows[items.rows.length - 1].id : null });
}));
router.patch('/read-all', asyncHandler(async (req, res) => {
  // Only acknowledge what the client actually saw, preserving newly arriving notices.
  if (!/^\d+$/.test(String(req.body.throughId || ''))) return res.status(400).json({ msg: 'Referencia inválida.' });
  await pool.query('UPDATE notifications SET leido=true WHERE user_id=$1 AND visible_at<=NOW() AND id<=$2 AND leido=false', [req.user.id, req.body.throughId]);
  res.json({ ok: true });
}));
router.patch('/:id/read', asyncHandler(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ msg: 'Aviso inválido.' });
  const result = await pool.query('UPDATE notifications SET leido=true WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
  if (!result.rowCount) return res.status(404).json({ msg: 'Aviso no encontrado.' });
  res.json({ ok: true });
}));
module.exports = router;
