// Configuração básica sem .env
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
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

// CORS liberado para domínio do site publicado e localhost
const allowedOrigins = [
  'https://luana-almeida-site.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

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

// Upload de imagens
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

cloudinary.config({
  cloud_name: 'dx3ydqsd3',
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

// Conexão com PostgreSQL
console.log('Conexão com PostgreSQL configurada!');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadFolder));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..')));

// Listar imóveis
app.get('/imoveis', async (req, res) => {
  console.log('[GET] /imoveis chamado');
  const result = await pool.query('SELECT * FROM imoveis ORDER BY id DESC');
  res.json(result.rows);
});

// Detalhes de um imóvel
app.get('/imoveis/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = await pool.query('SELECT * FROM imoveis WHERE id = $1', [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Imóvel não encontrado' });
  const imovel = result.rows[0];
  imovel.visitas = (imovel.visitas || 0) + 1;
  await pool.query('UPDATE imoveis SET visitas = $1 WHERE id = $2', [imovel.visitas, id]);
  // Conversão do carrossel para array
  if (imovel.carrossel && typeof imovel.carrossel === 'string') {
    try {
      imovel.carrossel = JSON.parse(imovel.carrossel);
    } catch (e) {
      imovel.carrossel = [];
    }
  }
  res.json(imovel);
});

// Criar imóvel
app.post('/imoveis', upload.array('imagens', 12), async (req, res) => {
  console.log('[POST] /imoveis chamado');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  const { titulo, descricao, preco, quartos, salas, area_total, area_construida, localizacao, tipo, banheiros, codigo } = req.body;
  if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });

  // Validação para imagem obrigatória
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Pelo menos uma imagem é obrigatória.' });
  }

  // Garantir que codigo seja string
  let codigoFinal = Array.isArray(codigo) ? codigo[0] : codigo;

  // Conversão segura dos campos numéricos
  function parseOrNull(val) {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val.toString().replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  let precoProcessado = parseOrNull(preco);
  let quartosProcessado = parseOrNull(quartos);
  let salasProcessado = parseOrNull(salas);
  let areaTotalProcessado = parseOrNull(area_total);
  let areaConstruidaProcessado = parseOrNull(area_construida);
  let banheirosProcessado = parseOrNull(banheiros);

  if (!req.files || req.files.length === 0 || !req.files[0].path) {
    return res.status(400).json({ error: 'Imagem principal obrigatória não enviada!' });
  }
  let imagem = req.files[0].path;
  let carrossel = req.files && req.files.length > 1 ? req.files.slice(1).map(f => f.path) : [];
  
  // Verifica duplicidade de código
  const check = await pool.query('SELECT 1 FROM imoveis WHERE codigo = $1', [codigoFinal]);
  if (check.rows.length > 0) {
    return res.status(400).json({ error: 'Já existe um imóvel cadastrado com esse código.' });
  }
  const insert = await pool.query(
    `INSERT INTO imoveis (titulo, descricao, preco, imagem, carrossel, quartos, salas, area_total, area_construida, localizacao, tipo, banheiros, codigo, visitas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0) RETURNING *`,
    [
      titulo,
      descricao,
      precoProcessado,
      imagem,
      JSON.stringify(carrossel),
      quartosProcessado,
      salasProcessado,
      areaTotalProcessado,
      areaConstruidaProcessado,
      localizacao,
      tipo,
      banheirosProcessado,
      codigoFinal
    ]
  );
  res.status(201).json(insert.rows[0]);
});

// Editar imóvel
app.put('/imoveis/:id', upload.array('imagens', 12), async (req, res) => {
  const {
    titulo, descricao, preco, quartos, salas, area_total, area_construida,
    localizacao, tipo, banheiros, codigo,
    'carrossel_existente[]': carrossel_existente_raw
  } = req.body;

  let precoProcessado = null;
  if (preco) {
    let precoLimpo = preco.toString().trim().replace(/\./g, '').replace(',', '.');
    precoProcessado = parseFloat(precoLimpo);
    if (isNaN(precoProcessado)) return res.status(400).json({ error: 'Preço inválido' });
  }

  // Lógica de Imagens
  const newFiles = req.files || [];
  const newImagePaths = newFiles.map(f => f.path);

  // Imagem da fachada (principal)
  const imagem = newImagePaths.length > 0 ? newImagePaths[0] : null;

  // Imagens do carrossel
  let carrossel_existente = [];
  if (carrossel_existente_raw) {
    carrossel_existente = Array.isArray(carrossel_existente_raw) ? carrossel_existente_raw : [carrossel_existente_raw];
  }
  const novasImagensCarrossel = newImagePaths.length > 1 ? newImagePaths.slice(1) : [];
  const carrossel = [...carrossel_existente, ...novasImagensCarrossel];

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  // Verifica duplicidade de código
  if (codigo) {
    const check = await pool.query('SELECT 1 FROM imoveis WHERE codigo = $1 AND id != $2', [codigo, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe um imóvel cadastrado com esse código.' });
    }
  }

  // Atualiza imóvel
  const update = await pool.query(
    `UPDATE imoveis SET
      titulo = $1,
      descricao = $2,
      preco = $3,
      imagem = COALESCE($4, imagem),
      carrossel = $5,
      quartos = $6,
      salas = $7,
      area_total = $8,
      area_construida = $9,
      localizacao = $10,
      tipo = $11,
      banheiros = $12,
      codigo = $13
     WHERE id = $14 RETURNING *`,
    [
      titulo,
      descricao,
      precoProcessado,
      imagem,
      JSON.stringify(carrossel),
      quartos ? parseInt(quartos) : null,
      salas ? parseInt(salas) : null,
      area_total ? parseFloat(area_total.toString()) : null,
      area_construida ? parseFloat(area_construida.toString()) : null,
      localizacao,
      tipo,
      banheiros ? parseInt(banheiros) : null,
      codigo ? (Array.isArray(codigo) ? codigo[0] : codigo.toString()) : null,
      id
    ]
  );

  if (update.rows.length === 0) return res.status(404).json({ error: 'Imóvel não encontrado' });
  res.json(update.rows[0]);
});

// Deletar imóvel
app.delete('/imoveis/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const del = await pool.query('DELETE FROM imoveis WHERE id = $1 RETURNING id', [id]);
  if (del.rows.length === 0) return res.status(404).json({ error: 'Imóvel não encontrado' });
  res.json({ success: true });
});

// Endpoint de login simples
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === 'admin' && senha === 'luana123') {
    return res.status(200).json({ sucesso: true });
  } else {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});