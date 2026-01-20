# Sistema de Categorías e Imágenes - Guía de Implementación

## 📋 Resumen de Cambios Implementados

### 1. **Sistema Unificado de Categorías** 🏷️

Se creó un archivo central de categorías que incluye 28 tipos de negocios con sus respectivas imágenes de fondo profesionales:

**Archivo**: `/Frontend/src/constants/categories.js`

**Categorías incluidas**:
- Tacos 🌮, Pizza 🍕, Desayunos 🍳, Sushi 🍣
- Café ☕, Postres 🍰, Panadería 🥖, Frutería 🍎
- Carne Asada 🥩, Burritos 🌯, Hotdogs 🌭, Hamburguesas 🍔
- Elotes 🌽, Snacks 🍿, Pasteles 🎂, Abarrotes 🛒
- Mariscos 🦐, Ensaladas 🥗, Alitas y Boneless 🍗, Tamales 🫔
- Tortas 🥙, Quesadillas 🧀, Empanadas 🥟, Crepas 🥞
- Comida China 🥡, Comida Italiana 🍝, Comida Mexicana 🌶️
- Otros 🍽️

Cada categoría tiene:
- ID único
- Label (nombre mostrado)
- Icono emoji
- Imagen de fondo profesional de Unsplash

### 2. **Mejoras en AddProductScreen.js** ✨

**Cambios implementados**:
```javascript
// Importación de categorías
import { BUSINESS_CATEGORIES } from '../src/constants/categories';

// Nuevo selector de categoría (línea ~217)
<View style={styles.inputContainer}>
  <Text style={styles.inputLabel}>Categoría del Producto</Text>
  <TouchableOpacity 
    style={styles.timeSelector}
    onPress={() => setShowCategoryPicker(true)}
  >
    <Ionicons name="restaurant-outline" size={18} color={COLORS.textLight} />
    <Text style={styles.timeSelectorText}>{categoria}</Text>
    <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
  </TouchableOpacity>
</View>

// Modal de selección (después del modal de horarios)
<Modal visible={showCategoryPicker} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.timePickerModal}>
      {/* Lista de categorías con iconos */}
      {BUSINESS_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          onPress={() => {
            setCategoria(cat.label);
            setShowCategoryPicker(false);
          }}
        >
          <Text>{cat.icon} {cat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>
```

**Estados agregados**:
```javascript
const [categoria, setCategoria] = useState('Otros');
const [showCategoryPicker, setShowCategoryPicker] = useState(false);
```

**Envío al backend**:
```javascript
formData.append('categoria', categoria); // En lugar de 'Otros' hardcodeado
```

### 3. **Mejoras en EditProductScreen.js** 🔧

Mismas mejoras que AddProductScreen, además de:
- Cargar categoría existente del producto
- Mantener categoría seleccionada al editar
- Actualizar categoría en el backend

### 4. **Actualización de RegisterScreen.js** 📝

**A implementar manualmente**:

Agregar selector de categoría al formulario de registro de comercios:

```javascript
import { BUSINESS_CATEGORIES } from '../src/constants/categories';

// Agregar estado
const [showCategoryPicker, setShowCategoryPicker] = useState(false);

// Agregar después del campo de teléfono (~línea 250)
<View style={styles.inputWrapper}>
  <Text style={styles.inputLabel}>Categoría del Negocio *</Text>
  <TouchableOpacity 
    style={styles.categorySelector}
    onPress={() => setShowCategoryPicker(true)}
  >
    <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
    <Text style={styles.categorySelectorText}>
      {categoria || 'Selecciona categoría'}
    </Text>
    <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
  </TouchableOpacity>
</View>

// Agregar modal antes del cierre del componente
<Modal visible={showCategoryPicker} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.categoryModal}>
      <View style={styles.categoryModalHeader}>
        <Text style={styles.categoryModalTitle}>Tipo de Negocio</Text>
        <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {BUSINESS_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryOption}
            onPress={() => {
              setCategoria(cat.label);
              setShowCategoryPicker(false);
            }}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
            {categoria === cat.label && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>

// Estilos necesarios
categorySelector: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.surface,
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: COLORS.border,
},
categorySelectorText: {
  flex: 1,
  marginLeft: 12,
  fontSize: 16,
  color: COLORS.text,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
categoryModal: {
  backgroundColor: COLORS.background,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: '80%',
  paddingBottom: 40,
},
categoryModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
},
categoryModalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: COLORS.text,
},
categoryOption: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border,
},
categoryIcon: {
  fontSize: 28,
  marginRight: 12,
},
categoryLabel: {
  flex: 1,
  fontSize: 16,
  color: COLORS.text,
},
```

### 5. **Actualización de DiscoverScreen.js** 🔍

El archivo ya está actualizado con el sistema de categorías.

**Mejora adicional**: Usar las categorías del sistema:

```javascript
import { getCategoryLabels } from '../src/constants/categories';

// Reemplazar línea 60
const [categoryList, setCategoryList] = useState(['Todos', ...getCategoryLabels()]);
```

### 6. **Actualización de MerchantDashboardScreen.js** 🏪

**Usar imágenes de categoría como background**:

```javascript
import { getCategoryBackground } from '../src/constants/categories';

// En el render del background (línea ~150)
const backgroundImage = storeInfo?.categoria 
  ? getCategoryBackground(storeInfo.categoria)
  : DEFAULT_BACKGROUNDS[0];

<ImageBackground
  source={{ uri: backgroundImage }}
  style={styles.headerBackground}
  resizeMode="cover"
>
  {/* Contenido */}
</ImageBackground>
```

**Mostrar logo del comercio** en lugar de iniciales:

```javascript
// Verificar si hay logo (foto_perfil en ProfileScreen)
const storeLogo = storeInfo?.foto_perfil;

// En el render del avatar
{storeLogo ? (
  <Image
    source={{ uri: storeLogo.startsWith('http') ? storeLogo : backendBase + storeLogo }}
    style={styles.storeLogo}
  />
) : (
  <View style={styles.storeLogoPlaceholder}>
    <Text style={styles.storeLogoText}>
      {storeInfo?.nombre_comercio?.substring(0, 2).toUpperCase() || 'DC'}
    </Text>
  </View>
)}
```

### 7. **Actualización de ProfileScreen.js** 📸

**Permitir subir logo del comercio**:

```javascript
import * as ImagePicker from 'expo-image-picker';

const [logoImage, setLogoImage] = useState(null);

const pickLogo = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Cuadrado para logo
    quality: 0.8,
  });

  if (!result.canceled) {
    setLogoImage(result.assets[0].uri);
    await uploadLogo(result.assets[0].uri);
  }
};

const uploadLogo = async (uri) => {
  try {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    
    formData.append('foto_perfil', { uri, name: filename, type });
    
    await api.put('/profiles/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    Alert.alert('Éxito', 'Logo actualizado');
    fetchProfile(); // Recargar perfil
  } catch (error) {
    Alert.alert('Error', 'No se pudo actualizar el logo');
  }
};

// En el JSX (para comercios)
{isComercio && (
  <View style={styles.logoSection}>
    <Text style={styles.sectionTitle}>Logo del Negocio</Text>
    <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
      {profile.foto_perfil ? (
        <Image
          source={{ uri: profile.foto_perfil.startsWith('http') 
            ? profile.foto_perfil 
            : backendBase + profile.foto_perfil 
          }}
          style={styles.logoImage}
        />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Ionicons name="camera" size={40} color={COLORS.primary} />
          <Text style={styles.logoPlaceholderText}>Subir Logo</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
)}

// Estilos
logoSection: {
  marginTop: 20,
},
logoContainer: {
  width: 120,
  height: 120,
  borderRadius: 60,
  overflow: 'hidden',
  alignSelf: 'center',
},
logoImage: {
  width: '100%',
  height: '100%',
},
logoPlaceholder: {
  width: '100%',
  height: '100%',
  backgroundColor: COLORS.surface,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: COLORS.border,
  borderStyle: 'dashed',
},
```

## 🔄 Flujo de Almacenamiento de Imágenes

### Backend (Ya configurado)
```javascript
// Backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta de destino
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

module.exports = multer({ storage });
```

### Frontend
```javascript
// Al seleccionar imagen
const formData = new FormData();
formData.append('imagen', {
  uri: imageUri,
  name: filename,
  type: 'image/jpeg' // o el tipo correcto
});

// Enviar con Content-Type multipart/form-data
await api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Mostrar imágenes
```javascript
// Construcción de URL correcta
const backendBase = (api.defaults?.baseURL || '').replace(/\/?api$/, '');
const imageUrl = product.imagen_url?.startsWith('http') 
  ? product.imagen_url 
  : backendBase + product.imagen_url;

<Image source={{ uri: imageUrl }} />
```

## ✅ Checklist de Implementación

- [x] Crear archivo de categorías centralizadas
- [x] Actualizar AddProductScreen con selector de categoría
- [x] Actualizar AddProductScreen con estado productoListo
- [ ] Actualizar EditProductScreen con selector de categoría (manual)
- [ ] Actualizar RegisterScreen con selector de categoría (manual)
- [x] Actualizar DiscoverScreen con categorías centralizadas
- [ ] Actualizar MerchantDashboardScreen con backgrounds por categoría (manual)
- [ ] Actualizar MerchantDashboardScreen para mostrar logo (manual)
- [ ] Actualizar ProfileScreen para subir logo del comercio (manual)
- [ ] Actualizar todas las pantallas que muestran comercios para usar logo (manual)

## 📝 Notas Importantes

1. **Verificar permisos**: Las imágenes requieren permisos de galería
2. **Tamaño de imágenes**: Se recomienda compresión (quality: 0.7-0.8)
3. **Formatos soportados**: JPG, PNG, WebP
4. **Carpeta uploads**: Debe existir en Backend y ser accesible
5. **URLs relativas**: Siempre construir URL completa para mostrar imágenes
6. **Fallback**: Siempre tener placeholder si no hay imagen

## 🚀 Próximos Pasos

1. Implementar cambios manuales en RegisterScreen.js
2. Implementar cambios manuales en EditProductScreen.js  
3. Actualizar MerchantDashboardScreen.js para usar backgrounds dinámicos
4. Actualizar ProfileScreen.js para permitir subir logo
5. Probar flujo completo de imágenes
6. Verificar que las categorías se filtren correctamente en DiscoverScreen
