'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Key,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Shield,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface TemporaryCredential {
  id: string;
  employeeName: string;
  email: string;
  tempPassword: string;
  role: string;
  createdAt: string;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string;
  notes: string | null;
  employee: {
    name: string;
    employee?: {
      employeeId: string;
      title: string;
      department: string;
    };
  };
  creator: {
    name: string;
    email: string;
  };
}

export function CredentialsManager() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<TemporaryCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<TemporaryCredential | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, [showExpired]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/credentials?showExpired=${showExpired}`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      
      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch credentials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const markAsUsed = async (credentialId: string) => {
    try {
      const response = await fetch('/api/admin/credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId, action: 'mark_used' })
      });

      if (!response.ok) throw new Error('Failed to update credential');

      toast({
        title: 'Success',
        description: 'Credential marked as used',
      });

      fetchCredentials();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update credential',
        variant: 'destructive'
      });
    }
  };

  const filteredCredentials = credentials.filter(cred => 
    cred.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cred.employee.employee?.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DIRECTOR': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'HR_MANAGER': return <User className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DIRECTOR': return 'bg-yellow-100 text-yellow-800';
      case 'HR_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'DEPARTMENT_MANAGER': return 'bg-green-100 text-green-800';
      case 'SUPERVISOR': return 'bg-purple-100 text-purple-800';
      case 'SENIOR_EMPLOYEE': return 'bg-indigo-100 text-indigo-800';
      case 'EMPLOYEE': return 'bg-gray-100 text-gray-800';
      case 'INTERN': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading credentials...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Key className="h-6 w-6 mr-2 text-blue-600" />
            Temporary Credentials Manager
          </h2>
          <p className="text-gray-600">
            Manage and view temporary passwords for newly created employees and directors
          </p>
        </div>
        <Button onClick={fetchCredentials} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credentials</p>
                <p className="text-3xl font-bold text-blue-600">{credentials.length}</p>
              </div>
              <Key className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Credentials</p>
                <p className="text-3xl font-bold text-green-600">
                  {credentials.filter(c => !c.isUsed && !isPast(new Date(c.expiresAt))).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used Credentials</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {credentials.filter(c => c.isUsed).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-3xl font-bold text-red-600">
                  {credentials.filter(c => isPast(new Date(c.expiresAt))).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search credentials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-expired"
                  checked={showExpired}
                  onCheckedChange={setShowExpired}
                />
                <label htmlFor="show-expired" className="text-sm font-medium">
                  Show expired credentials
                </label>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredCredentials.length} of {credentials.length} credentials
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Credentials</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials.map((credential) => {
                const isExpired = isPast(new Date(credential.expiresAt));
                
                return (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{credential.employeeName}</div>
                        <div className="text-sm text-gray-500">{credential.email}</div>
                        {credential.employee.employee && (
                          <div className="text-xs text-gray-400">
                            ID: {credential.employee.employee.employeeId} • {credential.employee.employee.department}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(credential.role)}
                        <Badge className={getRoleBadgeColor(credential.role)}>
                          {credential.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {credential.tempPassword}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(credential.tempPassword, 'Password')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(credential.email, 'Email')}
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Email
                        </Button>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {credential.isUsed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Used
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expired
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(credential.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {isExpired ? (
                          <span className="text-red-600">
                            Expired {formatDistanceToNow(new Date(credential.expiresAt))} ago
                          </span>
                        ) : (
                          <span>
                            {formatDistanceToNow(new Date(credential.expiresAt))}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCredential(credential)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Credential Details</DialogTitle>
                            </DialogHeader>
                            {selectedCredential && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Employee Name</label>
                                    <p className="text-sm">{selectedCredential.employeeName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-sm font-mono">{selectedCredential.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Temporary Password</label>
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                        {selectedCredential.tempPassword}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(selectedCredential.tempPassword, 'Password')}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Role</label>
                                    <p className="text-sm">{selectedCredential.role.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                {selectedCredential.notes && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Notes</label>
                                    <p className="text-sm">{selectedCredential.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {!credential.isUsed && !isExpired && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsUsed(credential.id)}
                          >
                            Mark as Used
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredCredentials.length === 0 && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No credentials found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}