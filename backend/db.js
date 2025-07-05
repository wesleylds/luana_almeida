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

// Função para criar a tabela automaticamente se não existir
async function criarTabelaImoveis() {
  const query = `
    CREATE TABLE IF NOT EXISTS imoveis (
      id SERIAL PRIMARY KEY,
      titulo TEXT,
      descricao TEXT,
      preco NUMERIC,
      imagem TEXT,
      carrossel TEXT,
      quartos INTEGER,
      salas INTEGER,
      area_total NUMERIC,
      area_construida NUMERIC,
      localizacao TEXT,
      tipo TEXT,
      banheiros INTEGER,
      codigo TEXT UNIQUE,
      visitas INTEGER DEFAULT 0
    );
  `;
  try {
    await pool.query(query);
    console.log('Tabela "imoveis" verificada/criada com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabela "imoveis":', err);
  }
}

// Chama a função ao iniciar o backend
criarTabelaImoveis();

module.exports = pool;
