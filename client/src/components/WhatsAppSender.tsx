import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, AlertCircle } from "lucide-react";

interface WhatsAppSenderProps {
  leadId: number;
  telefono?: string;
  onMensajeEnviado?: () => void;
}

export function WhatsAppSender({ leadId, telefono, onMensajeEnviado }: WhatsAppSenderProps) {
  const [mensaje, setMensaje] = useState("");
  const sendMutation = trpc.apis.whatsapp.enviarMensaje.useMutation();

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }

    if (!telefono) {
      toast.error("El lead no tiene teléfono registrado");
      return;
    }

    try {
      await sendMutation.mutateAsync({
        leadId,
        contenido: mensaje,
      });

      toast.success("Mensaje enviado correctamente");
      setMensaje("");
      onMensajeEnviado?.();
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el mensaje");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="w-4 h-4" />
          Enviar Mensaje WhatsApp
        </CardTitle>
        {telefono ? (
          <CardDescription>{telefono}</CardDescription>
        ) : (
          <CardDescription className="text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            No hay teléfono registrado
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Escribe tu mensaje aquí..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          maxLength={1024}
          disabled={!telefono || sendMutation.isPending}
          className="min-h-24"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{mensaje.length}/1024</span>
          <Button
            onClick={handleEnviar}
            disabled={!telefono || !mensaje.trim() || sendMutation.isPending}
            size="sm"
          >
            {sendMutation.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
