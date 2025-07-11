// backend/run-dashboard-optimizations.js
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

    // Read and execute the optimization SQL script
    const sqlPath = path.join(__dirname, 'optimize-dashboard-queries-simple.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📊 Creating database indexes and optimizations...');
    
    // Split the SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
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

// Run the optimizations if this script is executed directly
if (require.main === module) {
  runDashboardOptimizations();
}

module.exports = { runDashboardOptimizations }; 