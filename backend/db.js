// Conexão automática com o PostgreSQL externo da Render
const { Pool } = require('pg');

const pool = new Pool({
  user: 'luanauser',
  host: 'dpg-d1kjn8vdiees73ekjvfg-a.oregon-postgres.render.com',
  database: 'luanaimoveis',
  password: 'Q8DnO2IVcBzuoYsHZFNDNQ0zlXxazM3v',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
