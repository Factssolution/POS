// Minimal API handler - PROXY to Supabase for Vercel serverless
// Handles legacy API calls by forwarding to Supabase
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: supabase ? 'OK' : 'DEGRADED', 
    message: 'POS Backend API - Supabase Proxy Mode',
    timestamp: new Date().toISOString(),
    mode: 'serverless-supabase-proxy',
    database: supabase ? 'supabase-connected' : 'supabase-missing-key'
  });
});

// Proxy API routes to Supabase
app.all('/api/v1/*', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      message: 'Supabase client not configured'
    });
  }

  try {
    const path = req.path.replace('/api/v1/', '');
    const parts = path.split('/');
    const resource = parts[0];
    const id = parts[1];
    const method = req.method;

    let result;

    switch(resource) {
      case 'products':
        if (method === 'GET' && !id) {
          result = await supabase.from('products').select('*').eq('status', 'active');
        } else if (method === 'GET' && id) {
          result = await supabase.from('products').select('*').eq('id', id).single();
        }
        break;

      case 'employees':
      case 'users':
        if (method === 'GET' && !id) {
          result = await supabase.from('users').select('*');
        }
        break;

      case 'suppliers':
        if (method === 'GET' && !id) {
          result = await supabase.from('suppliers').select('*');
        }
        break;

      case 'categories':
        if (method === 'GET' && !id) {
          result = await supabase.from('categories').select('*');
        }
        break;

      case 'transactions':
        if (method === 'GET') {
          result = await supabase.from('transactions').select('*');
        }
        break;

      case 'expenses':
        if (method === 'GET') {
          result = await supabase.from('expenses').select('*');
        }
        break;

      case 'orders':
        if (method === 'GET') {
          result = await supabase.from('orders').select('*, order_items(*)');
        }
        break;

      default:
        result = { data: null, error: { message: 'Resource not found' } };
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error.message
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use('/uploads', (req, res) => {
  res.status(501).json({
    message: 'File uploads not available in serverless mode'
  });
});

module.exports = app;
