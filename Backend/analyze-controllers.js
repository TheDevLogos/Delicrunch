const fs = require('fs');
const path = require('path');

// Analizar todos los controladores y encontrar queries problemáticas
function analyzeControllers() {
    const controllersDir = './controllers';
    const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    
    const issues = [];
    
    // Patrones problemáticos
    const problematicPatterns = [
        { pattern: /seller_id/g, issue: 'Usa seller_id (debería ser store_id)' },
        { pattern: /\.name\b/g, issue: 'Usa .name (debería ser .nombre)' },
        { pattern: /\.price\b/g, issue: 'Usa .price (debería ser .precio_descuento o .precio_original)' },
        { pattern: /\.email\b(?!_)/g, issue: 'Usa .email' },
        { pattern: /FROM users.*seller/gi, issue: 'JOIN con users como seller' },
        { pattern: /\.stock\b/g, issue: 'Usa .stock (debería ser .cantidad_disponible)' },
        { pattern: /\.status\b/g, issue: 'Usa .status (debería ser .estado)' },
        { pattern: /order_number/gi, issue: 'Usa order_number (debería ser codigo_recogida)' },
        { pattern: /payment_status/gi, issue: 'Usa payment_status' },
        { pattern: /\.street\b/g, issue: 'Usa .street (debería ser .direccion)' },
        { pattern: /\.phone\b/g, issue: 'Usa .phone (debería ser .telefono)' },
        { pattern: /image_url/gi, issue: 'Usa image_url (debería ser imagen_url)' },
        { pattern: /unit_price/gi, issue: 'Usa unit_price (debería ser precio_unitario)' },
        { pattern: /quantity(?!_)/gi, issue: 'Usa quantity (debería ser cantidad)' },
    ];
    
    files.forEach(file => {
        const filePath = path.join(controllersDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        problematicPatterns.forEach(({ pattern, issue }) => {
            const matches = content.match(pattern);
            if (matches) {
                // Encontrar líneas específicas
                lines.forEach((line, index) => {
                    if (pattern.test(line)) {
                        issues.push({
                            file,
                            line: index + 1,
                            issue,
                            code: line.trim().substring(0, 100)
                        });
                    }
                });
            }
        });
    });
    
    return issues;
}

const issues = analyzeControllers();

console.log('🔍 ANÁLISIS DE CONTROLADORES\n');
console.log('='.repeat(100));
console.log(`\nTotal de problemas encontrados: ${issues.length}\n`);

// Agrupar por archivo
const byFile = {};
issues.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
});

Object.keys(byFile).sort().forEach(file => {
    console.log(`\n📄 ${file} (${byFile[file].length} problemas)`);
    console.log('-'.repeat(100));
    byFile[file].forEach(issue => {
        console.log(`  Línea ${issue.line}: ${issue.issue}`);
        console.log(`    ${issue.code}`);
    });
});

// Guardar reporte
fs.writeFileSync('./controller-issues.json', JSON.stringify(byFile, null, 2));
console.log('\n📄 Reporte detallado guardado en: ./controller-issues.json');
