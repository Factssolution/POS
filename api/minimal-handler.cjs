// Minimal API handler - PROXY to Supabase for Vercel serverless
// Handles legacy API calls by forwarding to Supabase
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Initialize Supabase client with ANON KEY
// IMPORTANT: If you get "Invalid API key" or RLS errors, you need to:
// 1. Go to Supabase Dashboard > Project Settings > API
// 2. Copy the "service_role key (secret)" 
// 3. Replace the anon key below with the service_role key
// OR disable RLS on tables: ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hfusrtiqjyiotjewzzkt.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdXNydGlxanlpb3RqZXd6emt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDExODYsImV4cCI6MjA5NTM3NzE4Nn0.Hihh9K0B1WIsZxlIZBEBfIp9ouUL3ZkG3cpnrfxOEdM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'POS Backend API - Supabase Proxy Mode',
    timestamp: new Date().toISOString(),
    mode: 'serverless-supabase-proxy',
    database: 'supabase-connected'
  });
});

// Proxy API routes to Supabase - NO AUTH REQUIRED (frontend uses Supabase auth directly)
app.all('/api/v1/*', async (req, res) => {
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
        // Handle /products/categories as a separate route
        if (id === 'categories') {
          result = await supabase.from('categories').select('*').eq('is_active', true);
        } else if (method === 'GET' && !id) {
          result = await supabase.from('products').select('*');
        } else if (method === 'GET' && id) {
          result = await supabase.from('products').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          // Check for duplicate products by SKU or name
          if (req.body.sku) {
            const { data: existingSku } = await supabase
              .from('products')
              .select('id')
              .eq('sku', req.body.sku)
              .single();
            
            if (existingSku) {
              return res.status(409).json({
                success: false,
                message: `Product with SKU '${req.body.sku}' already exists`
              });
            }
          }
          
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
          // Check for duplicate supplier by name
          const { data: existingSupplier } = await supabase
            .from('suppliers')
            .select('id')
            .eq('name', req.body.name)
            .single();
          
          if (existingSupplier) {
            return res.status(409).json({
              success: false,
              message: `Supplier '${req.body.name}' already exists`
            });
          }
          
          result = await supabase.from('suppliers').insert(req.body).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          result = await supabase.from('suppliers').update(req.body).eq('id', id).select().single();
        } else if (method === 'DELETE') {
          result = await supabase.from('suppliers').delete().eq('id', id);
        }
        break;

      case 'categories':
        if (subResource === 'stats') {
          const { data: cats } = await supabase.from('categories').select('*');
          result = {
            data: {
              stats: cats || [],
              total_categories: (cats || []).length,
              active_categories: (cats || []).filter(c => c.is_active).length
            },
            error: null
          };
        } else if (method === 'GET' && !id) {
          // Get all categories with detailed logging
          const queryResult = await supabase.from('categories').select('*');
          console.log('📊 Categories Query Result:', {
            hasError: !!queryResult.error,
            errorMessage: queryResult.error?.message,
            dataCount: queryResult.data?.length || 0,
            firstItem: queryResult.data?.[0]
          });
          result = queryResult;
        } else if (method === 'GET' && id) {
          result = await supabase.from('categories').select('*').eq('id', id).single();
        } else if (method === 'POST') {
          // Map frontend fields to Supabase schema
          const categoryData = {
            name: req.body.name,
            description: req.body.description || null,
            parent_id: req.body.parent_id || null,
            is_active: req.body.status === 'active' || req.body.is_active !== false
          };
          
          // Check if category with same name already exists
          const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('name', req.body.name)
            .single();
          
          if (existing) {
            return res.status(409).json({
              success: false,
              message: `Category '${req.body.name}' already exists`,
              data: existing
            });
          }
          
          result = await supabase.from('categories').insert(categoryData).select().single();
        } else if (method === 'PUT' || method === 'PATCH') {
          const categoryData = {
            name: req.body.name,
            description: req.body.description,
            parent_id: req.body.parent_id,
            is_active: req.body.status === 'active' || req.body.is_active !== false
          };
          result = await supabase.from('categories').update(categoryData).eq('id', id).select().single();
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
          const { data: exp } = await supabase.from('expenses').select('amount, category');
          const totalAmount = (exp || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          result = {
            data: {
              total_expenses: totalAmount,
              by_category: (exp || []).reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
                return acc;
              }, {})
            },
            error: null
          };
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
          // Settings table may not exist, return empty array
          try {
            result = await supabase.from('settings').select('*');
            if (result.error && result.error.message.includes('Could not find')) {
              result = { data: [], error: null };
            }
          } catch (e) {
            result = { data: [], error: null };
          }
        } else if (method === 'POST' || method === 'PUT') {
          // Try to upsert, if table doesn't exist just return success
          try {
            result = await supabase.from('settings').upsert(req.body).select().single();
            if (result.error && result.error.message.includes('Could not find')) {
              result = { data: req.body, error: null };
            }
          } catch (e) {
            result = { data: req.body, error: null };
          }
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

    // Wrap in expected response format based on resource type
    let responseData = result.data || [];
    
    // Special handling for categories - map Supabase schema to frontend expected format
    if (resource === 'categories' && Array.isArray(responseData)) {
      responseData = responseData.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || null,
        color: '#3B82F6', // Default color
        icon: '', // Default icon
        status: cat.is_active ? 'active' : 'inactive',
        sort_order: 0,
        product_count: 0,
        created_at: cat.created_at,
        updated_at: cat.created_at
      }));
    }
    
    // Special handling for category stats
    if (resource === 'categories' && subResource === 'stats') {
      responseData = result.data; // Already formatted
    }
    
    // Different resources expect different response formats
    if (resource === 'categories') {
      // Categories endpoint expects { categories: [], count: X }
      res.json({
        success: true,
        categories: Array.isArray(responseData) ? responseData : [],
        count: Array.isArray(responseData) ? responseData.length : 0
      });
    } else if (resource === 'products') {
      // Products endpoint expects { products: [], count: X }
      res.json({
        success: true,
        products: Array.isArray(responseData) ? responseData : [],
        count: Array.isArray(responseData) ? responseData.length : 0
      });
    } else {
      // Generic format for other resources
      res.json({
        success: true,
        data: Array.isArray(responseData) ? responseData : [responseData],
        count: Array.isArray(responseData) ? responseData.length : 1
      });
    }
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
