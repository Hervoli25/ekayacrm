'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  Share2, 
  Calendar,
  User,
  Building2,
  Star,
  CheckCircle
} from 'lucide-react';
import { showSuccess } from '@/lib/sweetalert';

interface CompletionCertificateProps {
  employeeName: string;
  completionDate: string;
  totalSteps: number;
  completedSteps: number;
  overallScore?: number;
}

export function CompletionCertificate({ 
  employeeName, 
  completionDate, 
  totalSteps, 
  completedSteps,
  overallScore = 0
}: CompletionCertificateProps) {
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  const isFullyCompleted = completedSteps === totalSteps;

  const handleDownloadCertificate = async () => {
    await showSuccess(
      'Certificate Ready!',
      'Your completion certificate has been generated and is ready for download.'
    );
  };

  const handleShareCertificate = async () => {
    await showSuccess(
      'Certificate Shared!',
      'Your completion certificate has been shared with your supervisor and HR department.'
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 shadow-2xl">
        <CardContent className="p-8">
          {/* Certificate Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Award className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Certificate of Completion
            </h1>
            <p className="text-lg text-gray-600">Prestige Car Wash by Ekhaya</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4"></div>
          </div>

          {/* Certificate Body */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-4">This is to certify that</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{employeeName}</h2>
            <p className="text-lg text-gray-700 mb-6">
              has successfully completed the comprehensive onboarding program for
            </p>
            <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Prestige Car Wash Operations
            </h3>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-white rounded-lg shadow-md border border-blue-100">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{completedSteps}/{totalSteps}</div>
              <div className="text-sm text-gray-600">Modules Completed</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-md border border-purple-100">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{completionPercentage}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-md border border-green-100">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          </div>

          {/* Completion Status */}
          <div className="text-center mb-8">
            {isFullyCompleted ? (
              <Badge className="bg-green-100 text-green-800 text-lg px-6 py-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                Fully Certified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-200 text-lg px-6 py-2">
                Partial Completion - {completedSteps}/{totalSteps} Modules
              </Badge>
            )}
          </div>

          {/* Certificate Footer */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
              <div className="flex items-center mb-4 md:mb-0">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Completed on {new Date(completionDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center mb-4 md:mb-0">
                <Building2 className="h-4 w-4 mr-2" />
                <span>Prestige Car Wash by Ekhaya</span>
              </div>
              
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>Employee ID: PCW-{employeeName.replace(/\s+/g, '').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button 
              onClick={handleDownloadCertificate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleShareCertificate}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share with Supervisor
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 opacity-10">
            <Award className="h-16 w-16 text-blue-500" />
          </div>
          <div className="absolute top-4 right-4 opacity-10">
            <Award className="h-16 w-16 text-purple-500" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <Star className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-10">
            <Star className="h-12 w-12 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
