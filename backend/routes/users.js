const express = require('express');
const database = require('../config/database');
const router = express.Router();
const crypto = require('crypto');

// Dev-only logger
const debugLog = (...args) => { if (process.env.NODE_ENV !== 'production') console.log(...args); };

// Helper functions for password hashing
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// POST /api/users/login - Vendor login with BusinessEmail and password
router.post('/login', async (req, res) => {
  try {
    const { BusinessEmail, password } = req.body;
    debugLog('Login attempt for:', BusinessEmail);
    
    // Validate input
    if (!BusinessEmail || !password) {
      debugLog('Login failed: Missing credentials');
      return res.status(400).json({
        success: false,
        error: 'BusinessEmail and password are required'
      });
    }
    
    // Find vendor by BusinessEmail using correct column names
    debugLog('Querying database for vendor:', BusinessEmail);
    const result = await database.query(`
      SELECT * 
      FROM Vendor 
      WHERE BusinessEmail = @BusinessEmail
    `, { BusinessEmail });
    
    debugLog('Database query result:', {
      recordCount: result.recordset.length,
      hasData: result.recordset.length > 0
    });
    
    if (result.recordset.length === 0) {
      debugLog('Login failed: Vendor not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - vendor not found'
      });
    }
    
    const vendor = result.recordset[0];
    debugLog('Full vendor object:', vendor);
    debugLog('Found vendor:', {
      id: vendor.ID || vendor.id,
      email: vendor.BusinessEmail,
      companyName: vendor.CompanyName || vendor.companyName,
      isActive: vendor.Is_Active || vendor.is_active,
      hasPassword: !!(vendor.Password || vendor.password),
      hasSalt: !!(vendor.Salt || vendor.salt)
    });
    
    // Check if vendor is active (handle both cases)
    const isActive = vendor.Is_Active || vendor.is_active;
    if (!isActive) {
      debugLog('Login failed: Vendor not active');
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }
    
    // Compare passwords using salted PBKDF2 hashing if salt exists; otherwise fallback
    debugLog('Comparing passwords securely...');
    const vendorPassword = vendor.Password ?? vendor.password;
    const vendorSalt = vendor.Salt ?? vendor.salt;

    let isMatch = false;
    if (vendorSalt) {
      const hashedInput = hashPassword(password, vendorSalt);
      isMatch = vendorPassword === hashedInput;
    } else {
      // Fallback for legacy records without salt
      isMatch = vendorPassword === password;
    }

    if (!isMatch) {
      debugLog('Login failed: Password mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - password mismatch'
      });
    }
    
    debugLog('Login successful for:', BusinessEmail);
    
    // Remove password from response and map field names for frontend
    const { Password, password: pwd, Salt, salt, ...vendorData } = vendor;
    
    // Map database field names to frontend expected field names
    const mappedVendorData = {
      ...vendorData,
      ID: vendorData.ID || vendorData.id,
      VendorName: vendorData.CompanyName,
      ContactPerson: vendorData.Ref_Name,
      PhoneNumber: vendorData.BusinessPhone,
      Address: vendorData.Address,
      BusinessEmail: vendorData.BusinessEmail,
      created_at: vendorData.Since
    };
    
    res.json({
      success: true,
      data: mappedVendorData,
      message: 'Vendor login successful'
    });
  } catch (error) {
    console.error('Error during vendor login:', error);
    res.status(500).json({
      success: false,
      error: 'Vendor login failed: ' + error.message
    });
  }
});

// GET /api/users/vendors - List all vendors (for debugging)
router.get('/vendors', async (req, res) => {
  try {
    debugLog('Fetching all vendors from database...');
    const result = await database.query('SELECT BusinessEmail, CompanyName, Is_Active FROM Vendor');
    
    debugLog('Found vendors:', result.recordset.length);
    
    res.json({
      success: true,
      vendors: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors',
      details: error.message
    });
  }
});

// Add Change Password endpoint
router.post('/change-password', async (req, res) => {
  try {
    const { BusinessEmail, oldPassword, newPassword } = req.body;

    if (!BusinessEmail || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'BusinessEmail, oldPassword, and newPassword are required'
      });
    }

    // Server-side password policy
    const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!policyRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      });
    }
    if (newPassword === oldPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from old password'
      });
    }

    // Fetch vendor
    const result = await database.query(`
      SELECT * FROM Vendor WHERE BusinessEmail = @BusinessEmail
    `, { BusinessEmail });

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    const vendor = result.recordset[0];
    const isActive = vendor.Is_Active || vendor.is_active;
    if (!isActive) {
      return res.status(401).json({ success: false, error: 'Account is not active' });
    }

    // Verify old password
    const currentHash = vendor.Password ?? vendor.password;
    const currentSalt = vendor.Salt ?? vendor.salt;

    let oldMatches = false;
    if (currentSalt) {
      oldMatches = currentHash === hashPassword(oldPassword, currentSalt);
    } else {
      oldMatches = currentHash === oldPassword;
    }

    if (!oldMatches) {
      return res.status(401).json({ success: false, error: 'Old password is incorrect' });
    }

    // Generate new salt and hash
    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);

    // Update in database
    await database.query(`
      UPDATE Vendor SET Password = @Password, Salt = @Salt
      WHERE BusinessEmail = @BusinessEmail
    `, { Password: newHash, Salt: newSalt, BusinessEmail });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, error: 'Failed to change password: ' + error.message });
  }
});

module.exports = router;