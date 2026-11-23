const fs = require('fs');
const path = require('path');
const pool = require('./index');
(async () => {
 try {
  await pool.query(fs.readFileSync(path.join(__dirname, 'migrations/20261123_business_visits.sql'), 'utf8'));
  console.log('Business visit inbox migration applied.');
 } catch (error) { console.error(error.message); process.exitCode=1; }
 finally { await pool.end(); }
})();
