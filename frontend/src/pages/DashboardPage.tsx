import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Dashboard } from "../api";
import { Panel, StageProgress, StatTile, StatusBadge } from "../components/ui";

const KPIS: {
  key: keyof Dashboard["orders_by_status"];
  label: string;
  accent: string;
}[] = [
  { key: "planned", label: "Planned", accent: "bg-slate-400" },
  { key: "in_progress", label: "In progress", accent: "bg-amber-500" },
  { key: "done", label: "Completed", accent: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", accent: "bg-rose-500" },
];

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading…</p>;

  const maxLoad = Math.max(1, ...Object.values(data.stage_load));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {KPIS.map(({ key, label, accent }) => (
          <StatTile key={key} label={label} value={data.orders_by_status[key]} accent={accent} />
        ))}
        <StatTile
          label="Open qty (kg/m)"
          value={data.open_quantity_kg.toLocaleString()}
          accent="bg-indigo-500"
        />
        <StatTile
          label="Avg lead time"
          value={data.avg_lead_time_hours != null ? `${data.avg_lead_time_hours}h` : "—"}
          accent="bg-indigo-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Work in progress by stage">
          {Object.keys(data.stage_load).length === 0 ? (
            <p className="text-sm text-slate-400">Nothing on the floor right now.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(data.stage_load).map(([stage, count]) => (
                  <tr key={stage} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-700">{stage}</td>
                    <td className="py-2 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-sm bg-slate-100">
                          <div
                            className="h-2 rounded-sm bg-indigo-500"
                            style={{ width: `${(count / maxLoad) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-medium tabular-nums text-slate-800">
                          {count}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Recent orders"
          actions={
            <Link to="/orders" className="text-xs font-medium text-indigo-600 hover:underline">
              View all →
            </Link>
          }
          bodyClass=""
        >
          <table className="w-full text-sm">
            <tbody>
              {data.recent_orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/orders/${o.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {o.code}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {o.product.name} · {o.quantity} {o.product.unit}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StageProgress stages={o.stages} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
