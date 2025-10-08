const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Test connection first
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    console.log('Database connection successful!');
    
    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL statements (basic splitting by GO or semicolon)
    const statements = schemaSql
      .split(/\bGO\b|;/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await database.query(statement);
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if tables already exist, that's okay
          if (error.message.includes('already exists')) {
            console.log(`⚠ Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`✗ Statement ${i + 1} failed:`, error.message);
          }
        }
      }
    }
    
    console.log('Database initialization completed!');
    
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await database.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;