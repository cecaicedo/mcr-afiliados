import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { filterProductsByNiche, getProductNiches } from "@shared/commercial";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Filter, Pencil, Plus, Search, Sparkles, Tag, Trash2, WalletCards, BookOpen, Star } from "lucide-react";

function ProductoForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: any }) {
  const utils = trpc.useUtils();
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    enlaceAfiliado: initial?.enlaceAfiliado ?? "",
    precio: initial?.precio ?? 0,
    categoria: initial?.categoria ?? "Finanzas",
    imagenUrl: initial?.imagenUrl ?? "",
    rating: initial?.rating ?? 9.5,
    comentariosCount: initial?.comentariosCount ?? 150,
    activo: initial?.activo ?? true,
  });

  const create = trpc.productos.create.useMutation({
    onSuccess: () => { toast.success("Ebook agregado al catálogo"); utils.productos.list.invalidate(); onClose(); },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.productos.update.useMutation({
    onSuccess: () => { toast.success("Ebook actualizado"); utils.productos.list.invalidate(); onClose(); },
    onError: (error) => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isEdit) update.mutate({ id: initial.id, ...form });
    else create.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Editar ebook" : "Agregar ebook al catálogo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del producto *</Label>
            <Input autoFocus value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} required placeholder="Ej. Finanzas personales desde cero" />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción comercial</Label>
            <textarea className="min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} placeholder="¿Qué problema ayuda a resolver?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>HotLink de afiliado *</Label>
              <Input type="url" value={form.enlaceAfiliado} onChange={(event) => setForm((current) => ({ ...current, enlaceAfiliado: event.target.value }))} required placeholder="https://go.hotmart.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>URL de imagen (Portada)</Label>
              <Input type="url" value={form.imagenUrl} onChange={(event) => setForm((current) => ({ ...current, imagenUrl: event.target.value }))} placeholder="https://images.unsplash.com/..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Precio (USD)</Label>
              <Input type="number" min="0" step="0.01" value={form.precio} onChange={(event) => setForm((current) => ({ ...current, precio: Number(event.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nicho / categoría</Label>
              <Input value={form.categoria} onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))} placeholder="Finanzas, Salud..." />
            </div>
            <div className="space-y-1.5">
              <Label>Calificación Hotmart</Label>
              <Input type="number" min="1" max="10" step="0.1" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) || 9.5 }))} />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Switch checked={form.activo} onCheckedChange={(value) => setForm((current) => ({ ...current, activo: value }))} />
            <div><Label>Disponible para promoción</Label><p className="text-[11px] text-muted-foreground">Solo los ebooks activos aparecerán como recomendables.</p></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending} className="min-h-11">{create.isPending || update.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar ebook"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Productos() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const utils = trpc.useUtils();
  const { data: productos = [], isLoading } = trpc.productos.list.useQuery();
  const deleteProducto = trpc.productos.delete.useMutation({
    onSuccess: () => { toast.success("Ebook eliminado"); utils.productos.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });

  const categories = useMemo(() => getProductNiches(productos), [productos]);
  const filtered = useMemo(() => filterProductsByNiche(productos, query, category), [productos, query, category]);
  const activeCount = productos.filter((product: any) => product.activo).length;
  const nicheCount = categories.length - 1;

  const copyHotLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("HotLink copiado", { description: "Ya puedes usarlo en una publicación o conversación." });
  };

  return (
    <div className="space-y-7 p-5 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Motor de ofertas Hotmart</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Catálogo de Ebooks y Nichos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Gestiona tus 30+ ebooks con tarjetas visuales optimizadas. Puedes subir tus propios productos o dejar que el CRM organice tus enlaces de afiliado.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="min-h-11 gap-2 px-5 shadow-sm"><Plus className="h-4 w-4" /> Agregar ebook</Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen del catálogo">
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><WalletCards className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{productos.length}</p><p className="text-xs text-muted-foreground">Ebooks en catálogo</p></div></CardContent></Card>
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600"><Tag className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{nicheCount}</p><p className="text-xs text-muted-foreground">Nichos activos</p></div></CardContent></Card>
        <Card className="border-border/80"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600"><BookOpen className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Listos para promoción</p></div></CardContent></Card>
      </section>

      <section className="space-y-3" aria-label="Filtros del catálogo">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por ebook, problema o nicho..." className="min-h-11 pl-9" aria-label="Buscar ebooks" /></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter className="h-4 w-4" /><span>{filtered.length} visibles</span></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por nicho">
          {categories.map((item: any) => <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)} className="min-h-9 shrink-0 rounded-full px-4">{item}</Button>)}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-96 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><Search className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" /><p className="font-medium">No encontramos ebooks con esos criterios.</p><p className="mt-1 text-sm text-muted-foreground">Prueba otro nicho o registra un nuevo producto.</p></CardContent></Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product: any) => {
            const defaultImg = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";
            const imageUrl = product.imagenUrl || defaultImg;
            return (
              <Card key={product.id} className={`group relative flex flex-col overflow-hidden rounded-2xl border-border/80 bg-card transition duration-200 hover:-translate-y-1 hover:shadow-xl ${!product.activo ? "opacity-60" : ""}`}>
                {/* Imagen destacada superior */}
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img src={imageUrl} alt={product.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm text-[10px] font-medium border-0">
                      {product.categoria || "Ebook"}
                    </Badge>
                    <div className="flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-white backdrop-blur-sm text-xs font-semibold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{Number(product.rating || 9.5).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Contenido comercial */}
                <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-display text-base font-bold leading-snug text-foreground" title={product.nombre}>
                        {product.nombre}
                      </h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Hotmart Afiliados</p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground pt-1">
                      {product.descripcion || "Promociona este ebook y gana comisiones automáticas con seguimiento por WhatsApp."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <button onClick={() => copyHotLink(product.enlaceAfiliado)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Copiar HotLink
                      </button>
                      <button onClick={() => setEditItem(product)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Precio oferta</p>
                        <p className="text-lg font-bold text-foreground">
                          ${Number(product.precio || 0).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">USD</span>
                        </p>
                      </div>
                      <Button asChild size="sm" className="h-9 px-3 gap-1 shadow-sm">
                        <a href={product.enlaceAfiliado} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" /> Ver oferta
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProductoForm open={showForm || Boolean(editItem)} onClose={() => { setShowForm(false); setEditItem(null); }} initial={editItem} />
    </div>
  );
}
