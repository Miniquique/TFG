-- SmartFoodAI - Base de datos inicial
CREATE DATABASE IF NOT EXISTS smartfoodai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartfoodai;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'premium', 'user') NOT NULL DEFAULT 'user',
  avatar_url VARCHAR(255),
  daily_calorie_goal INT DEFAULT 2000,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  age INT,
  activity_level ENUM('sedentary','light','moderate','active','very_active') DEFAULT 'moderate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de alimentos (catálogo general)
CREATE TABLE IF NOT EXISTS foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(100),
  barcode VARCHAR(50) UNIQUE,
  calories_per_100g DECIMAL(7,2) NOT NULL DEFAULT 0,
  protein_per_100g DECIMAL(6,2) DEFAULT 0,
  carbs_per_100g DECIMAL(6,2) DEFAULT 0,
  fat_per_100g DECIMAL(6,2) DEFAULT 0,
  fiber_per_100g DECIMAL(6,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'g',
  category VARCHAR(80),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Despensa del usuario
CREATE TABLE IF NOT EXISTS pantry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'g',
  expiry_date DATE,
  location VARCHAR(80) DEFAULT 'despensa',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Lista de la compra
CREATE TABLE IF NOT EXISTS shopping_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  food_id INT,
  custom_name VARCHAR(150),
  quantity DECIMAL(8,2) DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'ud',
  checked BOOLEAN DEFAULT FALSE,
  scanned_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
);

-- Registro diario de comidas
CREATE TABLE IF NOT EXISTS daily_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 100,
  meal_type ENUM('desayuno','almuerzo','comida','merienda','cena','snack') DEFAULT 'comida',
  logged_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Menús generados por IA
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content JSON NOT NULL,
  total_calories DECIMAL(8,2),
  is_ai_generated BOOLEAN DEFAULT TRUE,
  week_start DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices de rendimiento
CREATE INDEX idx_pantry_user ON pantry(user_id);
CREATE INDEX idx_daily_log_user_date ON daily_log(user_id, logged_at);
CREATE INDEX idx_shopping_user ON shopping_list(user_id);
CREATE INDEX idx_menus_user ON menus(user_id);

-- Datos de prueba
-- Usuario admin: admin@smartfoodai.com / 123456
-- Hash bcrypt válido para '123456' con 10 rounds: $2b$10$8UNBdEQGxaJyw5Xp5y8OTewrLAB9rt1NVzpNxKZiAzF11HdNkXmoC
INSERT IGNORE INTO users (id, name, email, password, role, daily_calorie_goal) 
VALUES (1, 'Admin SmartFoodAI', 'admin@smartfoodai.com', '$2b$10$8UNBdEQGxaJyw5Xp5y8OTewrLAB9rt1NVzpNxKZiAzF11HdNkXmoC', 'admin', 2500);

-- Alimentos de ejemplo
INSERT INTO foods (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g) VALUES
('Pechuga de pollo', 'Carnes', 165, 31, 0, 3.6, 0),
('Arroz blanco cocido', 'Cereales', 130, 2.7, 28, 0.3, 0.4),
('Brócoli', 'Verduras', 34, 2.8, 7, 0.4, 2.6),
('Plátano', 'Frutas', 89, 1.1, 23, 0.3, 2.6),
('Huevo entero', 'Lácteos y huevos', 155, 13, 1.1, 11, 0),
('Leche entera', 'Lácteos y huevos', 61, 3.2, 4.8, 3.3, 0),
('Pan integral', 'Panadería', 247, 9, 41, 3.4, 6.5),
('Aceite de oliva', 'Grasas', 884, 0, 0, 100, 0),
('Tomate', 'Verduras', 18, 0.9, 3.9, 0.2, 1.2),
('Pasta cocida', 'Cereales', 131, 5, 25, 1.1, 1.8),
('Salmón', 'Pescados', 208, 20, 0, 13, 0),
('Espinacas', 'Verduras', 23, 2.9, 3.6, 0.4, 2.2),
('Almendras', 'Frutos secos', 579, 21, 22, 50, 12.5),
('Yogur natural', 'Lácteos y huevos', 59, 3.5, 4.7, 3.3, 0),
('Lentejas cocidas', 'Legumbres', 116, 9, 20, 0.4, 7.9);
