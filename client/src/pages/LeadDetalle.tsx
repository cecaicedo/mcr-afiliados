import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  StickyNote,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { WhatsAppSender } from "@/components/WhatsAppSender";
import { WhatsAppHistory } from "@/components/WhatsAppHistory";

const ESTADOS = ["nuevo", "contactado", "interesado", "compro", "perdido"] as const;
const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado", compro: "Compró", perdido: "Perdido",
};

const TIPO_ICONS: Record<string, React.ElementType> = {
  mensaje_enviado: Send,
  mensaje_recibido: MessageSquare,
  nota: StickyNote,
  cambio_estado: RefreshCw,
  webhook: Webhook,
};

const ESTADO_MSG_ICONS: Record<string, React.ElementType> = {
  enviado: CheckCircle2,
  entregado: CheckCircle2,
  leido: CheckCircle2,
  fallido: XCircle,
  pendiente: Clock,
};

export default function LeadDetalle() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const leadId = parseInt(params.id ?? "0");
  const [nota, setNota] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: lead, isLoading } = trpc.leads.byId.useQuery({ id: leadId });
  const { data: interacciones = [], isLoading: loadingInt } = trpc.interacciones.byLeadId.useQuery({ leadId });
  const { data: productos = [] } = trpc.productos.list.useQuery();

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead actualizado");
      utils.leads.byId.invalidate({ id: leadId });
      utils.interacciones.byLeadId.invalidate({ leadId });
      utils.analytics.summary.invalidate();
      setNuevoEstado("");
    },
    onError: (e) => toast.error(e.message),
  });

  const addNota = trpc.leads.addNota.useMutation({
    onSuccess: () => {
      toast.success("Nota agregada");
      utils.interacciones.byLeadId.invalidate({ leadId });
      setNota("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Lead no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>Volver</Button>
      </div>
    );
  }

  const productoNombre = productos.find((p: any) => p.id === lead.productoInteresId)?.nombre;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Leads
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{lead.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">{lead.nombre}</h1>
            <p className="text-xs text-muted-foreground">
              Registrado el {new Date(lead.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`ml-auto estado-${lead.estado}`}>
          {ESTADO_LABELS[lead.estado]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del lead */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Información del Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lead.email && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="font-medium">{lead.email}</p>
                </div>
              )}
              {lead.telefono && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Teléfono / WhatsApp</p>
                  <p className="font-medium">{lead.telefono}</p>
                </div>
              )}
              {lead.fuente && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Fuente</p>
                  <Badge variant="secondary" className="text-xs">{lead.fuente}</Badge>
                </div>
              )}
              {lead.campana && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Campaña</p>
                  <p className="font-medium">{lead.campana}</p>
                </div>
              )}
              {productoNombre && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Producto de interés</p>
                  <p className="font-medium">{productoNombre}</p>
                </div>
              )}
              {lead.notas && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Notas</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cambiar estado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Cambiar Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={nuevoEstado || lead.estado} onValueChange={setNuevoEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => (
                    <SelectItem key={e} value={e}>
                      <span className={`inline-flex items-center gap-2`}>
                        <span className={`w-2 h-2 rounded-full ${
                          e === "nuevo" ? "bg-blue-500" :
                          e === "contactado" ? "bg-amber-500" :
                          e === "interesado" ? "bg-violet-500" :
                          e === "compro" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {ESTADO_LABELS[e]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                size="sm"
                disabled={!nuevoEstado || nuevoEstado === lead.estado || updateLead.isPending}
                onClick={() => updateLead.mutate({ id: leadId, estado: nuevoEstado as any })}
              >
                {updateLead.isPending ? "Actualizando..." : "Actualizar Estado"}
              </Button>
            </CardContent>
          </Card>

          {/* Agregar nota */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Agregar Nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Escribe una nota sobre este lead..."
                value={nota}
                onChange={e => setNota(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <Button
                className="w-full"
                size="sm"
                disabled={!nota.trim() || addNota.isPending}
                onClick={() => addNota.mutate({ leadId, nota })}
              >
                {addNota.isPending ? "Guardando..." : "Guardar Nota"}
              </Button>
            </CardContent>
          </Card>

          {/* Enviar WhatsApp */}
          <WhatsAppSender
            leadId={leadId}
            telefono={lead?.telefono || undefined}
            onMensajeEnviado={() => {
              utils.interacciones.byLeadId.invalidate({ leadId });
              utils.apis.whatsapp.listarMensajes.invalidate({ leadId });
            }}
          />
          <WhatsAppHistory leadId={leadId} />
        </div>

        {/* Historial de interacciones */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Historial de Interacciones
                <span className="ml-2 text-xs font-normal text-muted-foreground">({interacciones.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInt ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : interacciones.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4 pl-10">
                    {interacciones.map((int: any) => {
                      const Icon = TIPO_ICONS[int.tipo] ?? MessageSquare;
                      const StatusIcon = int.estadoMensaje ? ESTADO_MSG_ICONS[int.estadoMensaje] : null;
                      return (
                        <div key={int.id} className="relative">
                          <div className="absolute -left-10 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground capitalize">
                                  {int.tipo.replace("_", " ")}
                                </span>
                                {StatusIcon && (
                                  <StatusIcon className={`w-3 h-3 ${
                                    int.estadoMensaje === "fallido" ? "text-destructive" :
                                    int.estadoMensaje === "pendiente" ? "text-amber-500" : "text-emerald-500"
                                  }`} />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(int.createdAt).toLocaleString("es-CO", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{int.contenido}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
