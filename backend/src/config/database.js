const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { 
    rejectUnauthorized: false,
    require: true 
  }
});

module.exports = pool;
