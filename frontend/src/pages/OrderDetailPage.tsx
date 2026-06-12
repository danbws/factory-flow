import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Order } from "../api";
import { Card, StatusBadge } from "../components/ui";

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

  if (error && !order) return <p className="text-rose-600">{error}</p>;
  if (!order) return <p className="text-slate-400">Loading…</p>;

  const active = order.status === "planned" || order.status === "in_progress";
  const current = order.stages.find((s) => !s.finished_at);
  const nextLabel =
    current && !current.started_at ? `Start ${current.name}` : current ? `Finish ${current.name}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/orders" className="text-sm text-slate-400 hover:underline">
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {order.code} <StatusBadge status={order.status} />
          </h1>
          <p className="text-sm text-slate-500">
            {order.product.name} · {order.quantity} {order.product.unit}
            {order.customer && <> · {order.customer}</>}
          </p>
        </div>
        {active && (
          <div className="flex gap-2">
            <button
              onClick={() => act("advance")}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              {nextLabel}
            </button>
            <button
              onClick={() => act("cancel")}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Cancel order
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Card title="ROUTING">
        <ol className="space-y-4">
          {order.stages.map((s) => {
            const state = s.finished_at ? "done" : s.started_at ? "active" : "pending";
            return (
              <li key={s.id} className="flex items-center gap-4">
                <div
                  className={
                    state === "done"
                      ? "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white"
                      : state === "active"
                        ? "flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white"
                        : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500"
                  }
                >
                  {s.sequence}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    Started: {fmt(s.started_at)} · Finished: {fmt(s.finished_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
