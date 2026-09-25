import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Manager Portal — KWAK AUTO SPARE" },
      {
        name: "description",
        content: "KWAK AUTO SPARE Manager Portal",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/admin/quotations",
    label: "Quotations",
    icon: FileText,
  },
  {
    to: "/admin/customers",
    label: "Customers",
    icon: Users,
  },
  {
    to: "/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    to: "/admin/forecasting",
    label: "Forecasting",
    icon: TrendingUp,
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: FileBarChart,
  },
  {
    to: "/admin/alerts",
    label: "Alerts & Automation",
    icon: Bell,
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();

    navigate({
      to: "/auth",
      replace: true,
    });
  }

  const currentSection =
    NAV.find((item) => {
      if (item.exact) {
        return location.pathname === item.to;
      }

      return location.pathname.startsWith(item.to);
    })?.label ?? "Manager Portal";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col",
          "border-r border-border bg-background",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
          >
            <Logo />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Portal heading */}
        <div className="px-5 pt-6 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manager Portal
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 pb-6"
          aria-label="Manager navigation"
        >
          <div className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{
                    exact:
                      "exact" in item &&
                      item.exact === true,
                  }}
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{
                    className:
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold bg-secondary text-foreground",
                  }}
                >
                  <Icon className="size-5 shrink-0" />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Manager account */}
        <div className="border-t border-border p-4">
          <div className="mb-3 rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground">
              Signed in as
            </p>

            <p className="mt-1 text-sm font-semibold">
              Manager
            </p>

            <p className="text-xs text-muted-foreground">
              Administrator
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>

              <div>
                <p className="text-xs text-muted-foreground">
                  KWAK AUTO SPARE
                </p>

                <h1 className="text-lg font-semibold">
                  {currentSection}
                </h1>
              </div>
            </div>

            {/* Manager */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                M
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Manager
                </p>

                <p className="text-xs text-muted-foreground">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}