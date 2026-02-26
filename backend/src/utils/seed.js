require('dotenv').config();

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting seed...');

    // Create admin
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', 
      ['admin@hospital.com', adminHash, 'admin']);
    console.log('✅ Admin seeded');

    // Create lab
    const labHash = await bcrypt.hash('Lab@123', 10);
    await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', 
      ['lab@hospital.com', labHash, 'lab']);
    console.log('✅ Lab user seeded');

    // Create pharmacy
    const pharmacyHash = await bcrypt.hash('Pharmacy@123', 10);
    await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', 
      ['pharmacy@hospital.com', pharmacyHash, 'pharmacy']);
    console.log('✅ Pharmacy user seeded');

    // Sample doctors
    const doctors = [
      { name: 'Dr. John Smith', specialization: 'Cardiology', doctor_id: 'DOC001' },
      { name: 'Dr. Sarah Johnson', specialization: 'Neurology', doctor_id: 'DOC002' },
      { name: 'Dr. Mike Brown', specialization: 'Orthopedics', doctor_id: 'DOC003' }
    ];

    for (const doc of doctors) {
      const userRes = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
        [`${doc.doctor_id}@hospital.com`, adminHash, 'doctor']
      );
      await client.query(
        'INSERT INTO doctors (user_id, doctor_id, name, specialization) VALUES ($1, $2, $3, $4)',
        [userRes.rows[0].id, doc.doctor_id, doc.name, doc.specialization]
      );
    }
    console.log('✅ 3 Doctors seeded');

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
