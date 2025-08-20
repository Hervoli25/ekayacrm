'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PromotionManagementTest() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a test component to verify the build works.</p>
      </CardContent>
    </Card>
  );
}