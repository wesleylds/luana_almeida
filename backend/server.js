// -ww- Weslley Lemos de Sousa
// Configuração básica sem .env
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { imoveis: [] });
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

async function initDB() {
  await db.read();
  if (!db.data) {
    db.data = { imoveis: [] };
    await db.write();
  }
}
initDB();

const app = express();
const PORT = process.env.PORT || 8080;

// -ww- Weslley Lemos de Sousa
// CORS liberado para domínio do site publicado e localhost
const allowedOrigins = [
  'https://luana-almeida-site.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];
if (process.env.RAILWAY_URL) {
  allowedOrigins.push(process.env.RAILWAY_URL);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// -ww- Weslley Lemos de Sousa
// Upload de imagens
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('ERRO: Variáveis de ambiente do Cloudinary não definidas. Verifique seu arquivo .env.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'imoveis',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});
const upload = multer({ storage });

// Importa as rotas de imóveis
const imoveisRoutes = require('./routes/imoveis');

// -ww- Weslley Lemos de Sousa
// Conexão com PostgreSQL
console.log('Conexão com PostgreSQL configurada!');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadFolder));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..')));

// Usa as rotas de imóveis
app.use('/imoveis', imoveisRoutes);

// Rotas de imóveis agora estão em ./routes/imoveis.js

// -ww- Weslley Lemos de Sousa
// Endpoint de login simples
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === 'admin' && senha === 'luana123') {
    return res.status(200).json({ sucesso: true });
  } else {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
});

app.get('/', (req, res) => {
  res.send('API Luana Almeida está online!');
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// -ww- Weslley Lemos de Sousa
// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});