# 📁 Tasks Directory - Sistema de Gestión del Proyecto

Esta carpeta contiene el sistema de gestión de tareas y lecciones aprendidas para el proyecto Delicrunch.

## 📄 Archivos

### `todo.md` - Lista de Tareas
**Propósito:** Seguimiento de tareas activas, pendientes y completadas

**Cuándo usar:**
- ✅ Al inicio de cada sesión: Revisar tareas pendientes
- ✅ Durante desarrollo: Actualizar estado de tareas
- ✅ Al completar tareas: Marcar como completadas
- ✅ Al final de sesión: Documentar resumen

**Secciones principales:**
- 🎯 Tareas en Progreso
- 📌 Tareas Pendientes (Prioridad Alta/Media/Baja)
- 🚀 Próximos Pasos
- 🔍 Checklist de Verificación
- 📊 Resumen de Sesión

---

### `lessons.md` - Lecciones Aprendidas
**Propósito:** Capturar patrones de errores y soluciones para prevenir bugs repetitivos

**Cuándo actualizar:**
- ✅ Después de cada corrección de bug
- ✅ Al descubrir un patrón de error
- ✅ Al implementar una solución elegante
- ✅ Al identificar un anti-patrón

**Secciones principales:**
- 🔴 Errores Críticos y Sus Soluciones
- ✅ Reglas de Desarrollo Establecidas
- 🎯 Mejores Prácticas Identificadas
- 🔧 Soluciones Elegantes Aplicadas
- 🚨 Anti-Patrones a Evitar

**Template de lección:**
```markdown
### Patrón: [Nombre del Error]
**Fecha:** YYYY-MM-DD
**Contexto:** Descripción de cuándo/cómo ocurrió
**Causa Raíz:** Causa fundamental del problema
**Solución:** Cómo se resolvió correctamente
**Prevención:** Regla o check para evitar en el futuro
```

---

### `PROJECT_CONTEXT.md` - Estado del Proyecto
**Propósito:** Documentación viva del estado actual del proyecto

**Contenido principal:**
- 🎯 Resumen Ejecutivo
- 🏗️ Arquitectura del Proyecto
- 🗄️ Schema de Base de Datos
- ⚠️ Problemas Conocidos
- 🔑 Usuarios de Prueba
- 🚀 Comandos Importantes
- 📡 API Endpoints

**Cuándo actualizar:**
- ✅ Cambios en la arquitectura
- ✅ Nuevas tablas o cambios en schema
- ✅ Nuevos endpoints
- ✅ Problemas importantes resueltos
- ✅ Cambios en configuración

---

## 🔄 Workflow Diario

### 1️⃣ Al Iniciar Sesión
```bash
# Ejecutar script de revisión
./workflow-review.sh

# O revisar manualmente
cat tasks/todo.md
cat tasks/lessons.md
```

### 2️⃣ Durante Desarrollo
- Mantener `todo.md` actualizado con progreso
- Marcar tareas como completadas cuando se verifican
- Documentar decisiones importantes

### 3️⃣ Al Finalizar Sesión
- Actualizar sección "Resumen de Sesión" en `todo.md`
- Si hubo aprendizajes/correcciones, actualizar `lessons.md`
- Si hubo cambios arquitecturales, actualizar `PROJECT_CONTEXT.md`

---

## 📋 Checklist de Verificación (Antes de marcar tarea como completada)

Antes de marcar cualquier tarea como completada, verificar:
- [ ] ¿Funciona correctamente? (tests, logs, pruebas manuales)
- [ ] ¿El código es limpio y mantenible?
- [ ] ¿Se documentaron los cambios importantes?
- [ ] ¿Aprobaría esto un ingeniero senior?
- [ ] ¿Se actualizó `lessons.md` con aprendizajes?

---

## 🎯 Principios Clave

### Simplicidad First ⭐⭐
Hacer cada cambio lo más simple posible. Impacto mínimo de código.

### No Laziness ⭐⭐⭐
Encontrar causas raíz. Sin arreglos temporales. Estándares de desarrollador senior.

### Minimal Impact ⭐⭐
Los cambios solo deben tocar lo necesario. Evitar introducir bugs.

---

## 📚 Referencias

- [WORKFLOW_GUIDELINES.md](../WORKFLOW_GUIDELINES.md) - Guidelines completas (300+ líneas)
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) - Estado del proyecto

---

## 💡 Tips

### Para Tareas Complejas (3+ pasos)
1. **Plan Mode:** Escribir plan detallado en `todo.md` primero
2. **Verificar Plan:** Revisar antes de implementar
3. **Track Progress:** Actualizar en tiempo real
4. **Verify:** No marcar completo sin probar

### Para Bugs
1. **Investigar:** Logs, errores, reproducir
2. **Diagnosticar:** Encontrar causa raíz (no síntomas)
3. **Implementar:** Solución correcta (no workaround)
4. **Verificar:** Tests, casos edge
5. **Documentar:** Agregar lección en `lessons.md`

### Para Features Nuevas
1. **Planificar:** Escribir en `todo.md` con criterios de éxito
2. **Implementar:** Paso a paso
3. **Demand Elegance:** ¿Hay una manera más simple/elegante?
4. **Documentar:** Decisiones importantes
5. **Lessons:** Capturar aprendizajes

---

## 🚀 Comandos Rápidos

```bash
# Ver tareas pendientes
grep "^- \[ \]" tasks/todo.md

# Ver tareas completadas hoy
grep "^- \[x\]" tasks/todo.md | head -10

# Agregar tarea rápida
echo "- [ ] Nueva tarea" >> tasks/todo.md

# Ver últimas lecciones
grep "^###" tasks/lessons.md | head -10

# Buscar una lección específica
grep -A 10 "Patrón: Nombre" tasks/lessons.md
```

---

**🎯 Objetivo:** Reducir sobretrabajo, bugs repetitivos y mejorar resolución de problemas

*Creado: 25 de febrero de 2026*
