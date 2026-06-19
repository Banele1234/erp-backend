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
  password_hash: string;
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
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_movement_at?: string;
}

import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  customerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
