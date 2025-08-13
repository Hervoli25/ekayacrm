import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can fix database issues
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Starting employee ID fix ===');
    
    const results = await prisma.$transaction(async (tx) => {
      // Get all employees to check their IDs
      const allEmployees = await tx.employee.findMany({
        select: {
          id: true,
          employeeId: true,
          name: true,
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Filter invalid IDs in JavaScript (since Prisma doesn't support regex)
      const validEmpPattern = /^EMP\d{3}$/;
      const invalidEmployees = allEmployees.filter(emp => {
        const id = emp.employeeId;
        return (
          id.includes('NaN') ||           // Contains NaN
          !id.startsWith('EMP') ||       // Doesn't start with EMP
          !validEmpPattern.test(id)       // Doesn't match EMP### pattern
        );
      });

      console.log('Found employees with invalid IDs:', invalidEmployees.length);
      console.log('Invalid IDs:', invalidEmployees.map(emp => emp.employeeId));

      // Get valid EMP IDs to determine next number
      const validEmployees = allEmployees.filter(emp => 
        validEmpPattern.test(emp.employeeId)
      );

      const existingNumbers = validEmployees
        .map(emp => parseInt(emp.employeeId.replace('EMP', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

      let nextNumber = 1;
      if (existingNumbers.length > 0) {
        nextNumber = Math.max(...existingNumbers) + 1;
      }

      const fixedEmployees = [];

      for (const employee of invalidEmployees) {
        const newEmployeeId = `EMP${nextNumber.toString().padStart(3, '0')}`;
        
        console.log(`Fixing employee ${employee.name}: ${employee.employeeId} → ${newEmployeeId}`);

        await tx.employee.update({
          where: { id: employee.id },
          data: { employeeId: newEmployeeId }
        });

        fixedEmployees.push({
          id: employee.id,
          name: employee.name,
          oldId: employee.employeeId,
          newId: newEmployeeId
        });

        nextNumber++;
      }

      return fixedEmployees;
    });

    console.log('=== Employee ID fix completed ===');
    console.log('Fixed employees:', results.length);

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.length} employee IDs`,
      fixedEmployees: results
    });

  } catch (error) {
    console.error('Fix employee IDs error:', error);
    return NextResponse.json(
      { error: 'Failed to fix employee IDs' },
      { status: 500 }
    );
  }
}