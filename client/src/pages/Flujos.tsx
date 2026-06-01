import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, Settings2, Trash2, ChevronRight, Play } from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = {
  nuevo_lead: "Nuevo Lead",
  estado_contactado: "Lead Contactado",
  estado_interesado: "Lead Interesado",
  estado_compro: "Lead Compró",
  estado_perdido: "Lead Perdido",
  carrito_abandonado: "Carrito Abandonado",
  post_venta: "Post Venta",
  manual: "Manual",
};

const TRIGGER_COLORS: Record<string, string> = {
  nuevo_lead: "bg-blue-50 text-blue-700 border-blue-200",
  estado_contactado: "bg-amber-50 text-amber-700 border-amber-200",
  estado_interesado: "bg-violet-50 text-violet-700 border-violet-200",
  estado_compro: "bg-emerald-50 text-emerald-700 border-emerald-200",
  estado_perdido: "bg-red-50 text-red-600 border-red-200",
  carrito_abandonado: "bg-orange-50 text-orange-700 border-orange-200",
  post_venta: "bg-teal-50 text-teal-700 border-teal-200",
  manual: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function Flujos() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: flujos = [], isLoading } = trpc.flujos.list.useQuery();

  const updateFlujo = trpc.flujos.update.useMutation({
    onSuccess: () => { utils.flujos.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteFlujo = trpc.flujos.delete.useMutation({
    onSuccess: () => { toast.success("Flujo eliminado"); utils.flujos.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Automatizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Flujos de mensajes WhatsApp configurables</p>
        </div>
        <Button onClick={() => navigate("/flujos/nuevo")} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Flujo
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : flujos.length === 0 ? (
        <div className="py-20 text-center">
          <Zap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Sin flujos de automatización</p>
          <p className="text-xs text-muted-foreground mt-1">Crea secuencias de mensajes para automatizar tu seguimiento</p>
          <Button className="mt-4 gap-2" onClick={() => navigate("/flujos/nuevo")}>
            <Plus className="w-4 h-4" /> Crear Primer Flujo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {flujos.map((flujo: any) => (
            <Card key={flujo.id} className={`transition-all duration-200 hover:shadow-sm ${!flujo.activo ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${flujo.activo ? "bg-primary/10" : "bg-muted"}`}>
                    <Zap className={`w-5 h-5 ${flujo.activo ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{flujo.nombre}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${TRIGGER_COLORS[flujo.trigger] ?? ""}`}
                      >
                        {TRIGGER_LABELS[flujo.trigger] ?? flujo.trigger}
                      </Badge>
                    </div>
                    {flujo.descripcion && (
                      <p className="text-xs text-muted-foreground truncate">{flujo.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{flujo.activo ? "Activo" : "Inactivo"}</span>
                      <Switch
                        checked={flujo.activo}
                        onCheckedChange={(v) => updateFlujo.mutate({ id: flujo.id, activo: v })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/flujos/${flujo.id}`)}
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`¿Eliminar flujo "${flujo.nombre}"?`)) deleteFlujo.mutate({ id: flujo.id }); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
