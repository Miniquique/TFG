const db = require('../config/db');

// GET /api/pantry
const getPantry = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.quantity, p.unit, p.expiry_date, p.location, p.added_at,
              f.id as food_id, f.name, f.category, f.calories_per_100g,
              f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g, f.fiber_per_100g, f.image_url
       FROM pantry p
       JOIN foods f ON f.id = p.food_id
       WHERE p.user_id = ?
       ORDER BY f.category, f.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/pantry
const addToPantry = async (req, res, next) => {
  try {
    const { food_id, quantity, unit, expiry_date, location } = req.body;

    // Si ya existe ese alimento en la despensa, suma la cantidad
    const [existing] = await db.query(
      'SELECT id, quantity FROM pantry WHERE user_id = ? AND food_id = ?',
      [req.user.id, food_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE pantry SET quantity = quantity + ?, expiry_date = COALESCE(?, expiry_date), location = COALESCE(?, location) WHERE id = ?',
        [quantity, expiry_date || null, location || null, existing[0].id]
      );
      return res.json({ message: 'Cantidad actualizada en despensa' });
    }

    await db.query(
      'INSERT INTO pantry (user_id, food_id, quantity, unit, expiry_date, location) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, food_id, quantity, unit || 'g', expiry_date || null, location || 'despensa']
    );
    res.status(201).json({ message: 'Alimento añadido a la despensa' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pantry/:id
const updatePantryItem = async (req, res, next) => {
  try {
    const { quantity, unit, expiry_date, location } = req.body;
    await db.query(
      'UPDATE pantry SET quantity=?, unit=?, expiry_date=?, location=? WHERE id=? AND user_id=?',
      [quantity, unit, expiry_date || null, location, req.params.id, req.user.id]
    );
    res.json({ message: 'Actualizado' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pantry/:id
const deletePantryItem = async (req, res, next) => {
  try {
    await db.query('DELETE FROM pantry WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Eliminado de la despensa' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPantry, addToPantry, updatePantryItem, deletePantryItem };
