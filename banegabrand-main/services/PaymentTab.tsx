// components/project/tabs/PaymentsTab.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface PaymentsTabProps {
  payments: Payment[];
}

export function PaymentsTab({ payments }: PaymentsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    payment_type: 'client',
    milestone: '',
    amount: '',
    due_date: '',
    status: 'pending',
  });

  const clientPayments = payments.filter(p => p.payment_type === 'client');
  const manufacturerPayments = payments.filter(p => p.payment_type === 'manufacturer');

  const totalClient = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const received = clientPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pending = clientPayments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  const totalManufacturer = manufacturerPayments.reduce((sum, p) => sum + p.amount, 0);
  const manufacturerPaid = manufacturerPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const manufacturerPending = manufacturerPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  const grossProfit = received - manufacturerPaid;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Client</p>
            <p className="text-lg font-semibold">{formatCurrency(totalClient)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Received</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(received)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gross Profit</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(grossProfit)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Client Payments</CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Milestone</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clientPayments.map(payment => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">{payment.milestone}</td>
                    <td className="p-2 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="p-2 text-sm">
                      {payment.due_date ? format(new Date(payment.due_date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
                {clientPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      No client payments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Payment Type</Label>
              <Select
                value={newPayment.payment_type}
                onValueChange={(v) => setNewPayment({ ...newPayment, payment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Payment</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Milestone</Label>
              <Input
                value={newPayment.milestone}
                onChange={(e) => setNewPayment({ ...newPayment, milestone: e.target.value })}
                placeholder="e.g., Booking Amount"
              />
            </div>
            <div className="grid gap-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newPayment.due_date}
                onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={newPayment.status}
                onValueChange={(v) => setNewPayment({ ...newPayment, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Add Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}