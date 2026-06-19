export type UserRole = 'admin' | 'management' | 'warehouse_staff' | 'customer' | 'production';
export type CustomerType = 'oem' | 'regular_dealer' | 'exclusive_dealer';
export type CustomerRating = 'gold' | 'silver' | 'bronze';
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'ready_for_dispatch' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type MovementType = 'in' | 'out' | 'transfer';
export type ProductCategory = 'fast_moving' | 'slow_moving' | 'seasonal' | 'regular';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  customer_code: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  customer_type: CustomerType;
  rating: CustomerRating;
  credit_limit: number;
  current_outstanding: number;
  total_purchases: number;
  payment_days: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  warehouse_code: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  phone?: string;
  manager_name?: string;
  capacity_units: number;
  current_utilization: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit: string;
  unit_price: number;
  cost_price?: number;
  gst_percentage: number;
  reorder_level: number;
  eoq: number;
  weight_kg?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_movement_at?: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  to_warehouse_id?: string;
  movement_type: MovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  warehouse_id?: string;
  order_date: string;
  required_date?: string;
  status: OrderStatus;
  priority: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  warehouse?: Warehouse;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  tax_percentage: number;
  line_total: number;
  dispatched_quantity: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  customer_id: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: Order;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id?: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  bank_name?: string;
  cheque_number?: string;
  notes?: string;
  received_by?: string;
  created_at: string;
  customer?: Customer;
  invoice?: Invoice;
}

export interface MaterialRejection {
  id: string;
  rejection_number: string;
  order_id?: string;
  invoice_id?: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  reason: string;
  rejection_date: string;
  status: string;
  resolution?: string;
  resolution_date?: string;
  credit_issued: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  product?: Product;
}

export interface ProductionTracking {
  id: string;
  product_id: string;
  batch_number?: string;
  planned_quantity: number;
  produced_quantity: number;
  rejected_quantity: number;
  start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  status: string;
  factory?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type?: string;
  is_read: boolean;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export interface Factory {
  id: string;
  factory_code: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dispatch {
  id: string;
  dispatch_number: string;
  order_id: string;
  warehouse_id: string;
  dispatch_date: string;
  transporter_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  status: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
  warehouse?: Warehouse;
  items?: DispatchItem[];
}

export interface DispatchItem {
  id: string;
  dispatch_id: string;
  product_id: string;
  order_item_id?: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  outstandingPayments: number;
  lowStockProducts: number;
  totalCustomers: number;
  monthlyGrowth: number;
  recentOrders: Order[];
  topProducts: { product: Product; quantity: number }[];
}

export interface AuthState {
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
