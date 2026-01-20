const pool = require('../Backend/db');

(async () => {
  const client = await pool.connect();
  try {
    const email = 'comprador@delicrunch.com';
    const userRes = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rows.length === 0) {
      console.error(JSON.stringify({ success: false, error: 'Usuario no encontrado' }));
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    // Buscar una definición de cupón activa (usar welcome_5 si existe)
    let defRes = await client.query("SELECT * FROM coupon_definitions WHERE code = 'welcome_5' AND is_active = true LIMIT 1");
    if (defRes.rows.length === 0) {
      // fallback: tomar la primera definición activa
      defRes = await client.query('SELECT * FROM coupon_definitions WHERE is_active = true LIMIT 1');
      if (defRes.rows.length === 0) {
        console.error(JSON.stringify({ success: false, error: 'No hay definiciones de cupones activas' }));
        process.exit(1);
      }
    }

    const def = defRes.rows[0];

    // Preparar valores
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (def.valid_days || 30));
    const code = `forced_test_${def.code}_${userId}_${Date.now()}`;

    const insertRes = await client.query(`
      INSERT INTO user_coupons (
        user_id, coupon_definition_id, code, name, description, type, value,
        category, min_purchase, max_discount, icon, color, extra_discount,
        expires_at, level_obtained, source, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'forced_test','active')
      RETURNING *
    `, [
      userId, def.id, code, def.name, `Cupón forzado para test - ${def.name}`,
      def.type, def.value, def.category, def.min_purchase, def.max_discount,
      def.icon, def.color, def.extra_discount || 0, expiresAt, def.level_required || 1
    ]);

    console.log(JSON.stringify({ success: true, coupon: insertRes.rows[0] }));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
})();
