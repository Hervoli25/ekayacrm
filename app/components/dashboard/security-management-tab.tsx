'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Globe,
  Server,
  Database,
  Wifi,
  WifiOff,
  Clock,
  Users,
  UserX,
  Bell,
  Settings,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Ban,
  Flag,
  Search,
  Filter,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  HardDrive
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  overview: {
    securityScore: number;
    activeThreats: number;
    resolvedIncidents: number;
    pendingAlerts: number;
    lastSecurityScan: string;
    complianceScore: number;
  };
  authentication: {
    totalSessions: number;
    activeSessions: number;
    failedLogins: number;
    lockedAccounts: number;
    passwordResets: number;
    mfaEnabled: number;
    mfaTotal: number;
    suspiciousLogins: number;
    uniqueIPs: number;
  };
  accessControl: {
    totalPermissions: number;
    roleBasedAccess: number;
    privilegedUsers: number;
    accessViolations: number;
    permissionChanges: number;
    adminAccounts: number;
    serviceAccounts: number;
    inactiveUsers: number;
  };
  infrastructure: {
    firewallStatus: 'active' | 'inactive';
    sslCertificates: {
      total: number;
      valid: number;
      expiring: number;
      expired: number;
    };
    encryption: {
      dataAtRest: boolean;
      dataInTransit: boolean;
      databaseEncryption: boolean;
      backupEncryption: boolean;
    };
    networkSecurity: {
      intrusions: number;
      blockedIPs: number;
      allowedIPs: number;
      vpnConnections: number;
    };
  };
  compliance: {
    popiCompliance: number;
    isoCompliance: number;
    gdprCompliance: number;
    auditTrail: boolean;
    dataRetention: boolean;
    privacyPolicies: boolean;
    securityTraining: number;
    lastAudit: string;
  };
  incidents: Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
    description: string;
    timestamp: string;
    assignedTo?: string;
    resolution?: string;
  }>;
  vulnerabilities: Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    affected: string;
    discovered: string;
    status: 'OPEN' | 'PATCHING' | 'FIXED' | 'ACCEPTED';
  }>;
  auditLog: Array<{
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    ip: string;
    userAgent: string;
    status: 'SUCCESS' | 'FAILURE';
  }>;
  trends: Array<{
    date: string;
    threats: number;
    incidents: number;
    failedLogins: number;
    securityScore: number;
  }>;
}

const SEVERITY_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  OPEN: 'bg-red-100 text-red-800',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800',
  PATCHING: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  FIXED: 'bg-green-100 text-green-800',
  ACCEPTED: 'bg-purple-100 text-purple-800'
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function SecurityManagementTab() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSecurityMetrics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSecurityMetrics();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeframe, autoRefresh]);

  const fetchSecurityMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in practice, this would come from security monitoring systems
      const mockMetrics: SecurityMetrics = {
        overview: {
          securityScore: 94.2,
          activeThreats: 2,
          resolvedIncidents: 15,
          pendingAlerts: 3,
          lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          complianceScore: 96.8
        },
        authentication: {
          totalSessions: 2847,
          activeSessions: 156,
          failedLogins: 23,
          lockedAccounts: 2,
          passwordResets: 8,
          mfaEnabled: 198,
          mfaTotal: 235,
          suspiciousLogins: 4,
          uniqueIPs: 87
        },
        accessControl: {
          totalPermissions: 1247,
          roleBasedAccess: 1198,
          privilegedUsers: 23,
          accessViolations: 1,
          permissionChanges: 12,
          adminAccounts: 8,
          serviceAccounts: 15,
          inactiveUsers: 5
        },
        infrastructure: {
          firewallStatus: 'active',
          sslCertificates: {
            total: 12,
            valid: 10,
            expiring: 2,
            expired: 0
          },
          encryption: {
            dataAtRest: true,
            dataInTransit: true,
            databaseEncryption: true,
            backupEncryption: true
          },
          networkSecurity: {
            intrusions: 0,
            blockedIPs: 2841,
            allowedIPs: 156,
            vpnConnections: 45
          }
        },
        compliance: {
          popiCompliance: 98.5,
          isoCompliance: 95.2,
          gdprCompliance: 97.8,
          auditTrail: true,
          dataRetention: true,
          privacyPolicies: true,
          securityTraining: 92.1,
          lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        incidents: [
          {
            id: 'INC-001',
            type: 'Suspicious Login',
            severity: 'MEDIUM',
            status: 'INVESTIGATING',
            description: 'Multiple failed login attempts from unusual location',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'Security Team'
          },
          {
            id: 'INC-002',
            type: 'Access Violation',
            severity: 'HIGH',
            status: 'RESOLVED',
            description: 'Unauthorized access attempt to admin panel',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            assignedTo: 'IT Security',
            resolution: 'Account suspended, investigating further'
          }
        ],
        vulnerabilities: [
          {
            id: 'VULN-001',
            type: 'Software Vulnerability',
            severity: 'MEDIUM',
            description: 'Outdated Node.js version with known security issues',
            affected: 'Application Server',
            discovered: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'PATCHING'
          },
          {
            id: 'VULN-002',
            type: 'SSL Certificate',
            severity: 'HIGH',
            description: 'SSL certificate expiring in 7 days',
            affected: 'Web Server',
            discovered: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            status: 'OPEN'
          }
        ],
        auditLog: [
          {
            id: 'AUDIT-001',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            user: 'admin@company.com',
            action: 'USER_LOGIN',
            resource: '/dashboard',
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            status: 'SUCCESS'
          },
          {
            id: 'AUDIT-002',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            user: 'user@company.com',
            action: 'PASSWORD_RESET',
            resource: '/auth/reset',
            ip: '192.168.1.150',
            userAgent: 'Mozilla/5.0...',
            status: 'SUCCESS'
          }
        ],
        trends: [
          { date: '2024-01', threats: 5, incidents: 2, failedLogins: 45, securityScore: 92.1 },
          { date: '2024-02', threats: 3, incidents: 1, failedLogins: 32, securityScore: 93.5 },
          { date: '2024-03', threats: 7, incidents: 4, failedLogins: 67, securityScore: 91.2 },
          { date: '2024-04', threats: 2, incidents: 1, failedLogins: 28, securityScore: 94.8 },
          { date: '2024-05', threats: 4, incidents: 2, failedLogins: 41, securityScore: 93.9 },
          { date: '2024-06', threats: 2, incidents: 1, failedLogins: 23, securityScore: 94.2 }
        ]
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM': return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <Flag className="h-4 w-4 text-green-500" />;
      default: return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading security metrics...
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const threatData = [
    { name: 'Resolved', value: metrics.overview.resolvedIncidents, color: COLORS[0] },
    { name: 'Active', value: metrics.overview.activeThreats, color: COLORS[1] },
    { name: 'Pending Alerts', value: metrics.overview.pendingAlerts, color: COLORS[2] }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Security Dashboard</h3>
          <p className="text-sm text-gray-600">
            Comprehensive security monitoring and threat analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm">Auto Refresh</span>
          </div>
          
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchSecurityMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.overview.securityScore.toFixed(1)}%
                </p>
                <p className="text-xs text-green-500">Excellent</p>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Shield className="h-8 w-8 text-green-500 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Threats</p>
                <p className="text-3xl font-bold text-red-600">{metrics.overview.activeThreats}</p>
                <p className="text-xs text-red-500">Monitoring</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.authentication.activeSessions}</p>
                <p className="text-xs text-blue-500">
                  {metrics.authentication.uniqueIPs} unique IPs
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics.compliance.popiCompliance.toFixed(1)}%
                </p>
                <p className="text-xs text-purple-500">POPI Act</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication & Access Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Authentication Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.authentication.totalSessions}</p>
                <p className="text-xs text-gray-600">Total Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{metrics.authentication.failedLogins}</p>
                <p className="text-xs text-gray-600">Failed Logins</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">MFA Coverage</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {Math.round((metrics.authentication.mfaEnabled / metrics.authentication.mfaTotal) * 100)}%
                </Badge>
              </div>
              <Progress 
                value={(metrics.authentication.mfaEnabled / metrics.authentication.mfaTotal) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-gray-600">
                {metrics.authentication.mfaEnabled} of {metrics.authentication.mfaTotal} users have MFA enabled
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-lg font-bold text-yellow-600">{metrics.authentication.lockedAccounts}</p>
                <p className="text-xs text-yellow-600">Locked Accounts</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-600">{metrics.authentication.suspiciousLogins}</p>
                <p className="text-xs text-red-600">Suspicious Logins</p>
              </div>
            </div>

            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-lg font-bold text-blue-600">{metrics.authentication.passwordResets}</p>
              <p className="text-xs text-blue-600">Password Resets (24h)</p>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metrics.accessControl.totalPermissions}</p>
                <p className="text-xs text-gray-600">Total Permissions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{metrics.accessControl.privilegedUsers}</p>
                <p className="text-xs text-gray-600">Privileged Users</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Role-based Access</span>
                <span className="font-medium">{metrics.accessControl.roleBasedAccess}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Admin Accounts</span>
                <span className="font-medium text-red-600">{metrics.accessControl.adminAccounts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Accounts</span>
                <span className="font-medium">{metrics.accessControl.serviceAccounts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Inactive Users</span>
                <span className="font-medium text-yellow-600">{metrics.accessControl.inactiveUsers}</span>
              </div>
            </div>

            {metrics.accessControl.accessViolations > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {metrics.accessControl.accessViolations} access violation(s) detected
                  </span>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  {metrics.accessControl.permissionChanges} permission changes (24h)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Network Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Firewall Status</span>
              <Badge className="bg-green-100 text-green-800">
                {metrics.infrastructure.firewallStatus.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Blocked IPs</span>
                <span className="font-medium text-red-600">
                  {metrics.infrastructure.networkSecurity.blockedIPs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Allowed IPs</span>
                <span className="font-medium text-green-600">
                  {metrics.infrastructure.networkSecurity.allowedIPs}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VPN Connections</span>
                <span className="font-medium">{metrics.infrastructure.networkSecurity.vpnConnections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Intrusion Attempts</span>
                <span className="font-medium text-green-600">
                  {metrics.infrastructure.networkSecurity.intrusions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SSL Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              SSL Certificates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {metrics.infrastructure.sslCertificates.valid}
              </p>
              <p className="text-xs text-gray-600">Valid Certificates</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-lg font-bold text-yellow-600">
                  {metrics.infrastructure.sslCertificates.expiring}
                </p>
                <p className="text-xs text-yellow-600">Expiring</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-600">
                  {metrics.infrastructure.sslCertificates.expired}
                </p>
                <p className="text-xs text-red-600">Expired</p>
              </div>
            </div>

            {metrics.infrastructure.sslCertificates.expiring > 0 && (
              <div className="bg-yellow-50 p-2 rounded text-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs text-yellow-700">
                  {metrics.infrastructure.sslCertificates.expiring} certificate(s) expiring soon
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Encryption Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Encryption Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Data at Rest</span>
                {metrics.infrastructure.encryption.dataAtRest ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data in Transit</span>
                {metrics.infrastructure.encryption.dataInTransit ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                {metrics.infrastructure.encryption.databaseEncryption ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backups</span>
                {metrics.infrastructure.encryption.backupEncryption ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                All encryption protocols active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Incidents & Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Security Incidents
              </div>
              <Badge variant="outline">{metrics.incidents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{incident.type}</h4>
                        <Badge className={SEVERITY_COLORS[incident.severity]} variant="outline">
                          {incident.severity}
                        </Badge>
                        <Badge className={STATUS_COLORS[incident.status]} variant="outline">
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{incident.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(incident.timestamp).toLocaleString()}</span>
                        {incident.assignedTo && <span>Assigned: {incident.assignedTo}</span>}
                      </div>
                      {incident.resolution && (
                        <p className="text-xs text-green-600 mt-1">
                          Resolution: {incident.resolution}
                        </p>
                      )}
                    </div>
                    {getSeverityIcon(incident.severity)}
                  </div>
                </div>
              ))}
              
              {metrics.incidents.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No security incidents</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vulnerabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bug className="h-5 w-5 mr-2" />
                Vulnerabilities
              </div>
              <Badge variant="outline">{metrics.vulnerabilities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{vuln.type}</h4>
                        <Badge className={SEVERITY_COLORS[vuln.severity]} variant="outline">
                          {vuln.severity}
                        </Badge>
                        <Badge className={STATUS_COLORS[vuln.status]} variant="outline">
                          {vuln.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{vuln.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Affected: {vuln.affected}</span>
                        <span>Found: {new Date(vuln.discovered).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getSeverityIcon(vuln.severity)}
                  </div>
                </div>
              ))}
              
              {metrics.vulnerabilities.length === 0 && (
                <div className="text-center py-6">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No known vulnerabilities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">POPI Act Compliance</span>
                <Badge className="bg-green-100 text-green-800">
                  {metrics.compliance.popiCompliance.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={metrics.compliance.popiCompliance} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ISO 27001</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {metrics.compliance.isoCompliance.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={metrics.compliance.isoCompliance} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">GDPR Compliance</span>
                <Badge className="bg-purple-100 text-purple-800">
                  {metrics.compliance.gdprCompliance.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={metrics.compliance.gdprCompliance} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`h-4 w-4 ${metrics.compliance.auditTrail ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm">Audit Trail</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`h-4 w-4 ${metrics.compliance.dataRetention ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm">Data Retention</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`h-4 w-4 ${metrics.compliance.privacyPolicies ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm">Privacy Policies</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{metrics.compliance.securityTraining.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">Security Training</p>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-600">
            Last audit: {new Date(metrics.compliance.lastAudit).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Security Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Security Trends (6 Month View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="threats" stroke="#ef4444" name="Threats" strokeWidth={2} />
              <Line type="monotone" dataKey="incidents" stroke="#f59e0b" name="Incidents" strokeWidth={2} />
              <Line type="monotone" dataKey="failedLogins" stroke="#8b5cf6" name="Failed Logins" strokeWidth={2} />
              <Line type="monotone" dataKey="securityScore" stroke="#10b981" name="Security Score" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}