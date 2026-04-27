# 🥗 SmartFoodAI

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-reverse_proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Open Food Facts](https://img.shields.io/badge/Open_Food_Facts-API-FF6F00?style=for-the-badge)

Aplicación web de gestión nutricional inteligente con IA. Escanea listas de la compra, gestiona tu despensa, controla tus macros diarios y genera menús semanales con inteligencia artificial.

## 🏗️ Arquitectura

```
smartfoodai/
├── docker-compose.yml           # Orquestación de contenedores
├── .env.example                 # Variables de entorno (copia a .env)
│
├── backend/                     # Node.js + Express API REST
│   ├── src/
│   │   ├── app.js               # Configuración Express
│   │   ├── server.js            # Punto de entrada
│   │   ├── config/
│   │   │   ├── db.js            # Pool MySQL
│   │   │   ├── init.sql         # Schema y datos iniciales
│   │   │   └── openfoodfacts.js # Conexión con Open Food Facts
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # JWT + autorización por roles
│   │   ├── controllers/        # Lógica de negocio
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── food.controller.js
│   │   │   ├── pantry.controller.js
│   │   │   ├── scanner.controller.js   # Claude Vision API
│   │   │   ├── dailyLog.controller.js
│   │   │   └── menu.controller.js      # Claude AI menús
│   │   └── routes/             # Rutas Express
│   └── Dockerfile
│
└── frontend/                   # React 18
    ├── public/
    ├── src/
    │   ├── App.jsx             # Router principal
    │   ├── contexts/
    │   │   └── AuthContext.jsx # Estado global de autenticación
    │   ├── services/
    │   │   └── api.js          # Axios + todos los endpoints
    │   ├── styles/
    │   │   └── global.css      # Variables CSS + estilos base
    │   └── components/
    │       ├── Auth/           # LoginPage (login + registro)
    │       ├── Layout/         # AppLayout + Sidebar
    │       ├── Dashboard/      # Contador calorías + macros
    │       ├── Pantry/         # Gestión de despensa
    │       ├── Scanner/        # Escáner lista de compra con IA
    │       ├── Menus/          # Generador de menús IA
    │       └── Profile/        # Perfil + panel admin
    ├── nginx.conf
    └── Dockerfile
```

## 🚀 Inicio rápido

### Requisitos
- Docker + Docker Compose
- (Opcional para desarrollo local) Node.js 20+, MySQL 8

### Con Docker (recomendado)

```bash
# 1. Clonar y entrar al proyecto
git clone <repo> && cd smartfoodai

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores (especialmente ANTHROPIC_API_KEY)

# 3. Levantar todos los servicios
docker-compose up -d

# 4. Acceder a la aplicación
# Frontend: http://localhost:3000
# API:      http://localhost:5000/api
```

### Desarrollo local

```bash
# Backend
cd backend && npm install
cp ../.env.example .env   # ajusta DB_HOST=localhost
npm run dev               # puerto 5000

# Frontend (en otra terminal)
cd frontend && npm install
REACT_APP_API_URL=http://localhost:5000/api npm start   # puerto 3000
```

## 🔐 Acceso inicial

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@smartfoodai.com | Admin1234! |

El administrador puede cambiar el rol de cualquier usuario desde **Perfil → Panel de administración**.

## 🗺️ Páginas

| Ruta | Descripción | Acceso |
|------|------------|--------|
| `/` | Dashboard: calorías diarias + macros | Todos |
| `/pantry` | Gestión de despensa | Todos |
| `/scanner` | Escáner de lista de la compra con IA | Todos |
| `/menus` | Generador de menús semanales con IA | Premium / Admin |
| `/profile` | Perfil personal + panel de admin | Todos (admin extra) |

## 🤖 IA integrada

- **Escáner**: usa `gemini-2.5-flash` con visión para leer listas de la compra manuscritas o impresas.
- **Generador de menús**: usa `gemini-2.5-flash` para crear planes semanales personalizados teniendo en cuenta la despensa del usuario, sus macros objetivo y preferencias alimentarias.

## 🛡️ Roles de usuario

| Rol | Escáner | Menús IA | Admin Panel |
|-----|---------|----------|-------------|
| `user` | ✅ | ❌ | ❌ |
| `premium` | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

Solo el administrador puede cambiar roles de usuario.

## 🐳 Despliegue en la nube

El proyecto está preparado para desplegarse en cualquier proveedor con soporte Docker:

- **AWS**: ECS + RDS MySQL
- **Google Cloud**: Cloud Run + Cloud SQL
- **Azure**: Container Apps + Azure Database for MySQL
- **DigitalOcean**: App Platform o Droplet con Docker Compose

Variables de entorno necesarias en producción:
```
MYSQL_ROOT_PASSWORD, MYSQL_USER, MYSQL_PASSWORD
JWT_SECRET (string largo y aleatorio)
ANTHROPIC_API_KEY
FRONTEND_URL (URL pública del frontend)
```

## 📡 Endpoints API

### Auth
- `POST /api/auth/login` — Iniciar sesión
- `POST /api/auth/register` — Registro
- `GET  /api/auth/me` — Usuario actual

### Despensa
- `GET    /api/pantry` — Listar despensa
- `POST   /api/pantry` — Añadir item
- `PUT    /api/pantry/:id` — Actualizar cantidad
- `DELETE /api/pantry/:id` — Eliminar item

### Escáner
- `POST /api/scanner/scan` — Procesar imagen con IA
- `POST /api/scanner/add-to-pantry` — Añadir escaneados

### Registro diario
- `GET    /api/daily-log?date=` — Registro del día
- `GET    /api/daily-log/stats?days=7` — Estadísticas semanales
- `POST   /api/daily-log` — Añadir entrada
- `DELETE /api/daily-log/:id` — Eliminar entrada

### Menús
- `GET    /api/menus` — Listar menús
- `POST   /api/menus/generate` — Generar con IA (premium)
- `DELETE /api/menus/:id` — Eliminar menú

### Usuarios (admin)
- `GET   /api/users` — Todos los usuarios
- `PATCH /api/users/:id/role` — Cambiar rol

## 🎨 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, React Router 6, CSS Modules |
| Gráficos | Recharts |
| Backend | Node.js, Express 4 |
| Base de datos | MySQL 8 |
| IA | Anthropic Claude (claude-opus-4-5) |
| Auth | JWT (jsonwebtoken) |
| Seguridad | Helmet, express-rate-limit, bcrypt |
| Infraestructura | Docker, Docker Compose, Nginx |
