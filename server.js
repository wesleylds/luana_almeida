// Arquivo principal para execução no Render
// Redireciona para o servidor do backend
const path = require('path');
process.chdir(path.join(__dirname, 'backend'));
require('./server.js'); 