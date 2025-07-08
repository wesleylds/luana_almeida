// Conexão automática com o PostgreSQL externo da Render
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: { rejectUnauthorized: false }
});

if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASS) {
  console.error('ERRO: Variáveis de ambiente do banco de dados não definidas. Verifique seu arquivo .env.');
  process.exit(1);
}

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
