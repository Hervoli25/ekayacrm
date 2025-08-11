import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔐 Creating super admin user...');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('EkhayaAdmin2024!#$', 12);

    // Create the super admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin' },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
      create: {
        email: 'admin',
        name: 'Super Administrator',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Super admin user created/updated:', admin.email);

    // Create corresponding employee record
    await prisma.employee.upsert({
      where: { userId: admin.id },
      update: {
        name: 'Super Administrator',
        title: 'System Administrator',
        department: 'Administration',
        email: 'admin',
      },
      create: {
        userId: admin.id,
        employeeId: 'ADMIN001',
        name: 'Super Administrator',
        title: 'System Administrator',
        department: 'Administration',
        email: 'admin',
        phone: '+27 11 000 0000',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Super admin employee record created/updated');
    console.log('');
    console.log('🎉 Super Admin created successfully!');
    console.log('📧 Username: admin');
    console.log('🔑 Password: EkhayaAdmin2024!#$');
    console.log('🚀 Role: SUPER_ADMIN (unlimited access)');
    console.log('');
    console.log('You can now login at: http://localhost:3003');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
