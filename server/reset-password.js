/**
 * Password Reset Utility CLI
 * Usage: node reset-password.js <email> <new_password>
 */
const bcrypt = require('bcryptjs');
const prisma = require('./src/db/client');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Error: Missing arguments.');
    console.log('Usage: node reset-password.js <email> <new_password>');
    process.exit(1);
  }

  const [email, newPassword] = args;

  console.log(`Searching for user with email: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error(`Error: User with email ${email} not found.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (Role: ${user.role}).`);
  console.log('Hashing new password...');
  const passwordHash = await bcrypt.hash(newPassword, 10);

  console.log('Updating password in database...');
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  console.log('Password updated successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during password reset:', err);
  process.exit(1);
});
