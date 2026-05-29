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

// Proxy API routes to Supabase - NO AUTH REQUIRED (frontend uses Supabase auth directly)
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
    const subResource = parts[2];
    const method = req.method;

    let result;

    switch(resource) {
      case 'products':
        if (method === 'GET' && !id) {
          result = await supabase.from('products').select('*');
        } else if (method === 'GET' && id) {
          result = await supabase.from('products').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          result = await supabase.from('products').insert(req.body).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          result = await supabase.from('products').update(req.body).eq('id', id).select().single();
        } else if (method === 'DELETE') {
          result = await supabase.from('products').delete().eq('id', id);
        }
        break;

      case 'employees':
      case 'users':
        if (method === 'GET' && !id) {
          result = await supabase.from('users').select('*');
        } else if (method === 'GET' && id) {
          result = await supabase.from('users').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          result = await supabase.from('users').insert(req.body).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          result = await supabase.from('users').update(req.body).eq('id', id).select().single();
        } else if (method === 'DELETE') {
          result = await supabase.from('users').delete().eq('id', id);
        }
        break;

      case 'suppliers':
        if (method === 'GET' && !id) {
          result = await supabase.from('suppliers').select('*');
        } else if (method === 'GET' && id) {
          result = await supabase.from('suppliers').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          result = await supabase.from('suppliers').insert(req.body).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          result = await supabase.from('suppliers').update(req.body).eq('id', id).select().single();
        } else if (method === 'DELETE') {
          result = await supabase.from('suppliers').delete().eq('id', id);
        }
        break;

      case 'categories':
        if (subResource === 'stats') {
          result = await supabase.from('categories').select('*');
        } else if (method === 'GET' && !id) {
          result = await supabase.from('categories').select('*');
        } else if (method === 'GET' && id) {
          result = await supabase.from('categories').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          result = await supabase.from('categories').insert(req.body).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          result = await supabase.from('categories').update(req.body).eq('id', id).select().single();
        } else if (method === 'DELETE') {
          result = await supabase.from('categories').delete().eq('id', id);
        }
        break;

      case 'transactions':
        if (method === 'GET') {
          result = await supabase.from('transactions').select('*');
        } else if (method === 'POST') {
          result = await supabase.from('transactions').insert(req.body).select().single();
        }
        break;

      case 'expenses':
        if (subResource === 'stats') {
          result = await supabase.from('expenses').select('*');
        } else if (method === 'GET') {
          result = await supabase.from('expenses').select('*');
        } else if (method === 'POST') {
          result = await supabase.from('expenses').insert(req.body).select().single();
        }
        break;

      case 'orders':
        if (method === 'GET') {
          result = await supabase.from('orders').select('*, order_items(*)');
        } else if (method === 'POST') {
          result = await supabase.from('orders').insert(req.body).select().single();
        }
        break;

      case 'reports':
        if (id === 'sales') {
          result = await supabase.from('orders').select('*');
        } else if (id === 'customers') {
          result = await supabase.from('customers').select('*');
        } else if (id === 'profit-loss') {
          result = await supabase.from('orders').select('*');
        } else {
          result = await supabase.from('orders').select('*');
        }
        break;

      case 'settings':
        if (method === 'GET') {
          result = await supabase.from('settings').select('*');
        } else if (method === 'POST' || method === 'PUT') {
          result = await supabase.from('settings').upsert(req.body).select().single();
        }
        break;

      default:
        result = { data: [], error: null };
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error.message
      });
    }

    // Wrap in expected response format
    const responseData = result.data || [];
    res.json({
      success: true,
      data: Array.isArray(responseData) ? responseData : [responseData],
      count: Array.isArray(responseData) ? responseData.length : 1
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.use('/uploads', (req, res) => {
  res.status(501).json({
    message: 'File uploads not available in serverless mode'
  });
});

module.exports = app;
