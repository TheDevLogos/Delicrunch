const pool = require('../Backend/db');

(async () => {
  const client = await pool.connect();
  try {
    const email = 'comprador@delicrunch.com';

    const userRes = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rows.length === 0) {
      console.error('Usuario no encontrado');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    console.log('Usuario ID', userId);

    // 1) Restablecer cupón id 6 si existe y pertenece al usuario
    const couponIdToRestore = 6;
    await client.query(
      'UPDATE user_coupons SET status = $1, used_at = NULL, used_in_order_id = NULL WHERE id = $2 AND user_id = $3',
      ['active', couponIdToRestore, userId]
    );
    console.log(`Cupón ${couponIdToRestore} restablecido a active (si pertenecía al usuario).`);

    // 2) Obtener nivel actual del usuario
    const profileRes = await client.query('SELECT current_level, total_pedidos FROM profiles WHERE user_id = $1', [userId]);
    const currentLevel = (profileRes.rows[0] && profileRes.rows[0].current_level) || 1;
    const totalPedidos = (profileRes.rows[0] && profileRes.rows[0].total_pedidos) || 0;
    console.log('Nivel actual:', currentLevel, 'Total pedidos:', totalPedidos);

    // 3) Obtener definiciones hasta el nivel actual
    const defsRes = await client.query('SELECT * FROM coupon_definitions WHERE is_active = true AND level_required <= $1 ORDER BY level_required ASC', [currentLevel]);
    const defs = defsRes.rows;
    console.log('Definiciones elegibles encontradas:', defs.length);

    for (const def of defs) {
      // comprobar si ya tiene instancia
      const existing = await client.query('SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_definition_id = $2', [userId, def.id]);
      if (existing.rows.length > 0) {
        console.log(`Ya tiene cupón para definition ${def.code} (id ${def.id})`);
        continue;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (def.valid_days || 30));

      const code = `${def.code}_auto_${userId}_${Date.now()}`;

      const insertRes = await client.query(`
        INSERT INTO user_coupons (user_id, coupon_definition_id, code, name, description, type, value, category, min_purchase, max_discount, icon, color, extra_discount, expires_at, level_obtained, source)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'auto_grant') RETURNING id
      `, [
        userId, def.id, code, def.name, `Otorgado automáticamente según nivel ${def.level_required}`, def.type, def.value,
        def.category, def.min_purchase, def.max_discount, def.icon, def.color, def.extra_discount || 0, expiresAt, def.level_required || 1
      ]);

      console.log('Insertado cupón para def', def.code, '-> user_coupon id', insertRes.rows[0].id);
    }

    // 4) Mostrar resumen de cupones del usuario
    const myCoupons = await client.query('SELECT id, name, status, obtained_at, expires_at, source FROM user_coupons WHERE user_id = $1 ORDER BY expires_at', [userId]);
    console.log('Cupones del usuario:');
    myCoupons.rows.forEach(c => {
      console.log(JSON.stringify(c));
    });

    console.log('Proceso completado.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
})();
