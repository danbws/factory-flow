import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Order, type OrderStatus, type Product } from "../api";
import { Panel, StageProgress, StatusBadge } from "../components/ui";

const inputClass =
  "mt-1 rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const labelClass = "flex flex-col text-xs font-medium uppercase tracking-wide text-slate-500";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [form, setForm] = useState({ product_id: "", quantity: "", customer: "" });

  const refresh = useCallback(() => {
    api
      .orders(filter === "all" ? undefined : filter)
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
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
    <div className="space-y-5">
      <Panel title="New production order">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <label className={labelClass}>
            Product
            <select
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className={inputClass}
            >
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Quantity
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={`${inputClass} w-32`}
            />
          </label>
          <label className={labelClass}>
            Customer
            <input
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className={inputClass}
            />
          </label>
          <button className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            Create order
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </Panel>

      <Panel
        title={`Orders · ${orders.length}`}
        bodyClass=""
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === f.value
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <a
              href={`/api/orders/export.csv${filter === "all" ? "" : `?status=${filter}`}`}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Export CSV
            </a>
          </div>
        }
      >
        {orders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No orders match this filter.</p>
        ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Routing</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/orders/${o.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {o.code}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{o.product.name}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-700">
                  {o.quantity} {o.product.unit}
                </td>
                <td className="px-4 py-2.5 text-slate-500">{o.customer ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StageProgress stages={o.stages} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </Panel>
    </div>
  );
}
