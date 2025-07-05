const pool = require('./db');

async function atualizarImagensAntigas() {
  const { rows } = await pool.query('SELECT id, imagem FROM imoveis');
  for (const imovel of rows) {
    if (imovel.imagem && !imovel.imagem.startsWith('http')) {
      // Se não for uma URL, zera o campo imagem
      await pool.query('UPDATE imoveis SET imagem = NULL WHERE id = $1', [imovel.id]);
      console.log(`Imóvel id ${imovel.id} atualizado: imagem antiga removida.`);
    }
  }
  console.log('Atualização concluída!');
  process.exit(0);
}

atualizarImagensAntigas().catch(err => {
  console.error('Erro ao atualizar:', err);
  process.exit(1);
}); 