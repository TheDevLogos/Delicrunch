// Script para poblar PostgreSQL con datos de Chihuahua
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`
});

const ciudadesChihuahua = [
  { nombre: 'Delicias', lat: 28.1906, lng: -105.4711 },
  { nombre: 'Meoqui', lat: 28.2667, lng: -105.4833 },
  { nombre: 'Saucillo', lat: 28.0333, lng: -105.2833 }
];

const comercios = [
  { nombre: 'Tacos El Norteño', tipo: 'restaurant', categoria: 'Tacos' },
  { nombre: 'Pizzería La Italiana', tipo: 'restaurant', categoria: 'Pizza' },
  { nombre: 'Hamburguesas Premium', tipo: 'restaurant', categoria: 'Hamburguesas' },
  { nombre: 'Sushi Express', tipo: 'restaurant', categoria: 'Sushi' },
  { nombre: 'Café Gourmet', tipo: 'cafe', categoria: 'Café' },
  { nombre: 'Postres Delicias', tipo: 'bakery', categoria: 'Postres' }
];

const productosTemplate = {
  'Tacos': [
    { nombre: 'Tacos de Asada', descripcion: 'Deliciosos tacos de carne asada con cebolla y cilantro', precio: 45, imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400' },
    { nombre: 'Tacos de Pastor', descripcion: 'Tacos al pastor con piña y especias', precio: 45, imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400' },
    { nombre: 'Orden de Tacos (5 piezas)', descripcion: 'Orden completa de tacos variados', precio: 200, imagen: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' }
  ],
  'Pizza': [
    { nombre: 'Pizza Hawaiana', descripcion: 'Pizza con jamón, piña y queso mozzarella', precio: 180, imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { nombre: 'Pizza Pepperoni', descripcion: 'Pizza clásica de pepperoni con queso', precio: 160, imagen: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { nombre: 'Pizza Mexicana', descripcion: 'Pizza con jalapeño, carne molida y especias', precio: 190, imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' }
  ],
  'Hamburguesas': [
    { nombre: 'Hamburguesa Clásica', descripcion: 'Carne de res, lechuga, tomate y queso', precio: 85, imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { nombre: 'Hamburguesa Doble', descripcion: 'Doble carne con queso americano', precio: 120, imagen: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
    { nombre: 'Hamburguesa BBQ', descripcion: 'Con salsa BBQ, cebolla caramelizada y tocino', precio: 130, imagen: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' }
  ],
  'Sushi': [
    { nombre: 'Rollo California', descripcion: 'Surimi, aguacate y pepino', precio: 110, imagen: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400' },
    { nombre: 'Rollo Philadelphia', descripcion: 'Salmón, queso crema y pepino', precio: 140, imagen: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400' },
    { nombre: 'Combo Sushi (20 piezas)', descripcion: 'Variedad de rollos premium', precio: 350, imagen: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400' }
  ],
  'Café': [
    { nombre: 'Cappuccino', descripcion: 'Espresso con leche vaporizada y espuma', precio: 55, imagen: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' },
    { nombre: 'Latte Vainilla', descripcion: 'Café con leche y jarabe de vainilla', precio: 60, imagen: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    { nombre: 'Frappé Chocolate', descripcion: 'Bebida fría de café con chocolate', precio: 70, imagen: 'https://images.unsplash.com/photo-1530373239216-42518e6b4063?w=400' }
  ],
  'Postres': [
    { nombre: 'Pastel de Chocolate', descripcion: 'Rebanada de pastel de chocolate con betún', precio: 65, imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
    { nombre: 'Cheesecake Fresa', descripcion: 'Cheesecake con cobertura de fresas', precio: 75, imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400' },
    { nombre: 'Brownie con Helado', descripcion: 'Brownie caliente con helado de vainilla', precio: 80, imagen: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400' }
  ]
};

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    
    // Verificar si la tabla existe y tiene las columnas correctas
    const tableCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'seller_id'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('⚠️  La tabla products no tiene seller_id. Ejecutando schema.sql...');
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Schema ejecutado correctamente');
      } else {
        console.log('❌ No se encontró schema.sql, creando tablas manualmente...');
        await createTablesManually(client);
      }
    }
    
    // Limpiar datos existentes
    console.log('🧹 Limpiando datos de prueba...');
    await client.query("DELETE FROM order_items");
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM payments");
    await client.query("DELETE FROM cart_items");
    await client.query("DELETE FROM favorites");
    await client.query("DELETE FROM reviews");
    await client.query("DELETE FROM products");
    await client.query("DELETE FROM users WHERE email LIKE '%@test.com' OR email = 'admin@delicrunch.com'");
    
    // Insertar categorías
    console.log('📂 Creando categorías...');
    const categorias = ['Tacos', 'Pizza', 'Hamburguesas', 'Sushi', 'Café', 'Postres'];
    for (const cat of categorias) {
      await client.query(`
        INSERT INTO categories (name, slug, description, is_active) 
        VALUES ($1, $2, $3, true) 
        ON CONFLICT (name) DO UPDATE SET description = $3
      `, [cat, cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), `Deliciosos productos de ${cat}`]);
    }
    console.log('   ✅ 6 categorías creadas');
    
    // Crear Admin
    console.log('\n👤 Creando usuario Admin...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role, city, state, country, is_active, is_verified)
      VALUES ($1, $2, $3, 'admin', 'Delicias', 'Chihuahua', 'México', true, true)
    `, ['Administrador Delicrunch', 'admin@delicrunch.com', adminPassword]);
    console.log('   ✅ admin@delicrunch.com / admin123');
    
    // Crear comercios y productos
    console.log('\n🏪 Creando comercios...');
    let totalProducts = 0;
    
    for (const comercio of comercios) {
      const ciudad = ciudadesChihuahua[Math.floor(Math.random() * ciudadesChihuahua.length)];
      const emailSlug = comercio.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const email = `comercio${emailSlug}@test.com`;
      const password = await bcrypt.hash('password123', 10);
      const phone = `614${Math.floor(Math.random() * 9000000) + 1000000}`;
      
      const lat = ciudad.lat + (Math.random() * 0.02 - 0.01);
      const lng = ciudad.lng + (Math.random() * 0.02 - 0.01);
      
      const sellerResult = await client.query(`
        INSERT INTO users (name, email, password, role, phone, street, city, state, country, zip_code, latitude, longitude, is_active, is_verified)
        VALUES ($1, $2, $3, 'seller', $4, $5, $6, 'Chihuahua', 'México', '33000', $7, $8, true, true)
        RETURNING id
      `, [comercio.nombre, email, password, phone, `Calle ${Math.floor(Math.random() * 100) + 1}`, ciudad.nombre, lat, lng]);
      
      const sellerId = sellerResult.rows[0].id;
      console.log(`   ✅ ${comercio.nombre} (${ciudad.nombre}) - ${email}`);
      
      // Obtener ID de categoría
      const catResult = await client.query('SELECT id FROM categories WHERE name = $1', [comercio.categoria]);
      const categoryId = catResult.rows[0]?.id;
      
      // Crear productos
      const productos = productosTemplate[comercio.categoria];
      for (const prod of productos) {
        await client.query(`
          INSERT INTO products (name, description, price, seller_id, category_id, category, stock, image_url, latitude, longitude, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        `, [prod.nombre, prod.descripcion, prod.precio, sellerId, categoryId, comercio.categoria, 
            Math.floor(Math.random() * 50) + 20, prod.imagen, lat, lng]);
        totalProducts++;
      }
    }
    console.log(`   📦 ${totalProducts} productos creados`);
    
    // Crear compradores
    console.log('\n👥 Creando compradores');
    for (const ciudad of ciudadesChihuahua) {
      const emailSlug = ciudad.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const email = `comprador${emailSlug}@test.com`;
      const password = await bcrypt.hash('password123', 10);
      const phone = `614${Math.floor(Math.random() * 9000000) + 1000000}`;
      
      await client.query(`
        INSERT INTO users (name, email, password, role, phone, street, city, state, country, zip_code, latitude, longitude, is_active, is_verified)
        VALUES ($1, $2, $3, 'buyer', $4, $5, $6, 'Chihuahua', 'México', '33000', $7, $8, true, true)
      `, [`Comprador de ${ciudad.nombre}`, email, password, phone, 
          `Calle Principal ${Math.floor(Math.random() * 100) + 1}`, ciudad.nombre, ciudad.lat, ciudad.lng]);
      
      console.log(`   ✅ ${email}`);
    }
    
    // Resumen
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM users WHERE role = 'seller') as sellers,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM categories) as categories
    `);
    
    console.log('\n' + '═'.repeat(50));
    console.log('📊 BASE DE DATOS LISTA PARA MERCADO PAGO');
    console.log('═'.repeat(50));
    console.log(`   👥 Usuarios: ${counts.rows[0].users}`);
    console.log(`   🏪 Vendedores: ${counts.rows[0].sellers}`);
    console.log(`   📦 Productos: ${counts.rows[0].products}`);
    console.log(`   📂 Categorías: ${counts.rows[0].categories}`);
    console.log('═'.repeat(50));
    console.log('\n✅ Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function createTablesManually(client) {
  // Crear tablas mínimas necesarias
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      slug VARCHAR(100),
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'buyer',
      phone VARCHAR(50),
      street VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100) DEFAULT 'México',
      zip_code VARCHAR(20),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id),
      category VARCHAR(100),
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

seedDatabase().catch(console.error);
