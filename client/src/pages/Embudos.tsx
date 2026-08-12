import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Layers, Plus, Edit2, Trash2, ExternalLink, Globe, Smartphone, ShoppingCart, MessageCircle, Eye } from "lucide-react";

export default function Embudos() {
  const utils = trpc.useUtils();
  const { data: embudos = [], isLoading } = trpc.embudos.list.useQuery();
  const { data: productos = [] } = trpc.productos.list.useQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const deleteMutation = trpc.embudos.delete.useMutation({
    onSuccess: () => { toast.success("Embudo eliminado"); utils.embudos.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "registro": return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none gap-1"><Globe className="h-3 w-3" /> Registro (Opt-in)</Badge>;
      case "whatsapp": return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp Redirección</Badge>;
      case "venta": return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none gap-1"><ShoppingCart className="h-3 w-3" /> Venta Directa</Badge>;
      default: return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Embudos de Venta & Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Crea páginas de registro, ingresos a WhatsApp y cartas de venta conectadas a tus 30+ ebooks en Hotmart.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Crear nuevo embudo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Páginas de Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">Opt-In Leads</div>
            <p className="text-xs text-muted-foreground mt-1">Captura nombres, emails y teléfonos con consentimiento WhatsApp obligatorio.</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flujos WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-600">Chat Directo</div>
            <p className="text-xs text-muted-foreground mt-1">Redirige al prospecto directamente al chat con plantilla precargada.</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Venta Directa Hotmart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-purple-600">Checkout HotLink</div>
            <p className="text-xs text-muted-foreground mt-1">Cartas de venta optimizadas con botón directo a tu enlace de afiliado.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Tus Embudos Activos
          </CardTitle>
          <CardDescription>Lista de landing pages generadas para tus campañas de promoción de ebooks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando embudos...</div>
          ) : embudos.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No tienes embudos creados</p>
              <p className="text-xs text-muted-foreground mt-1">Crea tu primer embudo para empezar a captar prospectos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {embudos.map((e: any) => {
                const prod = productos.find((p: any) => p.id === e.productoId);
                return (
                  <div key={e.id} className="rounded-xl border border-border/60 bg-card p-5 space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTipoBadge(e.tipo)}
                        <Badge variant="outline" className="font-mono text-xs">/{e.slug}</Badge>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditing(e); setModalOpen(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => deleteMutation.mutate({ id: e.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">{e.nombre}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Producto: <span className="font-medium text-foreground">{prod?.nombre ?? "Ebook general"}</span></p>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border/40 space-y-1">
                      <p className="text-xs font-semibold text-foreground">{e.tituloHero}</p>
                      {e.subtituloHero && <p className="text-[11px] text-muted-foreground line-clamp-1">{e.subtituloHero}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <span>Visitas: <strong>{e.visitasCount}</strong> | Conversiones: <strong className="text-emerald-600">{e.conversionesCount}</strong></span>
                      <a href={`/embudos/${e.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                        Ver página <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <EmbudoForm initial={editing} productos={productos} open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function EmbudoForm({ initial, productos, open, onClose }: { initial: any; productos: any[]; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    slug: initial?.slug ?? "",
    productoId: initial?.productoId ?? (productos[0]?.id ?? 1),
    tipo: initial?.tipo ?? "registro",
    tituloHero: initial?.tituloHero ?? "Domina esta habilidad y transforma tus resultados hoy",
    subtituloHero: initial?.subtituloHero ?? "Accede al ebook exclusivo con bonos y soporte directo por WhatsApp.",
    imagenHeroUrl: initial?.imagenHeroUrl ?? "",
    ctaTexto: initial?.ctaTexto ?? "Obtener Acceso Inmediato",
    colorTema: initial?.colorTema ?? "emerald",
    activo: initial?.activo ?? true,
  });

  const create = trpc.embudos.create.useMutation({
    onSuccess: () => { toast.success("Embudo creado con éxito"); utils.embudos.list.invalidate(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const update = trpc.embudos.update.useMutation({
    onSuccess: () => { toast.success("Embudo actualizado"); utils.embudos.list.invalidate(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) update.mutate({ id: initial.id, ...form });
    else create.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initial ? "Editar embudo de venta" : "Crear nuevo embudo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre interno *</Label>
              <Input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej. Lanzamiento Ebook Finanzas" />
            </div>
            <div className="space-y-1.5">
              <Label>URL Slug (ruta web) *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="ej. finanzas-exito" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Producto asociado</Label>
              <Select value={String(form.productoId)} onValueChange={(val) => setForm({ ...form, productoId: Number(val) })}>
                <SelectTrigger><SelectValue placeholder="Selecciona ebook" /></SelectTrigger>
                <SelectContent>
                  {productos.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre} (${p.precio})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Embudo</Label>
              <Select value={form.tipo} onValueChange={(val: any) => setForm({ ...form, tipo: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="registro">Página de Registro (Opt-in)</SelectItem>
                  <SelectItem value="whatsapp">Redirección a WhatsApp</SelectItem>
                  <SelectItem value="venta">Venta Directa Hotmart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Título Principal (Hero) *</Label>
            <Input value={form.tituloHero} onChange={(e) => setForm({ ...form, tituloHero: e.target.value })} required placeholder="Título gancho para el visitante" />
          </div>
          <div className="space-y-1.5">
            <Label>Subtítulo o Promesa</Label>
            <textarea className="min-h-16 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.subtituloHero} onChange={(e) => setForm({ ...form, subtituloHero: e.target.value })} placeholder="Breve descripción de los beneficios del ebook..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>URL de Imagen / Mockup del Ebook</Label>
              <Input value={form.imagenHeroUrl} onChange={(e) => setForm({ ...form, imagenHeroUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Texto del Botón (CTA)</Label>
              <Input value={form.ctaTexto} onChange={(e) => setForm({ ...form, ctaTexto: e.target.value })} required placeholder="Obtener Acceso Inmediato" />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Switch checked={form.activo} onCheckedChange={(val) => setForm({ ...form, activo: val })} />
            <div><Label>Embudo activo y público</Label></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{initial ? "Guardar cambios" : "Crear embudo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
