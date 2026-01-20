/**
 * Categorías de negocios y productos para Delicrunch
 * Sistema unificado de categorías usado en toda la aplicación
 */

export const BUSINESS_CATEGORIES = [
  { id: 'tacos', label: 'Tacos', icon: '🌮', background: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' },
  { id: 'pizza', label: 'Pizza', icon: '🍕', background: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800' },
  { id: 'desayunos', label: 'Desayunos', icon: '🍳', background: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800' },
  { id: 'sushi', label: 'Sushi', icon: '🍣', background: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800' },
  { id: 'cafe', label: 'Café', icon: '☕', background: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { id: 'postres', label: 'Postres', icon: '🍰', background: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800' },
  { id: 'panaderia', label: 'Panadería', icon: '🥖', background: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' },
  { id: 'fruteria', label: 'Frutería', icon: '🍎', background: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800' },
  { id: 'carne-asada', label: 'Carne Asada', icon: '🥩', background: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  { id: 'burritos', label: 'Burritos', icon: '🌯', background: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' },
  { id: 'hotdogs', label: 'Hotdogs', icon: '🌭', background: 'https://images.unsplash.com/photo-1612392062798-2dbaa4f8c1df?w=800' },
  { id: 'hamburguesas', label: 'Hamburguesas', icon: '🍔', background: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },
  { id: 'elotes', label: 'Elotes', icon: '🌽', background: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800' },
  { id: 'snacks', label: 'Snacks', icon: '🍿', background: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800' },
  { id: 'pasteles', label: 'Pasteles', icon: '🎂', background: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800' },
  { id: 'abarrotes', label: 'Abarrotes', icon: '🛒', background: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800' },
  { id: 'mariscos', label: 'Mariscos', icon: '🦐', background: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523e?w=800' },
  { id: 'ensaladas', label: 'Ensaladas', icon: '🥗', background: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800' },
  { id: 'alitas', label: 'Alitas y Boneless', icon: '🍗', background: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800' },
  { id: 'tamales', label: 'Tamales', icon: '🫔', background: 'https://images.unsplash.com/photo-1616198814651-e71f960c3b8f?w=800' },
  { id: 'tortas', label: 'Tortas', icon: '🥙', background: 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800' },
  { id: 'quesadillas', label: 'Quesadillas', icon: '🧀', background: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800' },
  { id: 'empanadas', label: 'Empanadas', icon: '🥟', background: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800' },
  { id: 'crepas', label: 'Crepas', icon: '🥞', background: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800' },
  { id: 'comida-china', label: 'Comida China', icon: '🥡', background: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800' },
  { id: 'comida-italiana', label: 'Comida Italiana', icon: '🍝', background: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800' },
  { id: 'comida-mexicana', label: 'Comida Mexicana', icon: '🌶️', background: 'https://images.unsplash.com/photo-1599974579688-8dbdd335139f?w=800' },
  { id: 'otros', label: 'Otros', icon: '🍽️', background: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
];

// Obtener categoría por ID
export const getCategoryById = (id) => {
  return BUSINESS_CATEGORIES.find(cat => cat.id === id) || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];
};

// Obtener solo los labels para selectores simples
export const getCategoryLabels = () => {
  return BUSINESS_CATEGORIES.map(cat => cat.label);
};

// Obtener imagen de fondo por categoría
export const getCategoryBackground = (categoryLabel) => {
  const category = BUSINESS_CATEGORIES.find(
    cat => cat.label.toLowerCase() === categoryLabel.toLowerCase()
  );
  return category?.background || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1].background;
};

// Obtener icono por categoría
export const getCategoryIcon = (categoryLabel) => {
  const category = BUSINESS_CATEGORIES.find(
    cat => cat.label.toLowerCase() === categoryLabel.toLowerCase()
  );
  return category?.icon || '🍽️';
};

export default BUSINESS_CATEGORIES;
