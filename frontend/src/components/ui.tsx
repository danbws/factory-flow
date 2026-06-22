import type { OrderStatus, Stage } from "../api";

const STATUS_META: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  planned: { label: "Planned", dot: "bg-slate-400", text: "text-slate-600" },
  in_progress: { label: "In progress", dot: "bg-amber-500", text: "text-amber-700" },
  done: { label: "Done", dot: "bg-emerald-500", text: "text-emerald-700" },
  cancelled: { label: "Cancelled", dot: "bg-rose-500", text: "text-rose-700" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function StageProgress({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex items-center gap-1">
      {stages.map((s) => {
        const state = s.finished_at ? "done" : s.started_at ? "active" : "pending";
        return (
          <span
            key={s.id}
            title={s.name}
            className={
              state === "done"
                ? "h-1.5 w-5 rounded-sm bg-emerald-500"
                : state === "active"
                  ? "h-1.5 w-5 rounded-sm bg-amber-400"
                  : "h-1.5 w-5 rounded-sm bg-slate-200"
            }
          />
        );
      })}
    </div>
  );
}

/** A bordered panel with an optional ruled header — the workhorse container. */
export function Panel({
  title,
  actions,
  children,
  bodyClass = "p-4",
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      {title && (
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  accent = "bg-slate-300",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className={`w-1 ${accent}`} />
      <div className="px-4 py-3">
        <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
        <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      </div>
    </div>
  );
}
