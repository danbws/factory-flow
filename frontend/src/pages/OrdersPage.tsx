import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Order, type Product } from "../api";
import { Card, StageProgress, StatusBadge } from "../components/ui";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ product_id: "", quantity: "", customer: "" });

  const refresh = () => api.orders().then(setOrders).catch((e) => setError(e.message));

  useEffect(() => {
    refresh();
    api.products().then(setProducts).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.createOrder({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        customer: form.customer || undefined,
      });
      setForm({ product_id: "", quantity: "", customer: "" });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="NEW PRODUCTION ORDER">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-slate-600">
            Product
            <select
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Quantity
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-600">
            Customer
            <input
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
            Create order
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </Card>

      <Card title={`ORDERS (${orders.length})`}>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2">Code</th>
              <th className="pb-2">Product</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Customer</th>
              <th className="pb-2">Routing</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="py-2.5">
                  <Link to={`/orders/${o.id}`} className="font-medium text-sky-700 hover:underline">
                    {o.code}
                  </Link>
                </td>
                <td className="py-2.5 text-slate-700">{o.product.name}</td>
                <td className="py-2.5 text-slate-700">
                  {o.quantity} {o.product.unit}
                </td>
                <td className="py-2.5 text-slate-500">{o.customer ?? "—"}</td>
                <td className="py-2.5">
                  <StageProgress stages={o.stages} />
                </td>
                <td className="py-2.5">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
