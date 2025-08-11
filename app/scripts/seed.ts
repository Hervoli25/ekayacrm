
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create main admin user with your credentials
  const adminPassword = await bcrypt.hash('EkhayaAdmin2024!#$', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      name: 'System Administrator',
      password: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create admin employee record
  await prisma.employee.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      employeeId: 'EI001',
      name: 'System Administrator',
      title: 'System Administrator',
      department: 'IT',
      email: 'admin',
      phone: '+27 11 123 4567',
    },
  });

  console.log('✅ Created admin employee record');

  // Create test account (as requested)
  const testPassword = await bcrypt.hash('johndoe123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: testPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Created test admin user:', testUser.email);

  // Create test employee record
  await prisma.employee.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      employeeId: 'EI002',
      name: 'John Doe',
      title: 'Senior Manager',
      department: 'Management',
      email: 'john@doe.com',
      phone: '+27 11 123 4568',
    },
  });

  console.log('✅ Created test employee record');

  // Create sample employees
  const employeeData = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@ekhayaintel.com',
      title: 'Trading Analyst',
      department: 'Trading',
      phone: '+27 11 987 6543',
      password: 'password123',
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@ekhayaintel.com',
      title: 'Risk Manager',
      department: 'Risk Management',
      phone: '+27 11 555 7890',
      password: 'password123',
    },
    {
      name: 'Lisa Williams',
      email: 'lisa.williams@ekhayaintel.com',
      title: 'Financial Controller',
      department: 'Finance',
      phone: '+27 11 444 5678',
      password: 'password123',
    },
    {
      name: 'David Thompson',
      email: 'david.thompson@ekhayaintel.com',
      title: 'Senior Trader',
      department: 'Trading',
      phone: '+27 11 333 4567',
      password: 'password123',
    },
    {
      name: 'Emma Davis',
      email: 'emma.davis@ekhayaintel.com',
      title: 'Compliance Officer',
      department: 'Compliance',
      phone: '+27 11 222 3456',
      password: 'password123',
    },
  ];

  for (let i = 0; i < employeeData.length; i++) {
    const empData = employeeData[i];
    const hashedPassword = await bcrypt.hash(empData.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: empData.email },
      update: {},
      create: {
        email: empData.email,
        name: empData.name,
        password: hashedPassword,
        role: 'EMPLOYEE',
      },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: `EI${(i + 3).toString().padStart(3, '0')}`,
        name: empData.name,
        title: empData.title,
        department: empData.department,
        email: empData.email,
        phone: empData.phone,
      },
    });

    console.log('✅ Created employee:', empData.name);
  }

  // Create sample leave requests
  const employees = await prisma.employee.findMany({
    include: { user: true },
  });

  const leaveRequests = [
    {
      employeeName: 'Sarah Johnson',
      startDate: new Date('2024-08-20'),
      endDate: new Date('2024-08-22'),
      leaveType: 'VACATION',
      reason: 'Family vacation to Cape Town',
      status: 'PENDING',
    },
    {
      employeeName: 'Michael Chen',
      startDate: new Date('2024-08-15'),
      endDate: new Date('2024-08-16'),
      leaveType: 'SICK_LEAVE',
      reason: 'Medical appointment and recovery',
      status: 'APPROVED',
    },
    {
      employeeName: 'Lisa Williams',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-09-05'),
      leaveType: 'VACATION',
      reason: 'Annual leave - visiting family',
      status: 'PENDING',
    },
    {
      employeeName: 'David Thompson',
      startDate: new Date('2024-08-10'),
      endDate: new Date('2024-08-10'),
      leaveType: 'PERSONAL',
      reason: 'Personal matters',
      status: 'REJECTED',
    },
  ];

  for (const req of leaveRequests) {
    const employee = employees.find(emp => emp.name === req.employeeName);
    if (employee) {
      await prisma.leaveRequest.create({
        data: {
          userId: employee.userId,
          startDate: req.startDate,
          endDate: req.endDate,
          leaveType: req.leaveType as any,
          reason: req.reason,
          status: req.status as any,
        },
      });
      console.log('✅ Created leave request for:', req.employeeName);
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
