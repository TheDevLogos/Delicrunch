/**
 * Script para poblar la base de datos con comercios de Delicias, Chihuahua
 * Crea 6 comercios con 6 productos cada uno
 */

const pool = require('../db');
const bcrypt = require('bcryptjs');

// Coordenadas de Delicias, Chihuahua
const DELICIAS_CENTER = {
  lat: 28.1903,
  lng: -105.4708,
  city: 'Delicias',
  state: 'Chihuahua'
};

// Función para generar coordenadas aleatorias cerca de un punto
function getRandomCoordinates(centerLat, centerLng, radiusKm = 3) {
  const radiusInDegrees = radiusKm / 111; // 111 km por grado aprox
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: (centerLat + x).toFixed(6),
    lng: (centerLng + y).toFixed(6)
  };
}

// Definición de comercios
const STORES = [
  {
    name: 'Tacos el Borrego de Oro',
    email: 'tacosborregodeoro@delicias.com',
    description: 'Los mejores tacos de borrego de Delicias. Receta familiar con más de 30 años de tradición.',
    address: 'Av. Tercera Norte 301',
    phone: '639-123-4567',
    category: 'Tacos',
    products: [
      { name: 'Taco de Borrego', originalPrice: 45, discountPrice: 25, description: 'Delicioso taco de borrego con cebolla y cilantro', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
      { name: 'Orden de Tacos (3 pzas)', originalPrice: 120, discountPrice: 70, description: 'Orden de 3 tacos de borrego con salsas', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1599974579688-8dbdd335339f?w=400' },
      { name: 'Burrito de Borrego', originalPrice: 80, discountPrice: 50, description: 'Burrito grande de borrego con frijoles', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400' },
      { name: 'Quesadilla de Borrego', originalPrice: 70, discountPrice: 45, description: 'Quesadilla con queso y borrego', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400' },
      { name: 'Taco Dorado de Borrego', originalPrice: 50, discountPrice: 30, description: 'Taco dorado crujiente con crema y queso', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400' },
      { name: 'Consomé de Borrego', originalPrice: 90, discountPrice: 60, description: 'Consomé caliente con carne de borrego', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' }
    ]
  },
  {
    name: 'Pizza Orsinis',
    email: 'pizzaorsinis@delicias.com',
    description: 'Pizzería artesanal con ingredientes frescos y recetas italianas auténticas.',
    address: 'Calle Cuarta Sur 125',
    phone: '639-234-5678',
    category: 'Pizza',
    products: [
      { name: 'Pizza Margarita', originalPrice: 180, discountPrice: 100, description: 'Pizza clásica con tomate, mozzarella y albahaca', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      { name: 'Pizza Pepperoni', originalPrice: 200, discountPrice: 120, description: 'Pizza con abundante pepperoni y queso', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
      { name: 'Pizza Hawaiana', originalPrice: 190, discountPrice: 110, description: 'Pizza con jamón y piña', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      { name: 'Pizza Cuatro Quesos', originalPrice: 210, discountPrice: 130, description: 'Mezcla de mozzarella, parmesano, gorgonzola y provolone', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
      { name: 'Calzone Italiano', originalPrice: 170, discountPrice: 95, description: 'Pizza cerrada rellena de jamón, queso y champiñones', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=400' },
      { name: 'Pan de Ajo', originalPrice: 60, discountPrice: 35, description: 'Pan artesanal con mantequilla de ajo y queso', category: 'Pizza', imageUrl: 'https://images.unsplash.com/photo-1573140401552-388e7e2ee1c8?w=400' }
    ]
  },
  {
    name: 'Café Placeres',
    email: 'cafeplaceres@delicias.com',
    description: 'Cafetería boutique con café de especialidad y repostería artesanal.',
    address: 'Av. Quinta Poniente 450',
    phone: '639-345-6789',
    category: 'Café',
    products: [
      { name: 'Latte Especial', originalPrice: 65, discountPrice: 40, description: 'Café latte con leche de almendra y vainilla', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
      { name: 'Cappuccino', originalPrice: 60, discountPrice: 38, description: 'Espresso con espuma de leche cremosa', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' },
      { name: 'Frappe de Caramelo', originalPrice: 75, discountPrice: 45, description: 'Bebida fría con café, leche y caramelo', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400' },
      { name: 'Croissant de Mantequilla', originalPrice: 45, discountPrice: 28, description: 'Croissant francés recién horneado', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
      { name: 'Muffin de Arándano', originalPrice: 50, discountPrice: 30, description: 'Muffin esponjoso con arándanos frescos', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400' },
      { name: 'Sandwich Caprese', originalPrice: 85, discountPrice: 55, description: 'Pan ciabatta con tomate, mozzarella y albahaca', category: 'Café', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' }
    ]
  },
  {
    name: 'Taquería las Delicias',
    email: 'taqueriasdelicias@delicias.com',
    description: 'Tacos al estilo norteño con carne asada y tortillas hechas a mano.',
    address: 'Calle Segunda Norte 789',
    phone: '639-456-7890',
    category: 'Tacos',
    products: [
      { name: 'Taco de Carne Asada', originalPrice: 40, discountPrice: 22, description: 'Taco de carne asada con cebolla y cilantro', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400' },
      { name: 'Taco de Pastor', originalPrice: 38, discountPrice: 20, description: 'Taco al pastor con piña', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
      { name: 'Taco de Suadero', originalPrice: 42, discountPrice: 24, description: 'Suadero jugoso con salsa verde', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1613514785940-daed07799d11?w=400' },
      { name: 'Vampiro de Asada', originalPrice: 70, discountPrice: 45, description: 'Quesadilla frita con carne asada', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1599974579688-8dbdd335339f?w=400' },
      { name: 'Alambres', originalPrice: 95, discountPrice: 60, description: 'Carne con queso, pimiento y cebolla', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
      { name: 'Gringa', originalPrice: 75, discountPrice: 48, description: 'Tortilla de harina con pastor y queso', category: 'Tacos', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400' }
    ]
  },
  {
    name: 'Pastelería Dulce Noviembre',
    email: 'pasteleriadulcenoviembre@delicias.com',
    description: 'Pasteles y postres artesanales para toda ocasión. Especialidad en repostería fina.',
    address: 'Av. Sexta Oriente 234',
    phone: '639-567-8901',
    category: 'Postres',
    products: [
      { name: 'Rebanada de Pastel Chocolate', originalPrice: 65, discountPrice: 40, description: 'Pastel de chocolate con ganache', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
      { name: 'Cheesecake de Fresa', originalPrice: 70, discountPrice: 45, description: 'Cheesecake cremoso con fresas frescas', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400' },
      { name: 'Cupcake Red Velvet', originalPrice: 45, discountPrice: 28, description: 'Cupcake de terciopelo rojo con frosting', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1426869884541-df7117556757?w=400' },
      { name: 'Donas Glaseadas (3 pzas)', originalPrice: 80, discountPrice: 50, description: 'Tres donas con diferentes sabores', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400' },
      { name: 'Tarta de Manzana', originalPrice: 75, discountPrice: 48, description: 'Tarta casera con manzanas caramelizadas', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400' },
      { name: 'Macarons Franceses (6 pzas)', originalPrice: 95, discountPrice: 60, description: 'Seis macarons de diferentes sabores', category: 'Postres', imageUrl: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400' }
    ]
  },
  {
    name: 'Frutería los Pelones',
    email: 'fruteriapelones@delicias.com',
    description: 'Fruta fresca de temporada y preparados saludables. ¡Rescata fruta antes de que se desperdicie!',
    address: 'Calle Séptima Sur 567',
    phone: '639-678-9012',
    category: 'Desayunos',
    products: [
      { name: 'Bowl de Frutas Mixtas', originalPrice: 80, discountPrice: 45, description: 'Fresas, melón, papaya, piña y uvas', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
      { name: 'Jugo Verde Detox', originalPrice: 60, discountPrice: 35, description: 'Jugo de espinaca, apio, piña y jengibre', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400' },
      { name: 'Smoothie de Mango', originalPrice: 65, discountPrice: 40, description: 'Smoothie cremoso de mango con yogurt', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400' },
      { name: 'Ensalada de Frutas con Yogurt', originalPrice: 70, discountPrice: 42, description: 'Frutas frescas con yogurt griego y granola', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400' },
      { name: 'Agua de Fruta Natural (1L)', originalPrice: 50, discountPrice: 30, description: 'Agua fresca de frutas de temporada', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400' },
      { name: 'Caja de Fruta Sorpresa', originalPrice: 120, discountPrice: 70, description: 'Variedad de frutas frescas del día', category: 'Desayunos', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400' }
    ]
  }
];

async function seedDeliciasStores() {
  const client = await pool.connect();
  
  try {
    console.log('🏪 Iniciando seed de comercios de Delicias...\n');
    
    await client.query('BEGIN');
    
    // Contraseña por defecto
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Primero, limpiar comercios de prueba anteriores de Delicias
    console.log('🧹 Limpiando comercios anteriores de Delicias...');
    const emailList = STORES.map(s => s.email);
    await client.query(
      'DELETE FROM users WHERE email = ANY($1::text[])',
      [emailList]
    );
    console.log('✅ Comercios anteriores eliminados\n');
    
    // Obtener o crear categorías
    const categoryMap = {};
    const uniqueCategories = [...new Set(STORES.flatMap(s => s.products.map(p => p.category)))];
    
    for (const catName of uniqueCategories) {
      const catResult = await client.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [catName]
      );
      categoryMap[catName] = catResult.rows[0].id;
    }
    
    // Crear cada comercio
    for (const store of STORES) {
      console.log(`\n📍 Creando ${store.name}...`);
      
      // Generar coordenadas aleatorias cerca del centro de Delicias
      const coords = getRandomCoordinates(DELICIAS_CENTER.lat, DELICIAS_CENTER.lng);
      
      // Crear usuario vendedor con todos los datos
      const userResult = await client.query(
        `INSERT INTO users (
          name, email, password, role, phone, 
          street, city, state, latitude, longitude, 
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, 'seller', $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
        RETURNING id`,
        [
          store.name, 
          store.email, 
          hashedPassword, 
          store.phone,
          store.address,
          DELICIAS_CENTER.city,
          DELICIAS_CENTER.state,
          coords.lat,
          coords.lng
        ]
      );
      
      const userId = userResult.rows[0].id;
      console.log(`   ✅ Usuario vendedor creado (ID: ${userId})`);
      console.log(`   📧 Email: ${store.email}`);
      console.log(`   🔑 Password: password123`);
      console.log(`   📍 Coordenadas: ${coords.lat}, ${coords.lng}`);
      
      // Crear productos
      console.log(`   📦 Creando ${store.products.length} productos...`);
      let productCount = 0;
      
      for (const product of store.products) {
        const categoryId = categoryMap[product.category];
        
        await client.query(
          `INSERT INTO products (
            seller_id, name, description, price, compare_price,
            stock, category, category_id, latitude, longitude,
            image_url, is_active, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $10, true, NOW(), NOW())`,
          [
            userId,
            product.name,
            product.description,
            product.discountPrice,
            product.originalPrice,
            product.category,
            categoryId,
            coords.lat,
            coords.lng,
            product.imageUrl
          ]
        );
        
        productCount++;
      }
      
      console.log(`   ✅ ${productCount} productos creados`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SEED DE DELICIAS COMPLETADO EXITOSAMENTE          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 RESUMEN:');
    console.log(`   🏪 Comercios creados: ${STORES.length}`);
    console.log(`   📦 Total de productos: ${STORES.reduce((acc, s) => acc + s.products.length, 0)}`);
    console.log(`   📍 Ubicación: ${DELICIAS_CENTER.city}, ${DELICIAS_CENTER.state}`);
    console.log(`   🔑 Password común: password123\n`);
    
    console.log('📧 EMAILS DE ACCESO:');
    STORES.forEach(store => {
      console.log(`   • ${store.email}`);
    });
    
    console.log('\n💡 NOTA: Cada producto tiene 1 unidad disponible para pruebas de compra.\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error al ejecutar seed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDeliciasStores()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { seedDeliciasStores };
