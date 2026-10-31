/**
 * Venture Bali — Create an operator account
 * -------------------------------------------
 * Usage:
 *   npm run admin:create -- operator@example.com "your password" [SUPER_ADMIN]
 *
 * Stores a scrypt hash in the `AdminUser` table. The password is never
 * written to disk or logged.
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/adminAuth.ts';
const prisma = new PrismaClient();

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [emailArg, passwordArg, roleArg] = process.argv.slice(2);

  if (!emailArg || !passwordArg) {
    console.error(
      'Usage: npm run admin:create -- <email> <password> [SUPER_ADMIN|ADMIN|EDITOR|VIEWER]'
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error(`"${email}" is not a valid email address.`);
    process.exit(1);
  }

  if (passwordArg.length < 8) {
    console.error('The password must be at least 8 characters long.');
    process.exit(1);
  }

  const role: Role = (ROLES as readonly string[]).includes(roleArg ?? '')
    ? (roleArg as Role)
    : 'ADMIN';

  const passwordHash = hashPassword(passwordArg);

  const existing = await prisma.adminUser.findUnique({ where: { email } });

  const admin = existing
    ? await prisma.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, role, isActive: true },
      })
    : await prisma.adminUser.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash,
          role,
          isActive: true,
        },
      });

  console.log(`✓ Operator ready: ${admin.email} (${admin.role})`);
  console.log('  Sign in at /admin/login');
}

main()
  .catch((error) => {
    console.error('Failed to create the operator account:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
