import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../lib/api';
import { Inventory, Warehouse, MovementType, Product } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Package, Warehouse as WarehouseIcon, ArrowUp, ArrowDown, ArrowRight, AlertTriangle, X, RefreshCw } from 'lucide-react';

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
        apiService.getInventory({ page: 1, limit: 200 }),
        apiService.getWarehouses(),
      ]);

      console.log('✅ Inventory received:', invRes.data?.length || 0, 'items');
      console.log('✅ Warehouses received:', whRes.data?.length || 0, 'items');
      console.log('📦 Warehouses data:', whRes.data);

      setInventory(invRes.data || []);
      setWarehouses(whRes.data || []);

      // If warehouses are empty, show a warning in console
      if (!whRes.data || whRes.data.length === 0) {
        console.warn('⚠️ No warehouses found. Check backend /api/v1/warehouses');
      }
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
    }
    setIsLoading(false);
  };

  const filteredInventory = inventory.filter((inv) => {
    const matchesSearch =
      inv.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.product?.product_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = !filterWarehouse || inv.warehouse_id === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAdjustModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adjust Inventory
          </Button>
        </div>
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
        onSuccess={() => {
          setShowAdjustModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

// ========== Adjust Inventory Modal ==========
function AdjustInventoryModal({
  isOpen,
  onClose,
  warehouses,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  onSuccess: () => void;
}) {
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [warehouseId, setWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product search state
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch products when search changes (debounced)
  useEffect(() => {
    if (!productSearch.trim()) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsProductLoading(true);
      try {
        const res = await apiService.getProducts({ search: productSearch, limit: 50 });
        setProducts(res.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsProductLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product.');
      return;
    }
    if (!warehouseId) {
      alert('Please select a warehouse.');
      return;
    }
    if (movementType === 'transfer' && !toWarehouseId) {
      alert('Please select destination warehouse.');
      return;
    }
    if (quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.adjustInventory({
        product_id: selectedProduct.id,
        warehouse_id: warehouseId,
        movement_type: movementType,
        quantity: quantity,
        to_warehouse_id: movementType === 'transfer' ? toWarehouseId : undefined,
        notes: notes,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to adjust inventory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setMovementType('in');
    setWarehouseId('');
    setToWarehouseId('');
    setQuantity(1);
    setNotes('');
    setProductSearch('');
    setSelectedProduct(null);
    setProducts([]);
    setShowDropdown(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adjust Inventory" size="md">
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
              onClick={() => setMovementType(option.type as MovementType)}
              className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                movementType === option.type
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
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          placeholder="Select source warehouse"
          required
        />

        {movementType === 'transfer' && (
          <Select
            label="To Warehouse"
            value={toWarehouseId}
            onChange={(e) => setToWarehouseId(e.target.value)}
            options={warehouses
              .filter(w => w.id !== warehouseId)
              .map(w => ({ value: w.id, label: w.name }))}
            placeholder="Select destination warehouse"
            required
          />
        )}

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowDropdown(true);
                if (e.target.value === '') {
                  setSelectedProduct(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search product by name or code..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {selectedProduct && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductSearch('');
                  setProducts([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showDropdown && productSearch.trim() !== '' && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isProductLoading ? (
                <div className="p-4 text-center text-slate-500">
                  <LoadingSpinner size="sm" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No products found. You can add a product from the Products page.
                </div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-0"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.product_code}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {selectedProduct && (
            <p className="text-xs text-emerald-600 mt-1">
              Selected: <strong>{selectedProduct.name}</strong>
            </p>
          )}
        </div>

        <Input
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min={1}
          required
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={handleClose}>
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