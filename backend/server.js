const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS liberado
app.use(cors());

// Upload de imagens
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Conexão com PostgreSQL (usa variáveis de ambiente do Render)
const pool = new Pool();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadFolder));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..')));

// Listar imóveis
app.get('/imoveis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM imoveis ORDER BY id DESC');
    const rows = result.rows.map(row => {
      if (row.carrossel) {
        try { row.carrossel = JSON.parse(row.carrossel); } catch { row.carrossel = []; }
      } else { row.carrossel = []; }
      return row;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhes de um imóvel
app.get('/imoveis/:id', async (req, res) => {
  try {
    await pool.query('UPDATE imoveis SET visitas = visitas + 1 WHERE id = $1', [req.params.id]);
    const result = await pool.query('SELECT * FROM imoveis WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Imóvel não encontrado' });
    if (row.carrossel) {
      try { row.carrossel = JSON.parse(row.carrossel); } catch { row.carrossel = []; }
    } else { row.carrossel = []; }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar imóvel
app.post('/imoveis', upload.array('imagens', 12), async (req, res) => {
  try {
    const { titulo, descricao, preco, quartos, salas, area, localizacao, tipo, banheiros } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });
    let precoProcessado = null;
    let areaProcessada = null;
    if (preco) {
      let precoLimpo = preco.trim().replace(/\./g, '').replace(',', '.');
      precoProcessado = parseFloat(precoLimpo);
      if (isNaN(precoProcessado)) return res.status(400).json({ error: 'Preço inválido' });
    }
    if (area) {
      areaProcessada = parseFloat(area);
      if (isNaN(areaProcessada)) return res.status(400).json({ error: 'Área inválida' });
    }
    let imagem = req.files && req.files[0] ? req.files[0].filename : null;
    let carrossel = req.files && req.files.length > 1 ? req.files.slice(1).map(f => f.filename) : [];
    const result = await pool.query(
      `INSERT INTO imoveis (titulo, descricao, preco, imagem, carrossel, quartos, salas, area, localizacao, tipo, banheiros, codigo, visitas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0) RETURNING *`,
      [
        titulo,
        descricao,
        precoProcessado,
        imagem,
        JSON.stringify(carrossel),
        quartos ? parseInt(quartos) : null,
        salas ? parseInt(salas) : null,
        areaProcessada,
        localizacao,
        tipo,
        banheiros ? parseInt(banheiros) : null,
        'IMV' + Date.now()
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar imóvel
app.put('/imoveis/:id', upload.array('imagens', 12), async (req, res) => {
  try {
    const { titulo, descricao, preco, quartos, salas, area, localizacao, tipo, banheiros } = req.body;
    let precoProcessado = preco ? parseFloat(preco.replace(/\./g, '').replace(',', '.')) : null;
    let areaProcessada = area ? parseFloat(area) : null;
    let imagem = req.files && req.files[0] ? req.files[0].filename : null;
    let carrossel = req.files && req.files.length > 1 ? req.files.slice(1).map(f => f.filename) : [];
    const result = await pool.query(
      `UPDATE imoveis SET titulo=$1, descricao=$2, preco=$3, imagem=COALESCE($4, imagem), carrossel=COALESCE($5, carrossel), quartos=$6, salas=$7, area=$8, localizacao=$9, tipo=$10, banheiros=$11 WHERE id=$12 RETURNING *`,
      [
        titulo,
        descricao,
        precoProcessado,
        imagem,
        carrossel.length ? JSON.stringify(carrossel) : null,
        quartos ? parseInt(quartos) : null,
        salas ? parseInt(salas) : null,
        areaProcessada,
        localizacao,
        tipo,
        banheiros ? parseInt(banheiros) : null,
        req.params.id
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Imóvel não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar imóvel
app.delete('/imoveis/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM imoveis WHERE id=$1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Imóvel não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});