import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Customer } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState } from '../common/StatusBadge';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Star,
  Filter,
} from 'lucide-react';

const customerTypeLabels: Record<string, string> = {
  oem: 'OEM Customer',
  regular_dealer: 'Regular Dealer',
  exclusive_dealer: 'Exclusive Dealer',
};

const ratingColors: Record<string, string> = {
  gold: 'bg-amber-100 text-amber-700',
  silver: 'bg-slate-100 text-slate-700',
  bronze: 'bg-orange-100 text-orange-700',
};

const ratingDiscount: Record<string, number> = {
  gold: 20,
  silver: 10,
  bronze: 5,
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setIsLoading(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterType || c.customer_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUtilizationPercent = (customer: Customer) => {
    if (customer.credit_limit === 0) return 0;
    return Math.round((customer.current_outstanding / customer.credit_limit) * 100);
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customer base</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              { value: 'oem', label: 'OEM Customers' },
              { value: 'regular_dealer', label: 'Regular Dealers' },
              { value: 'exclusive_dealer', label: 'Exclusive Dealers' },
            ]}
            className="w-48"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <EmptyState message="No customers found" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{customer.company_name}</h3>
                      <p className="text-sm text-slate-500">{customer.customer_code}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ratingColors[customer.rating]}`}>
                    {customer.rating.charAt(0).toUpperCase() + customer.rating.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{customer.city}, {customer.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Star className="w-4 h-4" />
                    <span>{ratingDiscount[customer.rating]}% Discount Eligible</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Credit Utilization</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(customer.current_outstanding)} / {formatCurrency(customer.credit_limit)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        getUtilizationPercent(customer) > 80 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(getUtilizationPercent(customer), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCustomer(null);
        }}
        onUpdate={fetchCustomers}
      />

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchCustomers();
        }}
      />
    </div>
  );
}

function CustomerDetailsModal({
  customer,
  isOpen,
  onClose,
  onUpdate,
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    const { error } = await supabase
      .from('customers')
      .update(formData)
      .eq('id', customer.id);

    if (!error) {
      onUpdate();
      setIsEditing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="text-lg font-semibold"
              />
            ) : (
              <>
                <h3 className="text-xl font-semibold text-slate-900">{customer.company_name}</h3>
                <p className="text-slate-500">{customer.customer_code}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Rating</p>
            <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${ratingColors[customer.rating]}`}>
              {customer.rating.toUpperCase()}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Type</p>
            <p className="mt-1 font-medium text-slate-900">{customerTypeLabels[customer.customer_type]}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Discount</p>
            <p className="mt-1 font-medium text-slate-900">{ratingDiscount[customer.rating]}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.contact_person}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Address</h4>
            <p className="text-sm text-slate-600">
              {customer.address}<br />
              {customer.city}, {customer.state} - {customer.pincode}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-sm text-slate-500">Credit Limit</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(customer.credit_limit)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(customer.current_outstanding)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Purchases</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(customer.total_purchases)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    customer_type: 'regular_dealer' as const,
    credit_limit: 100000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from('customers').insert({
        customer_code: customerCode,
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gst_number: formData.gst_number,
        customer_type: formData.customer_type,
        credit_limit: formData.credit_limit,
        rating: 'bronze',
        country: 'India',
      });

      if (!error) {
        onSuccess();
        setFormData({
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          gst_number: '',
          customer_type: 'regular_dealer',
          credit_limit: 100000,
        });
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }

    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
          />
          <Input
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Select
            label="Customer Type"
            value={formData.customer_type}
            onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
            options={[
              { value: 'oem', label: 'OEM Customer' },
              { value: 'regular_dealer', label: 'Regular Dealer' },
              { value: 'exclusive_dealer', label: 'Exclusive Dealer' },
            ]}
          />
        </div>

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
          <Input
            label="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
          <Input
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="GST Number"
            value={formData.gst_number}
            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
          />
          <Input
            label="Credit Limit"
            type="number"
            value={formData.credit_limit}
            onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
