module.exports = {
  secret: process.env.JWT_SECRET || 'pos_system_super_secret_jwt_key_2025_change_in_production',
  expire: process.env.JWT_EXPIRE || '7d'
};
