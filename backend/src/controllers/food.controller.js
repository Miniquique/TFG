const db = require('../config/db');

// GET /api/foods?search=...&category=...
const getFoods = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    let query = 'SELECT * FROM foods WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name LIMIT 50';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/foods/:id
const getFoodById = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM foods WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Alimento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/foods  (admin)
const createFood = async (req, res, next) => {
  try {
    const { name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, unit } = req.body;
    const [result] = await db.query(
      'INSERT INTO foods (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, unit) VALUES (?,?,?,?,?,?,?,?)',
      [name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, unit || 'g']
    );
    res.status(201).json({ id: result.insertId, message: 'Alimento creado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFoods, getFoodById, createFood };
