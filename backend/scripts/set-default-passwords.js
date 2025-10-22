const database = require('../config/database');
const crypto = require('crypto');

// Helper functions for password hashing (same as in users.js)
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

async function setDefaultPasswords() {
  const defaultPassword = 'Abcd@1234';
  
  try {
    console.log('Starting default password update for all vendors...');
    
    // Get all vendors
    const vendorsResult = await database.query('SELECT ID, BusinessEmail FROM Vendor');
    const vendors = vendorsResult.recordset;
    
    console.log(`Found ${vendors.length} vendors to update`);
    
    if (vendors.length === 0) {
      console.log('No vendors found in database');
      return;
    }
    
    // Update each vendor with default password
    for (const vendor of vendors) {
      const salt = generateSalt();
      const hashedPassword = hashPassword(defaultPassword, salt);
      
      await database.query(`
        UPDATE Vendor 
        SET Password = @hashedPassword, 
            Salt = @salt
        WHERE ID = @vendorId
      `, {
        hashedPassword,
        salt,
        vendorId: vendor.ID
      });
      
      console.log(`Updated password for vendor: ${vendor.BusinessEmail}`);
    }
    
    console.log('✅ Successfully updated default passwords for all vendors');
    console.log(`Default password: ${defaultPassword}`);
    console.log('All vendors can now login with this password');
    
  } catch (error) {
    console.error('❌ Error updating default passwords:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  setDefaultPasswords()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setDefaultPasswords };