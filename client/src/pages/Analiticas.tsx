import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart3, Sparkles, Target } from "lucide-react";

const ESTADO_COLORS: Record<string, string> = {
  nuevo: "#3b82f6",
  contactado: "#f59e0b",
  interesado: "#8b5cf6",
  compro: "#10b981",
  perdido: "#ef4444",
};

const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado", compro: "Compró", perdido: "Perdido",
};

const FUNNEL_ORDER = ["nuevo", "contactado", "interesado", "compro"];

export default function Analiticas() {
  const { data: analytics, isLoading } = trpc.analytics.summary.useQuery();

  const porEstadoData = (analytics?.porEstado ?? []).map((e: any) => ({
    name: ESTADO_LABELS[e.estado] ?? e.estado,
    value: e.count,
    color: ESTADO_COLORS[e.estado] ?? "#6366f1",
  }));

  const funnelData = FUNNEL_ORDER
    .map(estado => {
      const item = (analytics?.porEstado ?? []).find((e: any) => e.estado === estado);
      return { name: ESTADO_LABELS[estado], value: item?.count ?? 0, fill: ESTADO_COLORS[estado] };
    })
    .filter(d => d.value > 0);

  const ventasData = (analytics?.ventasPorProducto ?? []).slice(0, 8);
  const fuentesData = ((analytics as any)?.porFuente ?? []).slice(0, 6);
  const campanasData = ((analytics as any)?.porCampana ?? []).slice(0, 6);

  return (
    <div className="space-y-7 p-5 md:p-8">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Aprendizaje comercial</div><h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Analíticas</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Descubre qué ebook, nicho, fuente y campaña están acercando más leads a la compra.</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Leads", value: analytics?.totalLeads ?? 0, icon: Users, color: "#6366f1", suffix: "" },
          { title: "Conversiones", value: analytics?.conversiones ?? 0, icon: ShoppingCart, color: "#10b981", suffix: "" },
          { title: "Tasa Conversión", value: analytics?.tasaConversion ?? 0, icon: TrendingUp, color: "#f59e0b", suffix: "%" },
          { title: "Comisiones Est.", value: (analytics?.totalComisiones ?? 0).toFixed(0), icon: DollarSign, color: "#8b5cf6", suffix: " USD" },
        ].map(({ title, value, icon: Icon, color, suffix }) => (
          <div key={title} className="metric-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-3xl font-display font-bold text-foreground mt-1">{value}{suffix}</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Embudo de conversión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Embudo de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56 w-full" /> : funnelData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <div className="space-y-2 mt-2">
                {funnelData.map((item, idx) => {
                  const pct = funnelData[0].value > 0 ? Math.round((item.value / funnelData[0].value) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-foreground">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.value} ({pct}%)</span>
                      </div>
                      <div className="h-7 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md flex items-center px-2 transition-all duration-700"
                          style={{ width: `${Math.max(pct, 5)}%`, background: item.fill }}
                        >
                          {pct > 15 && <span className="text-xs text-white font-medium">{pct}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56 w-full" /> : porEstadoData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={porEstadoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {porEstadoData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ventas por producto y fuentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Conversiones por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : ventasData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin ventas registradas</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ventasData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 240)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: "oklch(0.95 0.008 240)" }} />
                  <Bar dataKey="ventas" name="Ventas" fill="oklch(0.38 0.14 270)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" name="Leads" fill="oklch(0.88 0.01 240)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads por Fuente de Tráfico</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : fuentesData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos de fuentes</div>
            ) : (
              <div className="space-y-2 mt-2">
                {fuentesData.map((item: any) => {
                  const max = fuentesData[0]?.count ?? 1;
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.fuente} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground w-24 truncate shrink-0">{item.fuente || "Directo"}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {campanasData.length > 0 && <Card className="border-border/80"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Rendimiento por campaña</CardTitle><p className="text-xs text-muted-foreground">Usa este ranking para repetir los ángulos que generan más demanda.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{campanasData.map((item: any, index: number) => { const max = campanasData[0]?.count ?? 1; return <div key={item.campana} className="rounded-xl border border-border/70 p-3"><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium">{index + 1}. {item.campana || "Sin atribuir"}</span><Badge variant="secondary" className="shrink-0 text-[10px]">{item.count} leads</Badge></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500" style={{ width: `${Math.round((item.count / max) * 100)}%` }} /></div></div>; })}</div></CardContent></Card>}

      {/* Leads perdidos */}
      {((analytics?.porEstado ?? []).find((e: any) => e.estado === "perdido")?.count ?? 0) > 0 && (
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-700">Leads Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">
              Tienes <strong>{(analytics?.porEstado ?? []).find((e: any) => e.estado === "perdido")?.count}</strong> leads
              marcados como perdidos. Considera revisar tus flujos de seguimiento para recuperarlos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
