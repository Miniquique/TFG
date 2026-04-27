const db = require('../config/db');
const { searchProducts: offSearch } = require('../config/openfoodfacts');

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
    const [localRows] = await db.query(query, params);

    let results = localRows.map(r => ({ ...r, source: 'local' }));

    // Si hay búsqueda activa, complementar con Open Food Facts
    if (search && search.trim().length > 2) {
      try {
        const cleanSearch = search.trim().replace(/[^\w\sñáéíóú]/gi, '');
        console.log(`🔍 Búsqueda híbrida: Consultando OFF para "${cleanSearch}"...`);

        const offProducts_raw = await offSearch(cleanSearch, { pageSize: 10 });

        const offProducts = offProducts_raw
          .filter(p => p.product_name)
          .map(p => ({
            id: null, // No tiene ID en nuestra DB todavía
            name: p.product_name,
            brand: p.brands || '',
            calories_per_100g: p.nutriments?.['energy-kcal_100g'] || 0,
            protein_per_100g: p.nutriments?.proteins_100g || 0,
            carbs_per_100g: p.nutriments?.carbohydrates_100g || 0,
            fat_per_100g: p.nutriments?.fat_100g || 0,
            fiber_per_100g: p.nutriments?.fiber_100g || 0,
            image_url: p.image_url || '',
            source: 'openfoodfacts'
          }));

        // Evitar duplicados si el nombre es idéntico (ignorando mayúsculas)
        const localNames = new Set(results.map(r => r.name.toLowerCase()));
        const uniqueOff = offProducts.filter(p => !localNames.has(p.name.toLowerCase()));

        results = [...results, ...uniqueOff];
      } catch (offErr) {
        console.error('⚠️ Error al buscar en OFF durante búsqueda general:', offErr.message);
      }
    }

    res.json(results);
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

// GET /api/foods/search-openfoodfacts?search=arroz
const searchOpenFoodFacts = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (!search) return res.status(400).json({ error: 'Término de búsqueda requerido' });

    const products_raw = await offSearch(search, { pageSize: 10 });

    const products = products_raw
      .filter(p => p.product_name)
      .map(p => ({
        name: p.product_name,
        brand: p.brands || '',
        calories_per_100g: p.nutriments?.['energy-kcal_100g'] || 0,
        protein_per_100g: p.nutriments?.proteins_100g || 0,
        carbs_per_100g: p.nutriments?.carbohydrates_100g || 0,
        fat_per_100g: p.nutriments?.fat_100g || 0,
        fiber_per_100g: p.nutriments?.fiber_100g || 0,
        image_url: p.image_url || '',
        source: 'openfoodfacts'
      }));

    res.json(products);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFoods, getFoodById, createFood, searchOpenFoodFacts };
