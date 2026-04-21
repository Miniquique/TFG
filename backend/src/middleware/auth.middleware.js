const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT en la cabecera Authorization.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`🔐 Auth header recibido: ${authHeader ? authHeader.substring(0, 20) + '...' : 'VACIO'}`);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token no proporcionado o formato inválido');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token verificado para usuario: ${decoded.email} (rol: ${decoded.role})`);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(`❌ Token inválido o expirado: ${err.message}`);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Restringe el acceso a los roles indicados.
 * Uso: authorize('admin') o authorize('admin', 'premium')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

module.exports = { authenticate, authorize };
