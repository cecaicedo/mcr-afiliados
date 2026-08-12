import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Webhook, Tag, Trash2, Copy, CheckCircle2, Clock, AlertCircle, RefreshCw, Zap, MessageCircle } from "lucide-react";
import { ApiCredentialsManager } from "@/components/ApiCredentialsManager";
import { WelcomeMessagesConfig } from "@/components/WelcomeMessagesConfig";

function WebhookInfo() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin}/api/hotmart/webhook`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: webhooks = [], isLoading } = trpc.analytics.webhooksRecientes.useQuery();

  const EVENTO_LABELS: Record<string, string> = {
    "PURCHASE_COMPLETE": "Compra Completada",
    "purchase.complete": "Compra Completada",
    "PURCHASE_CANCELED": "Reembolso",
    "purchase.refunded": "Reembolso",
    "PURCHASE_ABANDONED": "Carrito Abandonado",
    "purchase.abandoned": "Carrito Abandonado",
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Webhook className="w-4 h-4 text-primary" />
            URL del Webhook Hotmart
          </CardTitle>
          <CardDescription className="text-xs">
            Configura esta URL en el panel de Hotmart → Mis Productos → Webhooks para recibir eventos automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background border border-border rounded-md px-3 py-2 font-mono text-foreground break-all">
              {webhookUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copyUrl} className="shrink-0 gap-1.5">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              { evento: "PURCHASE_COMPLETE", label: "Compra Completada", desc: "Actualiza lead a 'Compró'" },
              { evento: "PURCHASE_ABANDONED", label: "Carrito Abandonado", desc: "Crea/actualiza lead a 'Interesado'" },
              { evento: "PURCHASE_CANCELED", label: "Reembolso", desc: "Registra interacción de reembolso" },
            ].map(({ evento, label, desc }) => (
              <div key={evento} className="p-3 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground mb-0.5">{label}</p>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial de webhooks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Historial de Webhooks Recibidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="py-10 text-center">
              <Webhook className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin webhooks recibidos aún</p>
              <p className="text-xs text-muted-foreground mt-1">Los eventos de Hotmart aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {webhooks.map((wh: any) => (
                <div key={wh.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${wh.procesado ? "bg-emerald-100" : wh.error ? "bg-red-100" : "bg-amber-100"}`}>
                    {wh.procesado ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : wh.error ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {EVENTO_LABELS[wh.evento] ?? wh.evento}
                    </p>
                    {wh.error && <p className="text-xs text-red-500 truncate">{wh.error}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(wh.createdAt).toLocaleString("es-CO", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EtiquetasConfig() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#6366f1");

  const { data: etiquetas = [], isLoading } = trpc.etiquetas.list.useQuery();
  const create = trpc.etiquetas.create.useMutation({
    onSuccess: () => { toast.success("Etiqueta creada"); utils.etiquetas.list.invalidate(); setShowForm(false); setNombre(""); },
    onError: (e) => toast.error(e.message),
  });
  const deleteEtiqueta = trpc.etiquetas.delete.useMutation({
    onSuccess: () => { toast.success("Etiqueta eliminada"); utils.etiquetas.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Organiza tus leads con etiquetas personalizadas</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nueva Etiqueta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
      ) : etiquetas.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
          <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin etiquetas creadas</p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {etiquetas.map((e: any) => (
            <div
              key={e.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium"
              style={{ background: `${e.color}15`, borderColor: `${e.color}40`, color: e.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
              {e.nombre}
              <button
                onClick={() => { if (confirm(`¿Eliminar etiqueta "${e.nombre}"?`)) deleteEtiqueta.mutate({ id: e.id }); }}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Nueva Etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: VIP, Interesado en finanzas..." />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <div className="flex gap-2">
                  {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"].map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: color === c ? "white" : "transparent", boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button disabled={!nombre.trim() || create.isPending} onClick={() => create.mutate({ nombre, color })}>
              {create.isPending ? "Creando..." : "Crear Etiqueta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordatoriosConfig() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const { data: recordatorios = [], isLoading } = trpc.reglas.list.useQuery();
  const [form, setForm] = useState({ nombre: "", diasInactividad: 3, mensaje: "" });

  const create = trpc.reglas.create.useMutation({
    onSuccess: () => { toast.success("Regla creada"); utils.reglas.list.invalidate(); setShowForm(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = trpc.reglas.update.useMutation({
    onSuccess: () => utils.reglas.list.invalidate(),
    onError: (e: any) => toast.error(e.message),
  });
  const deleteRec = trpc.reglas.delete.useMutation({
    onSuccess: () => { toast.success("Regla eliminada"); utils.reglas.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Reglas para recontactar leads inactivos automáticamente</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nueva Regla
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : recordatorios.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
          <RefreshCw className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin reglas de recordatorio</p>
          <p className="text-xs text-muted-foreground mt-1">Crea reglas para seguir leads inactivos automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordatorios.map((r: any) => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recontactar después de <strong>{r.diasInactividad} días</strong> sin respuesta
                </p>
              </div>
              <Badge variant={r.activo ? "default" : "secondary"} className="text-xs shrink-0">
                {r.activo ? "Activo" : "Inactivo"}
              </Badge>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggle.mutate({ id: r.id, activo: !r.activo })}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm(`¿Eliminar regla "${r.nombre}"?`)) deleteRec.mutate({ id: r.id }); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Nueva Regla de Recordatorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre de la regla *</Label>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Seguimiento 3 días" />
            </div>
            <div className="space-y-1.5">
              <Label>Días de inactividad para recontactar</Label>
              <Input
                type="number"
                min="1"
                value={form.diasInactividad}
                onChange={e => setForm(f => ({ ...f, diasInactividad: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">Se marcará para seguimiento si el lead no ha respondido en X días</p>
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje de recordatorio (opcional)</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                value={form.mensaje}
                onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                placeholder="Nota interna sobre esta regla..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              disabled={!form.nombre.trim() || create.isPending}
              onClick={() => create.mutate({ nombre: form.nombre, diasInactividad: form.diasInactividad, estadosAplicables: ["nuevo", "contactado", "interesado"], plantillaId: 0 })}
            >
              {create.isPending ? "Creando..." : "Crear Regla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Configuracion() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Webhooks, etiquetas y reglas de automatización</p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList className="h-9">
          <TabsTrigger value="webhooks" className="text-xs gap-1.5">
            <Webhook className="w-3.5 h-3.5" /> Webhooks Hotmart
          </TabsTrigger>
          <TabsTrigger value="etiquetas" className="text-xs gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Etiquetas
          </TabsTrigger>
          <TabsTrigger value="recordatorios" className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Recordatorios
          </TabsTrigger>
          <TabsTrigger value="apis" className="text-xs gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Integraciones
          </TabsTrigger>
          <TabsTrigger value="bienvenida" className="text-xs gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Bienvenida WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-6">
          <WebhookInfo />
        </TabsContent>

        <TabsContent value="etiquetas" className="mt-6">
          <EtiquetasConfig />
        </TabsContent>

        <TabsContent value="recordatorios" className="mt-6">
          <RecordatoriosConfig />
        </TabsContent>

        <TabsContent value="apis" className="mt-6">
          <ApiCredentialsManager />
        </TabsContent>

        <TabsContent value="bienvenida" className="mt-6">
          <WelcomeMessagesConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
