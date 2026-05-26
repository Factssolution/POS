const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    category: Joi.string().required(),
    price: Joi.number().min(0).required(),
    cost_price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).default(0),
    min_stock: Joi.number().integer().min(0).default(5),
    barcode: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  updateProduct: Joi.object({
    name: Joi.string(),
    description: Joi.string().allow('', null),
    category: Joi.string(),
    price: Joi.number().min(0),
    cost_price: Joi.number().min(0),
    stock: Joi.number().integer().min(0),
    min_stock: Joi.number().integer().min(0),
    barcode: Joi.string(),
    status: Joi.string().valid('active', 'inactive')
  }).min(1),

  // Employee schemas
  createEmployee: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().allow('', null),
    user_id: Joi.string().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  updateEmployee: Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email().allow('', null),
    user_id: Joi.string(),
    password: Joi.string().min(6),
    role: Joi.string(),
    status: Joi.string().valid('active', 'inactive')
  }).min(1),

  // Supplier schemas
  createSupplier: Joi.object({
    name: Joi.string().required(),
    contact: Joi.string().required(),
    email: Joi.string().email().allow('', null),
    address: Joi.string().allow('', null),
    gst_number: Joi.string().allow('', null),
    opening_balance: Joi.number().min(0).default(0),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),

  updateSupplier: Joi.object({
    name: Joi.string(),
    contact: Joi.string(),
    email: Joi.string().email().allow('', null),
    address: Joi.string().allow('', null),
    gst_number: Joi.string().allow('', null),
    opening_balance: Joi.number().min(0),
    status: Joi.string().valid('active', 'inactive')
  }).min(1),

  // Transaction schemas
  createTransaction: Joi.object({
    supplier_id: Joi.number().integer().required(),
    type: Joi.string().valid('credit', 'debit').required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().allow('', null)
  }),

  // Order schemas
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required(),
    customer_name: Joi.string().allow('', null),
    customer_phone: Joi.string().allow('', null),
    payment_method: Joi.string().valid('cash', 'card', 'upi', 'other').default('cash')
  }),

  // Settings schema
  updateSettings: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.object()
    )
  )
};

module.exports = { validate, schemas };
