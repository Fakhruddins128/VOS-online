const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('first_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim()
    .escape(),
  
  body('last_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim()
    .escape(),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// User update validation (password is optional)
const validateUserUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('first_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim()
    .escape(),
  
  body('last_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim()
    .escape(),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
    .trim()
    .escape(),
  
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  
  handleValidationErrors
];

// Product update validation (all fields optional)
const validateProductUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters')
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim()
    .escape(),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
    .trim()
    .escape(),
  
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
    .toInt(),
  
  handleValidationErrors
];

// Query parameter validation for pagination and filtering
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .trim()
    .escape(),
  
  query('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
    .trim()
    .escape(),
  
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateUserUpdate,
  validateProduct,
  validateProductUpdate,
  validateId,
  validateQuery,
  handleValidationErrors
};