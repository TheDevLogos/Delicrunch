/**
 * Catálogo canónico de categorías de Delicrunch.
 * Mantén aquí un solo nombre por categoría; los alias conservan compatibilidad
 * con valores históricos guardados por la app o por la API.
 */

export const BUSINESS_CATEGORIES = [
  { id: 'tacos', label: 'Tacos', icon: '🌮', foodIcon: 'tacos', background: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800' },
  { id: 'pizza', label: 'Pizza', icon: '🍕', foodIcon: 'pizza', background: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800' },
  { id: 'desayunos', label: 'Desayunos', icon: '🍳', background: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800' },
  { id: 'sushi', label: 'Sushi', icon: '🍣', foodIcon: 'sushi', background: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800' },
  { id: 'cafe', label: 'Cafés', icon: '☕', foodIcon: 'cafes', background: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { id: 'postres', label: 'Postres', icon: '🍰', foodIcon: 'postres', background: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800' },
  { id: 'panaderia', label: 'Panadería', icon: '🥖', background: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' },
  { id: 'fruteria', label: 'Frutería', icon: '🍎', background: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800' },
  { id: 'carne-asada', label: 'Carne asada', icon: '🥩', background: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  { id: 'burritos', label: 'Burritos', icon: '🌯', background: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800' },
  { id: 'hotdogs', label: 'Hot dogs', icon: '🌭', background: 'https://images.unsplash.com/photo-1612392062798-2dbaa4f8c1df?w=800' },
  { id: 'hamburguesas', label: 'Hamburguesas', icon: '🍔', foodIcon: 'hamburguesas', background: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },
  { id: 'elotes', label: 'Elotes preparados', icon: '🌽', foodIcon: 'elotes', background: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800' },
  { id: 'snacks', label: 'Botanas', icon: '🍿', foodIcon: 'botanas', background: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800' },
  { id: 'abarrotes', label: 'Abarrotes', icon: '🛒', background: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800' },
  { id: 'mariscos', label: 'Mariscos', icon: '🦐', background: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523e?w=800' },
  { id: 'ensaladas', label: 'Ensaladas', icon: '🥗', foodIcon: 'ensaladas', background: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800' },
  { id: 'alitas', label: 'Alitas y boneless', icon: '🍗', background: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800' },
  { id: 'tamales', label: 'Tamales', icon: '🫔', background: 'https://images.unsplash.com/photo-1616198814651-e71f960c3b8f?w=800' },
  { id: 'tortas', label: 'Tortas', icon: '🥙', background: 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800' },
  { id: 'quesadillas', label: 'Quesadillas', icon: '🧀', background: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800' },
  { id: 'empanadas', label: 'Empanadas', icon: '🥟', background: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800' },
  { id: 'crepas', label: 'Crepas', icon: '🥞', background: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800' },
  { id: 'comida-china', label: 'Comida china', icon: '🥡', background: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800' },
  { id: 'comida-italiana', label: 'Comida italiana', icon: '🍝', background: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800' },
  { id: 'comida-mexicana', label: 'Comida mexicana', icon: '🌶️', foodIcon: 'comida-mexicana', background: 'https://images.unsplash.com/photo-1599974579688-8dbdd335139f?w=800' },
  { id: 'bowls', label: 'Bowls', icon: '🥣', foodIcon: 'bowls', background: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤', foodIcon: 'bebidas', background: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800' },
  { id: 'comida-corrida', label: 'Comida corrida', icon: '🍛', foodIcon: 'comida-corrida', background: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800' },
  { id: 'otros', label: 'Otros', icon: '🍽️', background: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
];

// Correspondencia de los 13 recortes del atlas con la clave visual de cada categoría.
// Al añadir ilustraciones, registra su foodIcon y su posición aquí; FoodCategoryIcon
// calcula automáticamente la fila y columna para cualquier cantidad de recortes.
export const FOOD_ICON_ATLAS = {
  columns: 4,
  tileAspectRatio: 16 / 15,
  artworkByKey: {
    hamburguesas: 0,
    pizza: 1,
    tacos: 2,
    ensaladas: 3,
    elotes: 4,
    sushi: 5,
    bowls: 6,
    postres: 7,
    botanas: 8,
    bebidas: 9,
    cafes: 10,
    'comida-mexicana': 11,
    'comida-corrida': 12,
  },
};

const FOOD_CATEGORY_ORDER = [
  'hamburguesas', 'pizza', 'tacos', 'ensaladas', 'elotes', 'sushi', 'bowls',
  'postres', 'snacks', 'bebidas', 'cafe', 'comida-mexicana', 'comida-corrida',
];

const CATEGORY_ALIASES = {
  tacos: ['taco', 'taqueria', 'taquería'],
  pizza: ['pizzeria', 'pizzería'],
  sushi: ['japonesa', 'japones', 'japonés'],
  cafe: ['café', 'cafeteria', 'cafetería', 'cafes', 'coffee'],
  postres: ['pastel', 'pasteles', 'dulces', 'reposteria', 'repostería', 'dessert', 'desserts'],
  hamburguesas: ['hamburguesa', 'burger', 'burgers'],
  elotes: ['elote', 'esquite', 'elotes'],
  snacks: ['botana', 'botanas', 'snack', 'chips'],
  ensaladas: ['ensalada', 'salad'],
  'comida-mexicana': ['mexicana', 'antojitos'],
  bowls: ['bowl', 'poke'],
  bebidas: ['bebida', 'drink', 'refresco', 'agua fresca'],
  'comida-corrida': ['menu del dia', 'menú del día', 'comida casera'],
};

export const normalizeCategoryName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const valuesForCategory = (category) => [
  category.id,
  category.label,
  category.foodIcon,
  ...(CATEGORY_ALIASES[category.id] || []),
].filter(Boolean).map(normalizeCategoryName);

export const FOOD_CATEGORIES = FOOD_CATEGORY_ORDER
  .map((id) => BUSINESS_CATEGORIES.find((category) => category.id === id))
  .filter(Boolean)
  .map((category) => ({
    ...category,
    iconKey: category.foodIcon,
    matches: CATEGORY_ALIASES[category.id] || [],
  }));

export const getCanonicalCategory = (value) => {
  const normalized = normalizeCategoryName(value);
  if (!normalized) return null;

  return BUSINESS_CATEGORIES.find((category) => valuesForCategory(category).includes(normalized)) || null;
};

export const getCanonicalCategoryLabel = (value, fallback = '') =>
  getCanonicalCategory(value)?.label || String(value || fallback);

export const matchesFoodCategory = (categoryId, values = []) => {
  const category = FOOD_CATEGORIES.find((item) =>
    item.id === categoryId || item.iconKey === categoryId || item.foodIcon === categoryId
  );
  if (!category) return false;

  const aliases = valuesForCategory(category);
  return values.some((value) => {
    const normalized = normalizeCategoryName(value);
    if (!normalized) return false;
    const paddedValue = ` ${normalized} `;
    return aliases.some((alias) => paddedValue.includes(` ${alias} `));
  });
};

export const getCategoryById = (id) =>
  BUSINESS_CATEGORIES.find((category) => category.id === id) ||
  getCanonicalCategory(id) ||
  BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];

export const getCategoryLabels = () => BUSINESS_CATEGORIES.map((category) => category.label);

export const getCategoryBackground = (categoryLabel) =>
  getCanonicalCategory(categoryLabel)?.background || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1].background;

export const getCategoryIcon = (categoryLabel) =>
  getCanonicalCategory(categoryLabel)?.icon || '🍽️';

export default BUSINESS_CATEGORIES;
