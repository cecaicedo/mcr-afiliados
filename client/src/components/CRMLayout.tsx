import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  BarChart3,
  Bot,
  ChevronRight,
  Cog,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/productos", icon: Package, label: "Productos" },
  { href: "/flujos", icon: Zap, label: "Automatizaciones" },
  { href: "/plantillas", icon: MessageSquare, label: "Plantillas" },
  { href: "/analiticas", icon: BarChart3, label: "Analíticas" },
];

const bottomItems = [
  { href: "/configuracion", icon: Cog, label: "Configuración" },
];

function SidebarNav() {
  const [location, navigate] = useLocation();

  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = location === href || (href !== "/" && location.startsWith(href));
        return (
          <button
            key={href}
            onClick={() => navigate(href)}
            className={cn("sidebar-item w-full", isActive && "active")}
          >
            <Icon className="icon" />
            <span className="flex-1 text-left">{label}</span>
            {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
          </button>
        );
      })}
    </nav>
  );
}

interface CRMLayoutProps {
  children: React.ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border p-4 space-y-3">
          <Skeleton className="h-8 w-36 bg-sidebar-accent" />
          <Skeleton className="h-4 w-24 bg-sidebar-accent" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-sidebar-accent" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">MCR Afiliados</h1>
            <p className="text-muted-foreground mt-2 text-sm">CRM inteligente para afiliados Hotmart</p>
          </div>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="w-full"
            size="lg"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r"
        style={{ background: "var(--color-sidebar)", borderColor: "var(--color-sidebar-border)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-white leading-none">MCR Afiliados</p>
              <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.55 0.03 255)" }}>Hotmart CRM</p>
            </div>
          </div>
        </div>

        <Separator style={{ background: "var(--color-sidebar-border)" }} />

        {/* Navigation */}
        <SidebarNav />

        <Separator style={{ background: "var(--color-sidebar-border)" }} />

        {/* Bottom items */}
        <nav className="px-3 py-2 space-y-0.5">
          {bottomItems.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <button
                key={href}
                onClick={() => window.location.href = href}
                className={cn("sidebar-item w-full", isActive && "active")}
              >
                <Icon className="icon" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="px-3 pb-4 pt-2">
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "var(--color-sidebar-accent)" }}
          >
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || "Usuario"}</p>
              <p className="text-[10px] truncate" style={{ color: "oklch(0.55 0.03 255)" }}>
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={logout}
              className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.03 255)" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
