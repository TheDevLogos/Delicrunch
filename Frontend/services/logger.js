// Un servicio de logging simple para centralizar el manejo y reporte de errores.

const log = (message, ...optionalParams) => {
  // En una app real, podrías tener lógica diferente para DEV vs PROD
  console.log(message, ...optionalParams);
};

const info = (message, ...optionalParams) => {
  console.info(`[INFO] ${message}`, ...optionalParams);
};

const warn = (message, ...optionalParams) => {
  console.warn(`[WARN] ${message}`, ...optionalParams);
};

/**
 * Logger de errores centralizado. Formatea los errores de Axios de forma detallada.
 * @param {Error} error El objeto de error.
 * @param {string} [context=''] Contexto opcional para saber dónde ocurrió el error.
 */
const error = (error, context = '') => {
  const contextMessage = context ? ` en ${context}` : '';

  if (error.response) {
    // La petición se hizo y el servidor respondió con un estado fuera del rango 2xx
    console.error(`[API ERROR]${contextMessage}:`, {
      status: error.response.status,
      data: error.response.data,
      url: error.config.url,
      method: error.config.method,
    });
  } else if (error.request) {
    // La petición se hizo pero no se recibió respuesta
    console.error(`[NETWORK ERROR]${contextMessage}: No se recibió respuesta.`, error.request);
  } else {
    // Algo ocurrió al configurar la petición que disparó un Error
    console.error(`[CLIENT ERROR]${contextMessage}:`, error.message);
  }

  // En el futuro, podrías enviar este error a un servicio como Sentry
  // Sentry.captureException(error);
};

export default { log, info, warn, error };