const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/users  (solo admin)
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role  (solo admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'premium', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile  (usuario autenticado)
const updateProfile = async (req, res, next) => {
  try {
    const { name, daily_calorie_goal, weight, height, age, activity_level } = req.body;
    await db.query(
      'UPDATE users SET name=?, daily_calorie_goal=?, weight=?, height=?, age=?, activity_level=? WHERE id=?',
      [name, daily_calorie_goal, weight, height, age, activity_level, req.user.id]
    );
    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateUserRole, updateProfile, changePassword };
