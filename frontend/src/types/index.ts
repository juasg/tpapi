// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  customerId?: string;
  roles: string[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  deliveryDate?: string;
  shipmentId?: string;
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  deliveryDate?: string;
  notes?: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  category: string;
  available: boolean;
  imageUrl?: string;
  minOrderQty?: number;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  downloadUrl?: string;
}

// ─── Shipments ───────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'PENDING'
  | 'PICKED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

export interface ShipmentEvent {
  timestamp: string;
  status: ShipmentStatus;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  events: ShipmentEvent[];
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export type ApiKeyStatus = 'ACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface ApiKey {
  id:          string;
  name:        string;
  key:         string | null;
  status:      ApiKeyStatus;
  product:     string;
  plan:        string;
  customerId:  string;
  companyName: string;
  useCase:     string;
  requestedAt: string;
  reviewedAt:  string | null;
  reviewNote:  string | null;
  createdAt:   string;
  lastUsedAt?: string;
  requestsToday: number;
  requestsLimit: number;
}

export interface ApiKeyRequest {
  name: string;
  product: string;
  plan: string;
  useCase: string;
}

// ─── API Products ─────────────────────────────────────────────────────────────

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  version: string;
  specUrl: string;
  endpoints: string[];
  plans: ApiPlan[];
  tags: string[];
}

export interface ApiPlan {
  id: string;
  name: string;
  requestsPerDay: number;
  requestsPerMinute: number;
  price: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}
