const fs = require('fs');
const path = require('path');
const database = require('./config/database');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Test connection first
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('Database connection successful!');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create_vendor_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL script...');
    const result = await database.query(sql);
    
    console.log('SQL script executed successfully!');
    console.log('Result:', result);
    
    // Test if vendors were inserted
    const vendorCheck = await database.query('SELECT COUNT(*) as count FROM Vendor');
    console.log(`Vendors in database: ${vendorCheck.recordset[0].count}`);
    
    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;