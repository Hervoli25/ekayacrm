
import { Role, LeaveType, LeaveStatus, EmployeeStatus } from '@prisma/client';

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
}

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  salary?: number | null;
  hireDate: Date;
  status: EmployeeStatus;
  terminationDate?: Date | null;
  terminationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
  };
}

export interface LeaveRequest {
  id: string;
  userId: string;
  employeeId?: string | null;
  startDate: Date;
  endDate: Date;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  adminNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  totalDays?: number | null;
  attachmentUrl?: string | null;
  isHalfDay: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name?: string | null;
    email: string;
    employee?: {
      name: string;
      employeeId: string;
      department: string;
      title: string;
    } | null;
  };
}

export interface CreateEmployeeData {
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string;
}

export interface CreateLeaveRequestData {
  startDate: Date;
  endDate: Date;
  leaveType: LeaveType;
  reason: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
