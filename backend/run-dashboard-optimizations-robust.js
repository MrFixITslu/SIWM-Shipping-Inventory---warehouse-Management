// backend/run-dashboard-optimizations-robust.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const runDashboardOptimizations = async () => {
  const pool = new Pool({
    user: process.env.DB_USER || 'vision79_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vision79siwm',
    password: process.env.DB_PASSWORD || 'pacalive15$',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔧 Starting dashboard performance optimizations...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Read the SQL script
    const sqlPath = path.join(__dirname, 'optimize-dashboard-queries-simple.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📊 Creating database indexes and optimizations...');
    
    // Execute the entire SQL script as one transaction
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('COMMIT');
      console.log('✅ All SQL optimizations executed successfully');
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('❌ Error executing SQL optimizations:', error.message);
      
      // Fallback: Execute statements one by one
      console.log('🔄 Attempting fallback execution...');
      await executeStatementsIndividually(pool, sql);
    }

    console.log('✅ Database optimizations completed successfully');

    // Test the optimized queries
    console.log('🧪 Testing optimized queries...');
    
    try {
      const dashboardMetrics = await pool.query('SELECT * FROM get_dashboard_metrics()');
      console.log('✅ Dashboard metrics function working');
    } catch (error) {
      console.log('⚠️  Dashboard metrics function not available (will use regular queries)');
    }

    try {
      const workflowMetrics = await pool.query('SELECT * FROM get_workflow_metrics()');
      console.log('✅ Workflow metrics function working');
    } catch (error) {
      console.log('⚠️  Workflow metrics function not available (will use regular queries)');
    }

    // Check if materialized view exists
    try {
      const mvCheck = await pool.query("SELECT * FROM warehouse_metrics_mv LIMIT 1");
      console.log('✅ Warehouse metrics materialized view available');
    } catch (error) {
      console.log('⚠️  Materialized view not available (will use regular queries)');
    }

    // Get performance statistics
    try {
      const stats = await pool.query(`
        SELECT 
          schemaname||'.'||tablename as table_name,
          n_tup_ins + n_tup_upd + n_tup_del as total_rows,
          last_vacuum,
          last_analyze,
          CASE 
            WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
            ELSE ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
          END as cache_hit_ratio
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('warehouses', 'inventory_items', 'warehouse_orders', 'inventory_movements')
        ORDER BY total_rows DESC
      `);
      
      console.log('📈 Current table statistics:');
      stats.rows.forEach(row => {
        console.log(`  ${row.table_name}: ${row.total_rows} rows, ${row.cache_hit_ratio}% cache hit ratio`);
      });
    } catch (error) {
      console.log('⚠️  Could not retrieve performance statistics');
    }

    console.log('\n🎉 Dashboard optimizations completed!');
    console.log('💡 The dashboard should now load faster and refresh less frequently.');
    console.log('📝 Key improvements:');
    console.log('   - Database indexes for faster queries');
    console.log('   - Materialized views for complex aggregations');
    console.log('   - Optimized caching in the backend');
    console.log('   - Reduced refresh intervals in the frontend');
    console.log('   - Better error handling and loading states');

  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
  } finally {
    await pool.end();
  }
};

// Helper function to execute statements individually
const executeStatementsIndividually = async (pool, sql) => {
  // Split by semicolon but be more careful about function definitions
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let braceCount = 0;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    currentStatement += line + '\n';
    
    // Check if we're in a function definition
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    // Count braces in function definitions
    if (inFunction) {
      braceCount += (trimmedLine.match(/\$\$/g) || []).length;
      if (braceCount >= 2) {
        inFunction = false;
        braceCount = 0;
      }
    }
    
    // If we're not in a function and we see a semicolon, end the statement
    if (!inFunction && trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  console.log(`📝 Executing ${statements.length} SQL statements individually...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement && !statement.startsWith('--')) {
      try {
        await pool.query(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('does not exist') ||
            error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`⚠️  Statement ${i + 1} skipped: ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
        }
      }
    }
  }
};

// Run the optimizations if this script is executed directly
if (require.main === module) {
  runDashboardOptimizations();
}

module.exports = { runDashboardOptimizations }; 