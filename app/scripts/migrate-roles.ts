import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating existing roles to new enterprise structure...');

  // First, let's see what roles exist in the current database
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });

    console.log('Current users and their roles:');
    for (const user of users) {
      console.log(`- ${user.email}: ${user.role}`);
    }

    // Map old roles to new roles
    const roleMapping = {
      'SUPER_ADMIN': 'DIRECTOR',
      'ADMIN': 'HR_MANAGER', 
      'HR_DIRECTOR': 'HR_MANAGER',
      'MANAGER': 'DEPARTMENT_MANAGER',
      'EMPLOYEE': 'EMPLOYEE'
    };

    // Update users with role mapping
    for (const user of users) {
      const oldRole = user.role;
      const newRole = roleMapping[oldRole as keyof typeof roleMapping] || 'EMPLOYEE';
      
      if (oldRole !== newRole) {
        // We can't update the role directly due to enum constraints
        // We need to use raw SQL to update the role
        await prisma.$executeRaw`
          UPDATE "users" 
          SET "role" = ${newRole}::"Role" 
          WHERE "id" = ${user.id}
        `;
        
        console.log(`✅ Updated ${user.email}: ${oldRole} → ${newRole}`);
      }
    }

    console.log('🎉 Role migration completed!');

  } catch (error) {
    console.error('❌ Error during role migration:', error);
    console.log('');
    console.log('🔄 The database schema has significant changes that require a fresh start.');
    console.log('Recommended solution: Reset the database completely');
    console.log('');
    console.log('Run these commands to reset and seed with the new enterprise structure:');
    console.log('1. npm run db:reset');
    console.log('2. npm run db:enterprise-seed');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });