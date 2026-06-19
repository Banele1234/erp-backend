import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem, Customer, Product, Warehouse } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  Factory,
  Package,
  X,
  Send,
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  ready_for_dispatch: 'Ready for Dispatch',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  in_production: 'primary',
  quality_check: 'info',
  ready_for_dispatch: 'info',
  in_transit: 'primary',
  delivered: 'success',
  cancelled: 'danger',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  in_production: Factory,
  quality_check: CheckCircle,
  ready_for_dispatch: Package,
  in_transit: Truck,
  delivered: CheckCircle,
  cancelled: X,
};

export default function OrderManagement() {
  const { user, customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user, customer]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, customer:customers(*), warehouse:warehouses(*), items:order_items(*, product:products(*))')
        .order('created_at', { ascending: false });

      if (user?.role === 'customer' && customer) {
        query = query.eq('customer_id', customer.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setIsLoading(false);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage customer orders</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusLabels).slice(0, 5).map(([key, label]) => {
          const count = orders.filter(o => o.status === key).length;
          const Icon = statusIcons[key];
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${filterStatus === key ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  key === 'pending' ? 'bg-amber-100' :
                  key === 'in_production' ? 'bg-blue-100' :
                  key === 'delivered' ? 'bg-emerald-100' :
                  'bg-slate-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    key === 'pending' ? 'text-amber-600' :
                    key === 'in_production' ? 'text-blue-600' :
                    key === 'delivered' ? 'text-emerald-600' :
                    'text-slate-600'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
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
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
            ]}
            className="w-48"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState message="No orders found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Order</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Items</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{order.order_number}</p>
                        <p className="text-xs text-slate-500">Priority: {order.priority}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{order.customer?.company_name}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{order.items?.length || 0} items</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] as any}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
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

      <CreateOrderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchOrders();
        }}
      />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        onUpdate={fetchOrders}
      />
    </div>
  );
}

function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { customer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    warehouse_id: '',
    notes: '',
    required_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    const [prodRes, whRes, custRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('warehouses').select('*').eq('is_active', true),
      supabase.from('customers').select('*').eq('is_active', true),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (whRes.data) setWarehouses(whRes.data);
    if (custRes.data) {
      setCustomers(custRes.data);
      if (customer) {
        setFormData(prev => ({ ...prev, customer_id: customer.id }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      let subtotal = 0;
      let taxAmount = 0;

      const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const lineTotal = (product?.unit_price || 0) * item.quantity;
        const tax = lineTotal * ((product?.gst_percentage || 18) / 100);
        subtotal += lineTotal;
        taxAmount += tax;
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product?.unit_price || 0,
          tax_percentage: product?.gst_percentage || 18,
          line_total: lineTotal,
        };
      });

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: formData.customer_id,
          warehouse_id: formData.warehouse_id,
          required_date: formData.required_date || null,
          notes: formData.notes,
          subtotal,
          tax_amount: taxAmount,
          total_amount: subtotal + taxAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData && orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems.map(item => ({ ...item, order_id: orderData.id })));

        if (itemsError) throw itemsError;
      }

      onSuccess();
      setItems([]);
      setFormData({ customer_id: '', warehouse_id: '', notes: '', required_date: '' });
    } catch (error) {
      console.error('Error creating order:', error);
    }

    setIsSubmitting(false);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Customer"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            options={customers.map(c => ({ value: c.id, label: c.company_name }))}
            required
          />
          <Select
            label="Warehouse"
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            required
          />
          <Input
            label="Required Date"
            type="date"
            value={formData.required_date}
            onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Order Items</h4>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg text-slate-500">
              No items added. Click "Add Item" to add products.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                const lineTotal = (product?.unit_price || 0) * item.quantity;
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <Select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        options={products.map(p => ({ value: p.id, label: `${p.name} - ${p.product_code}` }))}
                        placeholder="Select product"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-sm text-slate-500">Line Total</p>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lineTotal)}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Order notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);
    setIsUpdating(false);
    onUpdate();
    onClose();
  };

  const statusSteps = [
    'pending', 'confirmed', 'in_production', 'quality_check', 'ready_for_dispatch', 'in_transit', 'delivered'
  ];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{order.order_number}</h3>
            <p className="text-slate-500">{order.customer?.company_name}</p>
          </div>
          <Badge variant={statusColors[order.status] as any} size="lg">
            {statusLabels[order.status]}
          </Badge>
        </div>

        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="flex justify-between relative">
            {statusSteps.slice(0, 5).map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const Icon = statusIcons[step];
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs mt-2 ${isCompleted ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                    {statusLabels[step]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-slate-500">Order Date</p>
            <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Required Date</p>
            <p className="font-medium">{order.required_date ? new Date(order.required_date).toLocaleDateString() : 'N/A'}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Warehouse</p>
            <p className="font-medium">{order.warehouse?.name || 'N/A'}</p>
          </Card>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-700 mb-3">Order Items</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Qty</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>Tax</TableCell>
                <TableCell header>Total</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-slate-500">{item.product?.product_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell>{item.tax_percentage}%</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.line_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Order Total</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.total_amount)}</p>
          </div>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => updateStatus('cancelled')}>
                Cancel Order
              </Button>
              <Button onClick={() => {
                const nextIndex = statusSteps.indexOf(order.status) + 1;
                if (nextIndex < statusSteps.length) {
                  updateStatus(statusSteps[nextIndex]);
                }
              }} isLoading={isUpdating}>
                <Send className="w-4 h-4 mr-2" />
                Update Status
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
