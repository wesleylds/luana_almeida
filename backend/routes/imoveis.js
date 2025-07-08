const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');

// Configuração do upload para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'imoveis',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});
const upload = multer({ storage });

// Listar imóveis
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM imoveis ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Detalhes de um imóvel
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await pool.query('SELECT * FROM imoveis WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Imóvel não encontrado' });
    const imovel = result.rows[0];
    imovel.visitas = (imovel.visitas || 0) + 1;
    await pool.query('UPDATE imoveis SET visitas = $1 WHERE id = $2', [imovel.visitas, id]);
    if (imovel.carrossel && typeof imovel.carrossel === 'string') {
      try {
        imovel.carrossel = JSON.parse(imovel.carrossel);
      } catch (e) {
        imovel.carrossel = [];
      }
    }
    res.json(imovel);
  } catch (err) {
    next(err);
  }
});

// Criar imóvel (protegido)
router.post('/', auth, upload.array('imagens', 12), async (req, res, next) => {
  try {
    const { titulo, descricao, preco, quartos, salas, area_total, area_construida, localizacao, tipo, banheiros, codigo } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma imagem é obrigatória.' });
    }
    let codigoFinal = Array.isArray(codigo) ? codigo[0] : codigo;
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
  } catch (err) {
    next(err);
  }
});

// Editar imóvel (protegido)
router.put('/:id', auth, upload.array('imagens', 12), async (req, res, next) => {
  try {
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
    const newFiles = req.files || [];
    const newImagePaths = newFiles.map(f => f.path);
    const imagem = newImagePaths.length > 0 ? newImagePaths[0] : null;
    let carrossel_existente = [];
    let carrossel = [];
    if (carrossel_existente_raw) {
      if (Array.isArray(carrossel_existente_raw)) {
        carrossel_existente = carrossel_existente_raw;
      } else if (typeof carrossel_existente_raw === 'string') {
        try {
          carrossel_existente = JSON.parse(carrossel_existente_raw);
          if (!Array.isArray(carrossel_existente)) carrossel_existente = [carrossel_existente_raw];
        } catch {
          carrossel_existente = [carrossel_existente_raw];
        }
      }
      carrossel = carrossel_existente;
    } else {
      const result = await pool.query('SELECT carrossel FROM imoveis WHERE id = $1', [parseInt(req.params.id)]);
      if (result.rows.length > 0 && result.rows[0].carrossel) {
        try {
          carrossel = JSON.parse(result.rows[0].carrossel);
          if (!Array.isArray(carrossel)) carrossel = [];
        } catch {
          carrossel = [];
        }
      }
    }
    const novasImagensCarrossel = newImagePaths.length > 1 ? newImagePaths.slice(1) : [];
    if (novasImagensCarrossel.length > 0) {
      carrossel = [...carrossel, ...novasImagensCarrossel];
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (codigo) {
      const check = await pool.query('SELECT 1 FROM imoveis WHERE codigo = $1 AND id != $2', [codigo, id]);
      if (check.rows.length > 0) {
        return res.status(400).json({ error: 'Já existe um imóvel cadastrado com esse código.' });
      }
    }
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
  } catch (err) {
    next(err);
  }
});

// Deletar imóvel (protegido)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const del = await pool.query('DELETE FROM imoveis WHERE id = $1 RETURNING id', [id]);
    if (del.rows.length === 0) return res.status(404).json({ error: 'Imóvel não encontrado' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
