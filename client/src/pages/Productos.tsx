import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, ExternalLink, Pencil, Trash2, DollarSign, Tag } from "lucide-react";

function ProductoForm({
  open, onClose, initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: any;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    enlaceAfiliado: initial?.enlaceAfiliado ?? "",
    precio: initial?.precio ?? 0,
    categoria: initial?.categoria ?? "",
    activo: initial?.activo ?? true,
  });

  const create = trpc.productos.create.useMutation({
    onSuccess: () => { toast.success("Producto creado"); utils.productos.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.productos.update.useMutation({
    onSuccess: () => { toast.success("Producto actualizado"); utils.productos.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) update.mutate({ id: initial.id, ...form });
    else create.mutate(form);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del producto *</Label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: Curso de Marketing Digital" />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción breve del producto..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Enlace de afiliado *</Label>
            <Input
              type="url"
              value={form.enlaceAfiliado}
              onChange={e => setForm(f => ({ ...f, enlaceAfiliado: e.target.value }))}
              required
              placeholder="https://go.hotmart.com/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ej: Finanzas, Salud..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.activo} onCheckedChange={v => setForm(f => ({ ...f, activo: v }))} />
            <Label>Producto activo</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear Producto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Productos() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: productos = [], isLoading } = trpc.productos.list.useQuery();
  const deleteProducto = trpc.productos.delete.useMutation({
    onSuccess: () => { toast.success("Producto eliminado"); utils.productos.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogo de productos Hotmart del afiliado</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : productos.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Sin productos registrados</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega tus productos de Hotmart para comenzar</p>
          <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Agregar Producto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p: any) => (
            <Card key={p.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${!p.activo ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{p.nombre}</h3>
                    {p.categoria && (
                      <Badge variant="secondary" className="mt-1 text-xs gap-1">
                        <Tag className="w-2.5 h-2.5" />{p.categoria}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditItem(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`¿Eliminar "${p.nombre}"?`)) deleteProducto.mutate({ id: p.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {p.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.descripcion}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-foreground">{p.precio.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">USD</span>
                  </div>
                  <Badge variant={p.activo ? "default" : "secondary"} className="text-xs">
                    {p.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <a
                  href={p.enlaceAfiliado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver enlace de afiliado
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductoForm open={showForm || !!editItem} onClose={() => { setShowForm(false); setEditItem(null); }} initial={editItem} />
    </div>
  );
}
