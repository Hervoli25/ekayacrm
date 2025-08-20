'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Mail, 
  Download,
  CheckCircle,
  Clock,
  User,
  Car,
  Calendar,
  Search,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';

interface PaymentConfirmationProps {
  booking: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceName: string;
    vehicleInfo: string;
    scheduledDate: string;
    scheduledTime: string;
    totalAmount: number;
    status: string;
  };
  onPaymentConfirmed: (paymentData: any) => void;
  onClose: () => void;
}

export function PaymentConfirmation({ 
  booking, 
  onPaymentConfirmed, 
  onClose 
}: PaymentConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'CASH',
    amountPaid: booking.totalAmount.toString(),
    paymentReference: '',
    confirmedBy: '',
    notes: ''
  });
  const [receiptSearchResults, setReceiptSearchResults] = useState<any[]>([]);
  const [showReceiptSearch, setShowReceiptSearch] = useState(false);
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchReceipts = async (query: string) => {
    if (query.length < 3) {
      setReceiptSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/crm/receipts/search?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (response.ok) {
        setReceiptSearchResults(result.receipts || []);
      } else {
        console.error('Receipt search failed:', result.error);
        setReceiptSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching receipts:', error);
      setReceiptSearchResults([]);
    }
  };

  const handleReceiptSearch = (query: string) => {
    setReceiptSearchQuery(query);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchReceipts(query);
    }, 300);
  };

  const selectReceiptId = (receiptId: string) => {
    setFormData(prev => ({
      ...prev,
      paymentReference: receiptId
    }));
    setShowReceiptSearch(false);
    setReceiptSearchQuery('');
    setReceiptSearchResults([]);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleConfirmPayment = async () => {
    if (!formData.confirmedBy.trim()) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please enter who is confirming this payment.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (parseFloat(formData.amountPaid) <= 0) {
      Swal.fire({
        title: 'Invalid Amount',
        text: 'Please enter a valid payment amount.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment
      const paymentResponse = await fetch('/api/crm/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: formData.paymentMethod,
          amountPaid: parseFloat(formData.amountPaid),
          paymentReference: formData.paymentReference || undefined,
          notes: formData.notes || undefined,
          confirmedBy: formData.confirmedBy
        })
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'Failed to confirm payment');
      }

      // Generate PDF receipt
      const receiptResponse = await fetch('/api/crm/receipts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData: paymentResult.receipt
        })
      });

      const receiptResult = await receiptResponse.json();

      if (!receiptResponse.ok) {
        throw new Error(receiptResult.error || 'Failed to generate receipt');
      }

      // Show success message with options
      const result = await Swal.fire({
        title: '✅ Payment Confirmed!',
        html: `
          <div class="text-left space-y-3">
            <p><strong>Receipt ID:</strong> ${paymentResult.receipt.receiptId}</p>
            <p><strong>Amount Paid:</strong> R${formData.amountPaid}</p>
            <p><strong>Payment Method:</strong> ${formData.paymentMethod}</p>
            <p><strong>Customer:</strong> ${booking.customerName}</p>
            <div class="mt-4 p-3 bg-green-50 rounded-lg">
              <p class="text-sm text-green-800">
                ✓ Payment recorded successfully<br>
                ✓ Booking marked as completed<br>
                ✓ Receipt generated
              </p>
            </div>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: '📧 Email Receipt',
        denyButtonText: '📄 Download PDF',
        cancelButtonText: 'Close',
        customClass: {
          confirmButton: 'bg-blue-500 hover:bg-blue-600',
          denyButton: 'bg-green-500 hover:bg-green-600',
          cancelButton: 'bg-gray-500 hover:bg-gray-600'
        }
      });

      if (result.isConfirmed) {
        // Email receipt
        await handleEmailReceipt(paymentResult.receipt.receiptId);
      } else if (result.isDenied) {
        // Download PDF
        handleDownloadReceipt(receiptResult.receipt);
      }

      // Notify parent component
      onPaymentConfirmed({
        payment: paymentResult.payment,
        receipt: receiptResult.receipt,
        booking: paymentResult.booking
      });

    } catch (error) {
      console.error('Payment confirmation error:', error);
      Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to confirm payment',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailReceipt = async (receiptId: string) => {
    try {
      const response = await fetch('/api/crm/receipts/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId,
          customerEmail: booking.customerEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          title: '📧 Email Sent!',
          text: `Receipt has been sent to ${booking.customerEmail}`,
          icon: 'success',
          timer: 3000
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      Swal.fire({
        title: 'Email Failed',
        text: 'Receipt could not be emailed. You can still download it manually.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleDownloadReceipt = (receipt: any) => {
    try {
      // Create download link for PDF
      const htmlContent = receipt.htmlContent;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receipt.receiptId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        title: '📄 Receipt Downloaded!',
        text: 'The receipt has been downloaded to your device.',
        icon: 'success',
        timer: 3000
      });
    } catch (error) {
      Swal.fire({
        title: 'Download Failed',
        text: 'Could not download receipt. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          Confirm Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Booking Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{booking.customerEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-500" />
              <span>{booking.serviceName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{booking.scheduledDate} at {booking.scheduledTime}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-green-600">
                R{booking.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">💵 Cash</option>
                <option value="CARD">💳 Card</option>
                <option value="EFT">🏦 EFT</option>
                <option value="MOBILE">📱 Mobile Payment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="amountPaid">Amount Paid (R)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                min="0"
                value={formData.amountPaid}
                onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                className="text-right font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
              <div className="relative">
                <Input
                  id="paymentReference"
                  placeholder="e.g., Transaction ID, Receipt ID"
                  value={formData.paymentReference}
                  onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowReceiptSearch(!showReceiptSearch)}
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Receipt Search Dropdown */}
              {showReceiptSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Search Receipts</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowReceiptSearch(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Search by Receipt ID, Customer name..."
                      value={receiptSearchQuery}
                      onChange={(e) => handleReceiptSearch(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto">
                    {receiptSearchResults.length > 0 ? (
                      receiptSearchResults.map((receipt, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectReceiptId(receipt.receiptId)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-blue-600">
                                {receipt.receiptId}
                              </div>
                              <div className="text-xs text-gray-600">
                                {receipt.customerName} • {receipt.serviceName}
                              </div>
                              <div className="text-xs text-gray-500">
                                R{receipt.amount.toFixed(2)} • {new Date(receipt.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : receiptSearchQuery.length >= 3 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No receipts found
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        Type at least 3 characters to search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmedBy">Confirmed By *</Label>
              <Input
                id="confirmedBy"
                placeholder="Staff member name"
                value={formData.confirmedBy}
                onChange={(e) => handleInputChange('confirmedBy', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional payment notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Payment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}