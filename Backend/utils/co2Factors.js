/**
 * Factores de emisión de CO2 por categoría de alimento (Backend)
 * 
 * Valores basados en estudios de huella de carbono de alimentos:
 * - TGTG (Too Good To Go) estima ~2.5kg CO2 por comida
 * - FAO y estudios europeos de impacto ambiental
 * 
 * Unidad: kg CO2 por pack/producto salvado
 */

const CO2_FACTORS = {
  // Carnes y proteínas animales (alto impacto)
  'carne-asada': 6.5,
  'Carne Asada': 6.5,
  'hamburguesas': 5.8,
  'Hamburguesas': 5.8,
  'alitas': 3.2,
  'Alitas y Boneless': 3.2,
  'hotdogs': 4.5,
  'Hotdogs': 4.5,
  
  // Mariscos
  'mariscos': 4.8,
  'Mariscos': 4.8,
  'sushi': 3.5,
  'Sushi': 3.5,
  
  // Comidas mixtas/completas
  'tacos': 3.8,
  'Tacos': 3.8,
  'burritos': 4.2,
  'Burritos': 4.2,
  'tortas': 3.6,
  'Tortas': 3.6,
  'quesadillas': 2.8,
  'Quesadillas': 2.8,
  'tamales': 2.5,
  'Tamales': 2.5,
  'empanadas': 2.7,
  'Empanadas': 2.7,
  
  // Pizza y pasta
  'pizza': 3.4,
  'Pizza': 3.4,
  'comida-italiana': 2.9,
  'Comida Italiana': 2.9,
  'Pastas': 2.9,
  
  // Comidas preparadas
  'desayunos': 2.8,
  'Desayunos': 2.8,
  'comida-mexicana': 3.2,
  'Comida Mexicana': 3.2,
  'comida-china': 2.6,
  'Comida China': 2.6,
  
  // Panadería y postres
  'panaderia': 1.8,
  'Panadería': 1.8,
  'pasteles': 2.4,
  'Pasteles': 2.4,
  'postres': 2.2,
  'Postres': 2.2,
  'crepas': 2.0,
  'Crepas': 2.0,
  'Repostería': 2.2,
  
  // Café y bebidas
  'cafe': 1.5,
  'Café': 1.5,
  'Brunch': 2.3,
  'Combos': 2.8,
  
  // Vegetales y frutas
  'ensaladas': 1.2,
  'Ensaladas': 1.2,
  'fruteria': 0.8,
  'Frutería': 0.8,
  'elotes': 1.0,
  'Elotes': 1.0,
  
  // Snacks y abarrotes
  'snacks': 1.8,
  'Snacks': 1.8,
  'abarrotes': 2.0,
  'Abarrotes': 2.0,
  
  // Proteínas específicas
  'Pollo': 3.2,
  'Barbacoa': 5.5,
  'Carnes': 6.0,
  'Ramen': 2.4,
  'Bowls': 2.5,
  'Gorditas': 2.6,
  
  // Categoría general
  'otros': 2.5,
  'Otros': 2.5,
  'varios': 2.5,
};

/**
 * Obtener factor de CO2 por categoría
 */
const getCO2Factor = (categoria) => {
  if (!categoria) return 2.5;
  
  // Buscar coincidencia exacta
  if (CO2_FACTORS[categoria]) {
    return CO2_FACTORS[categoria];
  }
  
  // Convertir a minúsculas y buscar
  const categoriaLower = categoria.toLowerCase().trim();
  const key = Object.keys(CO2_FACTORS).find(k => 
    k.toLowerCase() === categoriaLower
  );
  
  if (key) {
    return CO2_FACTORS[key];
  }
  
  // Buscar coincidencia parcial
  const matchedKey = Object.keys(CO2_FACTORS).find(k => 
    categoriaLower.includes(k.toLowerCase()) || k.toLowerCase().includes(categoriaLower)
  );
  
  if (matchedKey) {
    return CO2_FACTORS[matchedKey];
  }
  
  // Valor por defecto
  return 2.5;
};

/**
 * Calcular CO2 ahorrado según categoría y cantidad
 */
const calculateCO2Saved = (categoria, cantidad = 1) => {
  const factor = getCO2Factor(categoria);
  return parseFloat((factor * cantidad).toFixed(2));
};

module.exports = {
  CO2_FACTORS,
  getCO2Factor,
  calculateCO2Saved,
};
