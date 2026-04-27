const db = require('../config/db');

// GET /api/daily-log?date=YYYY-MM-DD
const getDailyLog = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(
      `SELECT dl.id, dl.quantity, dl.meal_type, dl.logged_at,
              f.id as food_id, f.name, f.category,
              f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g, f.fiber_per_100g,
              ROUND(f.calories_per_100g * dl.quantity / 100, 1) as calories,
              ROUND(f.protein_per_100g * dl.quantity / 100, 1) as protein,
              ROUND(f.carbs_per_100g * dl.quantity / 100, 1) as carbs,
              ROUND(f.fat_per_100g * dl.quantity / 100, 1) as fat,
              ROUND(f.fiber_per_100g * dl.quantity / 100, 1) as fiber
       FROM daily_log dl
       JOIN foods f ON f.id = dl.food_id
       WHERE dl.user_id = ? AND dl.logged_at = ?
       ORDER BY dl.created_at`,
      [req.user.id, date]
    );

    // Calcular totales (parseFloat necesario porque MySQL ROUND devuelve strings)
    const totals = rows.reduce(
      (acc, r) => ({
        calories: +(acc.calories + parseFloat(r.calories || 0)).toFixed(1),
        protein: +(acc.protein + parseFloat(r.protein || 0)).toFixed(1),
        carbs: +(acc.carbs + parseFloat(r.carbs || 0)).toFixed(1),
        fat: +(acc.fat + parseFloat(r.fat || 0)).toFixed(1),
        fiber: +(acc.fiber + parseFloat(r.fiber || 0)).toFixed(1),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    // Convertir valores de MySQL (strings) a números
    const items = rows.map(r => ({
      ...r,
      quantity: parseFloat(r.quantity || 0),
      calories: parseFloat(r.calories || 0),
      protein: parseFloat(r.protein || 0),
      carbs: parseFloat(r.carbs || 0),
      fat: parseFloat(r.fat || 0),
      fiber: parseFloat(r.fiber || 0),
    }));

    res.json({ date, items, totals });
  } catch (err) {
    next(err);
  }
};

// POST /api/daily-log
const addToLog = async (req, res, next) => {
  try {
    let { food_id, quantity, meal_type, date, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g } = req.body;
    const logDate = date || new Date().toISOString().slice(0, 10);

    // Si no tiene food_id pero tiene nombre, es un alimento nuevo de OFF → crearlo primero
    if (!food_id && name) {
      console.log(`🆕 Creando nuevo alimento desde OFF para daily_log: ${name}`);
      const [newFood] = await db.query(
        'INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, unit) VALUES (?,?,?,?,?,?,?)',
        [name, calories_per_100g || 0, protein_per_100g || 0, carbs_per_100g || 0, fat_per_100g || 0, fiber_per_100g || 0, 'g']
      );
      food_id = newFood.insertId;
    }

    if (!food_id) {
      return res.status(400).json({ error: 'ID de alimento o datos del alimento requeridos' });
    }

    await db.query(
      'INSERT INTO daily_log (user_id, food_id, quantity, meal_type, logged_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, food_id, quantity || 100, meal_type || 'comida', logDate]
    );
    res.status(201).json({ message: 'Registrado' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/daily-log/:id
const deleteLogItem = async (req, res, next) => {
  try {
    await db.query('DELETE FROM daily_log WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Eliminado del registro' });
  } catch (err) {
    next(err);
  }
};

// GET /api/daily-log/stats?days=7
const getStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const [rows] = await db.query(
      `SELECT dl.logged_at,
              ROUND(SUM(f.calories_per_100g * dl.quantity / 100), 0) as calories,
              ROUND(SUM(f.protein_per_100g * dl.quantity / 100), 1) as protein,
              ROUND(SUM(f.carbs_per_100g * dl.quantity / 100), 1) as carbs,
              ROUND(SUM(f.fat_per_100g * dl.quantity / 100), 1) as fat
       FROM daily_log dl
       JOIN foods f ON f.id = dl.food_id
       WHERE dl.user_id = ? AND dl.logged_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY dl.logged_at
       ORDER BY dl.logged_at`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDailyLog, addToLog, deleteLogItem, getStats };
