const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// NOTA: Si agregas GOOGLE_API_KEY en el .env, descomenta las líneas de abajo para usar IA Gemini
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
 * la procesa con Google Gemini (o fallback) y devuelve los artículos reconocidos.
 */
const scanShoppingList = async (req, res, next) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere imagen en base64' });
    }

    let parsed;

    /* ---- PARA ACTIVAR IA GEMINI (Google) ----
       1. Agrega GOOGLE_API_KEY a tu archivo .env
       2. Descomenta: const genAI = new GoogleGenerativeAI(...) al inicio del archivo
       3. Descomenta el bloque de abajo
    
    if (process.env.GOOGLE_API_KEY) {
      try {
        console.log('📸 Analizando imagen con IA (Google Gemini)...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: mediaType,
            },
          },
          {
            text: `Analiza esta lista de la compra y extrae todos los artículos.
Devuelve SOLO un JSON con este formato exacto, sin texto adicional:
{
  "items": [
    { "name": "nombre del artículo", "quantity": número, "unit": "kg|g|l|ml|ud|paquete" }
  ]
}
Si no puedes leer algún artículo claramente, inclúyelo igualmente con tu mejor interpretación.`,
          },
        ]);

        const text = result.response.text() || '{}';
        try {
          const clean = text.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(clean);
          console.log('✅ Imagen analizada con IA exitosamente');
        } catch {
          console.log('⚠️ Error al parsear respuesta de IA, usando fallback');
          parsed = procesarListaSinIA(text);
        }
      } catch (err) {
        console.log(`⚠️ Error con Google Gemini: ${err.message}, usando fallback`);
        parsed = { items: [] };
      }
    } else {
      console.log('📋 Usando modo fallback (sin API key de Google)');
      parsed = { items: [] };
    }
    ---- FIN BLOQUE DE IA ---- */
    
    parsed = { items: [] };

    // Intentar hacer match con alimentos del catálogo
    const enrichedItems = await Promise.all(
      (parsed.items || []).map(async (item) => {
        const [matches] = await db.query(
          'SELECT id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM foods WHERE name LIKE ? LIMIT 1',
          [`%${item.name}%`]
        );
        return {
          ...item,
          matched_food: matches[0] || null,
        };
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
      if (!item.food_id) continue;

      const [existing] = await db.query(
        'SELECT id FROM pantry WHERE user_id = ? AND food_id = ?',
        [req.user.id, item.food_id]
      );

      if (existing.length > 0) {
        await db.query('UPDATE pantry SET quantity = quantity + ? WHERE id = ?', [
          item.quantity || 1,
          existing[0].id,
        ]);
      } else {
        await db.query(
          'INSERT INTO pantry (user_id, food_id, quantity, unit) VALUES (?, ?, ?, ?)',
          [req.user.id, item.food_id, item.quantity || 1, item.unit || 'g']
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
