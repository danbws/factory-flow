export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
}

export interface Stage {
  id: number;
  sequence: number;
  name: string;
  started_at: string | null;
  finished_at: string | null;
}

export type OrderStatus = "planned" | "in_progress" | "done" | "cancelled";

export interface Order {
  id: number;
  code: string;
  product: Product;
  quantity: number;
  status: OrderStatus;
  customer: string | null;
  due_date: string | null;
  created_at: string;
  stages: Stage[];
}

export interface Dashboard {
  orders_by_status: Record<OrderStatus, number>;
  open_quantity_kg: number;
  stage_load: Record<string, number>;
  avg_lead_time_hours: number | null;
  recent_orders: Order[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed: ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  dashboard: () => request<Dashboard>("/api/dashboard"),
  products: () => request<Product[]>("/api/products"),
  createProduct: (data: Omit<Product, "id" | "description"> & { description?: string }) =>
    request<Product>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  orders: () => request<Order[]>("/api/orders"),
  order: (id: number) => request<Order>(`/api/orders/${id}`),
  createOrder: (data: { product_id: number; quantity: number; customer?: string }) =>
    request<Order>("/api/orders", { method: "POST", body: JSON.stringify(data) }),
  advance: (id: number) => request<Order>(`/api/orders/${id}/advance`, { method: "POST" }),
  cancel: (id: number) => request<Order>(`/api/orders/${id}/cancel`, { method: "POST" }),
};
