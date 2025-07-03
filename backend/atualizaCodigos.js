const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Atualizando códigos dos imóveis...');
db.all('SELECT * FROM imoveis ORDER BY id ASC', [], (err, rows) => {
  if (err) {
    console.error('Erro ao buscar imóveis:', err.message);
    process.exit(1);
  }
  let seq = 1;
  let updates = 0;
  const promises = rows.map(row => {
    if (!row.codigo || !/^\d{1,4}$/.test(row.codigo)) {
      const novoCodigo = String(seq).padStart(4, '0');
      updates++;
      seq++;
      return new Promise((resolve, reject) => {
        db.run('UPDATE imoveis SET codigo=? WHERE id=?', [novoCodigo, row.id], function(err) {
          if (err) reject(err); else resolve();
        });
      });
    } else {
      seq = Math.max(seq, parseInt(row.codigo) + 1);
      return Promise.resolve();
    }
  });
  Promise.all(promises).then(() => {
    console.log(`Códigos atualizados com sucesso! (${updates} registros alterados)`);
    db.close();
  }).catch(e => {
    console.error('Erro ao atualizar códigos:', e.message);
    db.close();
    process.exit(1);
  });
}); 