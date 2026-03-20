const multer = require('multer');
const path = require('path');

// Usar memoria temporal para Supabase Storage
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('¡Solo se permiten archivos de imagen!'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter, 
    limits: { fileSize: 1024 * 1024 * 5 } // Límite de 5MB
});

module.exports = upload;