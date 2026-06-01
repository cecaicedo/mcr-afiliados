import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare, Pencil, Trash2, Bot, Sparkles, Copy } from "lucide-react";

const CATEGORIAS = [
  { value: "bienvenida", label: "Bienvenida", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "seguimiento", label: "Seguimiento", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "carrito_abandonado", label: "Carrito Abandonado", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "post_venta", label: "Post Venta", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "recordatorio", label: "Recordatorio", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "general", label: "General", color: "bg-gray-50 text-gray-700 border-gray-200" },
];

function PlantillaForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: any }) {
  const utils = trpc.useUtils();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    contenido: initial?.contenido ?? "",
    categoria: initial?.categoria ?? "general",
  });

  const create = trpc.plantillas.create.useMutation({
    onSuccess: () => { toast.success("Plantilla creada"); utils.plantillas.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.plantillas.update.useMutation({
    onSuccess: () => { toast.success("Plantilla actualizada"); utils.plantillas.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const extractVariables = (text: string) => {
    const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ""))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variables = extractVariables(form.contenido);
    if (isEdit) update.mutate({ id: initial.id, ...form, variables });
    else create.mutate({ ...form, variables });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: Bienvenida inicial" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contenido del mensaje *</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              rows={6}
              value={form.contenido}
              onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
              required
              placeholder="Hola {{nombre}}, te escribo sobre {{producto}}..."
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: <code className="bg-muted px-1 rounded text-xs">{"{{nombre}}"}</code>{" "}
              <code className="bg-muted px-1 rounded text-xs">{"{{producto}}"}</code>{" "}
              <code className="bg-muted px-1 rounded text-xs">{"{{enlace}}"}</code>{" "}
              <code className="bg-muted px-1 rounded text-xs">{"{{precio}}"}</code>
            </p>
            {form.contenido && extractVariables(form.contenido).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">Variables detectadas:</span>
                {extractVariables(form.contenido).map(v => (
                  <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear Plantilla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GeneradorIA({ open, onClose, productos }: { open: boolean; onClose: () => void; productos: any[] }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    productoId: "",
    etapaEmbudo: "bienvenida" as const,
    perfilLead: "",
  });
  const [resultado, setResultado] = useState<any>(null);

  const generar = trpc.plantillas.generarConIA.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      utils.plantillas.list.invalidate();
      toast.success("Plantilla generada con IA y guardada");
    },
    onError: (e) => toast.error(e.message),
  });

  const producto = productos.find((p: any) => p.id.toString() === form.productoId);

  const handleGenerar = () => {
    if (!producto) { toast.error("Selecciona un producto"); return; }
    generar.mutate({
      productoNombre: producto.nombre,
      productoDescripcion: producto.descripcion ?? undefined,
      etapaEmbudo: form.etapaEmbudo,
      perfilLead: form.perfilLead || undefined,
      enlaceAfiliado: producto.enlaceAfiliado,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setResultado(null); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generar Plantilla con IA
          </DialogTitle>
        </DialogHeader>
        {resultado ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-800 mb-1">{resultado.nombre}</p>
              <p className="text-sm text-emerald-700 whitespace-pre-wrap">{resultado.contenido}</p>
              {resultado.variables?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {resultado.variables.map((v: string) => (
                    <Badge key={v} className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">{v}</Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              ✅ Plantilla guardada automáticamente en tu catálogo
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResultado(null)}>Generar otra</Button>
              <Button onClick={() => { onClose(); setResultado(null); }}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto Hotmart *</Label>
              <Select value={form.productoId} onValueChange={v => setForm(f => ({ ...f, productoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                <SelectContent>
                  {productos.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa del embudo *</Label>
              <Select value={form.etapaEmbudo} onValueChange={v => setForm(f => ({ ...f, etapaEmbudo: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.filter(c => c.value !== "general").map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Perfil del lead (opcional)</Label>
              <Input
                value={form.perfilLead}
                onChange={e => setForm(f => ({ ...f, perfilLead: e.target.value }))}
                placeholder="Ej: emprendedor interesado en finanzas personales"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                onClick={handleGenerar}
                disabled={generar.isPending || !form.productoId}
                className="gap-2"
              >
                {generar.isPending ? (
                  <><Sparkles className="w-4 h-4 animate-pulse" /> Generando...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generar con IA</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Plantillas() {
  const [showForm, setShowForm] = useState(false);
  const [showIA, setShowIA] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filterCat, setFilterCat] = useState("all");
  const utils = trpc.useUtils();

  const { data: plantillas = [], isLoading } = trpc.plantillas.list.useQuery(
    filterCat !== "all" ? { categoria: filterCat } : undefined
  );
  const { data: productos = [] } = trpc.productos.list.useQuery();

  const deletePlantilla = trpc.plantillas.delete.useMutation({
    onSuccess: () => { toast.success("Plantilla eliminada"); utils.plantillas.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const getCategoriaStyle = (cat: string) => CATEGORIAS.find(c => c.value === cat)?.color ?? "";
  const getCategoriaLabel = (cat: string) => CATEGORIAS.find(c => c.value === cat)?.label ?? cat;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Plantillas de Mensajes</h1>
          <p className="text-sm text-muted-foreground mt-1">Mensajes WhatsApp reutilizables con variables dinámicas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowIA(true)} className="gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Generar con IA
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCat("all")} className="h-8 text-xs">
          Todas
        </Button>
        {CATEGORIAS.map(c => (
          <Button key={c.value} variant={filterCat === c.value ? "default" : "outline"} size="sm" onClick={() => setFilterCat(c.value)} className="h-8 text-xs">
            {c.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : plantillas.length === 0 ? (
        <div className="py-20 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Sin plantillas</p>
          <p className="text-xs text-muted-foreground mt-1">Crea plantillas o usa la IA para generarlas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plantillas.map((p: any) => (
            <Card key={p.id} className="hover:shadow-sm transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm truncate">{p.nombre}</h3>
                      {p.generadaPorIA && (
                        <Badge variant="outline" className="text-xs gap-1 shrink-0 border-primary/30 text-primary bg-primary/5">
                          <Bot className="w-2.5 h-2.5" /> IA
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs border ${getCategoriaStyle(p.categoria)}`}>
                      {getCategoriaLabel(p.categoria)}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => { navigator.clipboard.writeText(p.contenido); toast.success("Copiado"); }}
                      title="Copiar contenido"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditItem(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`¿Eliminar "${p.nombre}"?`)) deletePlantilla.mutate({ id: p.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-md p-3 line-clamp-4 whitespace-pre-wrap">
                  {p.contenido}
                </p>
                {p.variables && p.variables.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(p.variables as string[]).map((v: string) => (
                      <Badge key={v} variant="secondary" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlantillaForm open={showForm || !!editItem} onClose={() => { setShowForm(false); setEditItem(null); }} initial={editItem} />
      <GeneradorIA open={showIA} onClose={() => setShowIA(false)} productos={productos} />
    </div>
  );
}
