const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// NOTA: Asegúrate de que GOOGLE_API_KEY está en tu .env para usar Gemini
const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

// Menús de demostración - Ejemplos permanentes que se usan cuando no hay API key
const demoMenus = [
  {
    name: 'Saludable & Proteína',
    meals: {
      desayuno: {
        name: 'Avena con frutas y miel',
        description: 'Tazón de avena integral (50g) con plátano, fresas y una cucharada de miel',
        calories: 350
      },
      almuerzo: {
        name: 'Ensalada de pollo',
        description: 'Pechuga de pollo a la plancha (150g), lechuga, tomate, cebolla y aceite de oliva',
        calories: 420
      },
      comida: {
        name: 'Pasta integral con verduras',
        description: 'Pasta integral (80g cocida), salsa de tomate casera, zucchini y champiñones salteados',
        calories: 550
      },
      merienda: {
        name: 'Yogur natural con granola',
        description: 'Yogur natural (150g) sin azúcar con granola casera (30g)',
        calories: 220
      },
      cena: {
        name: 'Salmón con vegetales',
        description: 'Filete de salmón (120g) al horno con brócoli y batata asada (150g)',
        calories: 480
      }
    },
    totalCalories: 2020
  },
  {
    name: 'Mediterráneo & Ligero',
    meals: {
      desayuno: {
        name: 'Tostadas integrales con tomate y aceite',
        description: '2 rebanadas de pan integral tostado con tomate fresco y aceite de oliva virgen',
        calories: 280
      },
      almuerzo: {
        name: 'Hummus con verduras crudas',
        description: 'Hummus casero (100g), zanahoria, pepino, pimiento rojo y apio',
        calories: 350
      },
      comida: {
        name: 'Lentejas con vegetales',
        description: 'Lentejas cocidas (150g) con cebolla, ajo, espinaca y especias',
        calories: 480
      },
      merienda: {
        name: 'Frutos secos y fruta',
        description: 'Almendras (30g) y una manzana mediana',
        calories: 260
      },
      cena: {
        name: 'Dorada a la sal',
        description: 'Dorada al horno (150g) con limón, sal y hierbas aromáticas',
        calories: 400
      }
    },
    totalCalories: 1770
  },
  {
    name: 'Vegetariano & Energético',
    meals: {
      desayuno: {
        name: 'Batido verde smoothie',
        description: 'Espinaca, plátano, leche de almendra, proteína de vainilla',
        calories: 320
      },
      almuerzo: {
        name: 'Garbanzos tostados',
        description: 'Garbanzos asados con especias (150g), brócoli y arroz integral',
        calories: 480
      },
      comida: {
        name: 'Tofu salteado con verduras',
        description: 'Tofu firme (200g) salteado con setas, pimientos y salsa de soja baja en sodio',
        calories: 520
      },
      merienda: {
        name: 'Snack proteico',
        description: 'Barrita de proteína de cereales o edamame salteado (100g)',
        calories: 200
      },
      cena: {
        name: 'Curry de verduras',
        description: 'Curry casero con coliflor, zanahoria, guisantes y leche de coco light',
        calories: 380
      }
    },
    totalCalories: 1900
  },
  {
    name: 'Fitness & Músculo',
    meals: {
      desayuno: {
        name: 'Tortilla de claras con tostadas',
        description: '3 claras de huevo con queso bajo en grasa, 2 tostadas integrales',
        calories: 380
      },
      almuerzo: {
        name: 'Pechuga de pollo con arroz',
        description: 'Pechuga de pollo (200g) al horno, arroz blanco (150g cocido) y judías verdes',
        calories: 550
      },
      comida: {
        name: 'Atún con batata',
        description: 'Lata de atún en agua (120g), batata asada (200g) y espárragos a la plancha',
        calories: 420
      },
      merienda: {
        name: 'Proteína con plátano',
        description: 'Batido de proteína con leche desnatada, plátano y mantequilla de cacahuete',
        calories: 380
      },
      cena: {
        name: 'Ternera magra con brocoli',
        description: 'Filete de ternera (180g) a la plancha, brócoli y patata cocida (100g)',
        calories: 520
      }
    },
    totalCalories: 2250
  }
];

const getDemoMenu = (days = 7, userData) => {
  // Seleccionar un menú aleatorio de los ejemplos
  const menuEjemplo = demoMenus[Math.floor(Math.random() * demoMenus.length)];
  
  return {
    title: `Menú Semanal ${menuEjemplo.name} - ${userData.name}`,
    description: `Plan nutricional personalizado de ${days} días con objetivo de ${userData.daily_calorie_goal} kcal/día`,
    days: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      day_name: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i % 7],
      meals: menuEjemplo.meals,
      total_calories: menuEjemplo.totalCalories
    })),
    avg_daily_calories: menuEjemplo.totalCalories
  };
};

// GET /api/menus
const getMenus = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, description, total_calories, is_ai_generated, week_start, created_at FROM menus WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/menus/:id
const getMenuById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM menus WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Menú no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/menus/generate
const generateMenu = async (req, res, next) => {
  try {
    const { days = 7, preferences = '', exclude = '' } = req.body;

    const [user] = await db.query(
      'SELECT name, daily_calorie_goal FROM users WHERE id = ?',
      [req.user.id]
    );
    const userData = user[0];

    let menuData = getDemoMenu(days, userData);

    if (genAI) {
      try {
        console.log('📊 Generando menú con IA (Google Gemini)...');
        
        const [pantryItems] = await db.query(
          `SELECT f.name, p.quantity, p.unit FROM pantry p JOIN foods f ON f.id = p.food_id WHERE p.user_id = ?`,
          [req.user.id]
        );
        const pantryList = pantryItems.map((i) => `${i.name} (${i.quantity}${i.unit})`).join(', ');

        const prompt = `Eres un nutricionista experto. Crea un menú semanal de ${days} días para:
- Nombre: ${userData.name}
- Objetivo calórico diario: ${userData.daily_calorie_goal} kcal
- Preferencias: ${preferences || 'ninguna'}
- Alimentos a evitar: ${exclude || 'ninguno'}
- Ingredientes disponibles en despensa: ${pantryList || 'no especificado'}

Devuelve ÚNICAMENTE un JSON con este formato exacto:
{
  "title": "Menú semanal SmartFoodAI",
  "description": "breve descripción",
  "days": [
    {
      "day": 1,
      "day_name": "Lunes",
      "meals": {
        "desayuno": { "name": "nombre", "description": "ingredientes y preparación breve", "calories": 000 },
        "almuerzo": { "name": "nombre", "description": "...", "calories": 000 },
        "comida": { "name": "nombre", "description": "...", "calories": 000 },
        "merienda": { "name": "nombre", "description": "...", "calories": 000 },
        "cena": { "name": "nombre", "description": "...", "calories": 000 }
      },
      "total_calories": 0000
    }
  ],
  "avg_daily_calories": 0000
}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text() || '{}';
        
        try {
          const clean = text.replace(/```json|```/g, '').trim();
          menuData = JSON.parse(clean);
          console.log('✅ Menú generado con IA exitosamente');
        } catch {
          console.log('⚠️ Error al parsear respuesta de IA, usando menú de demostración');
        }
      } catch (err) {
        console.log(`⚠️ Error con Google Gemini API: ${err.message}, usando menú de demostración`);
      }
    } else {
      console.log('📋 Usando menú de demostración (sin API key de Google)');
    }

    const isAiGenerated = !!genAI;
    const [result] = await db.query(
      'INSERT INTO menus (user_id, title, description, content, total_calories, is_ai_generated, week_start) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [req.user.id, menuData.title, menuData.description, JSON.stringify(menuData), menuData.avg_daily_calories, isAiGenerated]
    );

    res.status(201).json({ id: result.insertId, ...menuData });
  } catch (err) {
    next(err);
  }
};

// GET /api/menus/templates
// Obtener lista de menús disponibles para seleccionar manualmente
const getMenuTemplates = async (req, res, next) => {
  try {
    const templates = demoMenus.map((menu, idx) => ({
      id: idx,
      name: menu.name,
      totalCalories: menu.totalCalories,
      meals: Object.keys(menu.meals).length
    }));
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

// POST /api/menus/select-template
// Seleccionar un menú template específico y guardarlo
const selectMenuTemplate = async (req, res, next) => {
  try {
    const { templateId, days = 7 } = req.body;
    
    if (templateId === undefined || templateId < 0 || templateId >= demoMenus.length) {
      return res.status(400).json({ error: 'ID de template inválido' });
    }

    const [user] = await db.query(
      'SELECT name, daily_calorie_goal FROM users WHERE id = ?',
      [req.user.id]
    );
    const userData = user[0];

    const menuTemplate = demoMenus[templateId];
    const menuData = {
      title: `Menú Semanal ${menuTemplate.name} - ${userData.name}`,
      description: `Plan nutricional personalizado de ${days} días con objetivo de ${userData.daily_calorie_goal} kcal/día`,
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        day_name: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i % 7],
        meals: menuTemplate.meals,
        total_calories: menuTemplate.totalCalories
      })),
      avg_daily_calories: menuTemplate.totalCalories
    };

    const [result] = await db.query(
      'INSERT INTO menus (user_id, title, description, content, total_calories, is_ai_generated, week_start) VALUES (?, ?, ?, ?, ?, ?, CURDATE())',
      [req.user.id, menuData.title, menuData.description, JSON.stringify(menuData), menuData.avg_daily_calories, false]
    );

    res.status(201).json({ id: result.insertId, ...menuData });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/menus/:id
const deleteMenu = async (req, res, next) => {
  try {
    await db.query('DELETE FROM menus WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Menú eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenus, getMenuById, generateMenu, getMenuTemplates, selectMenuTemplate, deleteMenu };
