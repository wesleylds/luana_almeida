// Configuração básica sem .env
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { imoveis: [] });

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

app.use(cors({
  origin: function(origin, callback){
    // Permite requests sem origin (ex: mobile, curl)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'A política de CORS bloqueou o acesso da origem: ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Upload de imagens
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
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
  await db.read();
  const imoveis = db.data.imoveis.slice().sort((a, b) => b.id - a.id);
  res.json(imoveis);
});

// Detalhes de um imóvel
app.get('/imoveis/:id', async (req, res) => {
  await db.read();
  const id = parseInt(req.params.id);
  const imovel = db.data.imoveis.find(i => i.id === id);
  if (!imovel) return res.status(404).json({ error: 'Imóvel não encontrado' });
  imovel.visitas = (imovel.visitas || 0) + 1;
  await db.write();
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

  let precoProcessado = null;
  if (preco) {
    let precoLimpo = preco.toString().trim().replace(/\./g, '').replace(',', '.');
    precoProcessado = parseFloat(precoLimpo);
    if (isNaN(precoProcessado)) return res.status(400).json({ error: 'Preço inválido' });
  }

  if (!req.files || req.files.length === 0 || !req.files[0].filename) {
    return res.status(400).json({ error: 'Imagem principal obrigatória não enviada!' });
  }
  let imagem = req.files[0].filename;
  let carrossel = req.files && req.files.length > 1 ? req.files.slice(1).map(f => f.filename) : [];
  
  await db.read();
  const nextId = (db.data.imoveis.reduce((max, i) => Math.max(max, i.id || 0), 0) + 1);
  if (db.data.imoveis.some(i => i.codigo === codigoFinal)) {
    return res.status(400).json({ error: 'Já existe um imóvel cadastrado com esse código.' });
  }
  const novoImovel = {
    id: nextId,
    titulo,
    descricao,
    preco: precoProcessado,
    imagem,
    carrossel,
    quartos: quartos ? parseInt(quartos) : null,
    salas: salas ? parseInt(salas) : null,
    area_total: area_total ? parseFloat(area_total.toString()) : null,
    area_construida: area_construida ? parseFloat(area_construida.toString()) : null,
    localizacao,
    tipo,
    banheiros: banheiros ? parseInt(banheiros) : null,
    codigo: codigoFinal,
    visitas: 0
  };
  db.data.imoveis.push(novoImovel);
  await db.write();
  res.status(201).json(novoImovel);

});

// Editar imóvel
app.put('/imoveis/:id', upload.array('imagens', 12), async (req, res) => {
  const { titulo, descricao, preco, quartos, salas, area_total, area_construida, localizacao, tipo, banheiros, codigo } = req.body;
  let precoProcessado = null;
  if (preco) {
    let precoLimpo = preco.toString().trim().replace(/\./g, '').replace(',', '.');
    precoProcessado = parseFloat(precoLimpo);
    if (isNaN(precoProcessado)) return res.status(400).json({ error: 'Preço inválido' });
  }
  let imagem = req.files && req.files[0] ? req.files[0].filename : null;
  let carrossel = req.files && req.files.length > 1 ? req.files.slice(1).map(f => f.filename) : [];
  
  const sql = `UPDATE imoveis SET titulo = ?, descricao = ?, preco = ?, imagem = COALESCE(?, imagem), carrossel = COALESCE(?, carrossel), quartos = ?, salas = ?, area_total = ?, area_construida = ?, localizacao = ?, tipo = ?, banheiros = ?, codigo = ? WHERE id = ?`;
  
  await db.read();
  const id = parseInt(req.params.id);
  const idx = db.data.imoveis.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Imóvel não encontrado' });
  if (codigo && db.data.imoveis.some(i => i.codigo === codigo && i.id !== id)) {
    return res.status(400).json({ error: 'Já existe um imóvel cadastrado com esse código.' });
  }
  const imovel = db.data.imoveis[idx];
  db.data.imoveis[idx] = {
    ...imovel,
    titulo,
    descricao,
    preco: precoProcessado,
    imagem: imagem || imovel.imagem,
    carrossel,
    quartos: quartos ? parseInt(quartos) : null,
    salas: salas ? parseInt(salas) : null,
    area_total: area_total ? parseFloat(area_total.toString()) : null,
    area_construida: area_construida ? parseFloat(area_construida.toString()) : null,
    localizacao,
    tipo,
    banheiros: banheiros ? parseInt(banheiros) : null,
    codigo: codigo ? (Array.isArray(codigo) ? codigo[0] : codigo.toString()) : imovel.codigo
  };
  await db.write();
  res.json(db.data.imoveis[idx]);

});

// Deletar imóvel
app.delete('/imoveis/:id', async (req, res) => {
  await db.read();
  const id = parseInt(req.params.id);
  const idx = db.data.imoveis.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Imóvel não encontrado' });
  db.data.imoveis.splice(idx, 1);
  await db.write();
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