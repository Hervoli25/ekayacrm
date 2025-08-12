import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSIONS, ROLE_PERMISSIONS, APPROVAL_WORKFLOWS } from '../lib/enterprise-permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Starting Enterprise HR Database Seeding...');

  // Create departments first
  const departments = [
    { name: 'Executive', code: 'EXEC', description: 'Executive Leadership', budget: 5000000 },
    { name: 'Human Resources', code: 'HR', description: 'Human Resources Department', budget: 2000000 },
    { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', budget: 3000000 },
    { name: 'Trading', code: 'TRD', description: 'Trading Operations', budget: 10000000 },
    { name: 'Risk Management', code: 'RISK', description: 'Risk Assessment and Compliance', budget: 1500000 },
    { name: 'IT', code: 'IT', description: 'Information Technology', budget: 2500000 },
    { name: 'Operations', code: 'OPS', description: 'Business Operations', budget: 2000000 },
    { name: 'Compliance', code: 'COMP', description: 'Regulatory Compliance', budget: 1200000 },
  ];

  const createdDepartments: any = {};
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    createdDepartments[dept.code] = department;
    console.log(`✅ Created department: ${dept.name}`);
  }

  // Create permissions
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
    console.log(`✅ Created permissions for: ${group.category}`);
  }

  // Create role permissions
  for (const [role, config] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of config.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: role as any,
            permissionId: (await prisma.permission.findUnique({ where: { name: permission } }))!.id,
          },
        },
        update: {},
        create: {
          role: role as any,
          permissionId: (await prisma.permission.findUnique({ where: { name: permission } }))!.id,
          canCreate: permission.includes('CREATE') || permission.includes('POST') || permission.includes('UPLOAD'),
          canRead: true,
          canUpdate: permission.includes('UPDATE') || permission.includes('EDIT') || permission.includes('MANAGE'),
          canDelete: permission.includes('DELETE'),
          canApprove: permission.includes('APPROVE'),
          constraints: config.constraints ? JSON.stringify(config.constraints) : null,
        },
      });
    }
    console.log(`✅ Created role permissions for: ${role}`);
  }

  // Create the 4 Directors (as specified by user)
  const directors = [
    {
      name: 'Director Alpha',
      email: 'director.alpha@ekhayaintel.com',
      employeeId: 'DIR001',
      department: 'EXEC',
      title: 'Executive Director',
      phone: '+27 11 000 0001',
    },
    {
      name: 'Director Beta',
      email: 'director.beta@ekhayaintel.com',
      employeeId: 'DIR002',
      department: 'EXEC',
      title: 'Executive Director',
      phone: '+27 11 000 0002',
    },
    {
      name: 'Director Gamma',
      email: 'director.gamma@ekhayaintel.com',
      employeeId: 'DIR003',
      department: 'EXEC',
      title: 'Executive Director',
      phone: '+27 11 000 0003',
    },
    {
      name: 'Director Delta',
      email: 'director.delta@ekhayaintel.com',
      employeeId: 'DIR004',
      department: 'EXEC',
      title: 'Executive Director',
      phone: '+27 11 000 0004',
    },
  ];

  const createdUsers: any = {};
  for (const director of directors) {
    const hashedPassword = await bcrypt.hash('DirectorPass2024!#$', 12);
    const user = await prisma.user.upsert({
      where: { email: director.email },
      update: {},
      create: {
        email: director.email,
        name: director.name,
        password: hashedPassword,
        role: 'DIRECTOR',
      },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: director.employeeId,
        name: director.name,
        title: director.title,
        department: director.department,
        email: director.email,
        phone: director.phone,
        salary: 2000000, // R2M salary for directors
      },
    });

    // Create employee hierarchy
    await prisma.employeeHierarchy.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        departmentId: createdDepartments[director.department].id,
        position: director.title,
        level: 10, // Highest level for directors
      },
    });

    // Create employee profile
    await prisma.employeeProfile.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        clearanceLevel: 'TOP_SECRET',
        salaryGrade: 'DIR',
      },
    });

    // Assign to department
    await prisma.userDepartment.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: createdDepartments[director.department].id,
        assignedBy: user.id, // Self-assigned initially
      },
    });

    createdUsers[director.employeeId] = user;
    console.log(`👑 Created Director: ${director.name}`);
  }

  // Create HR Manager
  const hrManagerPassword = await bcrypt.hash('HRManager2024!', 12);
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr.manager@ekhayaintel.com' },
    update: {},
    create: {
      email: 'hr.manager@ekhayaintel.com',
      name: 'Sarah HR Manager',
      password: hrManagerPassword,
      role: 'HR_MANAGER',
    },
  });

  await prisma.employee.upsert({
    where: { userId: hrManager.id },
    update: {},
    create: {
      userId: hrManager.id,
      employeeId: 'HRM001',
      name: 'Sarah HR Manager',
      title: 'HR Manager',
      department: 'HR',
      email: 'hr.manager@ekhayaintel.com',
      phone: '+27 11 100 0001',
      salary: 800000, // R800k salary
    },
  });

  await prisma.employeeHierarchy.upsert({
    where: { employeeId: hrManager.id },
    update: {},
    create: {
      employeeId: hrManager.id,
      departmentId: createdDepartments['HR'].id,
      position: 'HR Manager',
      level: 8,
      reportsTo: createdUsers['DIR001'].id, // Reports to first director
    },
  });

  await prisma.employeeProfile.upsert({
    where: { employeeId: hrManager.id },
    update: {},
    create: {
      employeeId: hrManager.id,
      clearanceLevel: 'SECRET',
      salaryGrade: 'M1',
    },
  });

  await prisma.userDepartment.upsert({
    where: { userId: hrManager.id },
    update: {},
    create: {
      userId: hrManager.id,
      departmentId: createdDepartments['HR'].id,
      assignedBy: createdUsers['DIR001'].id,
    },
  });

  console.log('👩‍💼 Created HR Manager');

  // Create Department Managers
  const departmentManagers = [
    { name: 'Finance Manager', email: 'finance.manager@ekhayaintel.com', department: 'FIN', empId: 'FM001' },
    { name: 'Trading Manager', email: 'trading.manager@ekhayaintel.com', department: 'TRD', empId: 'TM001' },
    { name: 'Risk Manager', email: 'risk.manager@ekhayaintel.com', department: 'RISK', empId: 'RM001' },
    { name: 'IT Manager', email: 'it.manager@ekhayaintel.com', department: 'IT', empId: 'ITM001' },
    { name: 'Operations Manager', email: 'ops.manager@ekhayaintel.com', department: 'OPS', empId: 'OM001' },
  ];

  for (const manager of departmentManagers) {
    const hashedPassword = await bcrypt.hash('Manager2024!', 12);
    const user = await prisma.user.upsert({
      where: { email: manager.email },
      update: {},
      create: {
        email: manager.email,
        name: manager.name,
        password: hashedPassword,
        role: 'DEPARTMENT_MANAGER',
      },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: manager.empId,
        name: manager.name,
        title: 'Department Manager',
        department: manager.department,
        email: manager.email,
        phone: `+27 11 200 ${Math.random().toString().slice(-4)}`,
        salary: 600000, // R600k salary
      },
    });

    await prisma.employeeHierarchy.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        departmentId: createdDepartments[manager.department].id,
        position: 'Department Manager',
        level: 7,
        reportsTo: createdUsers['DIR002'].id, // Reports to second director
      },
    });

    await prisma.employeeProfile.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        clearanceLevel: 'CONFIDENTIAL',
        salaryGrade: 'M2',
      },
    });

    await prisma.userDepartment.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: createdDepartments[manager.department].id,
        assignedBy: createdUsers['DIR002'].id,
      },
    });

    // Assign as department manager
    await prisma.departmentManager.upsert({
      where: {
        userId_departmentId: {
          userId: user.id,
          departmentId: createdDepartments[manager.department].id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        departmentId: createdDepartments[manager.department].id,
        assignedBy: createdUsers['DIR002'].id,
      },
    });

    createdUsers[manager.empId] = user;
    console.log(`🏢 Created Department Manager: ${manager.name}`);
  }

  // Create Supervisors and Employees
  const supervisors = [
    { name: 'Trading Supervisor', email: 'trading.supervisor@ekhayaintel.com', department: 'TRD', empId: 'TS001', reportsTo: 'TM001' },
    { name: 'Finance Supervisor', email: 'finance.supervisor@ekhayaintel.com', department: 'FIN', empId: 'FS001', reportsTo: 'FM001' },
    { name: 'IT Supervisor', email: 'it.supervisor@ekhayaintel.com', department: 'IT', empId: 'ITS001', reportsTo: 'ITM001' },
  ];

  for (const supervisor of supervisors) {
    const hashedPassword = await bcrypt.hash('Supervisor2024!', 12);
    const user = await prisma.user.upsert({
      where: { email: supervisor.email },
      update: {},
      create: {
        email: supervisor.email,
        name: supervisor.name,
        password: hashedPassword,
        role: 'SUPERVISOR',
      },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: supervisor.empId,
        name: supervisor.name,
        title: 'Supervisor',
        department: supervisor.department,
        email: supervisor.email,
        phone: `+27 11 300 ${Math.random().toString().slice(-4)}`,
        salary: 400000, // R400k salary
      },
    });

    await prisma.employeeHierarchy.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        departmentId: createdDepartments[supervisor.department].id,
        position: 'Supervisor',
        level: 6,
        reportsTo: createdUsers[supervisor.reportsTo].id,
        supervisorId: createdUsers[supervisor.reportsTo].id,
      },
    });

    await prisma.employeeProfile.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        clearanceLevel: 'CONFIDENTIAL',
        salaryGrade: 'S1',
      },
    });

    await prisma.userDepartment.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: createdDepartments[supervisor.department].id,
        assignedBy: createdUsers[supervisor.reportsTo].id,
      },
    });

    createdUsers[supervisor.empId] = user;
    console.log(`👥 Created Supervisor: ${supervisor.name}`);
  }

  // Create regular employees
  const employees = [
    { name: 'John Senior Trader', email: 'john.trader@ekhayaintel.com', department: 'TRD', role: 'SENIOR_EMPLOYEE', reportsTo: 'TS001' },
    { name: 'Mary Financial Analyst', email: 'mary.analyst@ekhayaintel.com', department: 'FIN', role: 'SENIOR_EMPLOYEE', reportsTo: 'FS001' },
    { name: 'Peter Junior Developer', email: 'peter.dev@ekhayaintel.com', department: 'IT', role: 'EMPLOYEE', reportsTo: 'ITS001' },
    { name: 'Lisa Junior Trader', email: 'lisa.trader@ekhayaintel.com', department: 'TRD', role: 'EMPLOYEE', reportsTo: 'TS001' },
    { name: 'Mike Support Analyst', email: 'mike.support@ekhayaintel.com', department: 'IT', role: 'EMPLOYEE', reportsTo: 'ITS001' },
    { name: 'Emma Intern Trader', email: 'emma.intern@ekhayaintel.com', department: 'TRD', role: 'INTERN', reportsTo: 'TS001' },
    { name: 'David Intern Developer', email: 'david.intern@ekhayaintel.com', department: 'IT', role: 'INTERN', reportsTo: 'ITS001' },
  ];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const hashedPassword = await bcrypt.hash('Employee2024!', 12);
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        password: hashedPassword,
        role: emp.role as any,
      },
    });

    const salary = emp.role === 'SENIOR_EMPLOYEE' ? 350000 : emp.role === 'EMPLOYEE' ? 250000 : 150000;
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: `EMP${(i + 1).toString().padStart(3, '0')}`,
        name: emp.name,
        title: emp.name.split(' ').slice(1).join(' '),
        department: emp.department,
        email: emp.email,
        phone: `+27 11 400 ${Math.random().toString().slice(-4)}`,
        salary: salary,
      },
    });

    const level = emp.role === 'SENIOR_EMPLOYEE' ? 5 : emp.role === 'EMPLOYEE' ? 4 : 2;
    await prisma.employeeHierarchy.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        departmentId: createdDepartments[emp.department].id,
        position: emp.name.split(' ').slice(1).join(' '),
        level: level,
        reportsTo: createdUsers[emp.reportsTo].id,
        supervisorId: createdUsers[emp.reportsTo].id,
      },
    });

    const clearance = emp.role === 'SENIOR_EMPLOYEE' ? 'CONFIDENTIAL' : 'NONE';
    await prisma.employeeProfile.upsert({
      where: { employeeId: user.id },
      update: {},
      create: {
        employeeId: user.id,
        clearanceLevel: clearance as any,
        salaryGrade: emp.role === 'SENIOR_EMPLOYEE' ? 'SE1' : emp.role === 'EMPLOYEE' ? 'E1' : 'I1',
      },
    });

    await prisma.userDepartment.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: createdDepartments[emp.department].id,
        assignedBy: createdUsers[emp.reportsTo].id,
      },
    });

    console.log(`👤 Created ${emp.role}: ${emp.name}`);
  }

  // Create approval workflows - separate workflow for each role
  const workflowTypes = Object.keys(APPROVAL_WORKFLOWS) as Array<keyof typeof APPROVAL_WORKFLOWS>;
  for (const workflowType of workflowTypes) {
    const roleWorkflows = APPROVAL_WORKFLOWS[workflowType];

    for (const [role, steps] of Object.entries(roleWorkflows)) {
      // Skip roles with no approval steps
      if (!steps || steps.length === 0) continue;

      const workflow = await prisma.approvalWorkflow.create({
        data: {
          name: `${workflowType.replace(/_/g, ' ')} - ${role}`,
          type: workflowType,
          requiresSequentialApproval: true,
        },
      });

      // Create approval steps for this specific role workflow
      for (const step of steps) {
        await prisma.approvalStep.create({
          data: {
            workflowId: workflow.id,
            stepOrder: step.step,
            requiredRole: step.requiredRole as any,
            isOptional: step.optional,
            timeoutHours: 72, // 3 days default
          },
        });
      }
    }

    console.log(`📋 Created approval workflows for: ${workflowType}`);
  }

  console.log('🎉 Enterprise HR Database Seeding Completed Successfully!');
  console.log('');
  console.log('👑 Directors created with FULL ACCESS:');
  console.log('   - Director Alpha (director.alpha@ekhayaintel.com)');
  console.log('   - Director Beta (director.beta@ekhayaintel.com)');
  console.log('   - Director Gamma (director.gamma@ekhayaintel.com)');
  console.log('   - Director Delta (director.delta@ekhayaintel.com)');
  console.log('   Password: DirectorPass2024!#$');
  console.log('');
  console.log('👩‍💼 HR Manager: hr.manager@ekhayaintel.com (Password: HRManager2024!)');
  console.log('🏢 Department Managers created for each department');
  console.log('👥 Supervisors and employees created with proper hierarchy');
  console.log('');
  console.log('🔐 Permission system configured with role-based access control');
  console.log('📋 Approval workflows configured for all processes');
  console.log('');
  console.log('Your enterprise HR system is ready! 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding enterprise database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });