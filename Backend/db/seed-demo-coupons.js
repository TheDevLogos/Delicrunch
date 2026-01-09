/**
 * Seed de cupones de demostración
 * Asigna algunos cupones al usuario de prueba para probar el sistema
 */
const pool = require('./index');

const seedDemoCoupons = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🎫 Asignando cupones de demostración...\n');

    // Buscar usuario demo (comprador)
    const userResult = await client.query(`
      SELECT id, email FROM users WHERE rol = 'comprador' LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No se encontró usuario comprador para asignar cupones');
      return;
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;
    console.log(`Usuario encontrado: ${userEmail} (ID: ${userId})`);

    // Obtener algunas definiciones de cupones
    const defsResult = await client.query(`
      SELECT * FROM coupon_definitions WHERE level_required <= 5 ORDER BY level_required LIMIT 4
    `);

    if (defsResult.rows.length === 0) {
      console.log('❌ No hay definiciones de cupones en la BD');
      return;
    }

    console.log(`\nEncontradas ${defsResult.rows.length} definiciones de cupones para niveles iniciales\n`);

    // Asignar cupones al usuario
    for (const couponDef of defsResult.rows) {
      // Verificar si ya tiene este cupón
      const existing = await client.query(`
        SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_definition_id = $2
      `, [userId, couponDef.id]);

      if (existing.rows.length > 0) {
        console.log(`⏭️  Ya tiene: ${couponDef.name}`);
        continue;
      }

      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + couponDef.valid_days);

      // Insertar cupón
      await client.query(`
        INSERT INTO user_coupons (
          user_id, coupon_definition_id, code, name, description, type, value,
          category, min_purchase, max_discount, icon, color, extra_discount,
          expires_at, level_obtained, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'demo')
      `, [
        userId, couponDef.id, `${couponDef.code}_demo_${Date.now()}`,
        couponDef.name, `Cupón de demostración - ${couponDef.name}`,
        couponDef.type, couponDef.value, couponDef.category,
        couponDef.min_purchase, couponDef.max_discount,
        couponDef.icon, couponDef.color, couponDef.extra_discount,
        expiresAt, couponDef.level_required
      ]);

      console.log(`✅ Cupón asignado: ${couponDef.name} (${couponDef.type} - ${couponDef.value})`);
    }

    // Actualizar stats de perfil del usuario
    await client.query(`
      UPDATE profiles SET total_xp = 500, current_level = 4 WHERE user_id = $1
    `, [userId]);
    console.log(`\n✅ Perfil actualizado: 500 XP, Nivel 4`);

    // Mostrar cupones actuales del usuario
    const couponsResult = await client.query(`
      SELECT name, type, value, category, status, expires_at 
      FROM user_coupons WHERE user_id = $1 ORDER BY expires_at
    `, [userId]);

    console.log(`\n📋 Cupones del usuario (${couponsResult.rows.length} total):`);
    couponsResult.rows.forEach(c => {
      const status = c.status === 'active' ? '🟢' : c.status === 'used' ? '🔵' : '🔴';
      console.log(`   ${status} ${c.name} | ${c.type} ${c.value} | ${c.category} | ${c.status}`);
    });

    console.log('\n✅ Seed de cupones completado!');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDemoCoupons()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDemoCoupons;
