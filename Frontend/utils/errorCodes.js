/**
 * Sistema de Códigos de Error para Delicrunch
 * Permite diagnóstico rápido y preciso de problemas
 */

// Generar código de error único
const generateErrorCode = (prefix) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
};

// Códigos de Error de Pagos
export const PAYMENT_ERROR_CODES = {
  // Errores de Preferencia (CPT01-xxx)
  PREFERENCE_CREATION_FAILED: {
    code: 'CPT01',
    title: 'Error al crear preferencia de pago',
    message: 'No pudimos iniciar el proceso de pago. Por favor, intenta nuevamente.',
    action: 'reintentar'
  },
  PREFERENCE_INVALID_PRODUCT: {
    code: 'CPT02',
    title: 'Producto no válido',
    message: 'El producto seleccionado no está disponible para compra.',
    action: 'volver'
  },
  PREFERENCE_NETWORK_ERROR: {
    code: 'CPT03',
    title: 'Error de conexión',
    message: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
    action: 'reintentar'
  },
  
  // Errores de Checkout (CPT10-xxx)
  CHECKOUT_URL_MISSING: {
    code: 'CPT10',
    title: 'Error al abrir checkout',
    message: 'No se pudo obtener la URL de pago. Por favor, intenta nuevamente.',
    action: 'reintentar'
  },
  CHECKOUT_BROWSER_ERROR: {
    code: 'CPT11',
    title: 'Error al abrir navegador',
    message: 'No se pudo abrir el navegador para completar el pago.',
    action: 'reintentar'
  },
  
  // Errores de Validación (CPT20-xxx)
  VALIDATION_MIN_AMOUNT: {
    code: 'CPT20',
    title: 'Monto mínimo',
    message: 'El monto mínimo de compra es $10.00 MXN.',
    action: 'volver'
  },
  VALIDATION_MAX_AMOUNT: {
    code: 'CPT21',
    title: 'Monto máximo',
    message: 'El monto máximo por transacción es $500,000.00 MXN.',
    action: 'volver'
  },
  VALIDATION_PRODUCT_INACTIVE: {
    code: 'CPT22',
    title: 'Producto no disponible',
    message: 'Este producto no está disponible en este momento.',
    action: 'volver'
  },
  
  // Errores de Autenticación (CPT30-xxx)
  AUTH_TOKEN_MISSING: {
    code: 'CPT30',
    title: 'Sesión no válida',
    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    action: 'login'
  },
  AUTH_UNAUTHORIZED: {
    code: 'CPT31',
    title: 'No autorizado',
    message: 'No tienes autorización para realizar esta acción.',
    action: 'volver'
  },
  
  // Errores de Backend (CPT40-xxx)
  BACKEND_TIMEOUT: {
    code: 'CPT40',
    title: 'Tiempo de espera agotado',
    message: 'El servidor tardó demasiado en responder. Por favor, intenta nuevamente.',
    action: 'reintentar'
  },
  BACKEND_ERROR: {
    code: 'CPT41',
    title: 'Error del servidor',
    message: 'Hubo un problema en nuestros servidores. Por favor, intenta más tarde.',
    action: 'reintentar'
  },
  BACKEND_MERCADOPAGO_CONFIG: {
    code: 'CPT42',
    title: 'Configuración de pagos',
    message: 'Hay un problema con la configuración de pagos. Contacta con soporte.',
    action: 'soporte'
  },
  
  // Error Genérico
  UNKNOWN_ERROR: {
    code: 'CPT99',
    title: 'Error desconocido',
    message: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    action: 'reintentar'
  }
};

/**
 * Crear objeto de error con código único
 */
export const createPaymentError = (errorType, additionalInfo = {}) => {
  const errorInfo = PAYMENT_ERROR_CODES[errorType] || PAYMENT_ERROR_CODES.UNKNOWN_ERROR;
  const uniqueCode = generateErrorCode(errorInfo.code);
  
  return {
    ...errorInfo,
    uniqueCode,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };
};

/**
 * Mapear errores del backend a códigos de la app
 */
export const mapBackendError = (error) => {
  // Error de red
  if (error.message?.includes('Network request failed') || error.message?.includes('Network Error')) {
    return createPaymentError('PREFERENCE_NETWORK_ERROR', { originalError: error.message });
  }
  
  // Error de timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return createPaymentError('BACKEND_TIMEOUT', { originalError: error.message });
  }
  
  // Errores HTTP
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.msg || error.response.data?.message || '';
    
    // 401 - No autorizado
    if (status === 401) {
      return createPaymentError('AUTH_TOKEN_MISSING', { statusCode: status, originalError: message });
    }
    
    // 403 - Prohibido
    if (status === 403) {
      return createPaymentError('AUTH_UNAUTHORIZED', { statusCode: status, originalError: message });
    }
    
    // 404 - No encontrado
    if (status === 404 && message.includes('Producto')) {
      return createPaymentError('PREFERENCE_INVALID_PRODUCT', { statusCode: status, originalError: message });
    }
    
    // 400 - Validación
    if (status === 400) {
      if (message.includes('mínimo')) {
        return createPaymentError('VALIDATION_MIN_AMOUNT', { statusCode: status, originalError: message });
      }
      if (message.includes('máximo')) {
        return createPaymentError('VALIDATION_MAX_AMOUNT', { statusCode: status, originalError: message });
      }
      if (message.includes('disponible')) {
        return createPaymentError('VALIDATION_PRODUCT_INACTIVE', { statusCode: status, originalError: message });
      }
    }
    
    // 500 - Error del servidor
    if (status >= 500) {
      if (message.includes('Mercado Pago') || message.includes('MercadoPago')) {
        return createPaymentError('BACKEND_MERCADOPAGO_CONFIG', { statusCode: status, originalError: message });
      }
      return createPaymentError('BACKEND_ERROR', { statusCode: status, originalError: message });
    }
  }
  
  // Error genérico
  return createPaymentError('UNKNOWN_ERROR', { originalError: error.message || String(error) });
};

/**
 * Logger de errores para analytics (puede integrarse con Sentry, Firebase, etc.)
 */
export const logPaymentError = (errorObj, context = {}) => {
  console.error('💳 Payment Error:', {
    code: errorObj.uniqueCode,
    type: errorObj.code,
    title: errorObj.title,
    message: errorObj.message,
    timestamp: errorObj.timestamp,
    context,
    originalError: errorObj.originalError
  });
  
  // Aquí se puede integrar con servicios de analytics
  // Ejemplos:
  // - Sentry.captureException(error)
  // - Firebase.analytics().logEvent('payment_error', {...})
  // - Crashlytics.recordError(error)
};

export default {
  PAYMENT_ERROR_CODES,
  createPaymentError,
  mapBackendError,
  logPaymentError
};
