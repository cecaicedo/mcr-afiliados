import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Settings, ShieldCheck, Trash2 } from "lucide-react";

export default function ConexionesSociales() {
  const { data: credenciales = [], refetch } = trpc.apis.credenciales.list.useQuery();
  const createMutation = trpc.apis.credenciales.create.useMutation();
  const deleteMutation = trpc.apis.credenciales.delete.useMutation();

  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [idCuentaInput, setIdCuentaInput] = useState("");
  const [nombreCuentaInput, setNombreCuentaInput] = useState("");

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp Business Cloud",
      icon: "💬",
      description: "Mensajes de bienvenida automáticos, carritos abandonados y secuencias con Opt-In.",
      requiredScopes: ["whatsapp_business_messaging", "whatsapp_business_management"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/whatsapp/webhook",
    },
    {
      id: "instagram",
      name: "Instagram Business",
      icon: "📸",
      description: "Automatiza respuestas a comentarios en Reels y DMs para promocionar tus 30+ ebooks.",
      requiredScopes: ["instagram_basic", "instagram_manage_comments", "pages_show_list"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/instagram",
    },
    {
      id: "tiktok",
      name: "TikTok for Business",
      icon: "🎵",
      description: "Publica videos cortos de tus ebooks y automatiza respuestas a interacciones.",
      requiredScopes: ["video.upload", "user.info.basic"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/tiktok",
    },
  ];

  const handleSave = async () => {
    if (!tokenInput.trim()) {
      toast.error("El token de acceso es requerido");
      return;
    }

    try {
      await createMutation.mutateAsync({
        plataforma: selectedPlatform.id as any,
        tokenAcceso: tokenInput,
        idCuenta: idCuentaInput || undefined,
        nombreCuenta: nombreCuentaInput || selectedPlatform.name,
      });

      toast.success(`${selectedPlatform.name} conectado con éxito`);
      refetch();
      setSelectedPlatform(null);
      setTokenInput("");
      setIdCuentaInput("");
      setNombreCuentaInput("");
    } catch (err: any) {
      toast.error(err.message || "Error al conectar la cuenta");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Conexión eliminada");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la conexión");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Conexiones Sociales (ManyChat Style)</h1>
          <p className="text-sm text-muted-foreground">Conecta y autoriza tus cuentas de redes sociales para automatizar respuestas, DMs y comentarios.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1 px-3">
            <ShieldCheck className="h-4 w-4" /> Webhook Gateway Activo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((p) => {
          const cred = credenciales.find((c: any) => c.plataforma === p.id && c.activo);
          const isConnected = !!cred;

          return (
            <Card key={p.id} className="border-border/60 shadow-sm flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.icon}</span>
                    <div>
                      <CardTitle className="font-display text-lg">{p.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{p.description}</CardDescription>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Desconectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-3 border border-border/45 space-y-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Webhook:</span>
                    <span className="text-foreground truncate max-w-[180px]">{p.webhookUrl}</span>
                  </div>
                  {isConnected && (
                    <div className="flex items-center justify-between text-emerald-600 pt-1 border-t border-border/30">
                      <span>Cuenta ID:</span>
                      <span className="font-semibold">{cred.idCuenta ?? "Principal"}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 mt-4 p-4">
                {isConnected ? (
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDelete(cred.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Desconectar
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin credencial activa</span>
                )}
                <Button variant={isConnected ? "outline" : "default"} size="sm" className="gap-2" onClick={() => { setSelectedPlatform(p); setTokenInput(cred?.tokenAcceso ?? ""); setIdCuentaInput(cred?.idCuenta ?? ""); setNombreCuentaInput(cred?.nombreCuenta ?? ""); }}>
                  <Settings className="h-3.5 w-3.5" /> {isConnected ? "Editar Conexión" : "Conectar cuenta"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {selectedPlatform && (
        <Dialog open={!!selectedPlatform} onOpenChange={() => setSelectedPlatform(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <span>{selectedPlatform.icon}</span> Conectar {selectedPlatform.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Configura los datos de acceso para autorizar la automatización y recepción de webhooks de {selectedPlatform.name}.
              </p>
              <div className="space-y-1.5">
                <Label>Token de Acceso (API / Bearer) *</Label>
                <Input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="EAAB... o token de autorización" />
              </div>
              <div className="space-y-1.5">
                <Label>ID de Cuenta / Página / Número</Label>
                <Input value={idCuentaInput} onChange={(e) => setIdCuentaInput(e.target.value)} placeholder="Ej. 1029384756 o número WhatsApp" />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre identificador de la cuenta</Label>
                <Input value={nombreCuentaInput} onChange={(e) => setNombreCuentaInput(e.target.value)} placeholder="Ej. Mi Cuenta Afiliado" />
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground font-sans">
                <p className="font-semibold text-foreground">Permisos requeridos:</p>
                <p>{selectedPlatform.requiredScopes.join(", ")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlatform(null)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>
                Guardar Conexión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
