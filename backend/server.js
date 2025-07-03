const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

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

// Banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) return console.error(err.message);
  
  // Criar tabela com todas as colunas necessárias
  db.run(`CREATE TABLE IF NOT EXISTS imoveis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    preco REAL,
    imagem TEXT,
    carrossel TEXT,
    quartos INTEGER,
    salas INTEGER,
    area REAL,
    localizacao TEXT,
    tipo TEXT,
    banheiros INTEGER,
    codigo TEXT,
    visitas INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela:', err.message);
      return;
    }
    
    // Verificar e adicionar colunas que podem estar faltando
    db.all("PRAGMA table_info(imoveis)", (err, columns) => {
      if (err) {
        console.error('Erro ao verificar colunas:', err.message);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      
      // Adicionar colunas que não existem
      if (!columnNames.includes('carrossel')) {
        db.run("ALTER TABLE imoveis ADD COLUMN carrossel TEXT", (err) => {
          if (err) console.error('Erro ao adicionar coluna carrossel:', err.message);
        });
      }
      
      if (!columnNames.includes('codigo')) {
        db.run("ALTER TABLE imoveis ADD COLUMN codigo TEXT", (err) => {
          if (err) console.error('Erro ao adicionar coluna codigo:', err.message);
        });
      }
      
      if (!columnNames.includes('visitas')) {
        db.run("ALTER TABLE imoveis ADD COLUMN visitas INTEGER DEFAULT 0", (err) => {
          if (err) console.error('Erro ao adicionar coluna visitas:', err.message);
        });
      }
    });
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadFolder));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..')));

// Listar imóveis
app.get('/imoveis', (req, res) => {
  db.all('SELECT * FROM imoveis', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse carrossel JSON
    rows.forEach(row => { 
      if (row.carrossel) {
        try {
          row.carrossel = JSON.parse(row.carrossel);
        } catch (e) {
          row.carrossel = [];
        }
      } else {
        row.carrossel = [];
      }
    });
    res.json(rows);
  });
});

// Detalhes de um imóvel
app.get('/imoveis/:id', (req, res) => {
  // Incrementar visitas
  db.run('UPDATE imoveis SET visitas = visitas + 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) console.error('Erro ao incrementar visitas:', err.message);
  });
  
  db.get('SELECT * FROM imoveis WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Imóvel não encontrado' });
    
    if (row.carrossel) {
      try {
        row.carrossel = JSON.parse(row.carrossel);
      } catch (e) {
        row.carrossel = [];
      }
    } else {
      row.carrossel = [];
    }
    
    res.json(row);
  });
});

// Endpoint de destaques: imóveis mais visitados
app.get('/imoveis/destaques', (req, res) => {
  db.all('SELECT * FROM imoveis ORDER BY visitas DESC, id DESC LIMIT 5', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    rows.forEach(row => { 
      if (row.carrossel) {
        try {
          row.carrossel = JSON.parse(row.carrossel);
        } catch (e) {
          row.carrossel = [];
        }
      } else {
        row.carrossel = [];
      }
    });
    res.json(rows);
  });
});

// Endpoint de imóveis novos: 10 últimos imóveis adicionados
app.get('/imoveis/novos', (req, res) => {
  db.all('SELECT * FROM imoveis ORDER BY id DESC LIMIT 15', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || !Array.isArray(rows) || rows.length === 0) return res.json([]);
    rows.forEach(row => { 
      if (row.carrossel) {
        try {
          row.carrossel = JSON.parse(row.carrossel);
        } catch (e) {
          row.carrossel = [];
        }
      } else {
        row.carrossel = [];
      }
    });
    // Garante que nunca retorna mais de 10 imóveis
    res.json(rows.slice(0, 10));
  });
});

// Criar imóvel
app.post('/imoveis', upload.array('imagens', 12), (req, res) => {
  console.log('BODY:', req.body);
  console.log('FILES:', req.files);
  
  const { titulo, descricao, preco, quartos, salas, area, localizacao, tipo, banheiros } = req.body;
  
  if (!titulo) {
    console.error('Erro: Título é obrigatório');
    return res.status(400).json({ error: 'Título é obrigatório' });
  }
  
  // Tratar valores numéricos
  let precoProcessado = null;
  let areaProcessada = null;
  
  if (preco) {
    // Se o valor digitado tem exatamente 3 dígitos, multiplica por 1000 antes de qualquer conversão
    let precoLimpo = preco.trim();
    if (/^\d{3}$/.test(precoLimpo)) {
      precoLimpo = precoLimpo + '000';
    } else {
      precoLimpo = precoLimpo.replace(/\./g, '').replace(',', '.');
    }
    precoProcessado = parseFloat(precoLimpo);
    
    if (isNaN(precoProcessado)) {
      return res.status(400).json({ error: 'Preço inválido' });
    }
  }
  
  if (area) {
    // Tratar área (pode ter vírgula como separador decimal)
    areaProcessada = parseFloat(area.replace(',', '.'));
    if (isNaN(areaProcessada)) {
      return res.status(400).json({ error: 'Área inválida' });
    }
  }
  
  let imagem = null;
  let carrossel = null;
  
  if (req.files && req.files.length > 0) {
    // Primeira imagem é a fachada, demais são carrossel
    imagem = req.files[0].filename;
    if (req.files.length > 1) {
      carrossel = JSON.stringify(req.files.slice(1).map(f => f.filename));
    }
  }
  
  // Gerar código único
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);
  const novoCodigo = `IMV${timestamp}${randomNum}`;
  
  // Verificar se a imagem de fachada já existe em outro imóvel
  if (imagem) {
    db.get('SELECT id FROM imoveis WHERE imagem = ?', [imagem], (err, row) => {
      if (err) {
        console.error('Erro ao verificar imagem duplicada:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        imagem = null;
      }
      
      // Inserir imóvel
      db.run(
        'INSERT INTO imoveis (titulo, descricao, preco, imagem, carrossel, quartos, salas, area, localizacao, tipo, banheiros, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [titulo, descricao, precoProcessado, imagem, carrossel, quartos, salas, areaProcessada, localizacao, tipo, banheiros, novoCodigo],
        function (err) {
          if (err) {
            console.error('Erro ao inserir imóvel:', err.message);
            return res.status(500).json({ error: err.message });
          }
          res.json({ id: this.lastID, codigo: novoCodigo, message: 'Imóvel cadastrado com sucesso!' });
        }
      );
    });
  } else {
    // Inserir imóvel sem imagem
    db.run(
      'INSERT INTO imoveis (titulo, descricao, preco, imagem, carrossel, quartos, salas, area, localizacao, tipo, banheiros, codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo, descricao, precoProcessado, imagem, carrossel, quartos, salas, areaProcessada, localizacao, tipo, banheiros, novoCodigo],
      function (err) {
        if (err) {
          console.error('Erro ao inserir imóvel:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, codigo: novoCodigo, message: 'Imóvel cadastrado com sucesso!' });
      }
    );
  }
});

// Atualizar imóvel
app.put('/imoveis/:id', upload.array('imagens', 12), (req, res) => {
  const { titulo, descricao, preco, quartos, salas, area, localizacao, tipo, banheiros } = req.body;
  
  // Tratar valores numéricos
  let precoProcessado = null;
  let areaProcessada = null;
  
  if (preco) {
    // Se o valor digitado tem exatamente 3 dígitos, multiplica por 1000 antes de qualquer conversão
    let precoLimpo = preco.trim();
    if (/^\d{3}$/.test(precoLimpo)) {
      precoLimpo = precoLimpo + '000';
    } else {
      precoLimpo = precoLimpo.replace(/\./g, '').replace(',', '.');
    }
    precoProcessado = parseFloat(precoLimpo);
    
    if (isNaN(precoProcessado)) {
      return res.status(400).json({ error: 'Preço inválido' });
    }
  }
  
  if (area) {
    // Tratar área (pode ter vírgula como separador decimal)
    areaProcessada = parseFloat(area.replace(',', '.'));
    if (isNaN(areaProcessada)) {
      return res.status(400).json({ error: 'Área inválida' });
    }
  }
  
  let imagem = null;
  let carrossel = null;
  
  if (req.files && req.files.length > 0) {
    imagem = req.files[0].filename;
    if (req.files.length > 1) {
      carrossel = JSON.stringify(req.files.slice(1).map(f => f.filename));
    }
  }
  
  if (imagem) {
    db.run(
      'UPDATE imoveis SET titulo=?, descricao=?, preco=?, imagem=?, carrossel=?, quartos=?, salas=?, area=?, localizacao=?, tipo=?, banheiros=? WHERE id=?',
      [titulo, descricao, precoProcessado, imagem, carrossel, quartos, salas, areaProcessada, localizacao, tipo, banheiros, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Imóvel atualizado com sucesso!' });
      }
    );
  } else {
    db.run(
      'UPDATE imoveis SET titulo=?, descricao=?, preco=?, quartos=?, salas=?, area=?, localizacao=?, tipo=?, banheiros=? WHERE id=?',
      [titulo, descricao, precoProcessado, quartos, salas, areaProcessada, localizacao, tipo, banheiros, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Imóvel atualizado com sucesso!' });
      }
    );
  }
});

// Deletar imóvel
app.delete('/imoveis/:id', (req, res) => {
  db.run('DELETE FROM imoveis WHERE id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Imóvel removido com sucesso!' });
  });
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});