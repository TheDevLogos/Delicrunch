# 🚀 Quick Start Guide - Delicrunch

> **Para nuevos desarrolladores:** Esta guía te ayudará a comenzar en 5 minutos

---

## ⚡ Inicio Ultra Rápido (1 comando)

```bash
./start-delicrunch.sh
```

Espera 2-3 minutos y escanea el QR con Expo Go. ¡Listo! 🎉

---

## 📋 Setup Paso a Paso

### 1️⃣ Clonar el Repositorio
```bash
git clone https://github.com/Alonsovl88074/Delicrunch.git
cd Delicrunch
```

### 2️⃣ Configurar Variables de Entorno

#### Backend (.env)
```bash
cd Backend
cp .env.example .env  # Si existe, o crear nuevo
```

Editar `Backend/.env`:
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=tu-secreto-seguro

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key

# Server
PORT=3000
NODE_ENV=development
```

#### Frontend (.env) - Opcional
```bash
cd ../Frontend
cp .env.example .env  # Si existe
```

Editar `Frontend/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-public-key
```

### 3️⃣ Instalar Dependencias
```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 4️⃣ Configurar Base de Datos (Supabase)

Ve a tu proyecto en [Supabase](https://supabase.com/dashboard) y ejecuta en el SQL Editor:

```sql
-- 1. Crear tablas
-- Copiar y ejecutar: supabase-migration/01-initial-schema.sql

-- 2. Poblar datos de prueba
-- Copiar y ejecutar: supabase-migration/02-seed-data.sql

-- 3. Actualizar passwords
-- Copiar y ejecutar: supabase-migration/03-fix-schema-inconsistencies.sql
```

### 5️⃣ Iniciar Aplicación
```bash
# Opción A: Todo junto (Recomendado)
./start-delicrunch.sh

# Opción B: Separado
# Terminal 1 - Backend
cd Backend && npm run dev

# Terminal 2 - Frontend
cd Frontend && npx expo start --tunnel
```

### 6️⃣ Probar en tu Dispositivo

1. Instala **Expo Go** en tu dispositivo móvil
2. Escanea el QR que aparece en la terminal
3. ¡La app debería cargarse!

---

## 🔑 Usuarios de Prueba

### Comprador
```
Email: comprador1@test.com
Password: Password123
```

### Vendedor (Taquería las Delicias)
```
Email: seller1@test.com
Password: Password123
```

### Admin
```
Email: admin@delicrunch.com
Password: Password123
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
cd Backend
npm start              # Iniciar servidor
npm run dev            # Con nodemon (auto-restart)
npm run migrate        # Ejecutar migraciones
npm run seed           # Poblar datos de prueba
```

### Frontend
```bash
cd Frontend
npx expo start         # Iniciar Expo
npx expo start --tunnel # Modo tunnel (para Codespaces)
npx expo start --clear  # Limpiar cache
```

### Diagnóstico
```bash
./diagnose-connectivity.sh    # Ver estado del sistema
./workflow-review.sh          # Revisar workflow y tareas
```

---

## 📚 Workflow de Desarrollo

### Al Iniciar Sesión
```bash
./workflow-review.sh
```

Esto muestra:
- 📋 Tareas pendientes
- 📚 Lecciones importantes
- 🔍 Estado del proyecto
- 🚀 Comandos rápidos

### Durante Desarrollo

1. **Para tareas simples:** Implementar directamente
2. **Para tareas complejas (3+ pasos):**
   - Escribir plan en `tasks/todo.md`
   - Implementar paso a paso
   - Actualizar progreso en tiempo real
   - Verificar antes de marcar completo

### Al Finalizar Sesión
- Actualizar `tasks/todo.md` con resumen
- Si hubo aprendizajes, actualizar `tasks/lessons.md`
- Commit y push cambios

---

## 📁 Archivos Importantes

### Documentación del Workflow
- `WORKFLOW_GUIDELINES.md` - Guidelines completas (LEER PRIMERO)
- `tasks/README.md` - Cómo usar el sistema de tareas
- `tasks/todo.md` - Lista de tareas activas
- `tasks/lessons.md` - Lecciones aprendidas

### Documentación Técnica
- `tasks/PROJECT_CONTEXT.md` - Estado completo del proyecto
- `ESTADO_SISTEMA_COMPLETO.md` - Estado del sistema
- `README.md` - Este archivo

### Migraciones
- `supabase-migration/01-initial-schema.sql`
- `supabase-migration/02-seed-data.sql`
- `supabase-migration/03-fix-schema-inconsistencies.sql`

---

## 🎯 Estructura del Proyecto

```
Delicrunch/
├── Backend/              # API Node.js/Express
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Endpoints
│   ├── middlewares/     # Auth, validación
│   └── server.js        # Entry point
│
├── Frontend/            # App React Native/Expo
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── screens/     # Pantallas
│   │   ├── navigation/  # React Navigation
│   │   └── context/     # Context API
│   └── app.json         # Config Expo
│
├── tasks/               # Sistema de gestión
│   ├── todo.md         # Tareas activas
│   ├── lessons.md      # Lecciones aprendidas
│   └── PROJECT_CONTEXT.md # Estado del proyecto
│
├── scripts/            # Scripts de automatización
└── supabase-migration/ # Migraciones SQL
```

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar variables de entorno
cat Backend/.env

# Verificar conexión a Supabase
cd Backend
node -e "const { createClient } = require('@supabase/supabase-js'); const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); console.log('Connected:', !!client);"

# Ver logs
npm run dev
```

### Frontend no conecta
```bash
# Limpiar cache
cd Frontend
npx expo start --clear

# Verificar URL del API en .env
cat .env

# Usar tunnel mode
npx expo start --tunnel
```

### Base de datos vacía
```bash
# Ejecutar seeds en Supabase SQL Editor
# Ver paso 4️⃣ arriba
```

### Error "Unable to load script"
```bash
# Limpiar cache completamente
cd Frontend
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 📞 Ayuda

### Documentación
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [MercadoPago Docs](https://www.mercadopago.com.mx/developers)

### Scripts de Diagnóstico
```bash
./diagnose-connectivity.sh    # Conectividad general
./diagnose-expo-connection.sh # Específico de Expo
```

### Workflow
```bash
./workflow-review.sh          # Revisar estado
cat tasks/todo.md             # Ver tareas
cat tasks/lessons.md          # Ver lecciones
```

---

## ✅ Checklist de Verificación

Después del setup, verificar:
- [ ] Backend iniciado sin errores (puerto 3000)
- [ ] Frontend muestra QR en terminal
- [ ] Base de datos tiene datos (users, stores, products)
- [ ] Puedes hacer login con usuarios de prueba
- [ ] App carga en Expo Go sin errores

---

## 🎉 ¡Todo Listo!

Si llegaste aquí y todo funciona, ¡estás listo para desarrollar!

**Próximos pasos:**
1. Lee `WORKFLOW_GUIDELINES.md` para entender el proceso
2. Ejecuta `./workflow-review.sh` al iniciar cada sesión
3. Revisa `tasks/todo.md` para ver tareas pendientes
4. ¡Empieza a desarrollar!

---

**Última actualización:** 25 de febrero de 2026

¡Bienvenido al equipo! 🚀
