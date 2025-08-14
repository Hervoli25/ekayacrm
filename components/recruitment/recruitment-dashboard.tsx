'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  postedBy: string;
  postedAt: string;
  applicationsCount: number;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  resumePath: string;
  coverLetter: string;
  status: 'PENDING' | 'REVIEWED' | 'INTERVIEWED' | 'OFFERED' | 'REJECTED' | 'HIRED';
  appliedAt: string;
  reviewedBy?: string;
  notes?: string;
}

const jobTypes = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Internship' }
];

const applicationStatuses = [
  { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'REVIEWED', label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  { value: 'INTERVIEWED', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
  { value: 'OFFERED', label: 'Job Offered', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'HIRED', label: 'Hired', color: 'bg-green-100 text-green-800' }
];

export default function RecruitmentDashboard() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data since no API exists
      const mockJobs: JobPosting[] = [
        {
          id: '1',
          title: 'Software Developer',
          department: 'Technology',
          location: 'Cape Town, South Africa',
          type: 'FULL_TIME',
          salaryMin: 350000,
          salaryMax: 450000,
          description: 'We are looking for a skilled Software Developer to join our growing tech team...',
          requirements: 'Bachelor\'s degree in Computer Science, 3+ years of experience with React, Node.js...',
          status: 'ACTIVE',
          postedBy: 'HR Manager',
          postedAt: '2024-01-15T10:00:00Z',
          applicationsCount: 12
        },
        {
          id: '2',
          title: 'Marketing Specialist',
          department: 'Marketing',
          location: 'Johannesburg, South Africa',
          type: 'FULL_TIME',
          salaryMin: 280000,
          salaryMax: 350000,
          description: 'Join our dynamic marketing team as a Marketing Specialist...',
          requirements: 'Degree in Marketing or related field, 2+ years experience in digital marketing...',
          status: 'ACTIVE',
          postedBy: 'Marketing Manager',
          postedAt: '2024-01-10T09:00:00Z',
          applicationsCount: 8
        },
        {
          id: '3',
          title: 'HR Assistant',
          department: 'Human Resources',
          location: 'Durban, South Africa',
          type: 'PART_TIME',
          salaryMin: 150000,
          salaryMax: 200000,
          description: 'Support our HR team with various administrative tasks...',
          requirements: 'High school diploma, strong communication skills, experience with MS Office...',
          status: 'CLOSED',
          postedBy: 'HR Manager',
          postedAt: '2024-01-05T11:00:00Z',
          applicationsCount: 25
        }
      ];

      const mockApplications: Application[] = [
        {
          id: '1',
          jobId: '1',
          jobTitle: 'Software Developer',
          candidateName: 'Alice Johnson',
          candidateEmail: 'alice.johnson@email.com',
          candidatePhone: '+27 81 123 4567',
          resumePath: '/resumes/alice-johnson-resume.pdf',
          coverLetter: 'I am excited to apply for the Software Developer position...',
          status: 'REVIEWED',
          appliedAt: '2024-01-16T14:30:00Z',
          reviewedBy: 'Tech Lead',
          notes: 'Strong technical background, good cultural fit'
        },
        {
          id: '2',
          jobId: '1',
          jobTitle: 'Software Developer',
          candidateName: 'Bob Smith',
          candidateEmail: 'bob.smith@email.com',
          candidatePhone: '+27 82 234 5678',
          resumePath: '/resumes/bob-smith-resume.pdf',
          coverLetter: 'With 5 years of experience in full-stack development...',
          status: 'INTERVIEWED',
          appliedAt: '2024-01-17T09:15:00Z',
          reviewedBy: 'Tech Lead',
          notes: 'Excellent interview, moving to final round'
        },
        {
          id: '3',
          jobId: '2',
          jobTitle: 'Marketing Specialist',
          candidateName: 'Carol Williams',
          candidateEmail: 'carol.williams@email.com',
          candidatePhone: '+27 83 345 6789',
          resumePath: '/resumes/carol-williams-resume.pdf',
          coverLetter: 'I am passionate about digital marketing and brand building...',
          status: 'PENDING',
          appliedAt: '2024-01-18T16:45:00Z'
        }
      ];

      setJobPostings(mockJobs);
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recruitment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.department || !newJob.type) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const mockJob: JobPosting = {
        id: Date.now().toString(),
        title: newJob.title,
        department: newJob.department,
        location: newJob.location || 'Remote',
        type: newJob.type as any,
        salaryMin: parseInt(newJob.salaryMin) || 0,
        salaryMax: parseInt(newJob.salaryMax) || 0,
        description: newJob.description,
        requirements: newJob.requirements,
        status: 'ACTIVE',
        postedBy: 'Current User',
        postedAt: new Date().toISOString(),
        applicationsCount: 0
      };

      setJobPostings(prev => [mockJob, ...prev]);
      setCreateJobDialogOpen(false);
      setNewJob({
        title: '',
        department: '',
        location: '',
        type: '',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: ''
      });

      toast({
        title: 'Success',
        description: 'Job posting created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create job posting',
        variant: 'destructive',
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus as any, reviewedBy: 'Current User' }
          : app
      ));

      toast({
        title: 'Success',
        description: 'Application status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = applicationStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getJobTypeBadge = (type: string) => {
    const colors = {
      FULL_TIME: 'bg-blue-100 text-blue-800',
      PART_TIME: 'bg-green-100 text-green-800',
      CONTRACT: 'bg-orange-100 text-orange-800',
      INTERN: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {jobTypes.find(t => t.value === type)?.label || type}
      </Badge>
    );
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter(app => 
    app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalJobs: jobPostings.length,
    activeJobs: jobPostings.filter(j => j.status === 'ACTIVE').length,
    totalApplications: applications.length,
    pendingReviews: applications.filter(a => a.status === 'PENDING').length,
    interviewed: applications.filter(a => a.status === 'INTERVIEWED').length,
    hired: applications.filter(a => a.status === 'HIRED').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading recruitment data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recruitment Management</h2>
        <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Create a new job posting to attract candidates
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="Software Developer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Cape Town, South Africa"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Job Type *</Label>
                  <Select value={newJob.type} onValueChange={(value) => setNewJob({ ...newJob, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salaryMin">Minimum Salary (R)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                    placeholder="300000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salaryMax">Maximum Salary (R)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                    placeholder="450000"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                  placeholder="List the required skills, experience, qualifications..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateJob}>Create Job Posting</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalJobs} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              Total received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviewed</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewed}</div>
            <p className="text-xs text-muted-foreground">
              In process
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hired}</div>
            <p className="text-xs text-muted-foreground">
              Successfully placed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalApplications > 0 ? Math.round((stats.hired / stats.totalApplications) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Hire rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>Manage your organization's job openings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>{getJobTypeBadge(job.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.salaryMin && job.salaryMax ? (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R{job.salaryMin.toLocaleString()} - R{job.salaryMax.toLocaleString()}
                          </div>
                        ) : (
                          'Not specified'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.applicationsCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(job.postedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
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

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>Review and manage candidate applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="font-medium">{application.candidateName}</div>
                      </TableCell>
                      <TableCell>{application.jobTitle}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {application.candidateEmail}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {application.candidatePhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>{application.reviewedBy || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={application.status}
                            onValueChange={(value) => updateApplicationStatus(application.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {applicationStatuses.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Resume
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