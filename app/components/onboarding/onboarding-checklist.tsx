'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  User, 
  FileText, 
  Shield, 
  Car,
  Droplets,
  Heart,
  Award,
  AlertTriangle
} from 'lucide-react';
import { showSuccess } from '@/lib/sweetalert';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: any;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

interface OnboardingChecklistProps {
  employeeName: string;
  employeeId: string;
  startDate: string;
  onComplete?: () => void;
}

export function OnboardingChecklist({ 
  employeeName, 
  employeeId, 
  startDate, 
  onComplete 
}: OnboardingChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Pre-Employment
    {
      id: 'background-check',
      category: 'Pre-Employment',
      title: 'Background Check Completed',
      description: 'Verify background check clearance',
      icon: Shield,
      required: true,
      completed: false
    },
    {
      id: 'documents-collected',
      category: 'Pre-Employment',
      title: 'Employment Documents Collected',
      description: 'ID, tax forms, emergency contacts, etc.',
      icon: FileText,
      required: true,
      completed: false
    },
    
    // First Day
    {
      id: 'workspace-setup',
      category: 'First Day',
      title: 'Workspace & Equipment Setup',
      description: 'Assign locker, uniform, safety equipment',
      icon: User,
      required: true,
      completed: false
    },
    {
      id: 'system-access',
      category: 'First Day',
      title: 'System Access Provided',
      description: 'Login credentials, time tracking system',
      icon: Clock,
      required: true,
      completed: false
    },
    {
      id: 'welcome-meeting',
      category: 'First Day',
      title: 'Welcome Meeting with Supervisor',
      description: 'Introduction, expectations, schedule review',
      icon: Heart,
      required: true,
      completed: false
    },
    
    // Training
    {
      id: 'safety-training',
      category: 'Training',
      title: 'Safety Training Completed',
      description: 'Chemical handling, equipment safety, emergency procedures',
      icon: Shield,
      required: true,
      completed: false
    },
    {
      id: 'service-training',
      category: 'Training',
      title: 'Car Wash Service Training',
      description: 'Service packages, procedures, quality standards',
      icon: Car,
      required: true,
      completed: false
    },
    {
      id: 'equipment-training',
      category: 'Training',
      title: 'Equipment Operation Training',
      description: 'Pressure washers, vacuums, chemical systems',
      icon: Droplets,
      required: true,
      completed: false
    },
    {
      id: 'customer-service-training',
      category: 'Training',
      title: 'Customer Service Training',
      description: 'Communication skills, complaint handling, upselling',
      icon: Heart,
      required: true,
      completed: false
    },
    
    // Certification
    {
      id: 'skills-assessment',
      category: 'Certification',
      title: 'Skills Assessment Passed',
      description: 'Practical demonstration of car wash procedures',
      icon: Award,
      required: true,
      completed: false
    },
    {
      id: 'quality-standards',
      category: 'Certification',
      title: 'Quality Standards Certification',
      description: 'Demonstrate understanding of Prestige standards',
      icon: Award,
      required: true,
      completed: false
    },
    
    // Follow-up
    {
      id: 'week-1-checkin',
      category: 'Follow-up',
      title: 'Week 1 Check-in',
      description: 'Review progress, address concerns, feedback',
      icon: CheckCircle,
      required: false,
      completed: false
    },
    {
      id: 'month-1-review',
      category: 'Follow-up',
      title: '30-Day Performance Review',
      description: 'Formal performance evaluation and feedback',
      icon: Award,
      required: false,
      completed: false
    }
  ]);

  const [notes, setNotes] = useState('');

  const handleItemToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : undefined,
            completedBy: !item.completed ? 'Current User' : undefined
          }
        : item
    ));
  };

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const required = checklist.filter(item => item.required).length;
    const requiredCompleted = checklist.filter(item => item.required && item.completed).length;
    
    return { total, completed, required, requiredCompleted };
  };

  const stats = getCompletionStats();
  const progress = (stats.completed / stats.total) * 100;
  const requiredProgress = (stats.requiredCompleted / stats.required) * 100;

  const categories = Array.from(new Set(checklist.map(item => item.category)));

  const handleCompleteOnboarding = async () => {
    if (stats.requiredCompleted === stats.required) {
      await showSuccess(
        'Onboarding Complete!',
        `${employeeName} has successfully completed all required onboarding steps.`
      );
      onComplete?.();
    } else {
      await showSuccess(
        'Missing Required Steps',
        `Please complete all required steps before marking onboarding as complete. ${stats.required - stats.requiredCompleted} required steps remaining.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Onboarding Checklist</CardTitle>
              <p className="text-gray-600 mt-1">
                Employee: <span className="font-semibold">{employeeName}</span> | 
                ID: <span className="font-semibold">{employeeId}</span> | 
                Start Date: <span className="font-semibold">{new Date(startDate).toLocaleDateString()}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{Math.round(progress)}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.requiredCompleted}</div>
            <div className="text-sm text-gray-500">Required Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.required - stats.requiredCompleted}</div>
            <div className="text-sm text-gray-500">Required Left</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.total - stats.completed}</div>
            <div className="text-sm text-gray-500">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist by Category */}
      {categories.map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {category === 'Pre-Employment' && <FileText className="h-5 w-5 mr-2 text-blue-500" />}
              {category === 'First Day' && <User className="h-5 w-5 mr-2 text-green-500" />}
              {category === 'Training' && <Shield className="h-5 w-5 mr-2 text-orange-500" />}
              {category === 'Certification' && <Award className="h-5 w-5 mr-2 text-purple-500" />}
              {category === 'Follow-up' && <CheckCircle className="h-5 w-5 mr-2 text-pink-500" />}
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklist
                .filter(item => item.category === category)
                .map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleItemToggle(item.id)}
                        className="mt-1"
                      />
                      <Icon className={`h-5 w-5 mt-1 ${
                        item.completed ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${
                            item.completed ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h3>
                          {item.required && (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              Required
                            </Badge>
                          )}
                          {item.completed && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        {item.completed && item.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed on {new Date(item.completedAt).toLocaleDateString()} by {item.completedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about the onboarding process, employee feedback, or areas for improvement..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          Save Progress
        </Button>
        <Button 
          onClick={handleCompleteOnboarding}
          className={`${
            stats.requiredCompleted === stats.required
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={stats.requiredCompleted !== stats.required}
        >
          {stats.requiredCompleted === stats.required ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Onboarding
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              {stats.required - stats.requiredCompleted} Required Steps Left
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
