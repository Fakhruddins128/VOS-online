const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
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

async function setupProductionDatabase() {
  let pool;
  
  try {
    console.log('Connecting to production database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!');

    // Check if tables exist
    const checkTablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'Vendor'
    `;
    
    const tablesResult = await pool.request().query(checkTablesQuery);
    
    if (tablesResult.recordset.length === 0) {
      console.log('Tables do not exist. Creating schema...');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by GO statements and execute each batch
      const batches = schemaSQL.split(/\bGO\b/gi).filter(batch => batch.trim());
      
      for (const batch of batches) {
        if (batch.trim()) {
          await pool.request().query(batch);
        }
      }
      
      console.log('Schema created successfully!');
    } else {
      console.log('Tables already exist. Skipping schema creation.');
    }

    // Test connection with a simple query
    const testResult = await pool.request().query('SELECT COUNT(*) as vendor_count FROM Vendor');
    console.log(`Database setup complete. Vendor count: ${testResult.recordset[0].vendor_count}`);

  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };