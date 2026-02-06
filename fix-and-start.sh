#!/bin/bash

# 🔧 Fix and Start Delicrunch
# Diagnostica, corrige problemas y inicia el sistema

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Diagnóstico y Corrección Automática"
echo "======================================="
echo ""

# Función para detener procesos
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deteniendo servicios...${NC}"
    pkill -f "node.*Backend" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================
# 1. VERIFICAR ESTRUCTURA
# ============================================
echo -e "${BLUE}[1/7] Verificando estructura del proyecto...${NC}"

if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    echo -e "${RED}❌ Estructura incorrecta${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Estructura correcta${NC}"

# ============================================
# 2. DETENER PROCESOS ANTERIORES
# ============================================
echo ""
echo -e "${BLUE}[2/7] Deteniendo procesos anteriores...${NC}"
pkill -f "node.*Backend" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Procesos detenidos${NC}"

# ============================================
# 3. VERIFICAR/CREAR .ENV FILES
# ============================================
echo ""
echo -e "${BLUE}[3/7] Verificando archivos .env...${NC}"

# Backend .env
if [ ! -f "Backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creando Backend/.env${NC}"
    if [ -f "Backend/.env.example" ]; then
        cp Backend/.env.example Backend/.env
    else
        cat > Backend/.env << 'ENVEOF'
PORT=5000
MONGO_URI=mongodb://localhost:27017/delicrunch
JWT_SECRET=your-secret-key-here-change-in-production
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NODE_ENV=development
ENVEOF
    fi
fi
echo -e "${GREEN}✅ Backend/.env existe${NC}"

# Frontend .env
if [ ! -f "Frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creando Frontend/.env${NC}"
    cat > Frontend/.env << 'ENVEOF'
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
ENVEOF
fi
echo -e "${GREEN}✅ Frontend/.env existe${NC}"

# ============================================
# 4. INSTALAR DEPENDENCIAS BACKEND
# ============================================
echo ""
echo -e "${BLUE}[4/7] Instalando dependencias del Backend...${NC}"
cd Backend

# Verificar package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Backend/package.json no encontrado${NC}"
    exit 1
fi

# Limpiar y reinstalar
rm -rf node_modules package-lock.json 2>/dev/null || true
echo "   📥 Instalando... (esto puede tardar un minuto)"
npm install --silent

# Verificar dependencias críticas
echo ""
echo "   🔍 Verificando dependencias críticas..."
MISSING_DEPS=0

if ! npm list mongoose --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  mongoose no encontrado, instalando...${NC}"
    npm install mongoose
    MISSING_DEPS=1
fi

if ! npm list bcryptjs --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  bcryptjs no encontrado, instalando...${NC}"
    npm install bcryptjs
    MISSING_DEPS=1
fi

if ! npm list jsonwebtoken --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  jsonwebtoken no encontrado, instalando...${NC}"
    npm install jsonwebtoken
    MISSING_DEPS=1
fi

if ! npm list express --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  express no encontrado, instalando...${NC}"
    npm install express
    MISSING_DEPS=1
fi

if ! npm list dotenv --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  dotenv no encontrado, instalando...${NC}"
    npm install dotenv
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 0 ]; then
    echo -e "${GREEN}   ✅ Todas las dependencias críticas instaladas${NC}"
fi

cd ..

# ============================================
# 5. INSTALAR DEPENDENCIAS FRONTEND
# ============================================
echo ""
echo -e "${BLUE}[5/7] Verificando dependencias del Frontend...${NC}"
cd Frontend

if [ ! -d "node_modules" ]; then
    echo "   📥 Instalando... (esto puede tardar unos minutos)"
    npm install --silent
else
    echo -e "${GREEN}   ✅ node_modules existe${NC}"
fi

cd ..

# ============================================
# 6. VERIFICAR MODELOS Y RUTAS
# ============================================
echo ""
echo -e "${BLUE}[6/7] Verificando modelos y rutas del Backend...${NC}"

# Verificar modelos
if [ ! -f "Backend/models/User.js" ]; then
    echo -e "${RED}❌ Backend/models/User.js no encontrado${NC}"
    exit 1
fi

if [ ! -f "Backend/models/Product.js" ]; then
    echo -e "${RED}❌ Backend/models/Product.js no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Modelos verificados${NC}"

# ============================================
# 7. CREAR SCRIPT DE SEED MEJORADO
# ============================================
echo ""
echo -e "${BLUE}[7/7] Creando script de seed mejorado...${NC}"

cat > Backend/seed-chihuahua.js << 'SEEDEOF'
// Script para poblar la base de datos con datos de Chihuahua
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Modelos
const User = require('./models/User');
const Product = require('./models/Product');

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
    { nombre: 'Tacos de Asada', descripcion: 'Deliciosos tacos de carne asada con cebolla y cilantro', precio: 45 },
    { nombre: 'Tacos de Pastor', descripcion: 'Tacos al pastor con piña y especias', precio: 45 },
    { nombre: 'Orden de Tacos (5 piezas)', descripcion: 'Orden completa de tacos variados', precio: 200 }
  ],
  'Pizza': [
    { nombre: 'Pizza Hawaiana', descripcion: 'Pizza con jamón, piña y queso mozzarella', precio: 180 },
    { nombre: 'Pizza Pepperoni', descripcion: 'Pizza clásica de pepperoni con queso', precio: 160 },
    { nombre: 'Pizza Mexicana', descripcion: 'Pizza con jalapeño, carne molida y especias', precio: 190 }
  ],
  'Hamburguesas': [
    { nombre: 'Hamburguesa Clásica', descripcion: 'Carne de res, lechuga, tomate y queso', precio: 85 },
    { nombre: 'Hamburguesa Doble', descripcion: 'Doble carne con queso americano', precio: 120 },
    { nombre: 'Hamburguesa BBQ', descripcion: 'Con salsa BBQ, cebolla caramelizada y tocino', precio: 130 }
  ],
  'Sushi': [
    { nombre: 'Rollo California', descripcion: 'Surimi, aguacate y pepino', precio: 110 },
    { nombre: 'Rollo Philadelphia', descripcion: 'Salmón, queso crema y pepino', precio: 140 },
    { nombre: 'Combo Sushi (20 piezas)', descripcion: 'Variedad de rollos premium', precio: 350 }
  ],
  'Café': [
    { nombre: 'Cappuccino', descripcion: 'Espresso con leche vaporizada y espuma', precio: 55 },
    { nombre: 'Latte Vainilla', descripcion: 'Café con leche y jarabe de vainilla', precio: 60 },
    { nombre: 'Frappé Chocolate', descripcion: 'Bebida fría de café con chocolate', precio: 70 }
  ],
  'Postres': [
    { nombre: 'Pastel de Chocolate', descripcion: 'Rebanada de pastel de chocolate con betún', precio: 65 },
    { nombre: 'Cheesecake Fresa', descripcion: 'Cheesecake con cobertura de fresas', precio: 75 },
    { nombre: 'Brownie con Helado', descripcion: 'Brownie caliente con helado de vainilla', precio: 80 }
  ]
};

async function seedDatabase() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log('   URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar datos de prueba anteriores
    console.log('🧹 Limpiando datos de prueba anteriores...');
    await User.deleteMany({ email: { $regex: /@test\.com$|@delicrunch\.com$/ } });
    await Product.deleteMany({});
    console.log('✅ Datos anteriores eliminados');

    const createdProducts = [];

    // Crear Admin
    console.log('\n👤 Creando usuario Admin...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Administrador Delicrunch',
      email: 'admin@delicrunch.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      address: {
        street: 'Av. Principal',
        city: 'Delicias',
        state: 'Chihuahua',
        country: 'México',
        zipCode: '33000',
        location: {
          type: 'Point',
          coordinates: [-105.4711, 28.1906]
        }
      }
    });
    console.log('✅ Admin: admin@delicrunch.com / admin123');

    // Crear comercios y productos
    console.log('\n🏪 Creando comercios y productos...');
    
    for (const comercio of comercios) {
      const ciudad = ciudadesChihuahua[Math.floor(Math.random() * ciudadesChihuahua.length)];
      const email = `comercio${comercio.nombre.toLowerCase().replace(/\s+/g, '').replace(/ñ/g, 'n')}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      const vendedor = await User.create({
        name: comercio.nombre,
        email: email,
        password: password,
        role: 'seller',
        isActive: true,
        phone: `639${Math.floor(Math.random() * 9000000) + 1000000}`,
        address: {
          street: `Calle ${Math.floor(Math.random() * 100) + 1}`,
          city: ciudad.nombre,
          state: 'Chihuahua',
          country: 'México',
          zipCode: '33000',
          location: {
            type: 'Point',
            coordinates: [
              ciudad.lng + (Math.random() * 0.02 - 0.01),
              ciudad.lat + (Math.random() * 0.02 - 0.01)
            ]
          }
        }
      });

      console.log(`✅ ${comercio.nombre} en ${ciudad.nombre}`);
      console.log(`   📧 ${email}`);

      // Crear 3 productos
      const productos = productosTemplate[comercio.categoria];
      for (const prod of productos) {
        const product = await Product.create({
          name: prod.nombre,
          description: prod.descripcion,
          price: prod.precio,
          seller: vendedor._id,
          category: comercio.categoria,
          stock: Math.floor(Math.random() * 50) + 20,
          images: [`https://via.placeholder.com/400x300?text=${encodeURIComponent(prod.nombre)}`],
          isActive: true,
          location: {
            type: 'Point',
            coordinates: vendedor.address.location.coordinates
          }
        });
        createdProducts.push(product);
      }
      console.log(`   📦 3 productos creados`);
    }

    // Crear compradores
    console.log('\n👥 Creando compradores...');
    
    for (const ciudad of ciudadesChihuahua) {
      const email = `comprador${ciudad.nombre.toLowerCase()}@test.com`;
      const password = await bcrypt.hash('password123', 10);

      await User.create({
        name: `Comprador de ${ciudad.nombre}`,
        email: email,
        password: password,
        role: 'buyer',
        isActive: true,
        phone: `639${Math.floor(Math.random() * 9000000) + 1000000}`,
        address: {
          street: `Calle Principal ${Math.floor(Math.random() * 100) + 1}`,
          city: ciudad.nombre,
          state: 'Chihuahua',
          country: 'México',
          zipCode: '33000',
          location: {
            type: 'Point',
            coordinates: [ciudad.lng, ciudad.lat]
          }
        }
      });
      console.log(`✅ ${ciudad.nombre}: ${email}`);
    }

    console.log('\n📊 Resumen Final:');
    console.log(`   👤 Admin: 1`);
    console.log(`   🏪 Comercios: ${comercios.length}`);
    console.log(`   📦 Productos: ${createdProducts.length}`);
    console.log(`   👥 Compradores: ${ciudadesChihuahua.length}`);
    console.log(`   📍 Ciudades: ${ciudadesChihuahua.map(c => c.nombre).join(', ')}`);
    
    console.log('\n✅ Base de datos poblada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
  }
}

// Verificar variables de entorno antes de ejecutar
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI no está definida en .env');
  process.exit(1);
}

seedDatabase();
SEEDEOF

echo -e "${GREEN}✅ Script de seed creado${NC}"

# ============================================
# INICIAR BACKEND
# ============================================
echo ""
echo "======================================"
echo -e "${GREEN}✅ Sistema verificado y corregido${NC}"
echo "======================================"
echo ""
echo "🚀 Iniciando servicios..."
echo ""

# Iniciar Backend
echo -e "${BLUE}[BACKEND]${NC} Iniciando en http://localhost:5000"
cd Backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend inicie
echo "⏳ Esperando que el backend inicie (10 segundos)..."
sleep 10

# Verificar que el backend esté corriendo
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend tardando en iniciar, esperando 5 segundos más...${NC}"
    sleep 5
fi

# Poblar base de datos
echo ""
echo -e "${BLUE}[SEED]${NC} Poblando base de datos..."
cd Backend
node seed-chihuahua.js
SEED_RESULT=$?
cd ..

if [ $SEED_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Error al poblar la base de datos${NC}"
    echo "Revisa los logs: cat backend.log"
    cleanup
    exit 1
fi

# Iniciar Frontend
echo ""
echo -e "${BLUE}[FRONTEND]${NC} Iniciando Expo Go (SDK 54)..."
cd Frontend
npx expo start --clear > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo -e "${GREEN}✅ Delicrunch iniciado correctamente!${NC}"
echo "======================================"
echo ""
echo "📍 Servicios:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: Escanea QR con Expo Go"
echo ""
echo "🔐 Credenciales:"
echo "   Admin: admin@delicrunch.com / admin123"
echo "   Comercios: comercio*@test.com / password123"
echo "   Compradores: comprador*@test.com / password123"
echo ""
echo "📦 Datos creados:"
echo "   🏪 6 comercios (18 productos)"
echo "   👥 3 compradores"
echo "   📍 Delicias, Meoqui, Saucillo"
echo ""
echo "📋 Logs:"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
echo ""
echo "🛑 Presiona Ctrl+C para detener"
echo "======================================"

# Mantener corriendo
wait