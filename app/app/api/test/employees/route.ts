import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing employees API...');
    
    // Test database connection
    const employeeCount = await prisma.employee.count();
    console.log('Employee count:', employeeCount);
    
    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        department: true,
        status: true
      },
      take: 10
    });
    
    console.log('Employees found:', employees.length);
    console.log('Sample employee:', employees[0]);
    
    return NextResponse.json({
      success: true,
      count: employeeCount,
      employees: employees,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Test employees API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
