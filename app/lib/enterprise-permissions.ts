import { Role } from '@prisma/client';

// Permission categories and actions for enterprise HR system
export const PERMISSIONS = {
  // Employee Management
  EMPLOYEE_CREATE: 'employee_create',
  EMPLOYEE_READ: 'employee_read',
  EMPLOYEE_UPDATE: 'employee_update',
  EMPLOYEE_DELETE: 'employee_delete',
  EMPLOYEE_VIEW_ALL: 'employee_view_all',
  EMPLOYEE_VIEW_DEPARTMENT: 'employee_view_department',
  EMPLOYEE_VIEW_SALARY: 'employee_view_salary',
  EMPLOYEE_UPDATE_SALARY: 'employee_update_salary',
  
  // Leave Management
  LEAVE_CREATE: 'leave_create',
  LEAVE_VIEW_OWN: 'leave_view_own',
  LEAVE_VIEW_TEAM: 'leave_view_team',
  LEAVE_VIEW_ALL: 'leave_view_all',
  LEAVE_APPROVE_TEAM: 'leave_approve_team',
  LEAVE_APPROVE_DEPARTMENT: 'leave_approve_department',
  LEAVE_APPROVE_ALL: 'leave_approve_all',
  LEAVE_REJECT: 'leave_reject',
  
  // Performance Management
  PERFORMANCE_CREATE_REVIEW: 'performance_create_review',
  PERFORMANCE_VIEW_OWN: 'performance_view_own',
  PERFORMANCE_VIEW_TEAM: 'performance_view_team',
  PERFORMANCE_VIEW_ALL: 'performance_view_all',
  PERFORMANCE_APPROVE: 'performance_approve',
  PERFORMANCE_SET_GOALS: 'performance_set_goals',
  
  // Time & Attendance
  TIME_CLOCK_IN_OUT: 'time_clock_in_out',
  TIME_VIEW_OWN: 'time_view_own',
  TIME_VIEW_TEAM: 'time_view_team',
  TIME_VIEW_ALL: 'time_view_all',
  TIME_APPROVE: 'time_approve',
  TIME_EDIT: 'time_edit',
  
  // Payroll Management
  PAYROLL_VIEW_OWN: 'payroll_view_own',
  PAYROLL_VIEW_ALL: 'payroll_view_all',
  PAYROLL_PROCESS: 'payroll_process',
  PAYROLL_APPROVE: 'payroll_approve',
  PAYROLL_GENERATE_REPORTS: 'payroll_generate_reports',
  
  // Disciplinary Actions
  DISCIPLINARY_CREATE: 'disciplinary_create',
  DISCIPLINARY_VIEW: 'disciplinary_view',
  DISCIPLINARY_APPROVE: 'disciplinary_approve',
  DISCIPLINARY_APPEAL: 'disciplinary_appeal',
  
  // Termination Management
  TERMINATION_INITIATE: 'termination_initiate',
  TERMINATION_APPROVE: 'termination_approve',
  TERMINATION_VIEW: 'termination_view',
  
  // Recruitment
  RECRUITMENT_POST_JOBS: 'recruitment_post_jobs',
  RECRUITMENT_VIEW_APPLICATIONS: 'recruitment_view_applications',
  RECRUITMENT_SCHEDULE_INTERVIEWS: 'recruitment_schedule_interviews',
  RECRUITMENT_MAKE_OFFERS: 'recruitment_make_offers',
  
  // Document Management
  DOCUMENTS_UPLOAD: 'documents_upload',
  DOCUMENTS_VIEW_OWN: 'documents_view_own',
  DOCUMENTS_VIEW_ALL: 'documents_view_all',
  DOCUMENTS_MANAGE_ACCESS: 'documents_manage_access',
  DOCUMENTS_DELETE: 'documents_delete',
  
  // Finance & Expenses
  FINANCE_VIEW_REPORTS: 'finance_view_reports',
  FINANCE_MANAGE_EXPENSES: 'finance_manage_expenses',
  FINANCE_APPROVE_EXPENSES: 'finance_approve_expenses',
  FINANCE_GENERATE_RECEIPTS: 'finance_generate_receipts',
  
  // System Administration
  ADMIN_USER_MANAGEMENT: 'admin_user_management',
  ADMIN_SYSTEM_CONFIG: 'admin_system_config',
  ADMIN_AUDIT_LOGS: 'admin_audit_logs',
  ADMIN_SECURITY_INCIDENTS: 'admin_security_incidents',
  ADMIN_BACKUP_RESTORE: 'admin_backup_restore',
  
  // Reporting & Analytics
  REPORTS_GENERATE: 'reports_generate',
  REPORTS_VIEW_ALL: 'reports_view_all',
  REPORTS_EXPORT: 'reports_export',
  ANALYTICS_VIEW: 'analytics_view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping with specific constraints
export const ROLE_PERMISSIONS: Record<Role, {
  permissions: Permission[];
  constraints?: {
    departmentOnly?: boolean;
    teamOnly?: boolean;
    salaryLimit?: number;
    expenseLimit?: number;
  };
}> = {
  // Super Admin - You, the system owner - complete system control
  SUPER_ADMIN: {
    permissions: Object.values(PERMISSIONS),
    constraints: {} // No constraints - unlimited system access
  },

  // Directors - Full HR powers except system admin (the real directors you'll create)
  DIRECTOR: {
    permissions: Object.values(PERMISSIONS).filter(p => !p.startsWith('ADMIN_')),
    constraints: {} // No constraints - full HR access
  },

  // HR Manager - Full HR operations except system admin
  HR_MANAGER: {
    permissions: [
      // Employee Management - Full access
      PERMISSIONS.EMPLOYEE_CREATE,
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.EMPLOYEE_UPDATE,
      PERMISSIONS.EMPLOYEE_DELETE,
      PERMISSIONS.EMPLOYEE_VIEW_ALL,
      PERMISSIONS.EMPLOYEE_VIEW_SALARY,
      PERMISSIONS.EMPLOYEE_UPDATE_SALARY,
      
      // Leave Management - Full approval rights
      PERMISSIONS.LEAVE_VIEW_ALL,
      PERMISSIONS.LEAVE_APPROVE_ALL,
      PERMISSIONS.LEAVE_REJECT,
      
      // Performance Management - Full access
      PERMISSIONS.PERFORMANCE_CREATE_REVIEW,
      PERMISSIONS.PERFORMANCE_VIEW_ALL,
      PERMISSIONS.PERFORMANCE_APPROVE,
      PERMISSIONS.PERFORMANCE_SET_GOALS,
      
      // Time & Attendance - Full access
      PERMISSIONS.TIME_VIEW_ALL,
      PERMISSIONS.TIME_APPROVE,
      PERMISSIONS.TIME_EDIT,
      
      // Payroll - View and process
      PERMISSIONS.PAYROLL_VIEW_ALL,
      PERMISSIONS.PAYROLL_PROCESS,
      PERMISSIONS.PAYROLL_GENERATE_REPORTS,
      
      // Disciplinary - Full access
      PERMISSIONS.DISCIPLINARY_CREATE,
      PERMISSIONS.DISCIPLINARY_VIEW,
      PERMISSIONS.DISCIPLINARY_APPROVE,
      
      // Termination - Can initiate, needs director approval
      PERMISSIONS.TERMINATION_INITIATE,
      PERMISSIONS.TERMINATION_VIEW,
      
      // Recruitment - Full access
      PERMISSIONS.RECRUITMENT_POST_JOBS,
      PERMISSIONS.RECRUITMENT_VIEW_APPLICATIONS,
      PERMISSIONS.RECRUITMENT_SCHEDULE_INTERVIEWS,
      PERMISSIONS.RECRUITMENT_MAKE_OFFERS,
      
      // Documents - Full access
      PERMISSIONS.DOCUMENTS_UPLOAD,
      PERMISSIONS.DOCUMENTS_VIEW_ALL,
      PERMISSIONS.DOCUMENTS_MANAGE_ACCESS,
      PERMISSIONS.DOCUMENTS_DELETE,
      
      // Reporting
      PERMISSIONS.REPORTS_GENERATE,
      PERMISSIONS.REPORTS_VIEW_ALL,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.ANALYTICS_VIEW,
      
      // Finance - Limited
      PERMISSIONS.FINANCE_VIEW_REPORTS,
      PERMISSIONS.FINANCE_APPROVE_EXPENSES,
    ],
    constraints: {
      expenseLimit: 50000 // R50,000 expense approval limit
    }
  },

  // Department Manager - Manage their department only
  DEPARTMENT_MANAGER: {
    permissions: [
      // Employee Management - Department only
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.EMPLOYEE_UPDATE,
      PERMISSIONS.EMPLOYEE_VIEW_DEPARTMENT,
      PERMISSIONS.EMPLOYEE_VIEW_SALARY,
      
      // Leave Management - Department approval
      PERMISSIONS.LEAVE_VIEW_TEAM,
      PERMISSIONS.LEAVE_APPROVE_DEPARTMENT,
      PERMISSIONS.LEAVE_REJECT,
      
      // Performance Management - Department only
      PERMISSIONS.PERFORMANCE_CREATE_REVIEW,
      PERMISSIONS.PERFORMANCE_VIEW_TEAM,
      PERMISSIONS.PERFORMANCE_APPROVE,
      PERMISSIONS.PERFORMANCE_SET_GOALS,
      
      // Time & Attendance - Department
      PERMISSIONS.TIME_VIEW_TEAM,
      PERMISSIONS.TIME_APPROVE,
      
      // Payroll - View department only
      PERMISSIONS.PAYROLL_VIEW_OWN,
      
      // Disciplinary - Can initiate for department
      PERMISSIONS.DISCIPLINARY_CREATE,
      PERMISSIONS.DISCIPLINARY_VIEW,
      
      // Recruitment - Department positions
      PERMISSIONS.RECRUITMENT_POST_JOBS,
      PERMISSIONS.RECRUITMENT_VIEW_APPLICATIONS,
      PERMISSIONS.RECRUITMENT_SCHEDULE_INTERVIEWS,
      
      // Documents - Department access
      PERMISSIONS.DOCUMENTS_UPLOAD,
      PERMISSIONS.DOCUMENTS_VIEW_ALL,
      
      // Finance - Limited
      PERMISSIONS.FINANCE_VIEW_REPORTS,
      PERMISSIONS.FINANCE_APPROVE_EXPENSES,
      
      // Reporting - Department level
      PERMISSIONS.REPORTS_GENERATE,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    constraints: {
      departmentOnly: true,
      expenseLimit: 25000 // R25,000 expense approval limit
    }
  },

  // Supervisor - Team level management
  SUPERVISOR: {
    permissions: [
      // Employee Management - Team only
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.EMPLOYEE_VIEW_DEPARTMENT,
      
      // Leave Management - Team approval for basic leave
      PERMISSIONS.LEAVE_VIEW_TEAM,
      PERMISSIONS.LEAVE_APPROVE_TEAM,
      
      // Performance Management - Team only
      PERMISSIONS.PERFORMANCE_CREATE_REVIEW,
      PERMISSIONS.PERFORMANCE_VIEW_TEAM,
      PERMISSIONS.PERFORMANCE_SET_GOALS,
      
      // Time & Attendance - Team
      PERMISSIONS.TIME_VIEW_TEAM,
      PERMISSIONS.TIME_APPROVE,
      
      // Basic document access
      PERMISSIONS.DOCUMENTS_VIEW_OWN,
      PERMISSIONS.DOCUMENTS_UPLOAD,
      
      // Basic reporting
      PERMISSIONS.REPORTS_GENERATE,
    ],
    constraints: {
      teamOnly: true,
      expenseLimit: 10000 // R10,000 expense approval limit
    }
  },

  // Senior Employee - Some additional privileges
  SENIOR_EMPLOYEE: {
    permissions: [
      // Basic employee permissions
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.LEAVE_CREATE,
      PERMISSIONS.LEAVE_VIEW_OWN,
      PERMISSIONS.PERFORMANCE_VIEW_OWN,
      PERMISSIONS.TIME_CLOCK_IN_OUT,
      PERMISSIONS.TIME_VIEW_OWN,
      PERMISSIONS.PAYROLL_VIEW_OWN,
      PERMISSIONS.DOCUMENTS_UPLOAD,
      PERMISSIONS.DOCUMENTS_VIEW_OWN,
      PERMISSIONS.FINANCE_GENERATE_RECEIPTS,
      
      // Additional privileges
      PERMISSIONS.PERFORMANCE_SET_GOALS, // Can set own goals
      PERMISSIONS.TIME_EDIT, // Can edit own time entries
    ],
    constraints: {
      expenseLimit: 5000 // R5,000 expense approval limit
    }
  },

  // Regular Employee - Basic access
  EMPLOYEE: {
    permissions: [
      PERMISSIONS.EMPLOYEE_READ, // Can read basic employee info
      PERMISSIONS.LEAVE_CREATE,
      PERMISSIONS.LEAVE_VIEW_OWN,
      PERMISSIONS.PERFORMANCE_VIEW_OWN,
      PERMISSIONS.TIME_CLOCK_IN_OUT,
      PERMISSIONS.TIME_VIEW_OWN,
      PERMISSIONS.PAYROLL_VIEW_OWN,
      PERMISSIONS.DOCUMENTS_UPLOAD, // Upload personal documents
      PERMISSIONS.DOCUMENTS_VIEW_OWN,
      PERMISSIONS.FINANCE_GENERATE_RECEIPTS, // Basic finance operations
    ],
    constraints: {
      expenseLimit: 1000 // R1,000 expense limit
    }
  },

  // Intern - Very restricted access
  INTERN: {
    permissions: [
      PERMISSIONS.LEAVE_CREATE, // Can request leave
      PERMISSIONS.LEAVE_VIEW_OWN,
      PERMISSIONS.PERFORMANCE_VIEW_OWN,
      PERMISSIONS.TIME_CLOCK_IN_OUT,
      PERMISSIONS.TIME_VIEW_OWN,
      PERMISSIONS.DOCUMENTS_VIEW_OWN, // Can only view own documents
      PERMISSIONS.FINANCE_GENERATE_RECEIPTS, // Basic receipts only
    ],
    constraints: {
      expenseLimit: 500 // R500 expense limit
    }
  },
};

// Approval workflow configurations by role
export const APPROVAL_WORKFLOWS = {
  LEAVE_REQUEST: {
    EMPLOYEE: [
      { step: 1, requiredRole: 'SUPERVISOR', optional: false },
      { step: 2, requiredRole: 'DEPARTMENT_MANAGER', optional: false },
    ],
    SENIOR_EMPLOYEE: [
      { step: 1, requiredRole: 'DEPARTMENT_MANAGER', optional: false },
    ],
    SUPERVISOR: [
      { step: 1, requiredRole: 'DEPARTMENT_MANAGER', optional: false },
    ],
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false },
    ],
    DIRECTOR: [], // No approval needed - directors have full power
    SUPER_ADMIN: [], // System admin - unlimited access
  },
  
  EXPENSE_APPROVAL: {
    EMPLOYEE: [
      { step: 1, requiredRole: 'SUPERVISOR', optional: false, maxAmount: 1000 },
      { step: 2, requiredRole: 'DEPARTMENT_MANAGER', optional: false, maxAmount: 10000 },
      { step: 3, requiredRole: 'HR_MANAGER', optional: false, maxAmount: 50000 },
      { step: 4, requiredRole: 'DIRECTOR', optional: false }, // Above 50k
    ],
    SUPERVISOR: [
      { step: 1, requiredRole: 'DEPARTMENT_MANAGER', optional: false, maxAmount: 25000 },
      { step: 2, requiredRole: 'HR_MANAGER', optional: false, maxAmount: 50000 },
      { step: 3, requiredRole: 'DIRECTOR', optional: false }, // Above 50k
    ],
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false, maxAmount: 50000 },
      { step: 2, requiredRole: 'DIRECTOR', optional: false }, // Above 50k
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false }, // Above 50k
    ],
    DIRECTOR: [], // No approval needed - full power
  },

  DISCIPLINARY_ACTION: {
    SUPERVISOR: [
      { step: 1, requiredRole: 'DEPARTMENT_MANAGER', optional: false },
      { step: 2, requiredRole: 'HR_MANAGER', optional: false },
    ],
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve disciplinary
    ],
    DIRECTOR: [], // Directors have full disciplinary power
  },

  TERMINATION: {
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
      { step: 2, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve terminations
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve terminations
    ],
    DIRECTOR: [], // Directors can terminate without approval
  },

  PERFORMANCE_REVIEW: {
    SUPERVISOR: [
      { step: 1, requiredRole: 'DEPARTMENT_MANAGER', optional: false },
    ],
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
    ],
    HR_MANAGER: [], // HR can approve reviews
    DIRECTOR: [], // Directors can approve reviews
  },

  SALARY_CHANGE: {
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
      { step: 2, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve salary changes
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve salary changes
    ],
    DIRECTOR: [], // Directors can change salaries without approval
  },

  PROMOTION: {
    DEPARTMENT_MANAGER: [
      { step: 1, requiredRole: 'HR_MANAGER', optional: false },
      { step: 2, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve promotions
    ],
    HR_MANAGER: [
      { step: 1, requiredRole: 'DIRECTOR', optional: false }, // Directors must approve promotions
    ],
    DIRECTOR: [], // Directors can promote without approval
  },
};

// Helper functions to check permissions
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  return roleConfig?.permissions?.includes(permission) || false;
}

export function canApprove(
  approverRole: Role, 
  requestType: keyof typeof APPROVAL_WORKFLOWS,
  requesterRole: Role,
  currentStep: number,
  amount?: number
): boolean {
  const workflow = APPROVAL_WORKFLOWS[requestType][requesterRole];
  if (!workflow) return false;
  
  const stepConfig = workflow.find(step => step.step === currentStep);
  if (!stepConfig) return false;
  
  if (stepConfig.requiredRole !== approverRole) return false;
  
  // Check amount limits for expense approvals
  if (requestType === 'EXPENSE_APPROVAL' && amount && stepConfig.maxAmount) {
    return amount <= stepConfig.maxAmount;
  }
  
  return true;
}

export function getNextApprovalStep(
  requestType: keyof typeof APPROVAL_WORKFLOWS,
  requesterRole: Role,
  currentStep: number
): { step: number; requiredRole: Role } | null {
  const workflow = APPROVAL_WORKFLOWS[requestType][requesterRole];
  if (!workflow) return null;
  
  const nextStepConfig = workflow.find(step => step.step === currentStep + 1);
  return nextStepConfig ? {
    step: nextStepConfig.step,
    requiredRole: nextStepConfig.requiredRole as Role
  } : null;
}

export function getRoleConstraints(role: Role) {
  return ROLE_PERMISSIONS[role].constraints || {};
}

// Salary limits that each role can manage
export const SALARY_LIMITS = {
  DIRECTOR: null, // No limit - directors have full power
  HR_MANAGER: 1000000, // R1M
  DEPARTMENT_MANAGER: 500000, // R500k
  SUPERVISOR: 100000, // R100k
  SENIOR_EMPLOYEE: null, // Cannot manage salaries
  EMPLOYEE: null, // Cannot manage salaries
  INTERN: null, // Cannot manage salaries
};

// Security clearance levels each role can access
export const CLEARANCE_ACCESS = {
  DIRECTOR: ['NONE', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'], // Directors have access to everything
  HR_MANAGER: ['NONE', 'CONFIDENTIAL', 'SECRET'],
  DEPARTMENT_MANAGER: ['NONE', 'CONFIDENTIAL'],
  SUPERVISOR: ['NONE', 'CONFIDENTIAL'],
  SENIOR_EMPLOYEE: ['NONE'],
  EMPLOYEE: ['NONE'],
  INTERN: ['NONE'],
};

// Document access levels by role
export const DOCUMENT_ACCESS = {
  DIRECTOR: 'ALL', // Directors can access all documents
  HR_MANAGER: 'HR_ALL', // All HR-related documents
  DEPARTMENT_MANAGER: 'DEPARTMENT', // Department-specific documents
  SUPERVISOR: 'TEAM', // Team-specific documents
  SENIOR_EMPLOYEE: 'OWN_PLUS', // Own documents plus some shared
  EMPLOYEE: 'OWN', // Only own documents
  INTERN: 'OWN_LIMITED', // Limited own documents
};

// Maximum team size each role can manage
export const TEAM_SIZE_LIMITS = {
  DIRECTOR: null, // No limit
  HR_MANAGER: null, // No limit
  DEPARTMENT_MANAGER: 50, // Up to 50 people per department
  SUPERVISOR: 15, // Up to 15 direct reports
  SENIOR_EMPLOYEE: 5, // Can mentor up to 5 junior staff
  EMPLOYEE: 0,
  INTERN: 0,
};

// Working hours modification permissions
export const SCHEDULE_PERMISSIONS = {
  DIRECTOR: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE'], // Full schedule control
  HR_MANAGER: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
  DEPARTMENT_MANAGER: ['CREATE', 'UPDATE', 'APPROVE'], // Cannot delete schedules
  SUPERVISOR: ['UPDATE', 'APPROVE'], // Can modify team schedules
  SENIOR_EMPLOYEE: ['UPDATE'], // Can request schedule changes
  EMPLOYEE: ['REQUEST'], // Can only request schedule changes
  INTERN: ['REQUEST'], // Can only request schedule changes
};