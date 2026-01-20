// metro.config.js - Configuración de Metro Bundler para Development Builds
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para Development Builds con túnel público
module.exports = {
  ...config,
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Agregar headers CORS para permitir conexiones desde cualquier origen
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    ...config.resolver,
    sourceExts: [...config.resolver.sourceExts, 'cjs'],
  },
};
