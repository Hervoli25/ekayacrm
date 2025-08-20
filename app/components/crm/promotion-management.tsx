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
  Eye,
  EyeOff,
  Tag,
  Check,
  X,
  Search,
  Mail,
  Zap,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';

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
          'X-API-Key': API_KEY,
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

  const fetchUsers = async (search = '') => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append('search', search);
      }

      const response = await fetch(`/api/crm/users?${params.toString()}`, {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch users'
      });
    } finally {
      setLoadingUsers(false);
    }
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/crm/promotions/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setUploadedImage(data.mediaUrl);
      
      Swal.fire({
        icon: 'success',
        title: 'Image Uploaded!',
        text: 'Promotion image uploaded successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error instanceof Error ? error.message : 'Failed to upload image'
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      if (!formData.title || !formData.discountValue || !formData.startDate || !formData.endDate) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please fill in all required fields'
        });
        return;
      }

      const promotionData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount || '0'),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        mediaUrl: uploadedImage,
        mediaType: uploadedImage ? uploadedImage.split('.').pop() : null
      };

      const response = await fetch('/api/crm/promotions', {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promotionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create promotion');
      }

      Swal.fire({
        icon: 'success',
        title: 'Promotion Created!',
        text: 'New promotion has been created successfully',
        timer: 2000,
        showConfirmButton: false
      });

      setShowCreateDialog(false);
      setFormData({
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
      setUploadedImage(null);
      fetchPromotions(statusFilter);

    } catch (error) {
      console.error('Error creating promotion:', error);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: error instanceof Error ? error.message : 'Failed to create promotion'
      });
    }
  };

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

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Promo code copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleSendPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setSelectedUsers([]);
    setUserSearch('');
    setShowUserModal(true);
    fetchUsers();
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const visibleUserIds = users.map(user => user.id);
    setSelectedUsers(visibleUserIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const sendPromotionToUsers = async () => {
    if (!selectedPromotion || selectedUsers.length === 0) return;

    try {
      setSendingPromotion(true);

      const response = await fetch('/api/crm/promotions/send', {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promotionId: selectedPromotion.id,
          userIds: selectedUsers,
          sendMethod: 'email'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send promotion');
      }

      const result = await response.json();

      Swal.fire({
        icon: 'success',
        title: 'Promotion Sent!',
        html: `
          <p>Successfully sent to <strong>${selectedUsers.length}</strong> customers</p>
          <div style="margin-top: 15px;">
            <p><strong>Promotion Link:</strong></p>
            <input type="text" value="${result.promotionLink}" readonly 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
          </div>
        `,
        confirmButtonText: 'Great!'
      });

      setShowUserModal(false);
      fetchPromotions(statusFilter); // Refresh to update sent counts

    } catch (error) {
      console.error('Error sending promotion:', error);
      Swal.fire({
        icon: 'error',
        title: 'Send Failed',
        text: 'Failed to send promotion. Please try again.'
      });
    } finally {
      setSendingPromotion(false);
    }
  };

  const generatePromotionLink = (promotion: Promotion) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/promotions/${promotion.id}${promotion.promoCode ? `?code=${promotion.promoCode}` : ''}`;
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
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Promotion
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Promotion</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Promotion Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Summer Car Wash Special"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your promotion..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select value={formData.discountType} onValueChange={(value) => setFormData({...formData, discountType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount (R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountValue">
                      Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(R)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                      placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '50'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="minPurchaseAmount">Min Purchase Amount (R)</Label>
                    <Input
                      id="minPurchaseAmount"
                      type="number"
                      min="0"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({...formData, minPurchaseAmount: e.target.value})}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                    <Input
                      id="promoCode"
                      value={formData.promoCode}
                      onChange={(e) => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                      placeholder="e.g., SUMMER20"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Promotion Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {uploadedImage ? (
                        <div className="space-y-2">
                          <img 
                            src={uploadedImage} 
                            alt="Promotion" 
                            className="mx-auto max-h-32 rounded"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setUploadedImage(null)}
                          >
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                            className="hidden"
                            id="imageUpload"
                          />
                          <Label 
                            htmlFor="imageUpload" 
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            <Upload className="h-4 w-4" />
                            {imageUploading ? 'Uploading...' : 'Upload Image'}
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WebP up to 2MB (stored in database)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePromotion} className="bg-purple-600 hover:bg-purple-700">
                    Create Promotion
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

                    {promotion.usageLimit && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uses:</span>
                        <span className="text-xs">
                          {promotion.usedCount}/{promotion.usageLimit} 
                          ({promotion.remainingUses || 0} left)
                        </span>
                      </div>
                    )}

                    {promotion.promoCode && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Code:</span>
                        <button 
                          onClick={() => copyPromoCode(promotion.promoCode!)}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                        >
                          <span className="font-mono font-medium">{promotion.promoCode}</span>
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleSendPromotion(promotion)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const link = generatePromotionLink(promotion);
                        navigator.clipboard.writeText(link);
                        Swal.fire({
                          icon: 'success',
                          title: 'Link Copied!',
                          text: 'Promotion link copied to clipboard',
                          timer: 2000,
                          showConfirmButton: false
                        });
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        Swal.fire({
                          icon: 'info',
                          title: 'Edit Feature',
                          text: 'Edit functionality coming soon!',
                          timer: 2000,
                          showConfirmButton: false
                        });
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        Swal.fire({
                          icon: 'info',
                          title: 'Delete Feature',
                          text: 'Delete functionality coming soon!',
                          timer: 2000,
                          showConfirmButton: false
                        });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
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

    {/* User Selection Modal */}
    <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Send Promotion: {selectedPromotion?.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          {/* Search and Actions Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  fetchUsers(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAllUsers}
              disabled={users.length === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSelection}
              disabled={selectedUsers.length === 0}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Selected Count */}
          <div className="mb-3 text-sm text-gray-600">
            {selectedUsers.length} customer{selectedUsers.length !== 1 ? 's' : ''} selected
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loadingUsers ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading customers...</p>
              </div>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                    onClick={() => handleUserSelection(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                      className="h-4 w-4 text-purple-600 rounded border-gray-300"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {user.fullName}
                          </h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <Badge 
                            className={cn(
                              'text-xs',
                              user.customerType === 'VIP' ? 'bg-gold-100 text-gold-800' :
                              user.customerType === 'Regular' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            )}
                          >
                            {user.customerType}
                          </Badge>
                          
                          <span className="text-gray-500">
                            {user.totalBookings} booking{user.totalBookings !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && !loadingUsers && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No customers found</p>
                    {userSearch && (
                      <p className="text-sm">Try adjusting your search terms</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowUserModal(false)}
              disabled={sendingPromotion}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendPromotionToUsers}
              disabled={selectedUsers.length === 0 || sendingPromotion}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sendingPromotion ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedUsers.length} Customer{selectedUsers.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}