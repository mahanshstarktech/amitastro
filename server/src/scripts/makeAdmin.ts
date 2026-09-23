import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initDatabase, getOne, runQuery } from '../db/database';

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg || !emailArg.includes('@')) {
    console.error(`
Usage:
  npm run make-admin <user-email>

Example:
  npm run make-admin amit@amitastro.com
    `);
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  console.log(`Connecting to database to promote ${email} to admin...`);

  await initDatabase();

  const user = await getOne<any>('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    console.error(`❌ User with email "${email}" was not found in the database.`);
    console.error(`   Please ask them to sign up or log in first, then run this command again.`);
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`✅ User ${user.name} (${email}) is already an Administrator.`);
    process.exit(0);
  }

  await runQuery("UPDATE users SET role = 'admin' WHERE id = ?", [user.id]);
  console.log(`🎉 SUCCESS: User "${user.name}" (${email}) has been successfully granted Administrator privileges!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
