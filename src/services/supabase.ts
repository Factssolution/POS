import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'pos-system@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
})

// Helper functions for common operations
export const db = {
  // Products
  products: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    getById: async (id) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    create: async (product) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
      if (error) throw error
      return data
    },
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      return data
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },

  // Orders
  orders: {
    getAll: async (filters: { startDate?: string; endDate?: string } = {}) => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    create: async (order) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
      if (error) throw error
      return data
    }
  },

  // Customers
  customers: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    create: async (customer) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
      if (error) throw error
      return data
    }
  },

  // Employees
  employees: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  },

  // Dashboard Stats
  getStats: async (startDate, endDate) => {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      start_date: startDate,
      end_date: endDate
    })
    if (error) throw error
    return data
  }
}

// Authentication helpers
export const auth = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    
    // Fetch user role from users table (handle gracefully if table doesn't exist or user not found)
    if (data.user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('email', email)
          .maybeSingle()  // Use maybeSingle() instead of single() to handle 0 rows
        
        if (userError) {
          // Table might not exist or other error - use auth metadata as fallback
          console.warn('Users table query failed, using auth metadata:', userError.message)
        } else if (userData) {
          // Attach user profile data to the auth response
          data.user.user_metadata = {
            ...data.user.user_metadata,
            name: userData.name || data.user.email?.split('@')[0],
            role: userData.role || 'Admin'  // Default to Admin if not found
          }
        } else {
          // User not in users table - use default values
          data.user.user_metadata = {
            ...data.user.user_metadata,
            name: data.user.email?.split('@')[0] || 'User',
            role: 'Admin'  // Default role
          }
        }
      } catch (e) {
        // Critical error - use fallback
        console.warn('Error fetching user profile, using defaults:', e)
        data.user.user_metadata = {
          ...data.user.user_metadata,
          name: data.user.email?.split('@')[0] || 'User',
          role: 'Admin'
        }
      }
    }
    
    return data
  },
  register: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

// Storage helpers
export const storage = {
  uploadReceipt: async (file, orderId) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `receipt-${orderId}-${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { data, error } = await supabase.storage
      .from('pos-files')
      .upload(filePath, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('pos-files')
      .getPublicUrl(filePath)
    
    return publicUrl
  },
  uploadProductImage: async (file, productId) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `product-${productId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { data, error } = await supabase.storage
      .from('pos-files')
      .upload(filePath, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('pos-files')
      .getPublicUrl(filePath)
    
    return publicUrl
  }
}

export default supabase
