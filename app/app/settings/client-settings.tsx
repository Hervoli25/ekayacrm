'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail,
  Phone,
  Building,
  Calendar,
  Clock
} from 'lucide-react';

export default function ClientSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      department: '',
      position: ''
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      leaveRequestAlerts: true,
      payrollNotifications: true,
      systemUpdates: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    privacy: {
      profileVisibility: 'team',
      shareContactInfo: true,
      allowDirectMessages: true
    }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Initialize settings with user data
    if (session.user) {
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: session.user.name || '',
          email: session.user.email || ''
        }
      }));
    }
  }, [session, status, router]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Mock API call - implement actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Profile settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Palette className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal and professional details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={settings.profile.name}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.profile.phone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value }
                        }))}
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={settings.profile.department}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          profile: { ...prev.profile, department: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="it">Information Technology</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Job Position</Label>
                    <Input
                      id="position"
                      value={settings.profile.position}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, position: e.target.value }
                      }))}
                      placeholder="e.g. Software Developer, HR Manager"
                    />
                  </div>

                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in the browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Leave Request Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about leave request updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.leaveRequestAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, leaveRequestAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Payroll Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when payroll is processed
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.payrollNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, payrollNotifications: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system maintenance
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, systemUpdates: checked }
                      }))}
                    />
                  </div>

                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Notifications'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Display & Language Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={settings.preferences.theme}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, theme: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.preferences.language}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, language: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="af">Afrikaans</SelectItem>
                          <SelectItem value="zu">Zulu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.preferences.timezone}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, timezone: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Johannesburg">South Africa (SAST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.preferences.dateFormat}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, dateFormat: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select
                      value={settings.preferences.timeFormat}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, timeFormat: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 Hour (14:30)</SelectItem>
                        <SelectItem value="12h">12 Hour (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your privacy and data sharing preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select
                      value={settings.privacy.profileVisibility}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, profileVisibility: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (Everyone)</SelectItem>
                        <SelectItem value="team">Team Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile information
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Share Contact Information</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow colleagues to see your contact details
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacy.shareContactInfo}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, shareContactInfo: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow colleagues to send you direct messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, allowDirectMessages: checked }
                      }))}
                    />
                  </div>

                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Privacy Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </main>
      </div>
    </DashboardLayout>
  );
}