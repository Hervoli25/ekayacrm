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
import { showAlert, showConfirmation } from '@/lib/sweetalert';
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
  const [viewingJob, setViewingJob] = useState<JobPosting | null>(null);
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch job postings
      const jobsResponse = await fetch('/api/recruitment/jobs');
      const jobsData = jobsResponse.ok ? await jobsResponse.json() : [];
      setJobPostings(jobsData);

      // Fetch applications
      const applicationsResponse = await fetch('/api/recruitment/applications');
      const applicationsData = applicationsResponse.ok ? await applicationsResponse.json() : [];
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      await showAlert('Error', 'Failed to fetch recruitment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.department || !newJob.type) {
      await showAlert('Error', 'Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newJob.title,
          department: newJob.department,
          location: newJob.location,
          type: newJob.type,
          description: newJob.description,
          requirements: newJob.requirements,
          salaryMin: parseInt(newJob.salaryMin) || undefined,
          salaryMax: parseInt(newJob.salaryMax) || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create job posting');
      }

      const createdJob = await response.json();
      setJobPostings(prev => [createdJob, ...prev]);
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

      await showAlert('Success', 'Job posting created successfully', 'success');
    } catch (error) {
      console.error('Error creating job posting:', error);
      await showAlert('Error', 'Failed to create job posting', 'error');
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/recruitment/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      const updatedApplication = await response.json();
      
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? updatedApplication : app
      ));

      await showAlert('Success', 'Application status updated', 'success');
    } catch (error) {
      console.error('Error updating application status:', error);
      await showAlert('Error', 'Failed to update application status', 'error');
    }
  };

  const handleViewJob = (job: JobPosting) => {
    setViewingJob(job);
    setViewJobDialogOpen(true);
  };

  const handleUpdateApplicationStatusWithConfirmation = async (applicationId: string, newStatus: string) => {
    const statusLabels = {
      PENDING: 'Pending Review',
      REVIEWED: 'Reviewed', 
      INTERVIEWED: 'Interviewed',
      OFFERED: 'Job Offered',
      REJECTED: 'Rejected',
      HIRED: 'Hired'
    };

    const result = await showConfirmation(
      'Update Application Status',
      `Are you sure you want to change this application status to "${statusLabels[newStatus as keyof typeof statusLabels]}"?`,
      'Yes, update status',
      'Cancel'
    );

    if (result.isConfirmed) {
      await updateApplicationStatus(applicationId, newStatus);
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewJob(job)}
                          >
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
                            onValueChange={(value) => handleUpdateApplicationStatusWithConfirmation(application.id, value)}
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

      {/* View Job Dialog */}
      <Dialog open={viewJobDialogOpen} onOpenChange={setViewJobDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Job Posting Details</DialogTitle>
            <DialogDescription>
              {viewingJob?.title} - {viewingJob?.department}
            </DialogDescription>
          </DialogHeader>
          {viewingJob && (
            <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Title</Label>
                  <div className="font-medium">{viewingJob.title}</div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="font-medium">{viewingJob.department}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {viewingJob.location}
                  </div>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <div>{getJobTypeBadge(viewingJob.type)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge variant={viewingJob.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {viewingJob.status}
                  </Badge>
                </div>
                <div>
                  <Label>Applications</Label>
                  <div className="font-medium">{viewingJob.applicationsCount}</div>
                </div>
              </div>
              {(viewingJob.salaryMin > 0 || viewingJob.salaryMax > 0) && (
                <div>
                  <Label>Salary Range</Label>
                  <div className="flex items-center font-medium">
                    <DollarSign className="h-4 w-4 mr-1" />
                    R{viewingJob.salaryMin.toLocaleString()} - R{viewingJob.salaryMax.toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <Label>Job Description</Label>
                <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {viewingJob.description || 'No description provided'}
                </div>
              </div>
              <div>
                <Label>Requirements</Label>
                <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {viewingJob.requirements || 'No requirements specified'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Posted By</Label>
                  <div>{viewingJob.postedBy}</div>
                </div>
                <div>
                  <Label>Posted Date</Label>
                  <div>{format(new Date(viewingJob.postedAt), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}