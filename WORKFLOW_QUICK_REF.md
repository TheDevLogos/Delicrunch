# 📌 Referencia Rápida - Workflow Delicrunch

> **Imprimir o mantener visible durante desarrollo**

---

## 🎯 PRINCIPIOS CORE (Memorizar)

### ⭐⭐⭐ No Laziness
**Encontrar CAUSAS RAÍZ. Sin arreglos temporales. Estándares de ingeniero senior.**
- ❌ "Funciona en mi máquina" 
- ✅ "Funciona en todos los entornos"
- ❌ Comentar código roto
- ✅ Arreglar o eliminar código roto

### ⭐⭐ Simplicity First
**Hacer cada cambio lo más simple posible. Impacto mínimo de código.**
- Preferir soluciones simples sobre complejas
- Menos líneas = menos bugs
- YAGNI: You Aren't Gonna Need It

### ⭐⭐ Minimal Impact
**Los cambios solo deben tocar lo necesario. Evitar introducir bugs.**
- Cambiar solo lo necesario
- Un cambio = un propósito
- Refactorings separados de features

---

## 🔄 WORKFLOW DIARIO

### 🌅 AL INICIAR
```bash
./workflow-review.sh
cat tasks/todo.md
cat tasks/lessons.md
```

### 💻 DURANTE DESARROLLO
1. **¿Tarea simple (1-2 pasos)?** → Implementar directo
2. **¿Tarea compleja (3+ pasos)?** → Plan Mode:
   - Escribir plan en `tasks/todo.md`
   - Verificar plan
   - Implementar paso a paso
   - Actualizar progreso
   - Verificar antes de marcar completo

### 🌙 AL FINALIZAR
- Actualizar `tasks/todo.md` (Resumen de Sesión)
- Si hubo aprendizajes → Actualizar `tasks/lessons.md`
- Commit y push

---

## ✅ CHECKLIST PRE-COMMIT

Antes de CADA commit:
- [ ] ¿Funciona? (tests, logs, pruebas manuales)
- [ ] ¿Código limpio y mantenible?
- [ ] ¿Cambios mínimos y necesarios?
- [ ] ¿Aprobaría esto un ingeniero senior?
- [ ] ¿Actualizado lessons.md con aprendizajes?

---

## 🐛 PROCESO DE BUGS

```
Bug Reportado
    ↓
1. Investigar (logs, errores, reproducir)
    ↓
2. Diagnosticar (CAUSA RAÍZ, no síntomas)
    ↓
3. Planificar (si complejo)
    ↓
4. Implementar (solución correcta, no workaround)
    ↓
5. Verificar (tests, logs, casos edge)
    ↓
6. Documentar (lessons.md)
```

---

## 📋 6 REGLAS DE ORO

### 1. Plan Mode Default
Planificar ANTES de codificar tareas complejas (3+ pasos).
Si algo falla, DETENER y re-planificar.

### 2. Subagent Strategy
Usar subagentes para investigación/análisis.
Mantener contexto principal limpio.

### 3. Self-Improvement Loop
DESPUÉS de CADA corrección del usuario:
1. Actualizar `lessons.md` con patrón
2. Escribir regla de prevención
3. Revisar lecciones al inicio de sesión

### 4. Verification Before Done
NUNCA marcar completo sin probar.
¿Aprobaría esto un ingeniero staff?

### 5. Demand Elegance
Para cambios no triviales: pausar y buscar solución elegante.
Saltear solo para fixes obvios de 1-2 líneas.

### 6. Autonomous Bug Fixing
Arreglar bugs autónomamente.
Zero context switching del usuario.

---

## 🚫 ANTI-PATRONES

### ❌ NUNCA HACER
- Workarounds sin documentar la deuda técnica
- Marcar tarea completa sin verificar
- console.log debugging en producción
- Try-catch genéricos sin manejo específico
- Asumir estructura de BD (siempre verificar)
- Commits con "WIP" o "fix" sin descripción

### ✅ SIEMPRE HACER
- Buscar causa raíz
- Verificar queries contra schema real
- Logs estructurados y significativos
- Manejar errores específicamente
- Documentar decisiones importantes
- Commits descriptivos y atómicos

---

## 📊 SCHEMA DE BD (Delicrunch)

### Columnas SIEMPRE EN ESPAÑOL

#### users
- `nombre` (NO "name")
- `rol` (NO "role")
- `password_hash`
- NO tiene: phone, street, city, avatar_url

#### products
- `store_id` (NO "seller_id") → FK a stores.id
- `nombre` (NO "name")
- `descripcion` (NO "description")
- `precio_descuento` (NO "price")
- `precio_original` (NO "compare_price")
- `cantidad_disponible` (NO "stock")
- `activo` (NO "is_active")

#### stores
- `user_id` → FK a users.id
- `nombre`, `descripcion`, `direccion`
- `calificacion_promedio`

#### reviews
- `calificacion` (NO "rating")
- `comentario` (NO "comment")
- `store_id` → FK a stores.id

#### profiles (datos extendidos de users)
- `id` → FK a users.id
- `telefono`, `direccion`, `ciudad`
- Estos NO están en users!

---

## 🔧 COMANDOS RÁPIDOS

```bash
# Iniciar todo
./start-delicrunch.sh

# Backend solo
cd Backend && npm run dev

# Frontend solo
cd Frontend && npx expo start --tunnel

# Workflow
./workflow-review.sh
cat tasks/todo.md
cat tasks/lessons.md

# Diagnóstico
./diagnose-connectivity.sh

# Verificar estructura BD
psql $DATABASE_URL -c "\d users"
psql $DATABASE_URL -c "\d products"
```

---

## 📝 TEMPLATE DE LECCIÓN

```markdown
### Patrón: [Nombre del Error]
**Fecha:** YYYY-MM-DD
**Contexto:** Descripción
**Causa Raíz:** Por qué ocurrió
**Solución:** Cómo se arregló
**Prevención:** Regla para evitar
```

---

## 🎯 PREGUNTAS DE VERIFICACIÓN

Antes de marcar tarea completa:
1. ¿Funciona en TODOS los escenarios?
2. ¿Maneja errores apropiadamente?
3. ¿Qué podría ROMPER esto?
4. ¿Es MANTENIBLE en 6 meses?
5. ¿Aprobaría esto un INGENIERO SENIOR?

---

## 💡 TIPS

### Para Elegancia
Si se siente hacky, preguntar:
"Conociendo todo lo que sé ahora, ¿cuál es la solución elegante?"

### Para Debugging
1. Reproducir error SIEMPRE primero
2. Leer logs COMPLETOS (no asumir)
3. Verificar schema REAL (no memoria)
4. Buscar causa RAÍZ (no síntoma)

### Para Planificación
- Escribir CRITERIOS DE ÉXITO medibles
- Identificar DEPENDENCIAS
- Definir PASOS VERIFICABLES
- Estimar COMPLEJIDAD realista

---

**🎯 OBJETIVO:** Reducir sobretrabajo, bugs repetitivos, mejorar resolución de problemas

**📌 RECORDAR:** Este workflow es una HERRAMIENTA, no burocracia. Úsalo para MEJORAR, no para frenar.

---

*Última actualización: 25 de febrero de 2026*

---

## 📚 RECURSOS

- [WORKFLOW_GUIDELINES.md](WORKFLOW_GUIDELINES.md) - Guía completa (300+ líneas)
- [tasks/README.md](tasks/README.md) - Cómo usar el sistema
- [tasks/PROJECT_CONTEXT.md](tasks/PROJECT_CONTEXT.md) - Estado del proyecto
- [QUICK_START.md](QUICK_START.md) - Setup inicial
