# 🎯 Workflow Orchestration Guidelines - Delicrunch

> **Framework de Trabajo Permanente**
> **Propósito:** Reducir sobretrabajo, bugs repetitivos y mejorar resolución de problemas

---

## 📋 Tabla de Contenidos

1. [Workflow Orchestration](#workflow-orchestration)
2. [Task Management](#task-management)
3. [Core Principles](#core-principles)
4. [Implementación Práctica](#implementación-práctica)

---

## 🔄 Workflow Orchestration

### 1. Plan Mode Default

**Cuándo entrar en modo planificación:**
- ✅ CUALQUIER tarea no trivial (3+ pasos o decisiones arquitecturales)
- ✅ Antes de hacer refactorings significativos
- ✅ Al abordar bugs complejos que afectan múltiples componentes
- ✅ Al implementar nuevas features

**Reglas del Plan Mode:**
- Si algo va mal, **DETENER** y re-planificar inmediatamente
- No continuar empujando si el plan original no funciona
- Usar modo plan para pasos de verificación, no solo para construcción
- Escribir especificaciones detalladas upfront para reducir ambigüedad

**Ejemplo de Plan:**
```markdown
## Tarea: [Nombre de la tarea]

### Objetivos
- [ ] Objetivo 1
- [ ] Objetivo 2

### Pasos
1. Paso específico y verificable
2. Paso específico y verificable
3. Verificación

### Criterios de Éxito
- Criterio medible 1
- Criterio medible 2
```

---

### 2. Subagent Strategy

**Cuándo usar subagentes:**
- Mantener limpia la ventana de contexto principal
- Offload investigación, exploración y análisis paralelo
- Para problemas complejos, lanzar más capacidad de computación
- **Un ataque por subagent** para ejecución enfocada

**Usos apropiados:**
- Búsqueda de código en múltiples archivos
- Análisis de dependencias
- Investigación de soluciones alternativas
- Validación de configuraciones

---

### 3. Self-Improvement Loop

**Proceso obligatorio después de correcciones del usuario:**

1. ✍️ **Actualizar `tasks/lessons.md`** con el patrón del error
2. 📝 **Escribir reglas** que prevengan el mismo error
3. 🔁 **Iterar despiadadamente** en estas lecciones hasta que la tasa de error caiga
4. 📖 **Revisar lecciones** al inicio de sesión para proyectos relevantes

**Template de Lección:**
```markdown
### Patrón: [Nombre del Error]
**Fecha:** YYYY-MM-DD
**Contexto:** Qué estaba haciendo cuando ocurrió
**Causa Raíz:** Por qué ocurrió realmente
**Solución:** Cómo se arregló correctamente
**Prevención:** Regla o check para evitar en el futuro
```

---

### 4. Verification Before Done

**NUNCA marcar una tarea como completa sin probar que funciona:**

#### Checklist de Verificación
- [ ] **Tests:** ¿Funcionan los tests automatizados?
- [ ] **Logs:** ¿Los logs muestran comportamiento correcto?
- [ ] **Diff:** ¿Los cambios son mínimos y necesarios?
- [ ] **Code Review Mental:** ¿Aprobaría esto un ingeniero staff?
- [ ] **Casos Edge:** ¿Maneja correctamente casos límite?
- [ ] **Errores:** ¿Maneja errores apropiadamente?

#### Preguntas de Validación
- 🤔 "¿Aprobaría esto un ingeniero staff?"
- 🤔 "¿Qué podría romper esto?"
- 🤔 "¿Hay casos no cubiertos?"
- 🤔 "¿Es esto mantenible en 6 meses?"

---

### 5. Demand Elegance (Balanced)

**Para cambios no triviales:** Pausar y preguntar "¿Hay una manera más elegante?"

#### Proceso de Elegancia
1. **Implementación inicial:** Hacer que funcione
2. **Pause & Reflect:** ¿Se siente hacky?
3. **Si es hacky:** "Conociendo todo lo que sé ahora, implementar la solución elegante"
4. **Refactor:** Limpiar y simplificar

#### Cuándo saltarse
- ✅ Arreglos simples y obvios (1-2 líneas)
- ✅ Código throwaway o temporal documentado
- ✅ Hotfixes urgentes (pero crear ticket para refactor)

#### Cuándo demandar elegancia
- ❗ Cambios en lógica de negocio core
- ❗ Código que será mantenido/extendido
- ❗ Soluciones que otros desarrolladores usarán

**Desafía tu propio trabajo antes de presentarlo**

---

### 6. Autonomous Bug Fixing

**Cuando se reporta un bug: SOLO ARREGLARLO**

#### Proceso Autónomo
1. 🔍 **Investigar:** Revisar logs, errores, stack traces
2. 🎯 **Diagnosticar:** Encontrar causa raíz
3. 🔧 **Arreglar:** Implementar solución correcta
4. ✅ **Verificar:** Tests, logs, demostrar corrección
5. 📝 **Documentar:** Actualizar lessons.md

#### No Hacer
- ❌ Pedir que te tomen de la mano
- ❌ Preguntar cómo debuggear
- ❌ Requerir cambio de contexto del usuario

#### Siempre Hacer
- ✅ Apuntar a logs, errores, tests que fallen
- ✅ Resolver autónomamente
- ✅ Ir a arreglar tests de CI que fallen sin que te digan cómo
- ✅ **Zero context switching** requerido del usuario

---

## 📊 Task Management

### 1. ✍️ Plan First
**Escribir plan a `tasks/todo.md` con items verificables**

Antes de codificar:
- Crear plan detallado en `tasks/todo.md`
- Identificar dependencias
- Definir criterios de éxito claros
- Estimar complejidad

### 2. ✅ Verify Plans
**Verificar antes de comenzar implementación**

Preguntas antes de empezar:
- ¿El plan es completo?
- ¿Hay ambigüedades?
- ¿Faltan pasos?
- ¿Los criterios de éxito son medibles?

### 3. 📈 Track Progress
**Marcar items completos mientras avanzas**

Durante implementación:
- Actualizar estado en `tasks/todo.md` en tiempo real
- No marcar completo hasta verificar
- Documentar blockers inmediatamente
- Ajustar plan si es necesario

### 4. 📝 Explain Changes
**Resumen de alto nivel en cada paso**

Al completar cada tarea:
- Explicar QUÉ se cambió
- Explicar POR QUÉ se cambió
- Documentar decisiones importantes
- Notar implicaciones futuras

### 5. 📋 Document Results
**Agregar sección de revisión a `tasks/todo.md`**

Al finalizar sesión:
- Resumir cambios aplicados
- Listar problemas encontrados
- Documentar decisiones técnicas
- Definir próximos pasos

### 6. 📚 Capture Lessons
**Actualizar `tasks/lessons.md` después de correcciones**

Después de cada corrección:
- Documentar el patrón del error
- Escribir regla de prevención
- Actualizar anti-patrones
- Refinar mejores prácticas

---

## ⭐ Core Principles

### 🎯 Simplicity First ⭐⭐

**Hacer cada cambio lo más simple posible. Impacto mínimo de código.**

- Preferir soluciones simples sobre complejas
- Menos líneas de código = menos bugs
- Si parece complicado, probablemente hay una manera más simple
- YAGNI: You Aren't Gonna Need It

**Ejemplos:**
- ✅ Usar funcionalidad existente antes de crear nueva
- ✅ Modificar código existente en lugar de duplicar
- ✅ Una función clara de 10 líneas > Una clase de 100 líneas

---

### 🔍 No Laziness ⭐⭐⭐

**Encontrar causas raíz. Sin arreglos temporales. Estándares de desarrollador senior.**

#### Mindset Requerido
- Investigar profundamente, no superficialmente
- Entender el "por qué" antes de arreglar
- No aceptar workarounds sin documentación
- Pensar en mantenibilidad a largo plazo

#### En la Práctica
- ❌ "Funciona en mi máquina" ➜ ✅ "Funciona en todos los entornos"
- ❌ "Comentar código roto" ➜ ✅ "Arreglar o eliminar código roto"
- ❌ "Try-catch genérico" ➜ ✅ "Manejo específico de errores"
- ❌ "console.log debugging" ➜ ✅ "Logs estructurados apropiados"

---

### 🎁 Minimal Impact ⭐⭐

**Los cambios solo deben tocar lo necesario. Evitar introducir bugs.**

#### Principio del Menor Privilegio de Cambios
- Cambiar solo lo necesario
- Un cambio = un propósito
- Refactorings separados de features
- Tests separados de implementación

#### Verificación de Impacto
Antes de cada commit preguntar:
- ¿Este cambio afecta algo más?
- ¿Hay side effects no intencionales?
- ¿Rompe compatibilidad?
- ¿Necesita migración de datos?

---

## 🛠️ Implementación Práctica

### Workflow Diario

#### Al Inicio de Sesión
1. 📖 Leer `tasks/lessons.md` - Revisar reglas relevantes
2. 📋 Revisar `tasks/todo.md` - Ver estado actual
3. 🎯 Planificar sesión - Definir objetivos claros

#### Durante Desarrollo
1. ✍️ **Plan Mode:** Para tareas no triviales (3+ pasos)
2. 📈 **Track Progress:** Actualizar `todo.md` en tiempo real
3. ✅ **Verify:** Antes de marcar completo
4. 💡 **Demand Elegance:** Para cambios importantes

#### Al Finalizar Sesión
1. 📝 Documentar cambios en `todo.md`
2. 📚 Actualizar `lessons.md` con aprendizajes
3. 🎯 Definir próximos pasos
4. ✅ Verificar que todo está commiteado

---

### Manejo de Bugs

```
Bug Reportado
    ↓
1. Investigar (logs, errores, reproducir)
    ↓
2. Diagnosticar (encontrar causa raíz)
    ↓
3. Planificar fix (si es complejo)
    ↓
4. Implementar solución
    ↓
5. Verificar (tests, logs, casos edge)
    ↓
6. Documentar lección
    ↓
7. Actualizar reglas de prevención
```

---

### Implementación de Features

```
Nueva Feature
    ↓
1. Plan Mode (escribir en todo.md)
    ↓
2. Verificar plan
    ↓
3. Implementar paso a paso
    ↓
4. Track progress
    ↓
5. Verificar cada paso
    ↓
6. Demand elegance
    ↓
7. Documentar decisiones
    ↓
8. Capturar lecciones
```

---

## 📏 Métricas de Éxito

### Reducción de Sobretrabjo
- ✅ Menos re-implementaciones
- ✅ Menos tiempo en debuggeo
- ✅ Planificación más efectiva

### Reducción de Bugs Repetitivos
- ✅ Tasa de bugs similares disminuye
- ✅ Reglas de prevención efectivas
- ✅ Menos errores del mismo tipo

### Mejor Resolución de Problemas
- ✅ Tiempo de resolución más rápido
- ✅ Soluciones más robustas
- ✅ Menos regressions

---

## 🔄 Revisión y Mejora Continua

### Semanal
- Revisar `lessons.md` y consolidar
- Eliminar reglas obsoletas
- Refinar mejores prácticas

### Mensual
- Analizar métricas de bugs
- Evaluar efectividad del workflow
- Ajustar según aprendizajes

### Por Proyecto
- Documentar decisiones arquitecturales
- Capturar patrones específicos del dominio
- Crear reglas específicas del proyecto

---

## 📚 Referencias Rápidas

### Archivos Clave
- [`tasks/todo.md`](tasks/todo.md) - Lista de tareas activas
- [`tasks/lessons.md`](tasks/lessons.md) - Lecciones aprendidas
- Este archivo - Guidelines del workflow

### Comandos Útiles
```bash
# Ver estado actual
cat tasks/todo.md

# Ver lecciones
cat tasks/lessons.md

# Agregar rápidamente a todo
echo "- [ ] Nueva tarea" >> tasks/todo.md
```

---

## ✅ Checklist Pre-Commit

Antes de cada commit verificar:
- [ ] Código funciona correctamente
- [ ] Tests pasan
- [ ] Logs no muestran errores
- [ ] Cambios son mínimos y necesarios
- [ ] Documentación actualizada si es necesario
- [ ] `todo.md` actualizado
- [ ] `lessons.md` actualizado si hubo aprendizajes

---

**🎯 Objetivo Final:** Desarrollo más eficiente, menos bugs, mejores soluciones

**📌 Recuerda:** Este workflow es una herramienta, no una burocracia. Úsalo para mejorar, no para frenar.

---

*Última actualización: 25 de febrero de 2026*
