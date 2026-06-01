import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  ArrowUpRight,
} from "lucide-react";

const ESTADO_COLORS: Record<string, string> = {
  nuevo: "#3b82f6",
  contactado: "#f59e0b",
  interesado: "#8b5cf6",
  compro: "#10b981",
  perdido: "#ef4444",
};

const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  interesado: "Interesado",
  compro: "Compró",
  perdido: "Perdido",
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading } = trpc.analytics.summary.useQuery();
  const { data: leads } = trpc.leads.list.useQuery();

  const recentLeads = leads?.slice(0, 5) ?? [];

  const porEstadoData = (analytics?.porEstado ?? []).map((e: any) => ({
    name: ESTADO_LABELS[e.estado] ?? e.estado,
    value: e.count,
    color: ESTADO_COLORS[e.estado] ?? "#6366f1",
  }));

  const ventasData = (analytics?.ventasPorProducto ?? [])
    .filter((v: any) => v.ventas > 0)
    .slice(0, 6);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de tu actividad como afiliado Hotmart
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={analytics?.totalLeads ?? 0}
          subtitle="Prospectos registrados"
          icon={Users}
          color="#6366f1"
          loading={isLoading}
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${analytics?.tasaConversion ?? 0}%`}
          subtitle="Leads que compraron"
          icon={TrendingUp}
          color="#10b981"
          loading={isLoading}
        />
        <MetricCard
          title="Ventas Generadas"
          value={analytics?.conversiones ?? 0}
          subtitle="Compras confirmadas"
          icon={ShoppingCart}
          color="#f59e0b"
          loading={isLoading}
        />
        <MetricCard
          title="Comisiones Est."
          value={`$${(analytics?.totalComisiones ?? 0).toFixed(0)}`}
          subtitle="40% del precio de venta"
          icon={DollarSign}
          color="#8b5cf6"
          loading={isLoading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Embudo por estado */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Leads por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : porEstadoData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Sin datos aún
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {porEstadoData.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${analytics?.totalLeads ? Math.round((item.value / analytics.totalLeads) * 100) : 0}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventas por producto */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Ventas por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : ventasData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Sin ventas registradas aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ventasData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 240)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid oklch(0.88 0.01 240)" }}
                    cursor={{ fill: "oklch(0.95 0.008 240)" }}
                  />
                  <Bar dataKey="ventas" fill="oklch(0.38 0.14 270)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leads recientes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Leads Recientes</CardTitle>
            <a href="/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentLeads.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">
              No hay leads registrados aún. <a href="/leads" className="text-primary hover:underline">Agregar el primero</a>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLeads.map((lead: any) => (
                <a
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {lead.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lead.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.email || lead.telefono || "Sin contacto"}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 estado-${lead.estado}`}
                  >
                    {ESTADO_LABELS[lead.estado] ?? lead.estado}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
