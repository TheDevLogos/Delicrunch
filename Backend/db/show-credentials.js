/**
 * Script para consultar credenciales de prueba
 * Ejecutar: node db/show-credentials.js
 */

const pool = require('./index');

async function showCredentials() {
  try {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🔐 CREDENCIALES DE PRUEBA - DELICRUNCH');
    console.log('════════════════════════════════════════════════════════════\n');

    const result = await pool.query(`
      SELECT tipo_usuario, ciudad, nombre_negocio, nombre_usuario, email, password_texto 
      FROM test_credentials 
      ORDER BY 
        CASE tipo_usuario 
          WHEN 'admin' THEN 1 
          WHEN 'comercio' THEN 2 
          WHEN 'comprador' THEN 3 
        END,
        ciudad
    `);

    // Admin
    console.log('👑 ADMINISTRADOR:');
    console.log('─────────────────────────────────────────────────────────────');
    result.rows.filter(r => r.tipo_usuario === 'admin').forEach(r => {
      console.log(`   📧 Email:    ${r.email}`);
      console.log(`   🔑 Password: ${r.password_texto}`);
    });

    // Comercios
    console.log('\n🏪 COMERCIOS (Password: Comercio123):');
    console.log('─────────────────────────────────────────────────────────────');
    
    let lastCity = '';
    result.rows.filter(r => r.tipo_usuario === 'comercio').forEach(r => {
      if (r.ciudad !== lastCity) {
        console.log(`\n   📍 ${r.ciudad}:`);
        lastCity = r.ciudad;
      }
      console.log(`      • ${r.email.padEnd(38)} → ${r.nombre_negocio}`);
    });

    // Compradores
    console.log('\n\n👤 COMPRADORES (Password: Comprador123):');
    console.log('─────────────────────────────────────────────────────────────');
    
    lastCity = '';
    result.rows.filter(r => r.tipo_usuario === 'comprador').forEach(r => {
      if (r.ciudad !== lastCity) {
        console.log(`\n   📍 ${r.ciudad}:`);
        lastCity = r.ciudad;
      }
      console.log(`      • ${r.email.padEnd(30)} → ${r.nombre_usuario}`);
    });

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${result.rows.length} usuarios de prueba`);
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

showCredentials();
