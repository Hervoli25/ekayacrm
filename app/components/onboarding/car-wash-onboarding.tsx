'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Droplets, 
  Shield, 
  Users, 
  CheckCircle, 
  Clock, 
  Star,
  Award,
  AlertTriangle,
  Play,
  BookOpen,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react';
import { showSuccess, showConfirmation } from '@/lib/sweetalert';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  duration: string;
  completed: boolean;
  content: {
    overview: string;
    keyPoints: string[];
    practicalTips: string[];
    safetyNotes?: string[];
  };
}

export function CarWashOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Prestige Car Wash',
      description: 'Introduction to our premium car wash service',
      icon: Sparkles,
      duration: '10 min',
      completed: false,
      content: {
        overview: 'Welcome to Prestige Car Wash by Ekhaya! We are committed to providing the highest quality car wash services with exceptional customer care. Our mission is to make every vehicle shine while delivering an outstanding customer experience.',
        keyPoints: [
          'Premium quality service standards',
          'Customer satisfaction is our priority',
          'Professional appearance and attitude',
          'Attention to detail in every service',
          'Environmental responsibility'
        ],
        practicalTips: [
          'Always greet customers with a smile',
          'Maintain professional appearance',
          'Ask about customer preferences',
          'Explain services clearly'
        ]
      }
    },
    {
      id: 'safety',
      title: 'Safety Protocols & Guidelines',
      description: 'Essential safety procedures for car wash operations',
      icon: Shield,
      duration: '15 min',
      completed: false,
      content: {
        overview: 'Safety is our top priority at Prestige Car Wash. Understanding and following safety protocols protects you, your colleagues, and our customers.',
        keyPoints: [
          'Personal Protective Equipment (PPE) requirements',
          'Chemical handling and storage procedures',
          'Equipment operation safety',
          'Emergency procedures',
          'Customer safety considerations'
        ],
        practicalTips: [
          'Always wear safety goggles when handling chemicals',
          'Use non-slip footwear in wet areas',
          'Keep walkways clear and dry',
          'Report any safety hazards immediately'
        ],
        safetyNotes: [
          '⚠️ Never mix different cleaning chemicals',
          '⚠️ Always read chemical labels before use',
          '⚠️ Keep first aid kit locations in mind',
          '⚠️ Report accidents immediately to supervisor'
        ]
      }
    },
    {
      id: 'services',
      title: 'Car Wash Services & Packages',
      description: 'Understanding our service offerings',
      icon: Car,
      duration: '20 min',
      completed: false,
      content: {
        overview: 'Prestige Car Wash offers a range of premium services designed to meet every customer need, from basic washes to comprehensive detailing packages.',
        keyPoints: [
          'Basic Wash Package - Exterior cleaning',
          'Premium Wash - Interior & exterior',
          'Deluxe Detail - Complete detailing service',
          'Specialty Services - Wax, polish, protection',
          'Add-on services and upgrades'
        ],
        practicalTips: [
          'Recommend packages based on vehicle condition',
          'Explain the benefits of each service level',
          'Suggest seasonal protection services',
          'Upsell appropriately without being pushy'
        ]
      }
    },
    {
      id: 'equipment',
      title: 'Equipment & Chemical Usage',
      description: 'Proper use of car wash equipment and chemicals',
      icon: Zap,
      duration: '25 min',
      completed: false,
      content: {
        overview: 'Proper equipment operation and chemical usage ensures quality results while maintaining safety and efficiency.',
        keyPoints: [
          'Pressure washer operation and settings',
          'Chemical mixing ratios and applications',
          'Vacuum system usage and maintenance',
          'Drying equipment and techniques',
          'Equipment maintenance schedules'
        ],
        practicalTips: [
          'Start with lowest pressure settings',
          'Pre-rinse vehicles thoroughly',
          'Use appropriate chemicals for each surface',
          'Follow manufacturer guidelines'
        ],
        safetyNotes: [
          '⚠️ Never point pressure washer at people',
          '⚠️ Check chemical concentrations before use',
          '⚠️ Inspect equipment before each shift'
        ]
      }
    },
    {
      id: 'customer-service',
      title: 'Customer Service Excellence',
      description: 'Delivering exceptional customer experiences',
      icon: Heart,
      duration: '15 min',
      completed: false,
      content: {
        overview: 'Outstanding customer service sets Prestige Car Wash apart. Every interaction should exceed customer expectations and build lasting relationships.',
        keyPoints: [
          'Professional communication skills',
          'Active listening and problem-solving',
          'Handling customer complaints gracefully',
          'Building customer loyalty',
          'Upselling and cross-selling techniques'
        ],
        practicalTips: [
          'Use customer names when possible',
          'Explain what you\'re doing and why',
          'Address concerns promptly and professionally',
          'Follow up to ensure satisfaction'
        ]
      }
    },
    {
      id: 'quality-control',
      title: 'Quality Control & Standards',
      description: 'Maintaining our premium quality standards',
      icon: Award,
      duration: '10 min',
      completed: false,
      content: {
        overview: 'Quality control ensures every vehicle meets our Prestige standards before leaving our facility.',
        keyPoints: [
          'Pre-wash vehicle inspection',
          'Quality checkpoints during service',
          'Final inspection procedures',
          'Customer walk-through process',
          'Handling quality issues'
        ],
        practicalTips: [
          'Document any pre-existing damage',
          'Check your work at each stage',
          'Use proper lighting for final inspection',
          'Take pride in every vehicle you service'
        ]
      }
    }
  ];

  const progress = (completedSteps.length / onboardingSteps.length) * 100;

  const handleStepComplete = async (stepId: string) => {
    const result = await showConfirmation(
      'Complete Step',
      'Mark this step as completed?',
      'Yes, Complete',
      'Continue Learning'
    );

    if (result.isConfirmed) {
      setCompletedSteps(prev => [...prev, stepId]);
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        await showSuccess(
          'Onboarding Complete!',
          'Congratulations! You\'ve completed the Prestige Car Wash onboarding program. Welcome to the team!'
        );
      }
    }
  };

  const startOnboarding = () => {
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-20 h-20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Prestige Car Wash
            </CardTitle>
            <p className="text-gray-600 text-lg mt-2">
              Your journey to excellence starts here
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">90 Minutes</p>
                <p className="text-xs text-gray-500">Total Duration</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">6 Modules</p>
                <p className="text-xs text-gray-500">Learning Sections</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Certificate</p>
                <p className="text-xs text-gray-500">Upon Completion</p>
              </div>
            </div>
            
            <Button 
              onClick={startOnboarding}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prestige Car Wash Onboarding</h1>
              <p className="text-gray-600">Step {currentStep + 1} of {onboardingSteps.length}</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Learning Path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    index === currentStep
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500'
                      : completedSteps.includes(step.id)
                      ? 'bg-green-50 border-l-4 border-green-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="mr-3">
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <step.icon className={`h-5 w-5 ${
                        index === currentStep ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      index === currentStep ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.duration}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-lg mr-4">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                  <p className="text-blue-100 mt-1">{currentStepData.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                  <TabsTrigger value="tips">Practical Tips</TabsTrigger>
                  {currentStepData.content.safetyNotes && (
                    <TabsTrigger value="safety">Safety</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {currentStepData.content.overview}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="keypoints" className="mt-6">
                  <div className="space-y-3">
                    {currentStepData.content.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{point}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tips" className="mt-6">
                  <div className="space-y-3">
                    {currentStepData.content.practicalTips.map((tip, index) => (
                      <div key={index} className="flex items-start bg-blue-50 p-3 rounded-lg">
                        <Star className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {currentStepData.content.safetyNotes && (
                  <TabsContent value="safety" className="mt-6">
                    <div className="space-y-3">
                      {currentStepData.content.safetyNotes.map((note, index) => (
                        <div key={index} className="flex items-start bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={() => handleStepComplete(currentStepData.id)}
                  disabled={completedSteps.includes(currentStepData.id)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {completedSteps.includes(currentStepData.id) ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    'Complete Step'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
