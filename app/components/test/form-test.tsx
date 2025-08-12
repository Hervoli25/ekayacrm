'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess } from '@/lib/sweetalert';

export function FormTest() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      showSuccess('Form submitted successfully!', 'All form data has been validated and processed.');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Stable Form Test</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-field">
            <Label className="form-label">Name *</Label>
            <Input
              className="stable-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your name"
            />
            <div className="form-error">
              {errors.name || ''}
            </div>
          </div>

          <div className="form-field">
            <Label className="form-label">Email *</Label>
            <Input
              type="email"
              className="stable-input"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email"
            />
            <div className="form-error">
              {errors.email || ''}
            </div>
          </div>

          <div className="form-field">
            <Label className="form-label">Message</Label>
            <Input
              className="stable-input"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Optional message"
            />
            <div className="form-description">
              This field is optional
            </div>
          </div>

          <Button type="submit" className="w-full">
            Test Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
