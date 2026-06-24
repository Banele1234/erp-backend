import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { Product } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Edit, Package, TrendingUp, TrendingDown, AlertTriangle, Filter } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  fast_moving: 'Fast Moving',
  slow_moving: 'Slow Moving',
  seasonal: 'Seasonal',
  regular: 'Regular',
};

const categoryColors: Record<string, string> = {
  fast_moving: 'bg-emerald-100 text-emerald-700',
  slow_moving: 'bg-amber-100 text-amber-700',
  seasonal: 'bg-blue-100 text-blue-700',
  regular: 'bg-slate-100 text-slate-700',
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getProducts({
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
        category: filterCategory || undefined,
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setIsLoading(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
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
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Fast Moving</p>
              <p className="text-2xl font-bold text-emerald-600">
                {products.filter(p => p.category === 'fast_moving').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Slow Moving</p>
              <p className="text-2xl font-bold text-amber-600">
                {products.filter(p => p.category === 'slow_moving').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Seasonal</p>
              <p className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.category === 'seasonal').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'fast_moving', label: 'Fast Moving' },
              { value: 'slow_moving', label: 'Slow Moving' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'regular', label: 'Regular' },
            ]}
            className="w-48"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState message="No products found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Category</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>GST %</TableCell>
                <TableCell header>EOQ</TableCell>
                <TableCell header>Reorder Level</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.product_code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                      {categoryLabels[product.category]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.unit_price)}</TableCell>
                  <TableCell>{product.gst_percentage}%</TableCell>
                  <TableCell>{product.eoq}</TableCell>
                  <TableCell>{product.reorder_level}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'success' : 'danger'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchProducts();
        }}
      />

      <EditProductModal
        product={selectedProduct}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          fetchProducts();
        }}
      />
    </div>
  );
}

// ========== Add Product Modal (FIXED) ==========
function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'regular',
    unit: 'PCS',
    unit_price: 0,
    cost_price: 0,
    gst_percentage: 18,
    reorder_level: 100,
    eoq: 500,
    weight_kg: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ✅ Generate a unique product code
      const productCode = `PRD-${Date.now().toString(36).toUpperCase()}`;

      const payload = {
        ...formData,
        product_code: productCode,
      };

      await apiService.createProduct(payload);
      onSuccess();
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'regular',
        unit: 'PCS',
        unit_price: 0,
        cost_price: 0,
        gst_percentage: 18,
        reorder_level: 100,
        eoq: 500,
        weight_kg: 0,
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }

    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'fast_moving', label: 'Fast Moving' },
              { value: 'slow_moving', label: 'Slow Moving' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'regular', label: 'Regular' },
            ]}
          />
        </div>

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="PCS, KG, LTR"
          />
          <Input
            label="Unit Price"
            type="number"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
            required
          />
          <Input
            label="Cost Price"
            type="number"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
          />
          <Input
            label="GST %"
            type="number"
            value={formData.gst_percentage}
            onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Reorder Level"
            type="number"
            value={formData.reorder_level}
            onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
            helpText="Minimum stock before reorder"
          />
          <Input
            label="Economic Order Qty"
            type="number"
            value={formData.eoq}
            onChange={(e) => setFormData({ ...formData, eoq: Number(e.target.value) })}
            helpText="Optimal order quantity"
          />
          <Input
            label="Weight (KG)"
            type="number"
            step="0.01"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Product
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ========== Edit Product Modal ==========
function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);

    try {
      await apiService.updateProduct(product.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
    }

    setIsSubmitting(false);
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category || 'regular'}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'fast_moving', label: 'Fast Moving' },
              { value: 'slow_moving', label: 'Slow Moving' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'regular', label: 'Regular' },
            ]}
          />
        </div>

        <Input
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Unit"
            value={formData.unit || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
          <Input
            label="Unit Price"
            type="number"
            value={formData.unit_price || 0}
            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
          />
          <Input
            label="Cost Price"
            type="number"
            value={formData.cost_price || 0}
            onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
          />
          <Input
            label="GST %"
            type="number"
            value={formData.gst_percentage || 0}
            onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Reorder Level"
            type="number"
            value={formData.reorder_level || 0}
            onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
          />
          <Input
            label="EOQ"
            type="number"
            value={formData.eoq || 0}
            onChange={(e) => setFormData({ ...formData, eoq: Number(e.target.value) })}
          />
          <Input
            label="Weight (KG)"
            type="number"
            step="0.01"
            value={formData.weight_kg || 0}
            onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active ?? true}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-slate-300"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Product is active</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}