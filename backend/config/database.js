const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'VOS_DB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = await sql.connect(config);
        console.log('Connected to MSSQL Server');
      }
      return this.pool;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log('Disconnected from MSSQL Server');
      }
    } catch (error) {
      console.error('Error disconnecting from database:', error.message);
    }
  }

  async query(queryString, params = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();
      
      // Add parameters to the request
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
      
      const result = await request.query(queryString);
      return result;
    } catch (error) {
      console.error('Query execution failed:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.connect();
      const result = await this.query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new Database();