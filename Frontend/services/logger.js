// Un servicio de logging simple para centralizar el manejo y reporte de errores.

const safeStringify = (obj) => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (k, v) => {
      if (v && typeof v === 'object') {
        if (seen.has(v)) return '[Circular]';
        seen.add(v);
      }
      if (typeof v === 'function') return `[Function: ${v.name || 'anonymous'}]`;
      return v;
    }, 2);
  } catch (e) {
    return String(obj);
  }
};

const log = (message, ...optionalParams) => {
  console.log(message, ...optionalParams.map((p) => (typeof p === 'object' ? safeStringify(p) : p)));
};

const info = (message, ...optionalParams) => {
  console.info(`[INFO] ${message}`, ...optionalParams.map((p) => (typeof p === 'object' ? safeStringify(p) : p)));
};

const warn = (message, ...optionalParams) => {
  console.warn(`[WARN] ${message}`, ...optionalParams.map((p) => (typeof p === 'object' ? safeStringify(p) : p)));
};

/**
 * Logger de errores centralizado. Formatea los errores de Axios de forma detallada.
 * @param {Error} error El objeto de error.
 * @param {string} [context=''] Contexto opcional para saber dónde ocurrió el error.
 */
const error = (error, context = '') => {
  const contextMessage = context ? ` en ${context}` : '';

  try {
    if (error && error.response) {
      // La petición se hizo y el servidor respondió con un estado fuera del rango 2xx
      const payload = {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
      };
      console.error(`[API ERROR]${contextMessage}:`, safeStringify(payload));
    } else if (error && error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error(`[NETWORK ERROR]${contextMessage}: No se recibió respuesta.`, safeStringify({ request: error.request, message: error.message }));
    } else {
      // Algo ocurrió al configurar la petición que disparó un Error
      console.error(`[CLIENT ERROR]${contextMessage}:`, safeStringify({ message: error?.message || String(error) }));
    }
  } catch (e) {
    // Fallback: si la serialización falla, imprimimos el error de forma segura
    try {
      console.error(`[LOGGER FAILURE]${contextMessage}:`, String(error));
    } catch (e2) {
      // No hacemos nada más para evitar bucles de error
    }
  }

  // En el futuro, podrías enviar este error a un servicio como Sentry
  // Sentry.captureException(error);
};

export default { log, info, warn, error };