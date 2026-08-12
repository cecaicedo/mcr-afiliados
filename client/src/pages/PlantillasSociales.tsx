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
import { MessageSquare, Plus, Edit2, Trash2, Share2, Sparkles, CheckCircle2 } from "lucide-react";

export default function PlantillasSociales() {
  const utils = trpc.useUtils();
  const { data: plantillas = [], isLoading } = trpc.plantillasSociales.list.useQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const deleteMutation = trpc.plantillasSociales.delete.useMutation({
    onSuccess: () => { toast.success("Plantilla eliminada"); utils.plantillasSociales.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Respuestas Automáticas (Redes Sociales)</h1>
          <p className="text-sm text-muted-foreground">Configura palabras clave en comentarios y DMs para Instagram, TikTok, Facebook y YouTube con clasificación automática al embudo.</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva plantilla social
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instagram & Facebook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">Meta Webhooks</div>
            <p className="text-xs text-muted-foreground mt-1">Responde comentarios y DMs automáticamente mediante la API de Graph.</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TikTok & YouTube</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">Social Sync</div>
            <p className="text-xs text-muted-foreground mt-1">Captura prospectos que comentan en tus vídeos de reseña de ebooks.</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clasificación al Embudo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">Automática</div>
            <p className="text-xs text-muted-foreground mt-1">Cada interacción registra origen y convierte al usuario en Lead.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Plantillas activas por palabra clave
          </CardTitle>
          <CardDescription>Cuando un usuario escriba la palabra clave exacta en tus publicaciones, el CRM responderá y creará el lead.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando plantillas...</div>
          ) : plantillas.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No hay plantillas configuradas</p>
              <p className="text-xs text-muted-foreground mt-1">Crea tu primera regla de respuesta para redes sociales.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantillas.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize font-medium">{p.plataforma}</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-mono">🔑 {p.palabraClave}</Badge>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-150 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditing(p); setModalOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => deleteMutation.mutate({ id: p.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{p.nombre}</h3>
                    <p className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2.5 rounded-lg border border-border/40 font-mono">{p.mensajeRespuesta}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span>Estado: {p.activo ? "Activo" : "Pausado"}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado al Embudo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm bg-muted/20">
        <CardHeader>
          <CardTitle className="font-display text-base">Guía de Configuración: Webhooks de Meta (Instagram y Facebook)</CardTitle>
          <CardDescription>Sigue estos pasos para que Meta envíe los comentarios y DMs a tu CRM en tiempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border/60 space-y-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Paso 1</span>
              <h4 className="font-medium text-foreground">Crear App en Meta for Developers</h4>
              <p className="text-xs">Entra a <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary underline">developers.facebook.com</a>, crea una aplicación de tipo "Negocio" y añade el producto <strong>Messenger</strong> y <strong>Instagram Graph API</strong>.</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border/60 space-y-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Paso 2</span>
              <h4 className="font-medium text-foreground">Configurar la URL del Webhook</h4>
              <p className="text-xs">En la sección Webhooks, introduce la URL pública de tu CRM y el token de verificación (ej. <code>mcr_secret_token_2026</code>). Suscríbete a los eventos: <code>messages</code>, <code>messaging_postbacks</code> y <code>comments</code>.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <PlantillaSocialForm initial={editing} open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function PlantillaSocialForm({ initial, open, onClose }: { initial: any; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    plataforma: initial?.plataforma ?? "instagram",
    palabraClave: initial?.palabraClave ?? "INFO",
    mensajeRespuesta: initial?.mensajeRespuesta ?? "¡Hola! Gracias por tu interés. Aquí tienes el enlace de acceso al ebook: [HOTLINK]",
    activo: initial?.activo ?? true,
  });

  const create = trpc.plantillasSociales.create.useMutation({
    onSuccess: () => { toast.success("Plantilla social creada"); utils.plantillasSociales.list.invalidate(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const update = trpc.plantillasSociales.update.useMutation({
    onSuccess: () => { toast.success("Plantilla social actualizada"); utils.plantillasSociales.list.invalidate(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) update.mutate({ id: initial.id, ...form });
    else create.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{initial ? "Editar plantilla social" : "Nueva plantilla de respuesta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de la regla *</Label>
            <Input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej. Respuesta automática ebook finanzas" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Red social</Label>
              <Select value={form.plataforma} onValueChange={(val: any) => setForm({ ...form, plataforma: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Palabra clave *</Label>
              <Input value={form.palabraClave} onChange={(e) => setForm({ ...form, palabraClave: e.target.value })} required placeholder="Ej. LIBRO" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensaje de respuesta automática *</Label>
            <textarea className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.mensajeRespuesta} onChange={(e) => setForm({ ...form, mensajeRespuesta: e.target.value })} required placeholder="Escribe la respuesta..." />
            <p className="text-[11px] text-muted-foreground">El CRM clasificará automáticamente al usuario como Lead en etapa "nuevo" al recibir este comentario.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Switch checked={form.activo} onCheckedChange={(val) => setForm({ ...form, activo: val })} />
            <div><Label>Activar respuesta automática</Label></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{initial ? "Guardar cambios" : "Crear plantilla"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
