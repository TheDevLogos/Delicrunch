# 👥 Usuarios en Producción - Delicrunch
## Base de Datos: Supabase (PostgreSQL)
**Última actualización:** 11 de marzo de 2026

---

## ✅ ESTADO: TODOS LOS USUARIOS FUNCIONANDO

Todos los usuarios han sido verificados y probados exitosamente en producción.

---

## 👑 ADMINISTRADOR

### Admin Principal
- **Nombre**: Admin Delicrunch
- **Email**: `admin@delicrunch.com`
- **Password**: `Admin123!`
- **Rol**: `admin`
- **ID**: 23
- **Estado**: ✅ Activo y verificado

**Permisos**:
- Acceso completo al panel de administración
- Gestión de usuarios y comercios
- Métricas y estadísticas del sistema
- Gestión de categorías y cupones

---

## 🏪 COMERCIOS (3 activos)

### 1. Taquería las Delicias
- **Nombre**: Taquería las Delicias
- **Email**: `comercio@delicrunch.com`
- **Password**: `Comercio123!`
- **Rol**: `comercio`
- **ID**: 18
- **Estado**: ✅ Activo

### 2. Pizza Orsinis
- **Nombre**: Pizza Orsinis
- **Email**: `pizza@delicrunch.com`
- **Password**: `Comercio123!`
- **Rol**: `comercio`
- **ID**: 19
- **Estado**: ✅ Activo

### 3. Café Placeres
- **Nombre**: Café Placeres
- **Email**: `cafe@delicrunch.com`
- **Password**: `Comercio123!`
- **Rol**: `comercio`
- **ID**: 20
- **Estado**: ✅ Activo

**Funcionalidades de Comercio**:
- Crear y gestionar productos
- Ver órdenes recibidas
- Gestionar horarios de recogida
- Ver balance y ganancias (split 82%)
- Actualizar perfil y ubicación

---

## 🛒 COMPRADORES

### Test Buyer
- **Nombre**: Test Buyer
- **Email**: `testbuyer2@delicrunch.com`
- **Password**: `Test1234!`
- **Rol**: `comprador`
- **ID**: (sin especificar en query)
- **Estado**: ✅ Activo y verificado

**Funcionalidades de Comprador**:
- Buscar y comprar productos
- Sistema de gamificación (XP, niveles, badges)
- Ver órdenes y favoritos
- Escribir reseñas
- Recibir cupones por nivel
- Pagar con MercadoPago

---

## 🔐 PRUEBAS DE ACCESO REALIZADAS

**Fecha**: 11 de marzo de 2026  
**Resultado**: ✅ 5/5 usuarios exitosos (100%)

| Email | Rol | Login | Token Generado |
|-------|-----|-------|----------------|
| admin@delicrunch.com | admin | ✅ | ✅ |
| comercio@delicrunch.com | comercio | ✅ | ✅ |
| pizza@delicrunch.com | comercio | ✅ | ✅ |
| cafe@delicrunch.com | comercio | ✅ | ✅ |
| testbuyer2@delicrunch.com | comprador | ✅ | ✅ |

---

## 📊 ESTRUCTURA DE LA TABLA `users`

### Columnas principales (español):
- `id` (bigint) - Primary key
- `nombre` (varchar) - Nombre completo
- `email` (varchar) - Email único
- `rol` (varchar) - Rol: 'admin', 'comercio', 'comprador'
- `password_hash` (varchar) - Contraseña hasheada con bcrypt
- `created_at` (timestamp) - Fecha de creación
- `updated_at` (timestamp) - Última actualización

**Nota**: La tabla tiene columnas adicionales de Supabase Auth que no se utilizan actualmente.

---

## 🔧 SCRIPTS DE GESTIÓN

### 1. Actualizar contraseñas
```bash
node Backend/update-passwords.js
```
Actualiza las contraseñas de todos los usuarios con hashes bcrypt seguros.

### 2. Listar usuarios
```bash
node Backend/list-users-fix.js
```
Muestra todos los usuarios agrupados por rol.

### 3. Probar accesos
```bash
bash test-all-users-login.sh
```
Prueba el login de todos los usuarios en producción.

### 4. Verificar schema
```bash
node Backend/check-schema.js
```
Muestra la estructura de tablas y columnas en Supabase.

---

## 🔒 SEGURIDAD

### Hashing de contraseñas
- **Algoritmo**: bcrypt
- **Rounds**: 10
- **Longitud hash**: 60 caracteres

### Ejemplo de hash generado:
```
$2b$10$pjxKjgyzrde3SmUz8PWbsOL...
```

### Autenticación
- **Método**: JWT (JSON Web Token)
- **Header**: `x-auth-token`
- **Expiración**: Configurada en el backend

---

## 📋 PRÓXIMOS PASOS (OPCIONAL)

### Agregar más usuarios de prueba:
1. Modificar el array `USERS` en `update-passwords.js`
2. Ejecutar el script
3. Probar con `test-all-users-login.sh`

### Ejemplo de nuevo usuario:
```javascript
{
  email: 'nuevousuario@delicrunch.com',
  password: 'Password123!',
  rol: 'comercio',
  nombre: 'Nuevo Comercio'
}
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Contraseñas seguras**: Todas las contraseñas incluyen:
   - Mínimo 8 caracteres
   - Mayúsculas y minúsculas
   - Números
   - Caracteres especiales (!)

2. **Seed local vs Producción**: 
   - El archivo `seed-chihuahua.js` usa columnas en inglés (name, role, etc.)
   - La base de Supabase usa columnas en español (nombre, rol, etc.)
   - Los scripts de actualización ya están adaptados a las columnas en español

3. **Roles en español**:
   - ✅ `admin` (no `administrator`)
   - ✅ `comercio` (no `seller`)
   - ✅ `comprador` (no `buyer`)

---

## 📞 SOPORTE

Para problemas con usuarios o accesos:
1. Verificar que el backend esté funcionando: `https://delicrunch.onrender.com/api/health`
2. Ejecutar `node Backend/list-users-fix.js` para ver estado actual
3. Ejecutar `bash test-all-users-login.sh` para probar accesos
4. Si es necesario, ejecutar `node Backend/update-passwords.js` para resetear contraseñas

---

**✅ Sistema de usuarios verificado y funcionando al 100%**
