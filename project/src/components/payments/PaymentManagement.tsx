import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Payment, Invoice, Customer } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, CreditCard, DollarSign, Check, Calendar, Building } from 'lucide-react';

export default function PaymentManagement() {
  const { user, customer } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [user, customer]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPayments({
        page: 1,
        limit: 100,
        customer_id: user?.role === 'customer' && customer ? customer.id : undefined,
      });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
    setIsLoading(false);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">Track customer payments</p>
        </div>
        {user?.role !== 'customer' && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Received</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(payments.filter(p => {
                  const date = new Date(p.payment_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bank Transfers</p>
              <p className="text-2xl font-bold text-slate-900">
                {payments.filter(p => p.payment_method === 'bank_transfer').length}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl">
              <Building className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState message="No payments found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Payment #</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Invoice</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Method</TableCell>
                <TableCell header>Reference</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">{payment.payment_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>{payment.customer?.company_name}</TableCell>
                  <TableCell>{payment.invoice?.invoice_number || 'N/A'}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="default">{payment.payment_method}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{payment.reference_number || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchPayments();
        }}
      />
    </div>
  );
}

// ========== Add Payment Modal (FIXED) ==========
function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_id: '',
    amount: 0,
    payment_method: 'bank_transfer',
    reference_number: '',
    bank_name: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch customers and invoices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomersAndInvoices();
    }
  }, [isOpen]);

  const fetchCustomersAndInvoices = async () => {
    setLoadingCustomers(true);
    setLoadingInvoices(true);
    setError('');
    try {
      // Fetch customers
      const custRes = await apiService.getCustomers({ page: 1, limit: 200 });
      const activeCustomers = (custRes.data || []).filter((c: any) => c.is_active !== false);
      setCustomers(activeCustomers);
      console.log('✅ Customers loaded:', activeCustomers.length);

      // Fetch invoices that are pending or partial
      const invRes = await apiService.getInvoices({ page: 1, limit: 200 });
      const pendingInvoices = (invRes.data || []).filter((i: any) =>
        ['pending', 'partial'].includes(i.payment_status)
      );
      setInvoices(pendingInvoices);
      console.log('✅ Invoices loaded:', pendingInvoices.length);
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError(err.message || 'Failed to load customers or invoices.');
    } finally {
      setLoadingCustomers(false);
      setLoadingInvoices(false);
    }
  };

  // Filter invoices for selected customer
  const filteredInvoices = formData.customer_id
    ? invoices.filter(i => i.customer_id === formData.customer_id)
    : [];

  // When customer changes, reset invoice and amount
  const handleCustomerChange = (customerId: string) => {
    setFormData({
      ...formData,
      customer_id: customerId,
      invoice_id: '',
      amount: 0,
    });
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    setFormData({
      ...formData,
      invoice_id: invoiceId,
      amount: invoice ? invoice.amount_due : formData.amount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.customer_id) {
      setError('Please select a customer.');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setIsSubmitting(true);

    try {
      await apiService.createPayment({
        invoice_id: formData.invoice_id || undefined,
        customer_id: formData.customer_id,
        amount: formData.amount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        bank_name: formData.bank_name,
        notes: formData.notes,
      });

      onSuccess();
      // Reset form
      setFormData({
        customer_id: '',
        invoice_id: '',
        amount: 0,
        payment_method: 'bank_transfer',
        reference_number: '',
        bank_name: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Customer Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.customer_id}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loadingCustomers}
          >
            <option value="">{loadingCustomers ? 'Loading customers...' : 'Select customer'}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
          {loadingCustomers && <span className="text-xs text-slate-400">Loading customers...</span>}
        </div>

        {/* Invoice Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Apply to Invoice (optional)
          </label>
          <select
            value={formData.invoice_id}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.customer_id || loadingInvoices}
          >
            <option value="">{loadingInvoices ? 'Loading invoices...' : 'Select invoice (optional)'}</option>
            {filteredInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoice_number} - Due: {formatCurrency(i.amount_due)}
              </option>
            ))}
          </select>
          {formData.customer_id && filteredInvoices.length === 0 && !loadingInvoices && (
            <p className="text-xs text-amber-600 mt-1">No pending invoices for this customer.</p>
          )}
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          min={1}
          required
        />

        {/* Payment Method */}
        <Select
          label="Payment Method"
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          options={[
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
          ]}
        />

        <Input
          label="Reference Number"
          value={formData.reference_number}
          onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
          placeholder="UTR/Transaction ID"
        />

        <Input
          label="Bank Name"
          value={formData.bank_name}
          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Helper function to format currency inside the modal
function formatCurrency(amount: number) {
  return `E ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}