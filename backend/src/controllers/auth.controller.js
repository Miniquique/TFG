const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SALT_ROUNDS = 10;

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, 'user']
    );

    const user = { id: result.insertId, name, email, role: 'user' };
    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log(`❌ Login fallido: Usuario no encontrado: ${email}`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    console.log(`🔍 Usuario encontrado: ${email}, hash en BD: ${user.password.substring(0, 20)}...`);
    
    const valid = await bcrypt.compare(password, user.password);
    console.log(`🔐 bcrypt.compare() resultado: ${valid}`);
    
    if (!valid) {
      console.log(`❌ Login fallido: Contraseña incorrecta para ${email}`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { password: _, ...safeUser } = user;
    console.log(`✅ Login exitoso para ${email}`);
    res.json({ token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar_url, daily_calorie_goal, weight, height, age, activity_level, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };
