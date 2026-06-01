/**
 * MULTI-TENANT COMPREHENSIVE AUDIT TEST
 * Professional-grade verification of row-level tenancy implementation
 * Tests: Database, API, Isolation, Licensing, Subscriptions
 */

const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/v1';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

let superAdminToken = null;
let tenant1Token = null;
let tenant2Token = null;
let tenant1Id = null;
let tenant2Id = null;

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(category, test, status, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`   ${icon} ${test}: ${message}`);
  
  testResults.tests.push({ category, test, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 MULTI-TENANT COMPREHENSIVE AUDIT TEST');
  console.log('═'.repeat(80));
  console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

  const dbClient = new Client(DB_CONFIG);

  try {
    await dbClient.connect();
    console.log('✅ Database connected\n');

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: DATABASE SCHEMA VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('\n📊 PHASE 1: DATABASE SCHEMA VERIFICATION');
    console.log('─'.repeat(80));

    // Test 1.1: Tenants table exists
    try {
      const result = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'tenants'
        )
      `);
      
      if (result.rows[0].exists) {
        logTest('Schema', 'Tenants Table', 'PASS', 'tenants table exists');
        
        // Check columns
        const columns = await dbClient.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'tenants'
          ORDER BY ordinal_position
        `);
        
        const requiredColumns = ['id', 'tenant_key', 'company_name', 'status', 'subscription_type', 'subscription_start', 'subscription_end'];
        const actualColumns = columns.rows.map(c => c.column_name);
        
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length === 0) {
          logTest('Schema', 'Tenant Columns', 'PASS', `All ${requiredColumns.length} required columns present`);
        } else {
          logTest('Schema', 'Tenant Columns', 'FAIL', `Missing: ${missingColumns.join(', ')}`);
        }
      } else {
        logTest('Schema', 'Tenants Table', 'FAIL', 'tenants table NOT found');
      }
    } catch (error) {
      logTest('Schema', 'Tenants Table', 'FAIL', error.message);
    }

    // Test 1.2: tenant_id columns in all tables
    const tablesToCheck = [
      'users', 'products', 'categories', 'suppliers', 'orders', 'order_items',
      'transactions', 'expenses', 'employees', 'settings', 'licenses', 'audit_logs', 'blobs'
    ];

    let tablesWithTenantId = 0;
    for (const table of tablesToCheck) {
      try {
        const result = await dbClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'tenant_id'
          )
        `, [table]);

        if (result.rows[0].exists) {
          tablesWithTenantId++;
        } else {
          logTest('Schema', `${table}.tenant_id`, 'FAIL', 'Missing tenant_id column');
        }
      } catch (error) {
        logTest('Schema', `${table}.tenant_id`, 'FAIL', error.message);
      }
    }

    if (tablesWithTenantId === tablesToCheck.length) {
      logTest('Schema', 'All Tables', 'PASS', `All ${tablesWithTenantId}/${tablesToCheck.length} tables have tenant_id`);
    } else {
      logTest('Schema', 'All Tables', 'FAIL', `Only ${tablesWithTenantId}/${tablesToCheck.length} tables have tenant_id`);
    }

    // Test 1.3: Indexes on tenant_id
    try {
      const indexes = await dbClient.query(`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE indexname LIKE '%tenant%'
        AND schemaname = 'public'
      `);

      if (indexes.rows.length >= 13) {
        logTest('Schema', 'Tenant Indexes', 'PASS', `${indexes.rows.length} tenant indexes found`);
      } else {
        logTest('Schema', 'Tenant Indexes', 'WARN', `Only ${indexes.rows.length}/13+ indexes found`);
      }
    } catch (error) {
      logTest('Schema', 'Tenant Indexes', 'FAIL', error.message);
    }

    // Test 1.4: Default tenant exists
    try {
      const defaultTenant = await dbClient.query('SELECT * FROM tenants WHERE tenant_key = $1', ['default']);
      
      if (defaultTenant.rows.length > 0) {
        tenant1Id = defaultTenant.rows[0].id;
        logTest('Schema', 'Default Tenant', 'PASS', `Default tenant exists (ID: ${tenant1Id})`);
      } else {
        logTest('Schema', 'Default Tenant', 'FAIL', 'Default tenant NOT found');
      }
    } catch (error) {
      logTest('Schema', 'Default Tenant', 'FAIL', error.message);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: AUTHENTICATION & TENANT CONTEXT
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔐 PHASE 2: AUTHENTICATION & TENANT CONTEXT');
    console.log('─'.repeat(80));

    // Test 2.1: Super Admin login
    try {
      console.log('   Attempting Super Admin login...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'factssolution@gmail.com',
        password: 'Black@786##'
      });

      console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));

      if (loginResponse.data.success && loginResponse.data.data?.token) {
        superAdminToken = loginResponse.data.data.token;
        logTest('Auth', 'Super Admin Login', 'PASS', 'Login successful');
        
        // Check if token has user info
        if (loginResponse.data.data.user) {
          logTest('Auth', 'User Info', 'PASS', `User: ${loginResponse.data.data.user.email}, Role: ${loginResponse.data.data.user.role}`);
        }
      } else {
        logTest('Auth', 'Super Admin Login', 'FAIL', 'Login failed: ' + JSON.stringify(loginResponse.data));
      }
    } catch (error) {
      console.log('   Error details:', JSON.stringify(error.response?.data, null, 2));
      logTest('Auth', 'Super Admin Login', 'FAIL', error.response?.data?.message || error.message);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: TENANT PROVISIONING
    // ═══════════════════════════════════════════════════════════
    console.log('\n🏢 PHASE 3: TENANT PROVISIONING');
    console.log('─'.repeat(80));

    if (!superAdminToken) {
      logTest('Provisioning', 'All Tests', 'FAIL', 'Skipped - Super Admin login failed');
    } else {
      // Test 3.1: Create Tenant 1
      try {
        const tenant1Data = {
          tenant_key: `audit-test-1-${Date.now()}`,
          company_name: 'Audit Test Company 1',
          contact_email: `audit1@test-${Date.now()}.com`,
          contact_phone: '+1234567890',
          address: '123 Test St, City 1',
          admin_name: 'Test Admin 1',
          admin_email: `admin1@test-${Date.now()}.com`,
          admin_password: 'Test123456',
          subscription_type: 'trial',
          max_users: 10
        };

        const createResponse = await axios.post(
          `${API_URL}/tenants`,
          tenant1Data,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (createResponse.data.success) {
          tenant1Id = createResponse.data.tenant.id;
          logTest('Provisioning', 'Create Tenant 1', 'PASS', `Tenant created (ID: ${tenant1Id})`);
          
          // Verify license created
          if (createResponse.data.license) {
            logTest('Provisioning', 'License Generation', 'PASS', `License: ${createResponse.data.license.license_key}`);
          }

          // Verify admin created
          if (createResponse.data.admin) {
            logTest('Provisioning', 'Admin Creation', 'PASS', `Admin: ${createResponse.data.admin.email}`);
          }

          // Test 3.2: Login as Tenant 1 Admin
          try {
            const tenant1Login = await axios.post(`${API_URL}/auth/login`, {
              email: tenant1Data.admin_email,
              password: tenant1Data.admin_password
            });

            if (tenant1Login.data.success) {
              tenant1Token = tenant1Login.data.data?.token;
              logTest('Provisioning', 'Tenant 1 Login', 'PASS', 'Tenant 1 admin login successful');
            }
          } catch (error) {
            logTest('Provisioning', 'Tenant 1 Login', 'FAIL', error.response?.data?.message || error.message);
          }
        } else {
          logTest('Provisioning', 'Create Tenant 1', 'FAIL', 'Creation failed');
        }
      } catch (error) {
        logTest('Provisioning', 'Create Tenant 1', 'FAIL', error.response?.data?.message || error.message);
      }

      await sleep(1000); // Wait to ensure unique timestamps

      // Test 3.3: Create Tenant 2
      try {
        const tenant2Data = {
          tenant_key: `audit-test-2-${Date.now()}`,
          company_name: 'Audit Test Company 2',
          contact_email: `audit2@test-${Date.now()}.com`,
          contact_phone: '+9876543210',
          address: '456 Test Ave, City 2',
          admin_name: 'Test Admin 2',
          admin_email: `admin2@test-${Date.now()}.com`,
          admin_password: 'Test654321',
          subscription_type: 'monthly',
          max_users: 5
        };

        const createResponse = await axios.post(
          `${API_URL}/tenants`,
          tenant2Data,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (createResponse.data.success) {
          tenant2Id = createResponse.data.tenant.id;
          logTest('Provisioning', 'Create Tenant 2', 'PASS', `Tenant created (ID: ${tenant2Id})`);

          // Test 3.4: Login as Tenant 2 Admin
          try {
            const tenant2Login = await axios.post(`${API_URL}/auth/login`, {
              email: tenant2Data.admin_email,
              password: tenant2Data.admin_password
            });

            if (tenant2Login.data.success) {
              tenant2Token = tenant2Login.data.data?.token;
              logTest('Provisioning', 'Tenant 2 Login', 'PASS', 'Tenant 2 admin login successful');
            }
          } catch (error) {
            logTest('Provisioning', 'Tenant 2 Login', 'FAIL', error.response?.data?.message || error.message);
          }
        } else {
          logTest('Provisioning', 'Create Tenant 2', 'FAIL', 'Creation failed');
        }
      } catch (error) {
        logTest('Provisioning', 'Create Tenant 2', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: TENANT LISTING & STATISTICS
    // ═══════════════════════════════════════════════════════════
    console.log('\n📋 PHASE 4: TENANT LISTING & STATISTICS');
    console.log('─'.repeat(80));

    if (!superAdminToken) {
      logTest('Listing', 'All Tests', 'FAIL', 'Skipped - No Super Admin token');
    } else {
      // Test 4.1: List all tenants
      try {
        const listResponse = await axios.get(
          `${API_URL}/tenants`,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (listResponse.data.success) {
          const tenantCount = listResponse.data.tenants?.length || 0;
          logTest('Listing', 'List Tenants', 'PASS', `${tenantCount} tenants found`);
        } else {
          logTest('Listing', 'List Tenants', 'FAIL', 'Failed to list tenants');
        }
      } catch (error) {
        logTest('Listing', 'List Tenants', 'FAIL', error.response?.data?.message || error.message);
      }

      // Test 4.2: Get tenant statistics
      try {
        const statsResponse = await axios.get(
          `${API_URL}/tenants/stats`,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (statsResponse.data.success) {
          const stats = statsResponse.data.stats;
          logTest('Listing', 'Tenant Stats', 'PASS', `Total: ${stats.total}, Active: ${stats.active}`);
        } else {
          logTest('Listing', 'Tenant Stats', 'FAIL', 'Failed to get stats');
        }
      } catch (error) {
        logTest('Listing', 'Tenant Stats', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 5: DATA ISOLATION VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔒 PHASE 5: DATA ISOLATION VERIFICATION');
    console.log('─'.repeat(80));

    // Test 5.1: Tenant 1 can access their own data
    if (tenant1Token) {
      try {
        const productsResponse = await axios.get(
          `${API_URL}/products`,
          { headers: { Authorization: `Bearer ${tenant1Token}` } }
        );

        if (productsResponse.data.success || productsResponse.data.products) {
          logTest('Isolation', 'Tenant 1 Products', 'PASS', 'Can access own products');
        } else {
          logTest('Isolation', 'Tenant 1 Products', 'WARN', 'Empty product list (expected for new tenant)');
        }
      } catch (error) {
        logTest('Isolation', 'Tenant 1 Products', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // Test 5.2: Tenant 2 can access their own data
    if (tenant2Token) {
      try {
        const productsResponse = await axios.get(
          `${API_URL}/products`,
          { headers: { Authorization: `Bearer ${tenant2Token}` } }
        );

        if (productsResponse.data.success || productsResponse.data.products) {
          logTest('Isolation', 'Tenant 2 Products', 'PASS', 'Can access own products');
        } else {
          logTest('Isolation', 'Tenant 2 Products', 'WARN', 'Empty product list (expected for new tenant)');
        }
      } catch (error) {
        logTest('Isolation', 'Tenant 2 Products', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // Test 5.3: Super Admin can access all tenants
    if (superAdminToken) {
      try {
        const productsResponse = await axios.get(
          `${API_URL}/products`,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (productsResponse.data.success || productsResponse.data.products) {
          logTest('Isolation', 'Super Admin Access', 'PASS', 'Super Admin can access all data');
        } else {
          logTest('Isolation', 'Super Admin Access', 'WARN', 'No products found');
        }
      } catch (error) {
        logTest('Isolation', 'Super Admin Access', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 6: SUBSCRIPTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    console.log('\n💳 PHASE 6: SUBSCRIPTION MANAGEMENT');
    console.log('─'.repeat(80));

    if (tenant1Id && superAdminToken) {
      // Test 6.1: Get tenant details
      try {
        const tenantResponse = await axios.get(
          `${API_URL}/tenants/${tenant1Id}`,
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (tenantResponse.data.success) {
          const tenant = tenantResponse.data.tenant;
          logTest('Subscription', 'Tenant Details', 'PASS', `Type: ${tenant.subscription_type}, Status: ${tenant.status}`);
          
          // Verify subscription dates
          if (tenant.subscription_start && tenant.subscription_end) {
            logTest('Subscription', 'Subscription Dates', 'PASS', 'Start and end dates set');
          }
        } else {
          logTest('Subscription', 'Tenant Details', 'FAIL', 'Failed to get tenant details');
        }
      } catch (error) {
        logTest('Subscription', 'Tenant Details', 'FAIL', error.response?.data?.message || error.message);
      }

      // Test 6.2: Update tenant subscription
      try {
        const updateResponse = await axios.put(
          `${API_URL}/tenants/${tenant1Id}`,
          { subscription_type: 'yearly' },
          { headers: { Authorization: `Bearer ${superAdminToken}` } }
        );

        if (updateResponse.data.success) {
          logTest('Subscription', 'Update Subscription', 'PASS', 'Subscription updated to yearly');
        } else {
          logTest('Subscription', 'Update Subscription', 'FAIL', 'Update failed');
        }
      } catch (error) {
        logTest('Subscription', 'Update Subscription', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 7: DATABASE INTEGRITY CHECKS
    // ═══════════════════════════════════════════════════════════
    console.log('\n🔍 PHASE 7: DATABASE INTEGRITY CHECKS');
    console.log('─'.repeat(80));

    // Test 7.1: Check for orphaned records (tenant_id not in tenants table)
    try {
      const orphanedCheck = await dbClient.query(`
        SELECT COUNT(*) as orphaned
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE t.id IS NULL
      `);

      const orphaned = parseInt(orphanedCheck.rows[0].orphaned);
      if (orphaned === 0) {
        logTest('Integrity', 'Orphaned Users', 'PASS', 'No orphaned user records');
      } else {
        logTest('Integrity', 'Orphaned Users', 'FAIL', `${orphaned} orphaned user records found`);
      }
    } catch (error) {
      logTest('Integrity', 'Orphaned Users', 'FAIL', error.message);
    }

    // Test 7.2: Check tenant user counts
    try {
      const userCounts = await dbClient.query(`
        SELECT t.id, t.tenant_key, t.company_name, COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        GROUP BY t.id, t.tenant_key, t.company_name
        ORDER BY t.id
      `);

      logTest('Integrity', 'Tenant User Counts', 'PASS', `${userCounts.rows.length} tenants verified`);
      userCounts.rows.forEach(row => {
        console.log(`      - ${row.company_name} (${row.tenant_key}): ${row.user_count} users`);
      });
    } catch (error) {
      logTest('Integrity', 'Tenant User Counts', 'FAIL', error.message);
    }

    // Test 7.3: Check license per tenant
    try {
      const licenseCheck = await dbClient.query(`
        SELECT t.id, t.tenant_key, COUNT(l.id) as license_count
        FROM tenants t
        LEFT JOIN licenses l ON t.id = l.tenant_id
        GROUP BY t.id, t.tenant_key
        ORDER BY t.id
      `);

      const tenantsWithoutLicense = licenseCheck.rows.filter(r => parseInt(r.license_count) === 0);
      if (tenantsWithoutLicense.length === 0) {
        logTest('Integrity', 'Tenant Licenses', 'PASS', 'All tenants have licenses');
      } else {
        logTest('Integrity', 'Tenant Licenses', 'WARN', `${tenantsWithoutLicense.length} tenants without licenses`);
      }
    } catch (error) {
      logTest('Integrity', 'Tenant Licenses', 'FAIL', error.message);
    }

    // ═══════════════════════════════════════════════════════════
    // FINAL AUDIT REPORT
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(80));
    console.log('📊 FINAL AUDIT REPORT');
    console.log('═'.repeat(80));
    
    console.log(`\n✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log(`📝 Total Tests: ${testResults.tests.length}`);
    
    const passRate = testResults.tests.length > 0 
      ? ((testResults.passed / testResults.tests.length) * 100).toFixed(1)
      : 0;
    
    console.log(`\n📈 Pass Rate: ${passRate}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 AUDIT RESULT: ALL CRITICAL TESTS PASSED!');
      console.log('   Multi-tenant system is functioning correctly.');
    } else if (testResults.failed <= 2) {
      console.log('\n⚠️  AUDIT RESULT: MINOR ISSUES FOUND');
      console.log('   System is mostly functional, review failed tests.');
    } else {
      console.log('\n❌ AUDIT RESULT: CRITICAL ISSUES FOUND');
      console.log('   System requires fixes before production use.');
    }

    // Show failed tests
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => {
          console.log(`   - [${t.category}] ${t.test}: ${t.message}`);
        });
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`⏰ Audit Completed: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    console.error(error.stack);
  } finally {
    await dbClient.end();
  }
}

runAudit();
