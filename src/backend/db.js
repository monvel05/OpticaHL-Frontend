const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'HL_Optica_Cloud',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
