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
      ? "border-indigo-500 bg-white/10 font-medium text-white"
      : "border-transparent text-white/55 hover:bg-white/5 hover:text-white/90",
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
    : TITLES[pathname] ?? "ShopFloor";
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="font-display text-sm font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          LIVE
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-steel sm:inline">Daniel B.</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            DB
          </div>
        </div>
      </div>
    </header>
  );
}

/** ShopFloor mark: squared bracket enclosing three ascending throughput bars,
    the tallest in Safety Orange. */
function Logo() {
  return (
    <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M6 4 H4 V20 H6 M18 4 H20 V20 H18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-white/70"
        />
        <rect x="7.5" y="14" width="2.6" height="5" rx="0.5" className="fill-white/80" />
        <rect x="10.7" y="11" width="2.6" height="8" rx="0.5" className="fill-white/80" />
        <rect x="13.9" y="7" width="2.6" height="12" rx="0.5" className="fill-orange" />
      </svg>
    </span>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="flex w-56 flex-col bg-ink">
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <Logo />
          <span className="font-display text-sm font-semibold tracking-tight text-white">
            Shop<span className="text-orange">Floor</span>
          </span>
        </div>
        <nav className="flex flex-col py-2">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-4 py-3 text-[11px] text-white/40">
          v1.0 · Print &amp; Embroidery
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
