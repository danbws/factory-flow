import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Dashboard } from "../api";
import { Card, StageProgress, StatusBadge } from "../components/ui";

const KPIS: { key: keyof Dashboard["orders_by_status"]; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-600">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {KPIS.map(({ key, label }) => (
          <Card key={key}>
            <p className="text-3xl font-bold text-slate-800">{data.orders_by_status[key]}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </Card>
        ))}
        <Card>
          <p className="text-3xl font-bold text-slate-800">
            {data.open_quantity_kg.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-slate-500">Open quantity (kg/m)</p>
        </Card>
        <Card>
          <p className="text-3xl font-bold text-slate-800">
            {data.avg_lead_time_hours != null ? `${data.avg_lead_time_hours}h` : "—"}
          </p>
          <p className="mt-1 text-sm text-slate-500">Avg lead time (completed)</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="WORK IN PROGRESS BY STAGE">
          {Object.keys(data.stage_load).length === 0 ? (
            <p className="text-sm text-slate-400">Nothing on the floor right now.</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(data.stage_load).map(([stage, count]) => (
                <li key={stage} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{stage}</span>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 rounded bg-sky-400"
                      style={{ width: `${Math.min(count * 32, 160)}px` }}
                    />
                    <span className="w-6 text-right text-sm font-semibold text-slate-800">
                      {count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="RECENT ORDERS">
          <ul className="divide-y divide-slate-100">
            {data.recent_orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <div>
                  <Link to={`/orders/${o.id}`} className="font-medium text-sky-700 hover:underline">
                    {o.code}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {o.product.name} · {o.quantity} {o.product.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StageProgress stages={o.stages} />
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
