'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Monitor, Menu, X } from 'lucide-react';

export function MobileMenuTest() {
  return (
    <div className="space-y-6 p-4">
      <Card className="bg-gradient-to-r from-red-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Smartphone className="mr-2 h-6 w-6 text-red-600" />
            Mobile Menu Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mobile View */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-3">
                <Smartphone className="h-4 w-4 mr-2 text-red-600" />
                <Badge variant="outline" className="text-red-600 border-red-200">
                  Mobile (< 640px)
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2">✅ Hamburger menu visible</p>
                <p className="mb-2">✅ Desktop nav hidden</p>
                <p className="mb-2">✅ User info in mobile menu</p>
                <p className="mb-2">✅ Smooth animations</p>
                <div className="flex items-center mt-3 p-2 bg-gray-100 rounded">
                  <Menu className="h-4 w-4 mr-2" />
                  <span className="text-xs">Tap to open menu</span>
                </div>
              </div>
            </div>

            {/* Tablet View */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-3">
                <Tablet className="h-4 w-4 mr-2 text-blue-600" />
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Tablet (640px - 1024px)
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2">✅ Desktop navigation visible</p>
                <p className="mb-2">✅ Hamburger menu hidden</p>
                <p className="mb-2">✅ Full user dropdown</p>
                <p className="mb-2">✅ Responsive layout</p>
                <div className="flex items-center mt-3 p-2 bg-gray-100 rounded">
                  <span className="text-xs">Full navigation bar</span>
                </div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-3">
                <Monitor className="h-4 w-4 mr-2 text-green-600" />
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Desktop (> 1024px)
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2">✅ Full desktop experience</p>
                <p className="mb-2">✅ Hover effects active</p>
                <p className="mb-2">✅ Scale animations</p>
                <p className="mb-2">✅ Complete user profile</p>
                <div className="flex items-center mt-3 p-2 bg-gray-100 rounded">
                  <span className="text-xs">Optimal experience</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
            <h3 className="font-semibold text-gray-900 mb-2">Testing Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Resize your browser window to test different breakpoints</li>
              <li>On mobile view, click the hamburger menu (☰) to open navigation</li>
              <li>Click outside the menu or on a link to close it</li>
              <li>Test the smooth animations and transitions</li>
              <li>Verify all navigation links work correctly</li>
              <li>Check that user info displays properly in mobile menu</li>
            </ol>
          </div>

          {/* Features */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Mobile Menu Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>✅ Responsive hamburger icon</div>
              <div>✅ Smooth slide animations</div>
              <div>✅ Click outside to close</div>
              <div>✅ Auto-close on navigation</div>
              <div>✅ Touch-friendly buttons</div>
              <div>✅ Brand color gradients</div>
              <div>✅ Backdrop blur effects</div>
              <div>✅ Accessibility support</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
