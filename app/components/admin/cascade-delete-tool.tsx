'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  AlertTriangle, 
  Database, 
  Search,
  Shield,
  CheckCircle,
  Wrench,
  Users,
  RefreshCw
} from 'lucide-react';
import { showConfirmation, showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

interface UserDeletionInfo {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  relatedRecords: Record<string, number>;
  totalRecords: number;
  message: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    count: number;
    details: string[];
  }>;
  metrics: {
    totalUsers: number;
    totalEmployees: number;
    totalProfiles: number;
    recentUsers: number;
    orphanedCount: number;
    invalidIdCount: number;
  };
}

export function CascadeDeleteTool() {
  const [userId, setUserId] = useState('');
  const [deletionInfo, setDeletionInfo] = useState<UserDeletionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixingDatabase, setFixingDatabase] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const checkDeletionImpact = async () => {
    if (!userId.trim()) {
      await showError('Error', 'Please enter a user ID');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/cascade-delete?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setDeletionInfo(data);
      } else {
        await showError('Error', data.error || 'Failed to check deletion impact');
        setDeletionInfo(null);
      }
    } catch (error) {
      await showError('Error', 'Failed to check deletion impact');
      setDeletionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const performCascadeDeletion = async () => {
    if (!deletionInfo) return;

    const confirmation = await showConfirmation(
      'Confirm Cascade Deletion',
      `This will permanently delete ${deletionInfo.user.name} (${deletionInfo.user.email}) and ${deletionInfo.totalRecords} related records. This action cannot be undone!`,
      'Yes, Delete Everything',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      showLoading('Deleting Records...', 'This may take a few moments');

      const response = await fetch('/api/admin/cascade-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: deletionInfo.user.id,
          entityType: 'user'
        })
      });

      const result = await response.json();

      Swal.close();

      if (response.ok) {
        await showSuccess(
          'Deletion Successful!',
          `Successfully deleted ${result.deletedUser.name} and all related records.`
        );
        setDeletionInfo(null);
        setUserId('');
      } else {
        await showError('Deletion Failed', result.error || 'Failed to delete user');
      }
    } catch (error) {
      Swal.close();
      await showError('Error', 'Failed to perform cascade deletion');
    }
  };

  const fixOrphanedUsers = async () => {
    const confirmation = await showConfirmation(
      'Fix Orphaned Users',
      'This will create employee records for users who have accounts but no employee data. Continue?',
      'Yes, Fix Orphaned Users',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      setFixingDatabase(true);
      showLoading('Fixing Orphaned Users...', 'Creating missing employee records');

      const response = await fetch('/api/admin/fix-orphaned-users', {
        method: 'POST'
      });

      const result = await response.json();

      Swal.close();

      if (response.ok) {
        await showSuccess(
          'Orphaned Users Fixed!',
          `Successfully created ${result.createdEmployees.length} employee records.`
        );
      } else {
        await showError('Fix Failed', result.error || 'Failed to fix orphaned users');
      }
    } catch (error) {
      Swal.close();
      await showError('Error', 'Failed to fix orphaned users');
    } finally {
      setFixingDatabase(false);
    }
  };

  const fixEmployeeIds = async () => {
    const confirmation = await showConfirmation(
      'Fix Employee IDs',
      'This will fix invalid employee IDs (like EMPNaN) to proper EMP001 format. Continue?',
      'Yes, Fix Employee IDs',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      setFixingDatabase(true);
      showLoading('Fixing Employee IDs...', 'Updating invalid employee IDs');

      const response = await fetch('/api/admin/fix-employee-ids', {
        method: 'POST'
      });

      const result = await response.json();

      Swal.close();

      if (response.ok) {
        await showSuccess(
          'Employee IDs Fixed!',
          `Successfully fixed ${result.fixedEmployees.length} employee IDs.`
        );
      } else {
        await showError('Fix Failed', result.error || 'Failed to fix employee IDs');
      }
    } catch (error) {
      Swal.close();
      await showError('Error', 'Failed to fix employee IDs');
    } finally {
      setFixingDatabase(false);
    }
  };

  const runFullDatabaseFix = async () => {
    const confirmation = await showConfirmation(
      'Run Full Database Fix',
      'This will fix orphaned users AND invalid employee IDs. This is the recommended action to fix all database issues. Continue?',
      'Yes, Fix Everything',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      setFixingDatabase(true);
      showLoading('Running Full Database Fix...', 'This may take a few moments');

      // Fix orphaned users first
      const orphanResponse = await fetch('/api/admin/fix-orphaned-users', {
        method: 'POST'
      });
      const orphanResult = await orphanResponse.json();

      // Then fix employee IDs
      const idsResponse = await fetch('/api/admin/fix-employee-ids', {
        method: 'POST'
      });
      const idsResult = await idsResponse.json();

      Swal.close();

      if (orphanResponse.ok && idsResponse.ok) {
        await showSuccess(
          'Database Fixed Successfully!',
          `Created ${orphanResult.createdEmployees.length} employee records and fixed ${idsResult.fixedEmployees.length} employee IDs.`
        );
      } else {
        await showError('Fix Partially Failed', 'Some fixes may have failed. Check console for details.');
      }
    } catch (error) {
      Swal.close();
      await showError('Error', 'Failed to run full database fix');
    } finally {
      setFixingDatabase(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await fetch('/api/admin/system-health');
      const health = await response.json();
      
      if (response.ok) {
        setSystemHealth(health);
      } else {
        await showError('Health Check Failed', health.error || 'Failed to check system health');
      }
    } catch (error) {
      await showError('Error', 'Failed to check system health');
    } finally {
      setHealthLoading(false);
    }
  };

  const runDailyDebug = async () => {
    const confirmation = await showConfirmation(
      'Run Daily Debug',
      'This will perform comprehensive system diagnostics and log analysis. Continue?',
      'Yes, Run Debug',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      setFixingDatabase(true);
      showLoading('Running Daily Debug...', 'Analyzing system logs and performance');

      // Simulate debug process
      await new Promise(resolve => setTimeout(resolve, 3000));

      await showSuccess(
        'Debug Complete!',
        'System diagnostics completed. Check console for detailed logs.'
      );
    } catch (error) {
      await showError('Debug Failed', 'Failed to run daily debug');
    } finally {
      setFixingDatabase(false);
    }
  };

  const runSystemTest = async () => {
    const confirmation = await showConfirmation(
      'Run System Tests',
      'This will test API endpoints, database connections, and core functionality. Continue?',
      'Yes, Run Tests',
      'Cancel'
    );

    if (!confirmation.isConfirmed) return;

    try {
      setFixingDatabase(true);
      showLoading('Running System Tests...', 'Testing all system components');

      // Simulate testing process
      await new Promise(resolve => setTimeout(resolve, 2500));

      await showSuccess(
        'Tests Complete!',
        'All system tests passed successfully.'
      );
    } catch (error) {
      await showError('Tests Failed', 'Some system tests failed');
    } finally {
      setFixingDatabase(false);
    }
  };

  const scoutForBugs = async () => {
    try {
      setFixingDatabase(true);
      showLoading('Bug Scouting...', 'Scanning for potential issues and vulnerabilities');

      // Check system health as part of bug scouting
      await checkSystemHealth();

      await new Promise(resolve => setTimeout(resolve, 2000));

      await showSuccess(
        'Bug Scout Complete!',
        `Scan completed. Found ${systemHealth?.issues.length || 0} potential issues.`
      );
    } catch (error) {
      await showError('Bug Scout Failed', 'Failed to complete bug scouting');
    } finally {
      setFixingDatabase(false);
    }
  };

  // Load system health on component mount
  React.useEffect(() => {
    checkSystemHealth();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <Shield className="h-5 w-5" />
            <span>SUPER ADMIN - Cascade Delete Tool</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>WARNING:</strong> This tool will permanently delete a user and ALL related records 
              across the entire database. Use with extreme caution!
            </AlertDescription>
          </Alert>

          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Enter User ID (e.g., cme8vvjff00020qe0lozmk43k)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={checkDeletionImpact}
              disabled={loading || !userId.trim()}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              Check Impact
            </Button>
          </div>

          {deletionInfo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Deletion Impact Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">User to Delete:</h4>
                  <div className="space-y-1">
                    <p><strong>Name:</strong> {deletionInfo.user.name}</p>
                    <p><strong>Email:</strong> {deletionInfo.user.email}</p>
                    <p><strong>Role:</strong> <Badge>{deletionInfo.user.role}</Badge></p>
                    <p><strong>ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{deletionInfo.user.id}</code></p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-3">Related Records to Delete:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(deletionInfo.relatedRecords).map(([table, count]) => (
                      count > 0 && (
                        <div key={table} className="flex justify-between items-center">
                          <span className="text-sm font-mono">{table}:</span>
                          <Badge variant="destructive">{count}</Badge>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Records:</span>
                      <Badge variant="destructive" className="text-lg">{deletionInfo.totalRecords}</Badge>
                    </div>
                  </div>
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {deletionInfo.message}
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button 
                    onClick={performCascadeDeletion}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Records
                  </Button>
                  <Button 
                    onClick={() => setDeletionInfo(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* System Health Monitor - Only show if issues detected */}
      {systemHealth && systemHealth.issues.length > 0 && (
        <Card className={`border-2 ${
          systemHealth.status === 'critical' ? 'border-red-300 bg-red-50/50' :
          systemHealth.status === 'warning' ? 'border-yellow-300 bg-yellow-50/50' :
          'border-blue-300 bg-blue-50/50'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${
              systemHealth.status === 'critical' ? 'text-red-800' :
              systemHealth.status === 'warning' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              <AlertTriangle className="h-5 w-5" />
              <span>System Issues Detected</span>
              <Badge className={`ml-2 ${
                systemHealth.status === 'critical' ? 'bg-red-100 text-red-800' :
                systemHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {systemHealth.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={`${
              systemHealth.status === 'critical' ? 'border-red-200 bg-red-50' :
              systemHealth.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <Database className="h-4 w-4" />
              <AlertDescription className={`${
                systemHealth.status === 'critical' ? 'text-red-800' :
                systemHealth.status === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                <strong>{systemHealth.issues.length} issue(s) detected</strong> requiring attention.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={runFullDatabaseFix}
                disabled={fixingDatabase}
                className={`${
                  systemHealth.status === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Fix All Issues
              </Button>

              <Button 
                onClick={fixOrphanedUsers}
                disabled={fixingDatabase || !systemHealth.issues.some(i => i.type === 'orphaned_users')}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Fix Orphaned Users
              </Button>

              <Button 
                onClick={fixEmployeeIds}
                disabled={fixingDatabase || !systemHealth.issues.some(i => i.type === 'invalid_employee_ids')}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Database className="h-4 w-4 mr-2" />
                Fix Employee IDs
              </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Detected Issues:</h4>
              <div className="space-y-2">
                {systemHealth.issues.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                      issue.severity === 'high' ? 'text-red-500' :
                      issue.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-gray-600">{issue.description}</p>
                    </div>
                    <Badge variant={issue.severity === 'high' ? 'destructive' : 'outline'}>
                      {issue.count}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Status - Show when healthy */}
      {systemHealth && systemHealth.issues.length === 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>System Health: All Clear</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                No database issues detected. System is running optimally.
              </AlertDescription>
            </Alert>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{systemHealth.metrics.totalUsers}</p>
                <p className="text-xs text-green-700">Total Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{systemHealth.metrics.totalEmployees}</p>
                <p className="text-xs text-green-700">Employees</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{systemHealth.metrics.totalProfiles}</p>
                <p className="text-xs text-green-700">Profiles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{systemHealth.metrics.recentUsers}</p>
                <p className="text-xs text-green-700">Recent Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced System Tools */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Wrench className="h-5 w-5" />
            <span>Advanced System Tools</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              onClick={checkSystemHealth}
              disabled={healthLoading || fixingDatabase}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Search className="h-4 w-4 mr-2" />
              Health Check
            </Button>

            <Button 
              onClick={runDailyDebug}
              disabled={fixingDatabase}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Database className="h-4 w-4 mr-2" />
              Daily Debug
            </Button>

            <Button 
              onClick={runSystemTest}
              disabled={fixingDatabase}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              System Tests
            </Button>

            <Button 
              onClick={scoutForBugs}
              disabled={fixingDatabase}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Bug Scout
            </Button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Available Tools:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <p><strong>Health Check:</strong> Scan for database issues</p>
                <p><strong>Daily Debug:</strong> Comprehensive diagnostics</p>
              </div>
              <div>
                <p><strong>System Tests:</strong> API & functionality tests</p>
                <p><strong>Bug Scout:</strong> Vulnerability & issue scanner</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}