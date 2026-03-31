#!/bin/bash

# 🎯 Script de Revisión de Workflow - Delicrunch
# Ejecutar al inicio de cada sesión de desarrollo

echo "═══════════════════════════════════════════════════════════"
echo "🎯 WORKFLOW REVIEW - DELICRUNCH"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "WORKFLOW_GUIDELINES.md" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

echo "📋 TAREAS PENDIENTES"
echo "───────────────────────────────────────────────────────────"
if [ -f "tasks/todo.md" ]; then
    # Extraer tareas pendientes (líneas que empiecen con - [ ])
    grep -E "^- \[ \]" tasks/todo.md | head -10
    echo ""
    total_pending=$(grep -c "^- \[ \]" tasks/todo.md)
    total_done=$(grep -c "^- \[x\]" tasks/todo.md)
    echo "📊 Total: $total_pending pendientes | $total_done completadas"
else
    echo "⚠️  No se encontró tasks/todo.md"
fi
echo ""

echo "📚 LECCIONES IMPORTANTES (Últimas 5)"
echo "───────────────────────────────────────────────────────────"
if [ -f "tasks/lessons.md" ]; then
    # Extraer títulos de secciones (### )
    grep "^###" tasks/lessons.md | grep -v "^### \[" | head -5
    echo ""
else
    echo "⚠️  No se encontró tasks/lessons.md"
fi
echo ""

echo "🔍 ESTADO DEL PROYECTO"
echo "───────────────────────────────────────────────────────────"

# Verificar Backend
if [ -d "Backend" ]; then
    if [ -f "Backend/package.json" ]; then
        echo "✅ Backend: Configurado"
    else
        echo "⚠️  Backend: package.json no encontrado"
    fi
else
    echo "❌ Backend: Directorio no encontrado"
fi

# Verificar Frontend
if [ -d "Frontend" ]; then
    if [ -f "Frontend/package.json" ]; then
        echo "✅ Frontend: Configurado"
    else
        echo "⚠️  Frontend: package.json no encontrado"
    fi
else
    echo "❌ Frontend: Directorio no encontrado"
fi

# Verificar variables de entorno
if [ -f "Backend/.env" ]; then
    echo "✅ Backend .env: Configurado"
else
    echo "⚠️  Backend .env: No encontrado (requerido)"
fi

if [ -f "Frontend/.env" ]; then
    echo "✅ Frontend .env: Configurado"
else
    echo "⚠️  Frontend .env: No encontrado (opcional)"
fi

echo ""

echo "🚀 COMANDOS RÁPIDOS"
echo "───────────────────────────────────────────────────────────"
echo "Iniciar todo:       ./start-delicrunch.sh"
echo "Backend solo:       cd Backend && npm run dev"
echo "Frontend solo:      cd Frontend && npx expo start --tunnel"
echo "Ver guidelines:     cat WORKFLOW_GUIDELINES.md | less"
echo "Ver tareas:         cat tasks/todo.md"
echo "Ver lecciones:      cat tasks/lessons.md"
echo "Ver contexto:       cat tasks/PROJECT_CONTEXT.md"
echo ""

echo "📖 RECORDATORIOS DEL WORKFLOW"
echo "───────────────────────────────────────────────────────────"
echo "1. 📝 Plan Mode: Para tareas de 3+ pasos, planificar primero"
echo "2. ✅ Verificar: Nunca marcar completo sin probar"
echo "3. 📚 Aprender: Actualizar lessons.md después de correcciones"
echo "4. 🎯 Simplicidad: Buscar siempre la solución más simple"
echo "5. 🔍 Causa Raíz: No arreglos temporales, buscar el problema real"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✨ ¡Listo para empezar! Revisa tareas y lecciones arriba ✨"
echo "═══════════════════════════════════════════════════════════"
