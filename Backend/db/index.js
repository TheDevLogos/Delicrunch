const { Pool } = require('pg');
const path = require('path');
// Cargar variables de entorno desde Backend/.env para garantizar consistencia
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exportamos el pool para que pueda ser utilizado en otros archivos
module.exports = pool;
