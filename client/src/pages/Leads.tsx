import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, User, Mail, Phone, Tag, Trash2, Eye } from "lucide-react";

const ESTADOS = ["nuevo", "contactado", "interesado", "compro", "perdido"] as const;
const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado", compro: "Compró", perdido: "Perdido",
};

function LeadForm({
  open, onClose, productos, etiquetas,
}: {
  open: boolean;
  onClose: () => void;
  productos: any[];
  etiquetas: any[];
}) {
  const utils = trpc.useUtils();
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead creado correctamente");
      utils.leads.list.invalidate();
      utils.analytics.summary.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", estado: "nuevo" as const,
    fuente: "", campana: "", productoInteresId: undefined as number | undefined, notas: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate({ ...form, email: form.email || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Nombre completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono / WhatsApp</Label>
              <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Producto de interés</Label>
              <Select
                value={form.productoInteresId?.toString() ?? "none"}
                onValueChange={v => setForm(f => ({ ...f, productoInteresId: v === "none" ? undefined : parseInt(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {productos.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuente de tráfico</Label>
              <Input value={form.fuente} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))} placeholder="Instagram, Google, etc." />
            </div>
            <div className="space-y-1.5">
              <Label>Campaña</Label>
              <Input value={form.campana} onChange={e => setForm(f => ({ ...f, campana: e.target.value }))} placeholder="Nombre de campaña" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notas</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones sobre el lead..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? "Guardando..." : "Crear Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Leads() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);

  const { data: leads = [], isLoading } = trpc.leads.list.useQuery(
    filterEstado !== "all" ? { estado: filterEstado } : undefined
  );
  const { data: productos = [] } = trpc.productos.list.useQuery();
  const { data: etiquetas = [] } = trpc.etiquetas.list.useQuery();
  const utils = trpc.useUtils();

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead eliminado"); utils.leads.list.invalidate(); utils.analytics.summary.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = leads.filter((l: any) =>
    l.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
    (l.telefono && l.telefono.includes(search))
  );

  const productoNombre = (id?: number | null) => productos.find((p: any) => p.id === id)?.nombre;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} prospectos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Lead
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={filterEstado === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterEstado("all")}
              className="h-8 text-xs"
            >
              Todos
            </Button>
            {ESTADOS.map(e => (
              <Button
                key={e}
                variant={filterEstado === e ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterEstado(e)}
                className="h-8 text-xs"
              >
                {ESTADO_LABELS[e]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No hay leads</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || filterEstado !== "all" ? "Prueba con otros filtros" : "Agrega tu primer lead"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuente</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">{lead.nombre.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{lead.nombre}</p>
                            {lead.campana && <p className="text-xs text-muted-foreground">{lead.campana}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {lead.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</p>}
                          {lead.telefono && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.telefono}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className={`text-xs estado-${lead.estado}`}>
                          {ESTADO_LABELS[lead.estado]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground">
                          {productoNombre(lead.productoInteresId) ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {lead.fuente ? (
                          <Badge variant="secondary" className="text-xs">{lead.fuente}</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`¿Eliminar lead "${lead.nombre}"?`)) {
                                deleteLead.mutate({ id: lead.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadForm open={showForm} onClose={() => setShowForm(false)} productos={productos} etiquetas={etiquetas} />
    </div>
  );
}
