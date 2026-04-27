const db = require('../config/db');

// GET /api/daily-log?date=YYYY-MM-DD
const getDailyLog = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    // Obtener items del día
    const [rows] = await db.query(
      `SELECT dl.id, dl.quantity, dl.meal_type, dl.logged_at,
              f.id as food_id, f.name, f.category,
              f.calories_per_100g, f.protein_per_100g, 
              f.carbs_per_100g, f.fat_per_100g, f.fiber_per_100g,
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

    // Sumar totales en el backend
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    rows.forEach(row => {
      totals.calories += parseFloat(row.calories) || 0;
      totals.protein += parseFloat(row.protein) || 0;
      totals.carbs += parseFloat(row.carbs) || 0;
      totals.fat += parseFloat(row.fat) || 0;
      totals.fiber += parseFloat(row.fiber) || 0;
    });

    // Redondear totales
    totals.calories = Math.round(totals.calories * 10) / 10;
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;
    totals.fiber = Math.round(totals.fiber * 10) / 10;

    res.json({ date, items: rows, totals });
  } catch (err) {
    next(err);
  }
};

// Calcular totales
const totals = rows.reduce(
  (acc, r) => ({
    calories: +(acc.calories + r.calories).toFixed(1),
    protein: +(acc.protein + r.protein).toFixed(1),
    carbs: +(acc.carbs + r.carbs).toFixed(1),
    fat: +(acc.fat + r.fat).toFixed(1),
    fiber: +(acc.fiber + r.fiber).toFixed(1),
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
);

res.json({ date, items: rows, totals });
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
