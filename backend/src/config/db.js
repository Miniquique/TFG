const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'smartfoodai',
  user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Verificar conexión al arrancar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err.message);
  });

module.exports = pool;
