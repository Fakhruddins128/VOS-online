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
};

async function backupDatabase() {
  let pool;
  
  try {
    console.log('Connecting to production database for backup...');
    pool = await sql.connect(config);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Export Vendor table data
    const vendorData = await pool.request().query('SELECT * FROM Vendor');
    const backupFile = path.join(backupDir, `vendor-backup-${timestamp}.json`);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      database: process.env.DB_DATABASE,
      tables: {
        vendor: vendorData.recordset
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup created successfully: ${backupFile}`);
    
    // Also create SQL backup
    const sqlBackupFile = path.join(backupDir, `vendor-backup-${timestamp}.sql`);
    let sqlContent = `-- Database backup created on ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${process.env.DB_DATABASE}\n\n`;
    
    sqlContent += `-- Vendor table backup\n`;
    sqlContent += `DELETE FROM Vendor;\n`;
    
    for (const row of vendorData.recordset) {
      const values = Object.values(row).map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return val;
      }).join(', ');
      
      sqlContent += `INSERT INTO Vendor VALUES (${values});\n`;
    }
    
    fs.writeFileSync(sqlBackupFile, sqlContent);
    console.log(`SQL backup created successfully: ${sqlBackupFile}`);
    
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };