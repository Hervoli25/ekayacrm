
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/permissions';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Director', variant: 'default' as const, color: 'bg-purple-600 text-white' };
      case 'ADMIN':
        return { label: 'Admin', variant: 'destructive' as const, color: 'bg-red-600 text-white' };
      case 'HR_DIRECTOR':
        return { label: 'HR Director', variant: 'default' as const, color: 'bg-blue-600 text-white' };
      case 'MANAGER':
        return { label: 'Manager', variant: 'secondary' as const, color: 'bg-green-600 text-white' };
      case 'EMPLOYEE':
        return { label: 'Employee', variant: 'outline' as const, color: 'bg-gray-600 text-white' };
      default:
        return { label: 'Unknown', variant: 'outline' as const, color: 'bg-gray-400 text-white' };
    }
  };

  const roleInfo = getRoleDisplay(role);

  return (
    <Badge 
      variant={roleInfo.variant} 
      className={`${roleInfo.color} ${className}`}
    >
      {roleInfo.label}
    </Badge>
  );
}
