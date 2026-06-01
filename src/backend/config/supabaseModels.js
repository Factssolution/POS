// Supabase REST API adapter - replaces Sequelize on Vercel

// Sequelize Op symbols
const Op = {
  in: Symbol('op.in'),
  or: Symbol('op.or'),
  and: Symbol('op.and'),
  gt: Symbol('op.gt'),
  gte: Symbol('op.gte'),
  lt: Symbol('op.lt'),
  lte: Symbol('op.lte'),
  ne: Symbol('op.ne'),
  like: Symbol('op.like'),
  between: Symbol('op.between'),
};

// Helper to apply where clause to Supabase query
function applyWhere(query, where) {
  if (!where) return query;
  
  Object.keys(where).forEach(key => {
    const val = where[key];
    
    if (val === null || val === undefined) {
      query = query.is(key, null);
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      // Handle operators like { [Op.in]: [...] }
      if (val[Op.in]) {
        query = query.in(key, val[Op.in]);
      } else if (val[Op.or]) {
        // OR handled separately
      } else if (val[Op.gt]) {
        query = query.gt(key, val[Op.gt]);
      } else if (val[Op.gte]) {
        query = query.gte(key, val[Op.gte]);
      } else if (val[Op.lt]) {
        query = query.lt(key, val[Op.lt]);
      } else if (val[Op.lte]) {
        query = query.lte(key, val[Op.lte]);
      } else if (val[Op.ne]) {
        query = query.neq(key, val[Op.ne]);
      } else if (val[Op.like]) {
        query = query.like(key, val[Op.like]);
      } else if (val[Op.between]) {
        query = query.gte(key, val[Op.between][0]).lte(key, val[Op.between][1]);
      } else {
        // Plain object - eq
        query = query.eq(key, val);
      }
    } else {
      // Simple equality
      query = query.eq(key, val);
    }
  });
  
  return query;
}

// Generic model factory
function createModel(tableName) {
  let _supabase = null;
  const getSupabase = () => {
    if (!_supabase) {
      _supabase = require('./supabase');
    }
    return _supabase;
  };
  
  return {
    // Find all records
    findAll: async (options = {}) => {
      let query = getSupabase().from(tableName).select('*');
      query = applyWhere(query, options.where);
      
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      if (options.order) {
        const [field, direction] = options.order[0];
        query = query.order(field, { ascending: direction === 'ASC' });
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      // Add toJSON method to each record
      return (data || []).map(item => ({
        ...item,
        toJSON: () => item
      }));
    },

    // Find one record
    findOne: async (options = {}) => {
      let query = getSupabase().from(tableName).select('*').limit(1);
      query = applyWhere(query, options.where);
      
      const { data, error } = await query;
      if (error) return null;
      const item = data && data[0] ? data[0] : null;
      return item ? { ...item, toJSON: () => item } : null;
    },

    // Find by primary key
    findByPk: async (id) => {
      const { data, error } = await getSupabase().from(tableName).select('*').eq('id', id).single();
      if (error) return null;
      return data ? { ...data, toJSON: () => data } : null;
    },

    // Create record
    create: async (data) => {
      const { data: result, error } = await getSupabase().from(tableName).insert(data).select().single();
      if (error) throw new Error(error.message);
      return result;
    },

    // Update records
    update: async (data, options = {}) => {
      let query = getSupabase().from(tableName).update(data);
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      const { data: result, error } = await query.select();
      if (error) throw new Error(error.message);
      return [result ? result.length : 0, result || []];
    },

    // Delete records
    destroy: async (options = {}) => {
      let query = getSupabase().from(tableName).delete();
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      const { data: result, error } = await query;
      if (error) throw new Error(error.message);
      return result ? result.length : 0;
    },

    // Count records
    count: async (options = {}) => {
      let query = getSupabase().from(tableName).select('*', { count: 'exact', head: true });
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          query = query.eq(key, options.where[key]);
        });
      }
      
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count || 0;
    },

    // Find and count all
    findAndCountAll: async (options = {}) => {
      let query = getSupabase().from(tableName).select('*');
      query = applyWhere(query, options.where);
      
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      if (options.order) {
        const [field, direction] = options.order[0];
        query = query.order(field, { ascending: direction === 'ASC' });
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      
      const countQuery = getSupabase().from(tableName).select('*', { count: 'exact', head: true });
      applyWhere(countQuery, options.where);
      const { count } = await countQuery;
      
      // Add toJSON to each row
      const rows = (data || []).map(item => ({
        ...item,
        toJSON: () => item
      }));
      
      return { rows, count: count || 0 };
    },

    // Bulk create
    bulkCreate: async (records, options = {}) => {
      const { data: result, error } = await getSupabase().from(tableName).insert(records).select();
      if (error) {
        if (options.updateOnDuplicate) {
          // Handle upsert
          const results = [];
          for (const record of records) {
            const { data, error: upsertErr } = await getSupabase().from(tableName).upsert(record).select();
            if (!upsertErr && data) results.push(data[0]);
          }
          return results;
        }
        throw new Error(error.message);
      }
      return result || [];
    },

    // Upsert
    upsert: async (data) => {
      const { data: result, error } = await getSupabase().from(tableName).upsert(data).select().single();
      if (error) throw new Error(error.message);
      return result;
    },

    // Sync (no-op)
    sync: async () => {},

    // Lifecycle hooks (no-op)
    beforeCreate: () => {},
    beforeUpdate: () => {},
    beforeSave: () => {},
    afterCreate: () => {},
    afterUpdate: () => {},
    afterSave: () => {},
    beforeDestroy: () => {},
    afterDestroy: () => {},
    beforeBulkCreate: () => {},
    beforeBulkUpdate: () => {},
    beforeBulkDestroy: () => {},
    addHook: () => {},

    // Associations (no-op)
    belongsTo: () => createModel(tableName),
    hasMany: () => createModel(tableName),
    hasOne: () => createModel(tableName),
    belongsToMany: () => createModel(tableName),
  };
}

// Export models
module.exports = {
  User: createModel('users'),
  Product: createModel('products'),
  Category: createModel('categories'),
  Order: createModel('orders'),
  OrderItem: createModel('order_items'),
  Employee: createModel('employees'),
  Supplier: createModel('suppliers'),
  Transaction: createModel('transactions'),
  Settings: createModel('settings'),
  License: createModel('licenses'),
  AuditLog: createModel('audit_logs'),
  Tenant: createModel('tenants'),
  Expense: createModel('expenses'),
  Op,
};
