import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Order } from "../api";
import { Panel, StatusBadge } from "../components/ui";

function fmt(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const refresh = () =>
    api.order(Number(id)).then(setOrder).catch((e) => setError(e.message));

  useEffect(() => {
    refresh();
  }, [id]);

  async function act(action: "advance" | "cancel") {
    setError("");
    try {
      setOrder(await api[action](Number(id)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !order) return <p className="text-sm text-rose-600">{error}</p>;
  if (!order) return <p className="text-sm text-slate-400">Loading…</p>;

  const active = order.status === "planned" || order.status === "in_progress";
  const current = order.stages.find((s) => !s.finished_at);
  const nextLabel =
    current && !current.started_at ? `Start ${current.name}` : current ? `Finish ${current.name}` : "";

  return (
    <div className="space-y-5">
      <Link to="/orders" className="text-xs text-slate-500 hover:underline">
        ← Production Orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tabular-nums text-slate-900">{order.code}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {order.product.name} · {order.quantity} {order.product.unit}
            {order.customer && <> · {order.customer}</>}
          </p>
        </div>
        {active && (
          <div className="flex gap-2">
            <button
              onClick={() => act("advance")}
              className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {nextLabel}
            </button>
            <button
              onClick={() => act("cancel")}
              className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Panel title="Routing" bodyClass="">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="w-10 px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 font-medium">Started</th>
              <th className="px-4 py-2 font-medium">Finished</th>
            </tr>
          </thead>
          <tbody>
            {order.stages.map((s) => {
              const state = s.finished_at ? "done" : s.started_at ? "active" : "pending";
              const dot =
                state === "done"
                  ? "bg-emerald-500"
                  : state === "active"
                    ? "bg-amber-500"
                    : "bg-slate-300";
              return (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 tabular-nums text-slate-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                      {s.sequence}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmt(s.started_at)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmt(s.finished_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
