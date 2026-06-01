import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Clock, MessageSquare, ChevronDown,
} from "lucide-react";

const TRIGGERS = [
  { value: "nuevo_lead", label: "Nuevo Lead" },
  { value: "estado_contactado", label: "Lead Contactado" },
  { value: "estado_interesado", label: "Lead Interesado" },
  { value: "estado_compro", label: "Lead Compró" },
  { value: "estado_perdido", label: "Lead Perdido" },
  { value: "carrito_abandonado", label: "Carrito Abandonado" },
  { value: "post_venta", label: "Post Venta" },
  { value: "manual", label: "Manual" },
];

interface Paso {
  id?: number;
  orden: number;
  plantillaId: number;
  delayHoras: number;
  condicion?: string;
}

export default function FlujoDetalle() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNuevo = params.id === "nuevo";
  const flujoId = isNuevo ? 0 : parseInt(params.id ?? "0");

  const utils = trpc.useUtils();
  const { data: flujoData, isLoading } = trpc.flujos.byId.useQuery(
    { id: flujoId },
    { enabled: !isNuevo }
  );
  const { data: plantillas = [] } = trpc.plantillas.list.useQuery();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [trigger, setTrigger] = useState("nuevo_lead");
  const [activo, setActivo] = useState(true);
  const [pasos, setPasos] = useState<Paso[]>([]);

  useEffect(() => {
    if (flujoData) {
      setNombre(flujoData.nombre);
      setDescripcion(flujoData.descripcion ?? "");
      setTrigger(flujoData.trigger);
      setActivo(flujoData.activo);
      setPasos((flujoData.pasos ?? []).map((p: any) => ({
        id: p.id,
        orden: p.orden,
        plantillaId: p.plantillaId,
        delayHoras: p.delayHoras,
        condicion: p.condicion ?? "",
      })));
    }
  }, [flujoData]);

  const create = trpc.flujos.create.useMutation({
    onSuccess: (data) => {
      toast.success("Flujo creado");
      utils.flujos.list.invalidate();
      navigate(`/flujos/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.flujos.update.useMutation({
    onSuccess: () => {
      toast.success("Flujo actualizado");
      utils.flujos.byId.invalidate({ id: flujoId });
      utils.flujos.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!nombre.trim()) { toast.error("El nombre es requerido"); return; }
    if (pasos.some(p => !p.plantillaId)) { toast.error("Todos los pasos deben tener una plantilla"); return; }

    const data = { nombre, descripcion, trigger: trigger as any, activo, pasos };
    if (isNuevo) create.mutate(data);
    else update.mutate({ id: flujoId, ...data });
  };

  const addPaso = () => {
    setPasos(prev => [...prev, { orden: prev.length + 1, plantillaId: 0, delayHoras: 0, condicion: "" }]);
  };

  const removePaso = (idx: number) => {
    setPasos(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, orden: i + 1 })));
  };

  const updatePaso = (idx: number, field: keyof Paso, value: any) => {
    setPasos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  if (!isNuevo && isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/flujos")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Flujos
        </Button>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-xl font-display font-bold text-foreground">
          {isNuevo ? "Nuevo Flujo" : nombre || "Editar Flujo"}
        </h1>
      </div>

      {/* Configuración del flujo */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">Configuración General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre del flujo *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Bienvenida a nuevos leads" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descripción</Label>
              <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe el propósito de este flujo..." />
            </div>
            <div className="space-y-1.5">
              <Label>Disparador (Trigger)</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">El flujo se ejecutará cuando ocurra este evento</p>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch checked={activo} onCheckedChange={setActivo} />
                <span className="text-sm text-foreground">{activo ? "Flujo activo" : "Flujo inactivo"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pasos del flujo */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Secuencia de Mensajes
              <span className="ml-2 text-xs font-normal text-muted-foreground">({pasos.length} pasos)</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addPaso} className="gap-1.5 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" /> Agregar Paso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pasos.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin pasos configurados</p>
              <p className="text-xs text-muted-foreground mt-1">Agrega mensajes a la secuencia</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={addPaso}>
                <Plus className="w-3.5 h-3.5" /> Agregar Primer Paso
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pasos.map((paso, idx) => (
                <div key={idx} className="relative">
                  {idx < pasos.length - 1 && (
                    <div className="absolute left-5 top-full h-3 w-px bg-border z-10" />
                  )}
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Plantilla de mensaje *</Label>
                        <Select
                          value={paso.plantillaId ? paso.plantillaId.toString() : ""}
                          onValueChange={v => updatePaso(idx, "plantillaId", parseInt(v))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleccionar plantilla..." />
                          </SelectTrigger>
                          <SelectContent>
                            {plantillas.map((p: any) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                <span className="text-xs">{p.nombre}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Delay (horas)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={paso.delayHoras}
                          onChange={e => updatePaso(idx, "delayHoras", parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Condición (opcional)</Label>
                        <Input
                          value={paso.condicion ?? ""}
                          onChange={e => updatePaso(idx, "condicion", e.target.value)}
                          placeholder="Ej: si no respondió"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0 mt-0.5"
                      onClick={() => removePaso(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/flujos")}>Cancelar</Button>
        <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? "Guardando..." : isNuevo ? "Crear Flujo" : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
