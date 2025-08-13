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
  Heart,
  Video,
  Download,
  FileText,
  HelpCircle,
  Target,
  Trophy
} from 'lucide-react';
import { showSuccess, showConfirmation } from '@/lib/sweetalert';
import { CompletionCertificate } from './completion-certificate';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

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
    quiz?: QuizQuestion[];
    videoUrl?: string;
    downloadableResources?: { name: string; url: string; type: string }[];
  };
}

export function CarWashOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentQuizScore, setCurrentQuizScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [stepScores, setStepScores] = useState<{[key: string]: number}>({});

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
        ],
        videoUrl: 'https://example.com/welcome-video',
        downloadableResources: [
          { name: 'Employee Handbook', url: '/resources/handbook.pdf', type: 'PDF' },
          { name: 'Company Values Poster', url: '/resources/values.pdf', type: 'PDF' }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the most important aspect of Prestige Car Wash service?',
            options: ['Speed', 'Customer satisfaction', 'Cost efficiency', 'Equipment maintenance'],
            correctAnswer: 1,
            explanation: 'Customer satisfaction is our top priority and drives all our service decisions.'
          },
          {
            id: 'q2',
            question: 'How should you greet every customer?',
            options: ['With a nod', 'With a smile and professional greeting', 'Silently', 'Only if they speak first'],
            correctAnswer: 1,
            explanation: 'A warm smile and professional greeting sets the tone for excellent service.'
          }
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
        ],
        videoUrl: 'https://example.com/safety-training-video',
        downloadableResources: [
          { name: 'Safety Checklist', url: '/resources/safety-checklist.pdf', type: 'PDF' },
          { name: 'Emergency Procedures', url: '/resources/emergency.pdf', type: 'PDF' },
          { name: 'Chemical Safety Data Sheets', url: '/resources/msds.pdf', type: 'PDF' }
        ],
        quiz: [
          {
            id: 'safety1',
            question: 'What should you do before handling any cleaning chemical?',
            options: ['Mix it with water', 'Read the safety label', 'Smell it first', 'Ask a colleague'],
            correctAnswer: 1,
            explanation: 'Always read safety labels to understand proper handling, dilution, and safety precautions.'
          },
          {
            id: 'safety2',
            question: 'If you accidentally mix two different chemicals, what should you do?',
            options: ['Continue using the mixture', 'Add more water', 'Stop immediately and report to supervisor', 'Test it on a small area'],
            correctAnswer: 2,
            explanation: 'Never mix chemicals as this can create dangerous reactions. Stop immediately and report to your supervisor.'
          },
          {
            id: 'safety3',
            question: 'What PPE is required when handling cleaning chemicals?',
            options: ['Just gloves', 'Safety goggles and gloves', 'Only an apron', 'No PPE needed'],
            correctAnswer: 1,
            explanation: 'Safety goggles protect your eyes and gloves protect your skin from chemical contact.'
          }
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
        ],
        videoUrl: 'https://example.com/services-overview-video',
        downloadableResources: [
          { name: 'Service Menu & Pricing', url: '/resources/service-menu.pdf', type: 'PDF' },
          { name: 'Upselling Guide', url: '/resources/upselling-guide.pdf', type: 'PDF' },
          { name: 'Seasonal Services Calendar', url: '/resources/seasonal-services.pdf', type: 'PDF' }
        ],
        quiz: [
          {
            id: 'services1',
            question: 'Which service package includes interior cleaning?',
            options: ['Basic Wash', 'Premium Wash', 'Express Rinse', 'Exterior Only'],
            correctAnswer: 1,
            explanation: 'Premium Wash includes both interior and exterior cleaning services.'
          },
          {
            id: 'services2',
            question: 'When should you recommend wax protection?',
            options: ['Never', 'Only in winter', 'For all vehicles year-round', 'Only for new cars'],
            correctAnswer: 2,
            explanation: 'Wax protection benefits all vehicles year-round by protecting paint from UV rays, dirt, and weather.'
          }
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

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const calculateQuizScore = (quiz: QuizQuestion[]) => {
    let correct = 0;
    quiz.forEach(question => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.length) * 100);
  };

  const handleQuizSubmit = (quiz: QuizQuestion[]) => {
    const score = calculateQuizScore(quiz);
    setCurrentQuizScore(score);
    setShowQuizResults(true);
  };

  const handleStepComplete = async (stepId: string) => {
    const result = await showConfirmation(
      'Complete Step',
      'Mark this step as completed?',
      'Yes, Complete',
      'Continue Learning'
    );

    if (result.isConfirmed) {
      // Save quiz score for this step if available
      const currentStepData = onboardingSteps[currentStep];
      if (currentStepData.content.quiz && showQuizResults) {
        setStepScores(prev => ({
          ...prev,
          [stepId]: currentQuizScore
        }));
      }

      setCompletedSteps(prev => [...prev, stepId]);

      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        // Reset quiz state for next step
        setShowQuizResults(false);
        setQuizAnswers({});
        setCurrentQuizScore(0);
      } else {
        // Calculate overall score
        const totalScore = Object.values(stepScores).reduce((sum, score) => sum + score, 0);
        const avgScore = Math.round(totalScore / Object.keys(stepScores).length) || 0;
        setOverallScore(avgScore);

        await showSuccess(
          'Onboarding Complete!',
          'Congratulations! You\'ve completed the Prestige Car Wash onboarding program. Your certificate is ready!'
        );

        setShowCertificate(true);
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

  // Show certificate if onboarding is complete
  if (showCertificate) {
    return (
      <CompletionCertificate
        employeeName="Employee Name" // This should come from session/props
        completionDate={new Date().toISOString()}
        totalSteps={onboardingSteps.length}
        completedSteps={completedSteps.length}
        overallScore={overallScore}
      />
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
                    {completedSteps.includes(step.id) && (
                      <div className="mt-1">
                        <p className="text-xs text-green-600">
                          ✓ Completed
                        </p>
                        {stepScores[step.id] && (
                          <p className="text-xs text-blue-600">
                            Quiz: {stepScores[step.id]}%
                          </p>
                        )}
                      </div>
                    )}
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
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                  {currentStepData.content.safetyNotes && (
                    <TabsTrigger value="safety">Safety</TabsTrigger>
                  )}
                  {currentStepData.content.videoUrl && (
                    <TabsTrigger value="video">Video</TabsTrigger>
                  )}
                  {currentStepData.content.quiz && (
                    <TabsTrigger value="quiz">Quiz</TabsTrigger>
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

                {/* Video Tab */}
                {currentStepData.content.videoUrl && (
                  <TabsContent value="video" className="mt-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <Video className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Training Video</h3>
                      </div>
                      <div className="bg-gray-200 rounded-lg p-8 text-center">
                        <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Interactive training video for {currentStepData.title}</p>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <Play className="h-4 w-4 mr-2" />
                          Play Video
                        </Button>
                      </div>

                      {/* Downloadable Resources */}
                      {currentStepData.content.downloadableResources && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Download className="h-5 w-5 mr-2 text-green-600" />
                            Downloadable Resources
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentStepData.content.downloadableResources.map((resource, index) => (
                              <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{resource.name}</p>
                                  <p className="text-sm text-gray-500">{resource.type}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Quiz Tab */}
                {currentStepData.content.quiz && (
                  <TabsContent value="quiz" className="mt-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                      <div className="flex items-center mb-4">
                        <HelpCircle className="h-6 w-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Knowledge Check</h3>
                        <Badge variant="outline" className="ml-auto text-green-600 border-green-200">
                          {currentStepData.content.quiz.length} Questions
                        </Badge>
                      </div>

                      {!showQuizResults ? (
                        <div className="space-y-6">
                          {currentStepData.content.quiz.map((question, qIndex) => (
                            <div key={question.id} className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-3">
                                {qIndex + 1}. {question.question}
                              </h4>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <label key={oIndex} className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={question.id}
                                      value={oIndex}
                                      onChange={() => handleQuizAnswer(question.id, oIndex)}
                                      className="mr-3 text-green-600"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}

                          <div className="text-center">
                            <Button
                              onClick={() => handleQuizSubmit(currentStepData.content.quiz!)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                              disabled={Object.keys(quizAnswers).length < currentStepData.content.quiz.length}
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Submit Quiz
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mb-6">
                            <Trophy className={`h-16 w-16 mx-auto mb-4 ${
                              currentQuizScore >= 80 ? 'text-green-600' : currentQuizScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
                            <p className="text-lg text-gray-600">Your Score: {currentQuizScore}%</p>
                            <Badge className={`mt-2 ${
                              currentQuizScore >= 80 ? 'bg-green-100 text-green-800' :
                              currentQuizScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {currentQuizScore >= 80 ? 'Excellent!' : currentQuizScore >= 60 ? 'Good Job!' : 'Needs Review'}
                            </Badge>
                          </div>

                          {/* Quiz Results */}
                          <div className="space-y-4 text-left">
                            {currentStepData.content.quiz.map((question, index) => {
                              const userAnswer = quizAnswers[question.id];
                              const isCorrect = userAnswer === question.correctAnswer;

                              return (
                                <div key={question.id} className={`p-4 rounded-lg border-l-4 ${
                                  isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                                }`}>
                                  <div className="flex items-start">
                                    {isCorrect ? (
                                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 mb-1">{question.question}</p>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Your answer: {question.options[userAnswer]}
                                        {!isCorrect && (
                                          <span className="text-red-600"> (Incorrect)</span>
                                        )}
                                      </p>
                                      {!isCorrect && (
                                        <p className="text-sm text-green-600 mb-2">
                                          Correct answer: {question.options[question.correctAnswer]}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-700 italic">{question.explanation}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-6">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowQuizResults(false);
                                setQuizAnswers({});
                                setCurrentQuizScore(0);
                              }}
                            >
                              Retake Quiz
                            </Button>
                          </div>
                        </div>
                      )}
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
