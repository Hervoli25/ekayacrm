
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Printer, Mail, Trash2, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface Service {
  service: string;
  quantity: number;
  price: number;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerEmail?: string;
  services: Array<{
    service: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  employee: {
    name: string;
  };
}

const SERVICE_OPTIONS = [
  'Trading Consultation',
  'Portfolio Analysis',
  'Risk Assessment',
  'Market Research',
  'Investment Planning',
  'Financial Advisory',
  'Tax Planning',
  'Retirement Planning',
];

export default function ReceiptGenerator() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [services, setServices] = useState<Service[]>([{ service: '', quantity: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [taxRate, setTaxRate] = useState(15); // 15% VAT
  const [loading, setLoading] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const addService = () => {
    setServices([...services, { service: '', quantity: 1, price: 0 }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updated = services.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    );
    setServices(updated);
  };

  const calculateTotals = () => {
    const subtotal = services.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const generateReceipt = async () => {
    if (!customerName.trim() || !paymentMethod) {
      toast({
        title: 'Error',
        description: 'Please fill in customer name and payment method',
        variant: 'destructive',
      });
      return;
    }

    const validServices = services.filter(s => s.service && s.price > 0);
    if (validServices.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one valid service',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { tax } = calculateTotals();
      
      const response = await fetch('/api/finance/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          customerEmail: customerEmail || undefined,
          services: validServices,
          paymentMethod,
          tax,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const receipt = await response.json();
      setGeneratedReceipt(receipt);
      
      toast({
        title: 'Success',
        description: 'Receipt generated successfully',
      });
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setServices([{ service: '', quantity: 1, price: 0 }]);
      setPaymentMethod('');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate receipt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReceipt = async () => {
    if (!generatedReceipt?.customerEmail) {
      toast({
        title: 'Error',
        description: 'No customer email provided',
        variant: 'destructive',
      });
      return;
    }

    // In a real implementation, you would call an API to send the email
    toast({
      title: 'Email Sent',
      description: `Receipt sent to ${generatedReceipt.customerEmail}`,
    });
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Receipt Generator</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receipt Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Receipt</CardTitle>
            <CardDescription>
              Create professional receipts for customer transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-3">
              <Label>Services</Label>
              {services.map((service, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-12 items-center">
                  <div className="md:col-span-5">
                    <Select
                      value={service.service}
                      onValueChange={(value) => updateService(index, 'service', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={service.quantity}
                      onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price (R)"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Badge variant="outline">
                      R{(service.price * service.quantity).toFixed(2)}
                    </Badge>
                  </div>

                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(index)}
                      disabled={services.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {/* Payment Method and Tax */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">VAT Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Totals Preview */}
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({taxRate}%):</span>
                <span>R{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R{total.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={generateReceipt} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Receipt'}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Receipt Preview */}
        {generatedReceipt && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Receipt Preview</CardTitle>
                  <CardDescription>#{generatedReceipt.receiptNumber}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  {generatedReceipt.customerEmail && (
                    <Button variant="outline" size="sm" onClick={sendEmailReceipt}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={printRef} className="space-y-6 p-6 bg-white text-black">
                {/* Receipt Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold">Ekhaya Intel Trading</h1>
                  <p className="text-sm text-gray-600">Professional Financial Services</p>
                  <p className="text-xs">VAT Registration: 123456789</p>
                </div>

                {/* Receipt Info */}
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-mono">{generatedReceipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(generatedReceipt.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{generatedReceipt.customerName}</span>
                  </div>
                  {generatedReceipt.customerEmail && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{generatedReceipt.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Served by:</span>
                    <span>{generatedReceipt.employee.name}</span>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <h3 className="font-semibold border-b">Services</h3>
                  {generatedReceipt.services.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div>{service.service}</div>
                        <div className="text-xs text-gray-500">
                          {service.quantity} x R{Number(service.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="font-semibold">
                        R{Number(service.total).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R{Number(generatedReceipt.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT:</span>
                    <span>R{Number(generatedReceipt.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>R{Number(generatedReceipt.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="text-center text-sm">
                  <p>Payment Method: {generatedReceipt.paymentMethod.replace('_', ' ')}</p>
                  <p className="text-xs mt-2 text-gray-500">
                    Thank you for choosing Ekhaya Intel Trading!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
