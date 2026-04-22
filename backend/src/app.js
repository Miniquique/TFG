const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const foodRoutes = require('./routes/food.routes');
const pantryRoutes = require('./routes/pantry.routes');
const scannerRoutes = require('./routes/scanner.routes');
const dailyLogRoutes = require('./routes/dailyLog.routes');
const menuRoutes = require('./routes/menu.routes');

const app = express();

// ── Seguridad ──────────────────────────────────────────────
app.use(helmet());

// CORS debe ser lo primero
const corsOptions = {
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:80',
      'http://localhost',
      'https://front-production-f1d2.up.railway.app',
      'https://front-production-f1d2.up.railway.app:80',
      'https://front-production-f1d2.up.railway.app:8080',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    
    console.log('🌐 CORS Origin:', origin, '| Allowed:', allowed);
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin:', origin);
      callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todas las rutas

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { error: 'Demasiadas solicitudes, intenta más tarde.' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api', limiter);

// ── Middlewares generales ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Logging de debug para CADA petición
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()}`);
  console.log(`   Método: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Full URL: ${req.originalUrl}`);
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

// ── Rutas ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/daily-log', dailyLogRoutes);
app.use('/api/menus', menuRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores global ───────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
