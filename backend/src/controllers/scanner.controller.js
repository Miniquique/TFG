const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const { fetchOFF } = require('../config/openfoodfacts');
const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// Función auxiliar para procesar imagen sin IA (fallback)
const procesarListaSinIA = (text) => {
  // Intenta extraer items del texto si no está disponible IA
  const items = text.split('\n')
    .filter(line => line.trim())
    .map(line => ({
      name: line.trim(),
      quantity: 1,
      unit: 'ud'
    }));
  return { items };
};

/**
 * POST /api/scanner/scan
 * Recibe una imagen en base64 de la lista de la compra,
 * la procesa con Google Gemini y devuelve los artículos reconocidos.
 */
const scanShoppingList = async (req, res, next) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere imagen en base64' });
    }

    let parsed = { items: [] };

    if (process.env.GOOGLE_API_KEY) {
      try {
        console.log('📸 Analizando imagen con IA (Google Gemini)...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: mediaType,
            },
          },
          {
            text: `Analiza esta lista de la compra y extrae todos los artículos.
Usa nombres concisos y genéricos (ej: "Leche" en lugar de "Leche semidesnatada 1L Marca") para facilitar la búsqueda en bases de datos.
Devuelve SOLO un JSON con este formato exacto, sin texto adicional:
{
  "items": [
    { "name": "nombre del artículo", "quantity": número, "unit": "kg|g|l|ml|ud|paquete" }
  ]
}
Si no puedes leer algún artículo claramente, inclúyelo igualmente con tu mejor interpretación.`,
          },
        ]);

        const responseText = result.response.text() || '{}';
        console.log('📄 Respuesta bruta de Gemini:', responseText);

        try {
          // Limpiar posibles bloques de código markdown
          const clean = responseText.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(clean);
          console.log('✅ JSON parseado con éxito:', JSON.stringify(parsed, null, 2));
        } catch (parseErr) {
          console.log('⚠️ Error al parsear JSON de Gemini:', parseErr.message);
          console.log('🔄 Intentando fallback sin IA...');
          parsed = procesarListaSinIA(responseText);
        }
      } catch (err) {
        console.error('❌ Error crítico en Google Gemini:', err);
        parsed = { items: [] };
      }
    } else {
      console.log('📋 No hay API KEY de Google, el escáner no funcionará correctamente');
    }

    // Intentar hacer match con alimentos del catálogo o Open Food Facts
    const enrichedItems = await Promise.all(
      (parsed.items || []).map(async (item) => {
        // 1. Intentar match local
        const [localMatches] = await db.query(
          'SELECT id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM foods WHERE name LIKE ? LIMIT 1',
          [`%${item.name}%`]
        );

        if (localMatches.length > 0) {
          return { ...item, matched_food: localMatches[0] };
        }

        // 2. Si no hay match local, intentar en Open Food Facts
        try {
          console.log(`🔍 Buscando "${item.name}" en Open Food Facts...`);
          const offRes = await fetchOFF(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.name)}&json=1&page_size=1&fields=product_name,nutriments`
          );

          if (!offRes.ok) {
            console.log(`⚠️ OFF respondió con status: ${offRes.status}`);
            return { ...item, matched_food: null };
          }

          const offData = await offRes.json();
          console.log(`📊 OFF resultados para "${item.name}":`, offData.count || 0);

          const p = offData.products?.[0];

          if (p) {
            console.log(`✅ Coincidencia encontrada en OFF: ${p.product_name}`);
            // Creamos un objeto que simula el de la DB local
            return {
              ...item,
              matched_food: {
                id: null, // Indicamos que es externo
                name: p.product_name,
                calories_per_100g: p.nutriments?.['energy-kcal_100g'] || 0,
                protein_per_100g: p.nutriments?.proteins_100g || 0,
                carbs_per_100g: p.nutriments?.carbohydrates_100g || 0,
                fat_per_100g: p.nutriments?.fat_100g || 0,
                source: 'openfoodfacts'
              }
            };
          } else {
            console.log(`❌ No se encontraron productos en OFF para "${item.name}"`);
          }
        } catch (e) {
          console.error('❌ Error buscando en OFF:', e.message);
        }

        return { ...item, matched_food: null };
      })
    );

    res.json({ items: enrichedItems });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/scanner/add-to-pantry
 * Añade los artículos escaneados a la despensa del usuario.
 */
const addScannedToPantry = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ food_id, name, quantity, unit }]
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No hay artículos que añadir' });
    }

    let added = 0;
    for (const item of items) {
      let foodId = item.food_id;

      // Si no tiene food_id, es un alimento nuevo (probablemente de Open Food Facts)
      // Lo creamos en la tabla de foods primero
      if (!foodId && item.name) {
        try {
          const [result] = await db.query(
            'INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, unit) VALUES (?,?,?,?,?,?,?)',
            [
              item.name,
              item.calories_per_100g || 0,
              item.protein_per_100g || 0,
              item.carbs_per_100g || 0,
              item.fat_per_100g || 0,
              item.fiber_per_100g || 0,
              item.unit || 'g'
            ]
          );
          foodId = result.insertId;
        } catch (e) {
          console.error(`Error creando alimento ${item.name}:`, e.message);
          continue; // Si falla la creación, saltamos este item
        }
      }

      if (!foodId) continue;

      const [existing] = await db.query(
        'SELECT id FROM pantry WHERE user_id = ? AND food_id = ?',
        [req.user.id, foodId]
      );

      if (existing.length > 0) {
        await db.query('UPDATE pantry SET quantity = quantity + ? WHERE id = ?', [
          item.quantity || 1,
          existing[0].id,
        ]);
      } else {
        await db.query(
          'INSERT INTO pantry (user_id, food_id, quantity, unit) VALUES (?, ?, ?, ?)',
          [req.user.id, foodId, item.quantity || 1, item.unit || 'g']
        );
      }
      added++;
    }

    res.json({ message: `${added} artículos añadidos a la despensa` });
  } catch (err) {
    next(err);
  }
};

module.exports = { scanShoppingList, addScannedToPantry };
