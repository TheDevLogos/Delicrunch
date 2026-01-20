/**
 * Factores de emisión de CO2 por categoría de alimento
 * 
 * Valores basados en estudios de huella de carbono de alimentos:
 * - TGTG (Too Good To Go) estima ~2.5kg CO2 por comida
 * - FAO y estudios europeos de impacto ambiental
 * 
 * Unidad: kg CO2 por pack/producto salvado
 */

export const CO2_FACTORS = {
  // Carnes y proteínas animales (alto impacto)
  'carne-asada': 6.5,        // Carne de res tiene la mayor huella de carbono
  'hamburguesas': 5.8,       // Similar a carne asada
  'alitas': 3.2,            // Pollo tiene menor impacto que res
  'hotdogs': 4.5,           // Productos procesados de cerdo/res
  
  // Mariscos
  'mariscos': 4.8,          // Varía según tipo, promedio medio-alto
  'sushi': 3.5,             // Pescado + arroz
  
  // Comidas mixtas/completas
  'tacos': 3.8,             // Mix de proteína, tortilla, vegetales
  'burritos': 4.2,          // Similar a tacos pero con más ingredientes
  'tortas': 3.6,            // Pan + proteína + vegetales
  'quesadillas': 2.8,       // Principalmente queso y tortilla
  'tamales': 2.5,           // Masa + relleno
  'empanadas': 2.7,         // Masa + relleno
  
  // Pizza y pasta (lácteos + cereales)
  'pizza': 3.4,             // Queso + harina + toppings
  'comida-italiana': 2.9,   // Pasta, queso, salsas
  
  // Comidas preparadas
  'desayunos': 2.8,         // Huevos + pan + lácteos
  'comida-mexicana': 3.2,   // Variedad de ingredientes
  'comida-china': 2.6,      // Arroz + vegetales + proteína moderada
  
  // Panadería y postres (cereales + lácteos)
  'panaderia': 1.8,         // Harina + levadura
  'pasteles': 2.4,          // Harina + huevos + lácteos + azúcar
  'postres': 2.2,           // Similar a pasteles
  'crepas': 2.0,            // Harina + huevos + lácteos
  
  // Café y bebidas
  'cafe': 1.5,              // Granos de café + lácteos (si aplica)
  
  // Vegetales y frutas (bajo impacto)
  'ensaladas': 1.2,         // Principalmente vegetales frescos
  'fruteria': 0.8,          // Frutas tienen muy baja huella
  'elotes': 1.0,            // Maíz fresco
  
  // Snacks y abarrotes
  'snacks': 1.8,            // Productos procesados variados
  'abarrotes': 2.0,         // Mix de productos empaquetados
  
  // Categoría general/otros
  'otros': 2.5,             // Valor promedio estándar TGTG
};

/**
 * Obtener factor de CO2 por categoría
 * @param {string} categoria - Nombre o ID de la categoría
 * @returns {number} Factor de CO2 en kg por pack
 */
export const getCO2Factor = (categoria) => {
  if (!categoria) return CO2_FACTORS['otros'];
  
  // Convertir a minúsculas y buscar
  const categoriaLower = categoria.toLowerCase().trim();
  
  // Buscar coincidencia exacta
  if (CO2_FACTORS[categoriaLower]) {
    return CO2_FACTORS[categoriaLower];
  }
  
  // Buscar coincidencia parcial (ej: "Tacos" → "tacos")
  const matchedKey = Object.keys(CO2_FACTORS).find(key => 
    categoriaLower.includes(key) || key.includes(categoriaLower)
  );
  
  if (matchedKey) {
    return CO2_FACTORS[matchedKey];
  }
  
  // Si no hay coincidencia, retornar valor por defecto
  return CO2_FACTORS['otros'];
};

/**
 * Calcular CO2 ahorrado según categoría y cantidad
 * @param {string} categoria - Categoría del producto
 * @param {number} cantidad - Cantidad de packs
 * @returns {number} CO2 ahorrado en kg
 */
export const calculateCO2Saved = (categoria, cantidad = 1) => {
  const factor = getCO2Factor(categoria);
  return parseFloat((factor * cantidad).toFixed(2));
};

/**
 * Obtener descripción del impacto de CO2
 * @param {number} co2kg - Cantidad de CO2 en kg
 * @returns {string} Descripción del impacto equivalente
 */
export const getCO2ImpactDescription = (co2kg) => {
  if (co2kg < 2) return `Equivale a ${Math.round(co2kg * 5)} km en auto`;
  if (co2kg < 5) return `Equivale a ${Math.round(co2kg * 4)} km en auto`;
  if (co2kg < 10) return `Equivale a ${Math.round(co2kg * 3.5)} km en auto`;
  return `Equivale a ${Math.round(co2kg * 3)} km en auto o ${Math.round(co2kg / 20)} árboles plantados`;
};

export default {
  CO2_FACTORS,
  getCO2Factor,
  calculateCO2Saved,
  getCO2ImpactDescription,
};
