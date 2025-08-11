
// Role-based permission system for Ekhaya Intel Trading

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR_DIRECTOR' | 'MANAGER' | 'EMPLOYEE';

export interface Permission {
  canViewEmployees: boolean;
  canEditEmployees: boolean;
  canDeleteEmployees: boolean;
  canViewLeaveRequests: boolean;
  canApproveLeaveRequests: boolean;
  canViewFinanceReports: boolean;
  canCreateFinanceReports: boolean;
  canViewExpenses: boolean;
  canApproveExpenses: boolean;
  canViewInventory: boolean;
  canManageInventory: boolean;
  canViewPerformance: boolean;
  canEditPerformance: boolean;
  canAccessAdminSettings: boolean;
}

export const getPermissions = (role: UserRole): Permission => {
  switch (role) {
    case 'SUPER_ADMIN':
      // Directors - Full access to everything
      return {
        canViewEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true,
        canViewLeaveRequests: true,
        canApproveLeaveRequests: true,
        canViewFinanceReports: true,
        canCreateFinanceReports: true,
        canViewExpenses: true,
        canApproveExpenses: true,
        canViewInventory: true,
        canManageInventory: true,
        canViewPerformance: true,
        canEditPerformance: true,
        canAccessAdminSettings: true,
      };

    case 'ADMIN':
      // System Administrators
      return {
        canViewEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true,
        canViewLeaveRequests: true,
        canApproveLeaveRequests: true,
        canViewFinanceReports: true,
        canCreateFinanceReports: true,
        canViewExpenses: true,
        canApproveExpenses: true,
        canViewInventory: true,
        canManageInventory: true,
        canViewPerformance: true,
        canEditPerformance: true,
        canAccessAdminSettings: false, // Only SUPER_ADMIN can access admin settings
      };

    case 'HR_DIRECTOR':
      // HR Director role
      return {
        canViewEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: false, // Can't delete employees
        canViewLeaveRequests: true,
        canApproveLeaveRequests: true,
        canViewFinanceReports: true,
        canCreateFinanceReports: false, // Can view but not create
        canViewExpenses: true,
        canApproveExpenses: false, // Can view but not approve
        canViewInventory: true,
        canManageInventory: false,
        canViewPerformance: true,
        canEditPerformance: true,
        canAccessAdminSettings: false,
      };

    case 'MANAGER':
      // Managers/Supervisors
      return {
        canViewEmployees: true,
        canEditEmployees: false, // Can view but not edit
        canDeleteEmployees: false,
        canViewLeaveRequests: true,
        canApproveLeaveRequests: true, // Can approve for their team
        canViewFinanceReports: true, // Limited access
        canCreateFinanceReports: false,
        canViewExpenses: true, // Limited access
        canApproveExpenses: false,
        canViewInventory: true,
        canManageInventory: false,
        canViewPerformance: true, // Can view their team's performance
        canEditPerformance: false,
        canAccessAdminSettings: false,
      };

    case 'EMPLOYEE':
      // Regular employees - very limited access
      return {
        canViewEmployees: true, // Can view employee directory
        canEditEmployees: false,
        canDeleteEmployees: false,
        canViewLeaveRequests: true, // Only their own
        canApproveLeaveRequests: false,
        canViewFinanceReports: false, // No access to finance
        canCreateFinanceReports: false,
        canViewExpenses: false,
        canApproveExpenses: false,
        canViewInventory: false,
        canManageInventory: false,
        canViewPerformance: true, // Only their own performance
        canEditPerformance: false,
        canAccessAdminSettings: false,
      };

    default:
      // Default to employee permissions
      return getPermissions('EMPLOYEE');
  }
};

export const hasPermission = (userRole: UserRole, permission: keyof Permission): boolean => {
  const permissions = getPermissions(userRole);
  return permissions[permission];
};

// Helper function to check if user can access a specific route/feature
export const canAccessFeature = (userRole: UserRole, feature: string): boolean => {
  switch (feature) {
    case 'employee-management':
      return hasPermission(userRole, 'canEditEmployees');
    case 'leave-approval':
      return hasPermission(userRole, 'canApproveLeaveRequests');
    case 'finance-management':
      return hasPermission(userRole, 'canViewFinanceReports');
    case 'expense-approval':
      return hasPermission(userRole, 'canApproveExpenses');
    case 'inventory-management':
      return hasPermission(userRole, 'canManageInventory');
    case 'admin-settings':
      return hasPermission(userRole, 'canAccessAdminSettings');
    default:
      return false;
  }
};
