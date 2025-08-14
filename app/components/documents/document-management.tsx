'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2,
  Search,
  Filter,
  Plus,
  File,
  Image,
  FileSpreadsheet,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: string;
  category: 'CONTRACT' | 'ID_DOCUMENT' | 'CERTIFICATE' | 'POLICY' | 'FORM' | 'OTHER';
  employeeId?: string;
  employeeName?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  filePath: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
  expiryDate?: string;
}

const documentCategories = [
  { value: 'CONTRACT', label: 'Contracts', icon: FileText },
  { value: 'ID_DOCUMENT', label: 'ID Documents', icon: File },
  { value: 'CERTIFICATE', label: 'Certificates', icon: FileSpreadsheet },
  { value: 'POLICY', label: 'Policies', icon: FileText },
  { value: 'FORM', label: 'Forms', icon: File },
  { value: 'OTHER', label: 'Other', icon: File }
];

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: '',
    employeeId: '',
    expiryDate: '',
    file: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchEmployees();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Mock data since no API exists yet
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Employment Contract - John Smith',
          type: 'application/pdf',
          category: 'CONTRACT',
          employeeId: '1',
          employeeName: 'John Smith',
          uploadedBy: 'HR Manager',
          uploadedAt: '2024-01-15T10:30:00Z',
          fileSize: 2048000,
          filePath: '/documents/contracts/john-smith-contract.pdf',
          status: 'ACTIVE',
          expiryDate: '2025-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Company Policy Manual',
          type: 'application/pdf',
          category: 'POLICY',
          uploadedBy: 'Admin',
          uploadedAt: '2024-02-01T09:00:00Z',
          fileSize: 5120000,
          filePath: '/documents/policies/policy-manual.pdf',
          status: 'ACTIVE'
        },
        {
          id: '3',
          name: 'Safety Certificate - Workshop',
          type: 'application/pdf',
          category: 'CERTIFICATE',
          uploadedBy: 'Safety Officer',
          uploadedAt: '2024-01-20T14:15:00Z',
          fileSize: 1024000,
          filePath: '/documents/certificates/safety-cert.pdf',
          status: 'ACTIVE',
          expiryDate: '2024-12-31T00:00:00Z'
        }
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!newDocument.name || !newDocument.category || !newDocument.file) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Mock upload since no API exists
      const mockUpload: Document = {
        id: Date.now().toString(),
        name: newDocument.name,
        type: newDocument.file.type,
        category: newDocument.category as any,
        employeeId: newDocument.employeeId || undefined,
        employeeName: newDocument.employeeId ? employees.find(e => e.id === newDocument.employeeId)?.name : undefined,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
        fileSize: newDocument.file.size,
        filePath: `/documents/${newDocument.category.toLowerCase()}/${newDocument.file.name}`,
        status: 'ACTIVE',
        expiryDate: newDocument.expiryDate || undefined
      };

      setDocuments(prev => [mockUpload, ...prev]);
      setUploadDialogOpen(false);
      setNewDocument({
        name: '',
        category: '',
        employeeId: '',
        expiryDate: '',
        file: null
      });

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string, expiryDate?: string) => {
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    const variants = {
      ACTIVE: 'default',
      ARCHIVED: 'secondary',
      EXPIRED: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categoryStats = documentCategories.map(cat => ({
    ...cat,
    count: documents.filter(doc => doc.category === cat.value).length
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Document Management</h2>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="docName">Document Name</Label>
                <Input
                  id="docName"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  placeholder="Enter document name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newDocument.category} onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee (Optional)</Label>
                <Select value={newDocument.employeeId} onValueChange={(value) => setNewDocument({ ...newDocument, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific employee</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newDocument.expiryDate}
                  onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files?.[0] || null })}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleFileUpload}>Upload Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              All categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => {
                if (!d.expiryDate) return false;
                const expiry = new Date(d.expiryDate);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                return expiry <= thirtyDaysFromNow && expiry >= new Date();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, d) => sum + d.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total file size
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setCategoryFilter('all')}>
              All Documents
            </TabsTrigger>
            {categoryStats.map(cat => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
              >
                <cat.icon className="h-4 w-4 mr-1" />
                {cat.label} ({cat.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>
        </div>

        <TabsContent value={categoryFilter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Manage your organization's documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFileIcon(doc.type)}
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-muted-foreground">{doc.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {documentCategories.find(c => c.value === doc.category)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.employeeName ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {doc.employeeName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">by {doc.uploadedBy}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate ? (
                          <div className="text-sm">
                            {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(doc.status, doc.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}