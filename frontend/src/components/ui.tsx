import type { OrderStatus, Stage } from "../api";

const STATUS_STYLES: Record<OrderStatus, string> = {
  planned: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StageProgress({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((s) => {
        const state = s.finished_at ? "done" : s.started_at ? "active" : "pending";
        return (
          <div key={s.id} className="flex items-center gap-1.5" title={s.name}>
            <div
              className={
                state === "done"
                  ? "h-2.5 w-2.5 rounded-full bg-emerald-500"
                  : state === "active"
                    ? "h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-100"
                    : "h-2.5 w-2.5 rounded-full bg-slate-200"
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h2 className="mb-4 text-sm font-semibold text-slate-500">{title}</h2>}
      {children}
    </div>
  );
}
