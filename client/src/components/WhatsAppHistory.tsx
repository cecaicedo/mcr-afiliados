import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck, Clock3, MessageCircle, XCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  entregado: "Entregado",
  leido: "Leído",
  error: "Error",
};

export function WhatsAppHistory({ leadId }: { leadId: number }) {
  const { data: mensajes = [], isLoading } = trpc.apis.whatsapp.listarMensajes.useQuery({ leadId });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          Historial WhatsApp
          <span className="text-xs font-normal text-muted-foreground">({mensajes.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="py-5 text-center">
            <MessageCircle className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Todavía no hay mensajes enviados a este lead.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mensajes.map((mensaje: any) => {
              const isError = mensaje.estado === "error";
              const Icon = isError ? XCircle : mensaje.estado === "pendiente" ? Clock3 : CheckCheck;
              return (
                <div key={mensaje.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <Badge variant={isError ? "destructive" : mensaje.estado === "pendiente" ? "secondary" : "outline"} className="gap-1 text-[10px]">
                      <Icon className="h-3 w-3" /> {STATUS_LABELS[mensaje.estado] ?? mensaje.estado}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(mensaje.createdAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-foreground/80">{mensaje.contenido}</p>
                  {mensaje.error && <p className="mt-1 text-[11px] text-destructive">{mensaje.error}</p>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
