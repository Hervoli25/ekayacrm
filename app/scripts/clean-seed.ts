import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../lib/enterprise-permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Setting up clean HR system with your admin account...');

  // First, create only the essential departments (no fake data)
  const departments = [
    { name: 'Executive', code: 'EXEC', description: 'Executive Leadership' },
    { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' },
    { name: 'Finance', code: 'FIN', description: 'Finance and Accounting' },
    { name: 'Operations', code: 'OPS', description: 'Business Operations' },
  ];

  console.log('📁 Creating basic departments...');
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  // Create permissions system (needed for the role-based access)
  console.log('🔑 Setting up permission system...');
  const permissionGroups = [
    { category: 'Employee Management', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('EMPLOYEE_')) },
    { category: 'Leave Management', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('LEAVE_')) },
    { category: 'Performance', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('PERFORMANCE_')) },
    { category: 'Time & Attendance', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('TIME_')) },
    { category: 'Payroll', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('PAYROLL_')) },
    { category: 'Disciplinary', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('DISCIPLINARY_')) },
    { category: 'Termination', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('TERMINATION_')) },
    { category: 'Recruitment', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('RECRUITMENT_')) },
    { category: 'Documents', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('DOCUMENTS_')) },
    { category: 'Finance', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('FINANCE_')) },
    { category: 'Administration', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('ADMIN_')) },
    { category: 'Reporting', permissions: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('REPORTS_') || key.startsWith('ANALYTICS_')) },
  ];

  for (const group of permissionGroups) {
    for (const [key, permission] of group.permissions) {
      await prisma.permission.upsert({
        where: { name: permission },
        update: {},
        create: {
          name: permission,
          category: group.category,
          description: `Permission for ${permission.replace(/_/g, ' ').toLowerCase()}`,
        },
      });
    }
  }

  // Create role permissions
  for (const [role, config] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of config.permissions) {
      const permissionRecord = await prisma.permission.findUnique({ where: { name: permission } });
      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as any,
              permissionId: permissionRecord.id,
            },
          },
          update: {},
          create: {
            role: role as any,
            permissionId: permissionRecord.id,
            canCreate: permission.includes('CREATE') || permission.includes('POST') || permission.includes('UPLOAD'),
            canRead: true,
            canUpdate: permission.includes('UPDATE') || permission.includes('EDIT') || permission.includes('MANAGE'),
            canDelete: permission.includes('DELETE'),
            canApprove: permission.includes('APPROVE'),
            constraints: config.constraints ? JSON.stringify(config.constraints) : null,
          },
        });
      }
    }
  }

  // Create/verify your admin account
  console.log('👤 Setting up your admin account...');
  const adminPassword = await bcrypt.hash('EkhayaAdmin2024!#$', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {
      role: 'SUPER_ADMIN', // Ensure correct role
    },
    create: {
      email: 'admin',
      name: 'System Administrator',
      password: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // Create admin employee record
  await prisma.employee.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      employeeId: 'ADMIN001',
      name: 'System Administrator',
      title: 'System Administrator',
      department: 'Executive',
      email: 'admin',
      phone: '+27 11 123 4567',
    },
  });

  console.log('✅ System setup complete!');
  console.log('');
  console.log('🎉 Your HR system is ready with clean data!');
  console.log('');
  console.log('👤 Login with your admin account:');
  console.log('   📧 Email: admin');
  console.log('   🔑 Password: EkhayaAdmin2024!#$');
  console.log('');
  console.log('✨ You can now:');
  console.log('   - Create real directors through the system');
  console.log('   - Add actual employees');
  console.log('   - Set up departments as needed');
  console.log('   - Configure real workflows');
  console.log('');
  console.log('🔧 The system is ready for real data - no more dummy records!');
}

main()
  .catch((e) => {
    console.error('❌ Error setting up clean system:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });