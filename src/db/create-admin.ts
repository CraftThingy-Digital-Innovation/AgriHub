import 'dotenv/config';
import db from '../config/knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function createAdmin() {
  const phone = '085188000139';
  const name = 'Super Admin AgriHub';
  const password = 'adminagrihub123';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const hasTable = await db.schema.hasTable('users');
    if (!hasTable) {
      console.log('⚠️  Users table does not exist yet. Please ensure migrations have run successfully first.');
      process.exit(1);
    }

    const existing = await db('users').where({ phone }).first();
    
    if (existing) {
      await db('users').where({ phone }).update({
        role: 'admin',
        is_verified: true,
        updated_at: new Date(),
      });
      console.log('✅ Admin account updated to superadmin:', phone);
    } else {
      const id = uuidv4();
      await db('users').insert({
        id,
        phone,
        name,
        password_hash: passwordHash,
        role: 'admin',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log('🚀 Superadmin created successfully!');
    }

    console.log('📱 Phone:', phone);
    console.log('🔑 Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin:', err);
    process.exit(1);
  }
}

createAdmin();
