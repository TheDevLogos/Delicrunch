# 🔧 Scripts de Gestión de Usuarios - Delicrunch

Colección de scripts para gestionar usuarios en Supabase.

---

## 📋 Scripts Disponibles

### 1. 👀 Listar Usuarios
```bash
node Backend/list-users-fix.js
```
**Propósito**: Muestra todos los usuarios agrupados por rol (admin, comercio, comprador).

**Output**:
- Lista de administradores con email e ID
- Lista de comercios con email, teléfono e ID  
- Lista de compradores con email

---

### 2. 🔐 Actualizar Contraseñas
```bash
node Backend/update-passwords.js
```
**Propósito**: Actualiza las contraseñas de usuarios específicos con hashes bcrypt seguros.

**Usuarios que actualiza**:
- admin@delicrunch.com → Admin123!
- comercio@delicrunch.com → Comercio123!
- pizza@delicrunch.com → Comercio123!
- cafe@delicrunch.com → Comercio123!
- testbuyer2@delicrunch.com → Test1234!

**Advertencia**: Modifica las contraseñas en la base de datos de producción.

---

### 3. 🧪 Probar Login de Todos los Usuarios
```bash
bash test-all-users-login.sh
```
**Propósito**: Prueba el endpoint `/api/auth/login` con todos los usuarios configurados.

**Output**:
- ✅ Login exitoso + token parcial
- ❌ Login fallido + mensaje de error
- Resumen de éxitos y fallos

---

### 4. 🏗️ Seed Completo de Base de Datos
```bash
node Backend/seed-supabase.js
```
**Propósito**: Crea una base de datos completa con:
- 1 administrador
- 6 comercios con productos
- 3 compradores
- ~18 productos con precios y categorías

**⚠️  ADVERTENCIA**: Este script **ELIMINA** todos los datos de prueba existentes antes de insertar nuevos.

**Seguro ejecutar en**:
- ✅ Base de datos local para desarrollo
- ✅ Supabase de testing
- ⚠️  Supabase de producción (solo si quieres resetear todo)

---

### 5. 🔍 Verificar Schema de Base de Datos
```bash
node Backend/check-schema.js
```
**Propósito**: Muestra la estructura de tablas y columnas en Supabase.

**Output**:
- Lista de tablas disponibles
- Columnas de tabla `users` con tipos de datos
- Columnas de otras tablas relacionadas con usuarios

---

## 🗂️ Archivos Importantes

### seed-chihuahua.js
**Estado**: ⚠️ **OBSOLETO**  
**Problema**: Usa columnas en inglés (name, role, password)  
**No usar con**: Supabase actual (usa español)

### seed-supabase.js
**Estado**: ✅ **ACTUAL Y RECOMENDADO**  
**Características**:
- Columnas en español (nombre, rol, password_hash)
- Compatible con estructura de Supabase
- Crea relación completa: users → stores → products
- Contraseñas seguras predefinidas

---

## 📖 Guía de Uso Común

### Caso 1: Ver usuarios actuales
```bash
node Backend/list-users-fix.js
```

### Caso 2: Resetear contraseña de usuario
1. Editar `Backend/update-passwords.js`
2. Modificar el array `USERS` con el email y nueva contraseña
3. Ejecutar: `node Backend/update-passwords.js`

### Caso 3: Crear base de datos desde cero
```bash
# ⚠️  Esto eliminará todos los datos existentes
node Backend/seed-supabase.js
```

### Caso 4: Verificar que todos los usuarios pueden hacer login
```bash
bash test-all-users-login.sh
```

---

## 🔐 Seguridad

### Hashing de Contraseñas
- **Algoritmo**: bcrypt
- **Rounds**: 10
- **Longitud**: 60 caracteres

### Ejemplo de hash:
```
$2b$10$pjxKjgyzrde3SmUz8PWbsOLvXY8...
```

### Requisitos de contraseña:
- ✅ Mínimo 8 caracteres
- ✅ Mayúsculas y minúsculas
- ✅ Números
- ✅ Caracteres especiales

---

## 🐛 Troubleshooting

### Error: "relation 'usuarios' does not exist"
**Causa**: Intentando usar columnas incorrectas  
**Solución**: Verificar que se usen columnas en español (nombre, rol, password_hash)

### Error: "column 'phone' does not exist"
**Causa**: Algunas columnas tienen nombres diferentes en Supabase  
**Solución**: Usar `Backend/check-schema.js` para ver nombres reales de columnas

### Login falla con credenciales correctas
**Causa**: Contraseña no hasheada correctamente  
**Solución**: Ejecutar `node Backend/update-passwords.js` para rehashear

---

## 📚 Documentación Adicional

Ver archivo completo de usuarios: [USUARIOS_PRODUCCION.md](../USUARIOS_PRODUCCION.md)

---

**Última actualización**: 11 de marzo de 2026
