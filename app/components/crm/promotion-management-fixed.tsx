'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Swal from 'sweetalert2';
import { 
  Plus,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Upload,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Copy,
  Send,
  Tag,
  Check,
  X,
  Search,
  Mail,
  Zap,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'INACTIVE';
  usageLimit?: number;
  usedCount: number;
  remainingUses?: number;
  promoCode?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdBy: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  totalBookings: number;
  customerType: 'VIP' | 'Regular' | 'New';
}

export function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  
  // User selection modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingPromotion, setSendingPromotion] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '0',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    promoCode: '',
    createdBy: 'CRM Admin'
  });

  const fetchPromotions = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/crm/promotions?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch promotions: ${response.statusText}`);
      }

      const data = await response.json();
      setPromotions(data.promotions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch promotions');
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(statusFilter);
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const createBlackFridayPromotion = () => {
    const blackFridayDate = new Date(2024, 10, 29); // November 29, 2024
    const endDate = new Date(2024, 10, 30); // November 30, 2024

    setFormData({
      title: '🖤 BLACK FRIDAY MEGA DEAL',
      description: 'Biggest savings of the year! Get your car sparkling clean for less. Limited time only - Black Friday exclusive offer!',
      discountType: 'PERCENTAGE',
      discountValue: '50',
      minPurchaseAmount: '100',
      maxDiscountAmount: '200',
      startDate: blackFridayDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      usageLimit: '100',
      promoCode: 'BLACKFRIDAY50',
      createdBy: 'CRM Admin'
    });
    setShowCreateDialog(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-600" />
            Promotion Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={createBlackFridayPromotion}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Zap className="h-4 w-4 mr-1" />
                Black Friday
              </Button>
              
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-1" />
                Create Promotion
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="bg-gray-300 h-32 rounded mb-3"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-3 rounded mb-2 w-3/4"></div>
                <div className="bg-gray-300 h-3 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <span className="text-sm text-red-600">Error loading promotions: {error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  {promotion.mediaUrl && (
                    <img 
                      src={promotion.mediaUrl} 
                      alt={promotion.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={cn('text-xs', getStatusColor(promotion.status))}>
                      {promotion.status}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {promotion.title}
                  </h3>
                  
                  {promotion.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {promotion.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium flex items-center gap-1">
                        {promotion.discountType === 'PERCENTAGE' ? (
                          <>
                            <Percent className="h-3 w-3" />
                            {promotion.discountValue}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3" />
                            R{promotion.discountValue}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Valid:</span>
                      <span className="text-xs">
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </span>
                    </div>

                    {promotion.promoCode && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Code:</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(promotion.promoCode!);
                            Swal.fire({
                              icon: 'success',
                              title: 'Copied!',
                              text: 'Promo code copied to clipboard',
                              timer: 1500,
                              showConfirmButton: false
                            });
                          }}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                        >
                          <span className="font-mono font-medium">{promotion.promoCode}</span>
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {promotions.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No promotions found</p>
                <p className="text-sm">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} promotions available` 
                    : 'Create your first promotion to get started'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}