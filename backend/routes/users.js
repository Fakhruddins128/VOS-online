const express = require('express');
const database = require('../config/database');
const router = express.Router();

// POST /api/users/login - Vendor login with BusinessEmail and password
router.post('/login', async (req, res) => {
  try {
    const { BusinessEmail, password } = req.body;
    console.log('Login attempt for:', BusinessEmail);
    
    // Validate input
    if (!BusinessEmail || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({
        success: false,
        error: 'BusinessEmail and password are required'
      });
    }
    
    // Find vendor by BusinessEmail using correct column names
    console.log('Querying database for vendor:', BusinessEmail);
    const result = await database.query(`
      SELECT * 
      FROM Vendor 
      WHERE BusinessEmail = @BusinessEmail
    `, { BusinessEmail });
    
    console.log('Database query result:', {
      recordCount: result.recordset.length,
      hasData: result.recordset.length > 0
    });
    
    if (result.recordset.length === 0) {
      console.log('Login failed: Vendor not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - vendor not found'
      });
    }
    
    const vendor = result.recordset[0];
    console.log('Full vendor object:', vendor);
    console.log('Found vendor:', {
      id: vendor.ID || vendor.id,
      email: vendor.BusinessEmail,
      companyName: vendor.CompanyName || vendor.companyName,
      isActive: vendor.Is_Active || vendor.is_active,
      hasPassword: !!(vendor.Password || vendor.password)
    });
    
    // Check if vendor is active (handle both cases)
    const isActive = vendor.Is_Active || vendor.is_active;
    if (!isActive) {
      console.log('Login failed: Vendor not active');
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }
    
    // Compare passwords (in production, use proper password hashing)
    console.log('Comparing passwords...');
    const vendorPassword = vendor.Password || vendor.password;
    if (vendorPassword !== password) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials - password mismatch'
      });
    }
    
    console.log('Login successful for:', BusinessEmail);
    
    // Remove password from response and map field names for frontend
    const { Password, password: pwd, ...vendorData } = vendor;
    
    // Map database field names to frontend expected field names
    const mappedVendorData = {
      ...vendorData,
      ID: vendorData.ID || vendorData.id, // Ensure ID is preserved
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
    console.log('Fetching all vendors from database...');
    const result = await database.query('SELECT BusinessEmail, CompanyName, Is_Active FROM Vendor');
    
    console.log('Found vendors:', result.recordset.length);
    
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

module.exports = router;