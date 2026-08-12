import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Megaphone, Pencil, Trash2, Copy, ExternalLink, Tag, Users, Sparkles } from "lucide-react";

function CampanaForm({ open, onClose, initial, productos }: { open: boolean; onClose: () => void; initial?: any; productos: any[] }) {
  const utils = trpc.useUtils();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    fuente: initial?.fuente ?? "Instagram",
    utmSource: initial?.utmSource ?? "instagram",
    utmMedium: initial?.utmMedium ?? "social",
    utmCampaign: initial?.utmCampaign ?? "",
    productoId: initial?.productoId ? String(initial.productoId) : "none",
    activo: initial?.activo ?? true,
  });

  const create = trpc.campanas.create.useMutation({
    onSuccess: () => { toast.success("Campaña creada correctamente"); utils.campanas.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.campanas.update.useMutation({
    onSuccess: () => { toast.success("Campaña actualizada"); utils.campanas.list.invalidate(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      productoId: form.productoId === "none" ? null : Number(form.productoId),
    };
    if (isEdit) update.mutate({ id: initial.id, ...payload });
    else create.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar Campaña" : "Nueva Campaña y UTMs"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de la campaña *</Label>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required placeholder="Ej: Lanzamiento Ebook Finanzas Reel #1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fuente principal</Label>
              <Select value={form.fuente} onValueChange={v => setForm(f => ({ ...f, fuente: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Orgánico">Orgánico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ebook Asociado (Opcional)</Label>
              <Select value={form.productoId} onValueChange={v => setForm(f => ({ ...f, productoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (General)</SelectItem>
                  {productos.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>utm_source</Label>
              <Input value={form.utmSource} onChange={e => setForm(f => ({ ...f, utmSource: e.target.value }))} placeholder="instagram" />
            </div>
            <div className="space-y-1.5">
              <Label>utm_medium</Label>
              <Input value={form.utmMedium} onChange={e => setForm(f => ({ ...f, utmMedium: e.target.value }))} placeholder="social" />
            </div>
            <div className="space-y-1.5">
              <Label>utm_campaign</Label>
              <Input value={form.utmCampaign} onChange={e => setForm(f => ({ ...f, utmCampaign: e.target.value }))} placeholder="lanzamiento" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción / Notas</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Estrategia aplicada, ángulo de ventas..."
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Switch checked={form.activo} onCheckedChange={v => setForm(f => ({ ...f, activo: v }))} />
            <div><Label>Campaña Activa</Label><p className="text-[11px] text-muted-foreground">Permite atribuir nuevos leads que lleguen con estos UTMs.</p></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending} className="min-h-11">
              {create.isPending || update.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear campaña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Campanas() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data: campanas = [], isLoading } = trpc.campanas.list.useQuery();
  const { data: productos = [] } = trpc.productos.list.useQuery();

  const deleteCampana = trpc.campanas.delete.useMutation({
    onSuccess: () => { toast.success("Campaña eliminada"); utils.campanas.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const copyHotmartLinkWithUtm = async (campana: any, producto?: any) => {
    const baseUrl = producto?.enlaceAfiliado || "https://go.hotmart.com/ABC123XYZ";
    const separator = baseUrl.includes("?") ? "&" : "?";
    const utms = [
      campana.utmSource ? `utm_source=${encodeURIComponent(campana.utmSource)}` : "",
      campana.utmMedium ? `utm_medium=${encodeURIComponent(campana.utmMedium)}` : "",
      campana.utmCampaign ? `utm_campaign=${encodeURIComponent(campana.utmCampaign)}` : "",
    ].filter(Boolean).join("&");

    const fullUrl = utms ? `${baseUrl}${separator}${utms}` : baseUrl;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("HotLink con UTM copiado", { description: fullUrl });
  };

  const totalLeads = campanas.reduce((acc, c: any) => acc + (c.leadsCount || 0), 0);
  const activeCount = campanas.filter((c: any) => c.activo).length;

  return (
    <div className="space-y-7 p-5 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Atribución y tráfico
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Campañas & Captación</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Diseña enlaces con parámetros UTM para Hotmart, mide qué fuente social atrae más prospectos y automatiza el seguimiento por nicho.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="min-h-11 gap-2 px-5 shadow-sm">
          <Plus className="h-4 w-4" /> Nueva campaña
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de campañas">
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Megaphone className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{campanas.length}</p>
              <p className="text-xs text-muted-foreground">Campañas registradas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">Leads atribuidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600"><Tag className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Campañas activas</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : campanas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
            <p className="font-medium">No hay campañas registradas todavía.</p>
            <p className="mt-1 text-sm text-muted-foreground">Crea tu primera campaña con UTMs para rastrear tus ventas en Hotmart.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">Crear campaña</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campanas.map((campana: any) => {
            const producto = productos.find((p: any) => p.id === campana.productoId);
            return (
              <Card key={campana.id} className="group relative overflow-hidden rounded-2xl border-border/80 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-emerald-400" />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-[10px]"><Tag className="h-2.5 w-2.5" />{campana.fuente}</Badge>
                        <Badge variant={campana.activo ? "default" : "secondary"} className="text-[10px]">{campana.activo ? "Activa" : "Pausada"}</Badge>
                      </div>
                      <h2 className="line-clamp-2 text-base font-semibold leading-tight">{campana.nombre}</h2>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setEditItem(campana)} title="Editar campaña">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`¿Eliminar la campaña "${campana.nombre}"?`)) deleteCampana.mutate({ id: campana.id }); }} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="min-h-9 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {campana.descripcion || "Sin notas de estrategia adicionales."}
                  </p>
                  <div className="rounded-lg bg-muted/30 p-2.5 text-xs font-mono text-muted-foreground border border-border/60">
                    <p className="font-semibold text-foreground mb-1">UTM Hotmart:</p>
                    <p className="truncate">{campana.hotmartUtm || "Sin UTM configurados"}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Ebook: <strong className="text-foreground">{producto?.nombre || "General"}</strong></span>
                    <span className="font-semibold text-primary">{campana.leadsCount || 0} leads atribuidos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="outline" className="min-h-10 gap-1.5 text-xs" onClick={() => copyHotmartLinkWithUtm(campana, producto)}>
                      <Copy className="h-3.5 w-3.5" /> Copiar HotLink+UTM
                    </Button>
                    {producto?.enlaceAfiliado ? (
                      <Button asChild className="min-h-10 gap-1.5 text-xs">
                        <a href={producto.enlaceAfiliado} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Ver HotLink
                        </a>
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled className="min-h-10 gap-1.5 text-xs">
                        Sin enlace
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CampanaForm
        open={showForm || Boolean(editItem)}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        initial={editItem}
        productos={productos}
      />
    </div>
  );
}
