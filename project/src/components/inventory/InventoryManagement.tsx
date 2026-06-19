import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Inventory, Warehouse, MovementType } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Package, Warehouse as WarehouseIcon, ArrowUp, ArrowDown, ArrowRight, AlertTriangle } from 'lucide-react';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, whRes] = await Promise.all([
        supabase
          .from('inventory')
          .select('*, product:products(*), warehouse:warehouses(*)')
          .order('created_at', { ascending: false }),
        supabase.from('warehouses').select('*').eq('is_active', true),
      ]);

      if (invRes.data) setInventory(invRes.data);
      if (whRes.data) setWarehouses(whRes.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
    setIsLoading(false);
  };

  const filteredInventory = inventory.filter((inv) => {
    const matchesSearch =
      inv.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.product?.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = !filterWarehouse || inv.warehouse_id === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (item: Inventory) => {
    const reorderLevel = item.product?.reorder_level || 100;
    if (item.available_quantity === 0) return { label: 'Out of Stock', color: 'danger' };
    if (item.available_quantity < reorderLevel) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const lowStockCount = inventory.filter(i =>
    i.available_quantity < (i.product?.reorder_level || 100)
  ).length;
  const outOfStockCount = inventory.filter(i => i.available_quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track and manage stock levels across warehouses</p>
        </div>
        <Button onClick={() => setShowAdjustModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adjust Inventory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total SKUs</p>
              <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Warehouses</p>
              <p className="text-2xl font-bold text-slate-900">{warehouses.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <WarehouseIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <Package className="w-6 h-6 text-red-600" />
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
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
            className="w-48"
          />
        </div>

        {filteredInventory.length === 0 ? (
          <EmptyState message="No inventory items found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Warehouse</TableCell>
                <TableCell header>On Hand</TableCell>
                <TableCell header>Reserved</TableCell>
                <TableCell header>Available</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>Value</TableCell>
                <TableCell header>Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const value = (item.quantity || 0) * (item.product?.unit_price || 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.product?.name}</p>
                          <p className="text-sm text-slate-500">{item.product?.product_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="w-4 h-4 text-slate-400" />
                        <span>{item.warehouse?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-amber-600">{item.reserved_quantity}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{item.available_quantity}</TableCell>
                    <TableCell>{formatCurrency(item.product?.unit_price || 0)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(value)}</TableCell>
                    <TableCell>
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AdjustInventoryModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        warehouses={warehouses}
        inventory={inventory}
        onSuccess={() => {
          setShowAdjustModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

function AdjustInventoryModal({
  isOpen,
  onClose,
  warehouses,
  inventory,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  inventory: Inventory[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    movement_type: 'in' as MovementType,
    warehouse_id: '',
    product_id: '',
    to_warehouse_id: '',
    quantity: 0,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: moveError } = await supabase.from('inventory_movements').insert({
        movement_type: formData.movement_type,
        warehouse_id: formData.warehouse_id,
        product_id: formData.product_id,
        to_warehouse_id: formData.movement_type === 'transfer' ? formData.to_warehouse_id : null,
        quantity: formData.quantity,
        notes: formData.notes,
      });

      if (moveError) throw moveError;

      if (formData.movement_type === 'in') {
        await supabase.rpc('adjust_inventory', {
          p_product_id: formData.product_id,
          p_warehouse_id: formData.warehouse_id,
          p_quantity: formData.quantity,
        });
      } else if (formData.movement_type === 'out') {
        await supabase.rpc('adjust_inventory', {
          p_product_id: formData.product_id,
          p_warehouse_id: formData.warehouse_id,
          p_quantity: -formData.quantity,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }

    setIsSubmitting(false);
  };

  const availableProducts = inventory
    .filter(i => i.warehouse_id === formData.warehouse_id)
    .map(i => ({ value: i.product_id, label: i.product?.name || '' }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Inventory" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 mb-4">
          {[
            { type: 'in', label: 'Stock In', icon: ArrowDown },
            { type: 'out', label: 'Stock Out', icon: ArrowUp },
            { type: 'transfer', label: 'Transfer', icon: ArrowRight },
          ].map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => setFormData({ ...formData, movement_type: option.type as MovementType })}
              className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                formData.movement_type === option.type
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>

        <Select
          label="Warehouse"
          value={formData.warehouse_id}
          onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
          options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          placeholder="Select warehouse"
          required
        />

        {formData.movement_type === 'transfer' && (
          <Select
            label="To Warehouse"
            value={formData.to_warehouse_id}
            onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
            options={warehouses.filter(w => w.id !== formData.warehouse_id).map(w => ({ value: w.id, label: w.name }))}
            placeholder="Select destination warehouse"
            required
          />
        )}

        <Select
          label="Product"
          value={formData.product_id}
          onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          options={availableProducts}
          placeholder="Select product"
          required
        />

        <Input
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          min={1}
          required
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
