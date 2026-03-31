/**
 * Script de verificación post-migración
 * Verifica que todas las columnas y tablas existan correctamente en Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rrvdvbzkwhhgvgxzlcsw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ ERROR: SUPABASE_KEY no está configurado');
  console.error('Por favor configura SUPABASE_KEY en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Estructura esperada de cada tabla
const expectedStructure = {
  orders: [
    'id', 'user_id', 'store_id', 'total', 'estado', 'metodo_pago',
    'codigo_recogida', 'mercadopago_preference_id', 'mercadopago_payment_id',
    'comision_plataforma', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'store_id', 'nombre', 'descripcion', 'precio_original',
    'precio_descuento', 'cantidad_disponible', 'categoria', 'activo',
    'destacado', 'producto_listo', 'created_at', 'updated_at'
  ],
  stores: [
    'id', 'user_id', 'nombre', 'descripcion', 'direccion', 'telefono',
    'activo', 'mercadopago_user_id', 'mercadopago_public_key',
    'mercadopago_access_token', 'mercadopago_onboarding_complete',
    'comision_plataforma', 'created_at', 'updated_at'
  ],
  order_items: [
    'id', 'order_id', 'product_id', 'cantidad', 'precio_unitario',
    'created_at'
  ],
  payment_preferences: [
    'id', 'mercadopago_preference_id', 'user_id', 'product_id',
    'store_id', 'amount', 'currency', 'platform_fee_amount',
    'merchant_amount', 'status', 'metadata', 'external_reference',
    'created_at', 'updated_at'
  ],
  users: [
    'id', 'email', 'password', 'nombre', 'rol', 'created_at', 'updated_at'
  ],
  profiles: [
    'id', 'user_id', 'total_xp', 'total_packs_saved', 'unlocked_badges',
    'mercadopago_customer_id', 'created_at', 'updated_at'
  ],
  reviews: [
    'id', 'order_id', 'user_id', 'store_id', 'product_id',
    'calidad_comida', 'valor_precio', 'experiencia_recogida',
    'comentario', 'created_at', 'updated_at'
  ]
};

// Foreign Keys esperadas
const expectedForeignKeys = {
  orders: [
    { column: 'user_id', references: 'users(id)' },
    { column: 'store_id', references: 'stores(id)' }
  ],
  products: [
    { column: 'store_id', references: 'stores(id)' }
  ],
  order_items: [
    { column: 'order_id', references: 'orders(id)' },
    { column: 'product_id', references: 'products(id)' }
  ],
  stores: [
    { column: 'user_id', references: 'users(id)' }
  ]
};

async function verifyTableColumns(tableName, expectedColumns) {
  console.log(`\n📋 Verificando tabla: ${tableName}`);
  
  try {
    // Consultar información de columnas
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: tableName
    });

    // Si no hay función RPC, intentar con query directa
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `;

    // Como Supabase no permite queries arbitrarias desde JS, usamos una aproximación
    // Intentamos hacer un SELECT * LIMIT 0 para obtener las columnas
    const { data: testData, error: testError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (testError) {
      console.error(`❌ Error al acceder a ${tableName}:`, testError.message);
      return false;
    }

    const actualColumns = testData && testData[0] ? Object.keys(testData[0]) : [];
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

    if (missingColumns.length === 0 && extraColumns.length === 0) {
      console.log(`✅ ${tableName}: Todas las columnas correctas (${actualColumns.length} columnas)`);
      return true;
    } else {
      console.log(`⚠️  ${tableName}: Diferencias encontradas`);
      if (missingColumns.length > 0) {
        console.log(`   Columnas faltantes: ${missingColumns.join(', ')}`);
      }
      if (extraColumns.length > 0) {
        console.log(`   Columnas extra: ${extraColumns.join(', ')}`);
      }
      return false;
    }
  } catch (err) {
    console.error(`❌ Error verificando ${tableName}:`, err.message);
    return false;
  }
}

async function verifyTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      // Error 42P01 = tabla no existe
      if (error.code === '42P01') {
        console.log(`❌ Tabla ${tableName} NO EXISTE`);
        return false;
      }
      console.log(`⚠️  Error al verificar ${tableName}:`, error.message);
      return false;
    }

    console.log(`✅ Tabla ${tableName} existe`);
    return true;
  } catch (err) {
    console.error(`❌ Error verificando existencia de ${tableName}:`, err.message);
    return false;
  }
}

async function verifyCriticalData() {
  console.log('\n📊 Verificando datos críticos...\n');

  try {
    // Verificar que hay usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, rol')
      .limit(5);

    if (usersError) {
      console.error('❌ Error al consultar users:', usersError.message);
    } else {
      console.log(`✅ Usuarios: ${users?.length || 0} usuarios encontrados`);
      if (users && users.length > 0) {
        console.log('   Ejemplos:', users.map(u => `${u.email} (${u.rol})`).join(', '));
      }
    }

    // Verificar que hay tiendas
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, nombre, activo')
      .limit(5);

    if (storesError) {
      console.error('❌ Error al consultar stores:', storesError.message);
    } else {
      console.log(`✅ Tiendas: ${stores?.length || 0} tiendas encontradas`);
      if (stores && stores.length > 0) {
        console.log('   Ejemplos:', stores.map(s => `${s.nombre} (activo: ${s.activo})`).join(', '));
      }
    }

    // Verificar que hay productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, nombre, precio_descuento, cantidad_disponible, store_id')
      .limit(5);

    if (productsError) {
      console.error('❌ Error al consultar products:', productsError.message);
    } else {
      console.log(`✅ Productos: ${products?.length || 0} productos encontrados`);
      if (products && products.length > 0) {
        console.log('   Ejemplos:', products.map(p => 
          `${p.nombre} - $${p.precio_descuento} (store: ${p.store_id})`
        ).join(', '));
      }
    }

    // Verificar payment_preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('payment_preferences')
      .select('id, mercadopago_preference_id, status')
      .limit(5);

    if (prefsError) {
      console.error('❌ Error al consultar payment_preferences:', prefsError.message);
    } else {
      console.log(`✅ Payment Preferences: ${prefs?.length || 0} registros`);
    }

  } catch (err) {
    console.error('❌ Error en verificación de datos:', err.message);
  }
}

async function main() {
  console.log('🔍 INICIANDO VERIFICACIÓN DE MIGRACIÓN\n');
  console.log('=' .repeat(60));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('='.repeat(60));

  let allPassed = true;

  // 1. Verificar existencia de tablas críticas
  console.log('\n\n📦 PASO 1: Verificar existencia de tablas');
  console.log('-'.repeat(60));

  const criticalTables = [
    'users', 'stores', 'products', 'orders', 'order_items',
    'payment_preferences', 'profiles', 'reviews'
  ];

  for (const table of criticalTables) {
    const exists = await verifyTableExists(table);
    if (!exists) allPassed = false;
  }

  // 2. Verificar columnas de cada tabla
  console.log('\n\n📋 PASO 2: Verificar estructura de columnas');
  console.log('-'.repeat(60));

  for (const [tableName, columns] of Object.entries(expectedStructure)) {
    const valid = await verifyTableColumns(tableName, columns);
    if (!valid) allPassed = false;
  }

  // 3. Verificar datos críticos
  await verifyCriticalData();

  // Resumen final
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(60));

  if (allPassed) {
    console.log('✅ MIGRACIÓN EXITOSA');
    console.log('Todas las tablas y columnas están correctas.');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Actualiza los controllers para usar las columnas en español');
    console.log('2. Haz commit y push a GitHub');
    console.log('3. Render desplegará automáticamente');
    console.log('4. Prueba los endpoints de pago');
  } else {
    console.log('⚠️  MIGRACIÓN INCOMPLETA');
    console.log('Revisa los errores arriba y ejecuta el SQL de migración de nuevo.');
    console.log('\nArchivo: Backend/db/migrations/supabase-complete-migration.sql');
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(err => {
  console.error('\n❌ ERROR FATAL:', err);
  process.exit(1);
});
