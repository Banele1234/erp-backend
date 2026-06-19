import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Invoice, Order, Customer } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Eye, FileText, Download, Send, Printer, DollarSign } from 'lucide-react';

const paymentStatusColors: Record<string, string> = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'danger',
};

export default function InvoiceManagement() {
  const { user, customer } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [user, customer]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('invoices')
        .select('*, customer:customers(*), order:orders(*)')
        .order('created_at', { ascending: false });

      if (user?.role === 'customer' && customer) {
        query = query.eq('customer_id', customer.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
    setIsLoading(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || inv.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalOutstanding = invoices
    .filter(i => i.payment_status !== 'paid')
    .reduce((sum, i) => sum + i.amount_due, 0);

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
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage customer invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {invoices.filter(i => i.payment_status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              <p className="text-2xl font-bold text-emerald-600">
                {invoices.filter(i => i.payment_status === 'paid').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600" />
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
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            className="w-48"
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState message="No invoices found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Invoice</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Due Date</TableCell>
                <TableCell header>Total</TableCell>
                <TableCell header>Paid</TableCell>
                <TableCell header>Due</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.customer?.company_name}</TableCell>
                  <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell className="text-emerald-600">{formatCurrency(invoice.amount_paid)}</TableCell>
                  <TableCell className="text-red-600 font-medium">{formatCurrency(invoice.amount_due)}</TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusColors[invoice.payment_status] as any}>
                      {invoice.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInvoice(null);
        }}
        onUpdate={fetchInvoices}
      />
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onUpdate,
}: {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 -mx-6 -mt-6 p-6 rounded-t-xl">
          <div className="text-white">
            <h3 className="text-xl font-bold">{invoice.invoice_number}</h3>
            <p className="text-blue-100">{invoice.customer?.company_name}</p>
          </div>
          <Badge className="bg-white text-blue-700" size="lg">
            {invoice.payment_status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">Bill To</h4>
            <p className="font-medium text-slate-900">{invoice.customer?.company_name}</p>
            <p className="text-sm text-slate-600">{invoice.customer?.address}</p>
            <p className="text-sm text-slate-600">{invoice.customer?.city}, {invoice.customer?.state}</p>
            <p className="text-sm text-slate-600">GST: {invoice.customer?.gst_number}</p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-sm text-slate-500">Invoice Date</p>
              <p className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Due Date</p>
              <p className="font-medium">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span className="font-medium text-emerald-600">-{formatCurrency(invoice.discount_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax (GST)</span>
            <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-300">
            <span className="text-lg font-bold text-slate-900">Total</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Amount Paid</span>
            <span className="font-medium text-emerald-600">{formatCurrency(invoice.amount_paid)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span className="font-medium">Amount Due</span>
            <span className="font-bold">{formatCurrency(invoice.amount_due)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
