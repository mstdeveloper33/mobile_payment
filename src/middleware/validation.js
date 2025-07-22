const { validationResult, body, param, query } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('phone')
    .isMobilePhone('tr-TR')
    .withMessage('Valid Turkish phone number is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters long'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Product description must be at least 10 characters long'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.address')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Address must be at least 10 characters long'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.zipCode')
    .trim()
    .matches(/^\d{5}$/)
    .withMessage('Valid 5-digit zip code is required'),
  handleValidationErrors
];

// Payment validation rules
const validatePayment = [
  body('orderId')
    .isUUID()
    .withMessage('Valid order ID is required'),
  body('paymentCard')
    .isObject()
    .withMessage('Payment card information is required'),
  body('paymentCard.cardHolderName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Card holder name is required'),
  body('paymentCard.cardNumber')
    .isCreditCard()
    .withMessage('Valid card number is required'),
  body('paymentCard.expireMonth')
    .isInt({ min: 1, max: 12 })
    .withMessage('Valid expire month is required'),
  body('paymentCard.expireYear')
    .isInt({ min: new Date().getFullYear() })
    .withMessage('Valid expire year is required'),
  body('paymentCard.cvc')
    .isLength({ min: 3, max: 4 })
    .isNumeric()
    .withMessage('Valid CVC is required'),
  handleValidationErrors
];

// Parameter validation
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateOrder,
  validatePayment,
  validateUUID,
  validatePagination,
  handleValidationErrors
}; 