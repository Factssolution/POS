// Supabase REST API adapter - replaces Sequelize on Vercel
const supabase = require('./supabase');

// Generic model factory
function createModel(tableName) {
  return {
    // Find all records
    findAll: async (options = {}) => {
      let query = supabase.from(tableName).select('*');
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          const val = options.where[key];
          if (val && val[Symbol.for('op')]) {
            // Handle Sequelize operators
            const op = val[Symbol.for('op')];
            if (op === 'in') query = query.in(key, val.values);
          } else {
            query = query.eq(key, val);
          }
        });
      }
      
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      if (options.order) {
        const [field, direction] = options.order[0];
        query = query.order(field, { ascending: direction === 'ASC' });
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },

    // Find one record
    findOne: async (options = {}) => {
      let query = supabase.from(tableName).select('*').limit(1);
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          const val = options.where[key];
          if (val && typeof val === 'object' && val[Symbol.for('op')] === 'in') {
            query = query.in(key, val.values);
          } else {
            query = query.eq(key, val);
          }
        });
      }
      
      const { data, error } = await query;
      if (error) return null;
      return data && data[0] ? data[0] : null;
    },

    // Find by primary key
    findByPk: async (id) => {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },

    // Create record
    create: async (data) => {
      const { data: result, error } = await supabase.from(tableName).insert(data).select().single();
      if (error) throw new Error(error.message);
      return result;
    },

    // Update records
    update: async (data, options = {}) => {
      let query = supabase.from(tableName).update(data);
      
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
      let query = supabase.from(tableName).delete();
      
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
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
      
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
      let query = supabase.from(tableName).select('*');
      
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          const val = options.where[key];
          if (val && typeof val === 'object' && val[Symbol.for('op')] === 'in') {
            query = query.in(key, val.values);
          } else {
            query = query.eq(key, val);
          }
        });
      }
      
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      if (options.order) {
        const [field, direction] = options.order[0];
        query = query.order(field, { ascending: direction === 'ASC' });
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      
      const countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
      if (options.where) {
        Object.keys(options.where).forEach(key => {
          countQuery.eq(key, options.where[key]);
        });
      }
      const { count } = await countQuery;
      
      return { rows: data || [], count: count || 0 };
    },

    // Bulk create
    bulkCreate: async (records, options = {}) => {
      const { data: result, error } = await supabase.from(tableName).insert(records).select();
      if (error) {
        if (options.updateOnDuplicate) {
          // Handle upsert
          const results = [];
          for (const record of records) {
            const { data, error: upsertErr } = await supabase.from(tableName).upsert(record).select();
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
      const { data: result, error } = await supabase.from(tableName).upsert(data).select().single();
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

// Sequelize Op symbol
const Op = {
  in: Symbol.for('op'),
};

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
  Op: {
    in: { [Symbol.for('op')]: 'in', values: null },
  },
};

// Helper to create IN operator
function createInOperator(values) {
  return { [Symbol.for('op')]: 'in', values };
}

module.exports.Op.in = createInOperator;
