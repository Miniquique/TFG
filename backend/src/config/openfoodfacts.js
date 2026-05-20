/**
 * Módulo de autenticación y peticiones a Open Food Facts
 * 
 * Utiliza las variables de entorno OFF_USER y OFF_PASSWORD para
 * autenticarse con la API de Open Food Facts mediante cookies de sesión.
 * Si no hay credenciales, las peticiones se hacen sin autenticación.
 */

const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'SmartFoodAI - WebApp - Version 1.0 - contact@smartfoodai.com';
const fetchCookie = require('fetch-cookie');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);
let sessionExpiry = 0;

// Duración de la sesión: 1 hora (renovar antes de expirar)
const SESSION_TTL_MS = 60 * 60 * 1000;

/**
 * Inicia sesión en Open Food Facts y guarda la cookie en el jar
 */
const login = async () => {
  const userId = process.env.OFF_USER;
  const password = process.env.OFF_PASSWORD;

  if (!userId || !password) {
    console.log('ℹ️ OFF: Sin credenciales configuradas (OFF_USER / OFF_PASSWORD), peticiones sin autenticar');
    return false;
  }

  try {
    console.log(`🔐 OFF: Iniciando sesión como "${userId}"...`);

    const response = await fetchWithCookies(`${OFF_BASE_URL}/cgi/session.pl`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user_id: userId,
        password: password,
      }),
      redirect: 'manual', // No seguir redirecciones para capturar cookies
    });

    const cookies = await jar.getCookies(OFF_BASE_URL);
    if (cookies.length > 0) {
      sessionExpiry = Date.now() + SESSION_TTL_MS;
      console.log('✅ OFF: Sesión iniciada correctamente');
      return true;
    }

    console.log('⚠️ OFF: Login exitoso pero no se recibieron cookies de sesión');
    return false;
  } catch (err) {
    console.error('❌ OFF: Error al iniciar sesión:', err.message);
    return false;
  }
};

/**
 * Comprueba si la sesión OFF sigue activa y la renueva si es necesario
 */
const ensureSession = async () => {
  if (!process.env.OFF_USER || !process.env.OFF_PASSWORD) {
    return false;
  }

  if (Date.now() < sessionExpiry) {
    return true;
  }

  return await login();
};

/**
 * Realiza una petición a Open Food Facts usando la jar de cookies
 * @param {string} url - URL completa de la petición
 * @param {object} options - Opciones adicionales de fetch
 * @returns {Response} - Respuesta de fetch
 */
const fetchOFF = async (url, options = {}) => {
  await ensureSession();

  const headers = {
    'User-Agent': USER_AGENT,
    ...options.headers,
  };

  return fetchWithCookies(url, {
    ...options,
    headers,
  });
};

/**
 * Busca productos en Open Food Facts
 * @param {string} searchTerms - Términos de búsqueda
 * @param {object} opts - Opciones: pageSize, fields
 * @returns {Array} - Lista de productos encontrados
 */
const searchProducts = async (searchTerms, opts = {}) => {
  const { pageSize = 10, fields = 'product_name,brands,nutriments,image_url' } = opts;

  const url = `${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&json=1&page_size=${pageSize}&fields=${fields}`;

  const response = await fetchOFF(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('La respuesta de OFF no es JSON válido');
  }

  const data = await response.json();
  return data.products || [];
};

module.exports = {
  fetchOFF,
  searchProducts,
  login,
  OFF_BASE_URL,
  USER_AGENT,
};
