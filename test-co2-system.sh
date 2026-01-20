#!/bin/bash
# Script para verificar el sistema de CO2 por categoría

echo "🧪 Verificando sistema de CO2 por categoría..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/Backend"

echo -e "${BLUE}📊 Probando cálculos de CO2...${NC}"
echo ""

node -e "
const { calculateCO2Saved, getCO2Factor } = require('./utils/co2Factors');

const tests = [
  { categoria: 'Carne Asada', cantidad: 1, esperado: 6.5 },
  { categoria: 'Tacos', cantidad: 2, esperado: 7.6 },
  { categoria: 'Pizza', cantidad: 3, esperado: 10.2 },
  { categoria: 'Ensaladas', cantidad: 5, esperado: 6.0 },
  { categoria: 'Frutería', cantidad: 10, esperado: 8.0 },
  { categoria: 'otros', cantidad: 1, esperado: 2.5 },
];

console.log('Categoría              | Cantidad | CO2 Real | CO2 Esperado | Estado');
console.log('---------------------  | -------- | -------- | ------------ | ------');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const resultado = calculateCO2Saved(test.categoria, test.cantidad);
  const status = resultado === test.esperado ? '✅ PASS' : '❌ FAIL';
  
  if (resultado === test.esperado) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(
    test.categoria.padEnd(22) + ' | ' +
    test.cantidad.toString().padEnd(8) + ' | ' +
    resultado.toFixed(1).padEnd(8) + ' | ' +
    test.esperado.toFixed(1).padEnd(12) + ' | ' +
    status
  );
});

console.log('');
console.log('Resumen: ' + passed + ' pasaron, ' + failed + ' fallaron');
console.log('');

// Mostrar factores de todas las categorías
console.log('📋 Factores de CO2 por categoría:');
console.log('');

const { CO2_FACTORS } = require('./utils/co2Factors');
const categories = Object.keys(CO2_FACTORS).sort((a, b) => CO2_FACTORS[b] - CO2_FACTORS[a]);

categories.slice(0, 10).forEach(cat => {
  console.log('  ' + cat.padEnd(25) + ': ' + CO2_FACTORS[cat].toFixed(1) + ' kg CO₂');
});

console.log('  ...');
console.log('  Total de categorías: ' + categories.length);
"

echo ""
echo -e "${GREEN}✅ Verificación completada${NC}"
