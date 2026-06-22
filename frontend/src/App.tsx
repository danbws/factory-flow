import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrdersPage from "./pages/OrdersPage";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/orders", label: "Production Orders", end: false },
];

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center border-l-2 px-4 py-2 text-sm transition-colors",
    isActive
      ? "border-indigo-400 bg-slate-800 text-white"
      : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
  ].join(" ");
}

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Production Orders",
};

function Topbar() {
  const { pathname } = useLocation();
  const title = pathname.startsWith("/orders/")
    ? "Order Detail"
    : TITLES[pathname] ?? "Factory Flow";
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-sm font-semibold text-slate-700">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          PRODUCTION
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">Daniel B.</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            DB
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <aside className="flex w-56 flex-col bg-slate-900">
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500 text-xs font-bold text-white">
            F
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            FACTORY<span className="text-indigo-400">FLOW</span>
          </span>
        </div>
        <nav className="flex flex-col py-2">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
          v1.0 · Textile module
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
