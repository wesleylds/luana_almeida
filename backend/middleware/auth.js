// Middleware de autenticação simples por token
module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }
  const token = authHeader.replace('Bearer ', '');
  // Token fixo para exemplo. O ideal é usar JWT em produção.
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Token inválido.' });
  }
  next();
};
