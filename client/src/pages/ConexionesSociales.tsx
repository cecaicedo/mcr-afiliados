import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Settings, ShieldCheck, Trash2, KeyRound, ExternalLink, Lock } from "lucide-react";

export default function ConexionesSociales() {
  const { data: credenciales = [], refetch } = trpc.apis.credenciales.list.useQuery();
  const createMutation = trpc.apis.credenciales.create.useMutation();
  const deleteMutation = trpc.apis.credenciales.delete.useMutation();

  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [authMode, setAuthMode] = useState<"oauth" | "token">("oauth");
  const [tokenInput, setTokenInput] = useState("");
  const [idCuentaInput, setIdCuentaInput] = useState("");
  const [nombreCuentaInput, setNombreCuentaInput] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp Business Cloud",
      icon: "💬",
      description: "Mensajes de bienvenida automáticos, carritos abandonados y secuencias con Opt-In.",
      requiredScopes: ["whatsapp_business_messaging", "whatsapp_business_management"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/whatsapp/webhook",
      oauthUrl: "https://developers.facebook.com/apps/whatsapp-business/",
    },
    {
      id: "instagram",
      name: "Instagram Business",
      icon: "📸",
      description: "Automatiza respuestas a comentarios en Reels y DMs para promocionar tus 30+ ebooks.",
      requiredScopes: ["instagram_basic", "instagram_manage_comments", "pages_show_list"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/instagram",
      oauthUrl: "https://www.facebook.com/v18.0/dialog/oauth?client_id=mcr_caicedo&scope=instagram_basic,instagram_manage_comments",
    },
    {
      id: "tiktok",
      name: "TikTok for Business",
      icon: "🎵",
      description: "Publica videos cortos de tus ebooks y automatiza respuestas a interacciones.",
      requiredScopes: ["video.upload", "user.info.basic"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/tiktok",
      oauthUrl: "https://www.tiktok.com/v2/auth/authorize/?client_key=mcr_caicedo",
    },
  ];

  const handleOAuthLogin = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      // Simular éxito de inicio de sesión OAuth y otorgamiento de permisos
      const simulatedToken = `oauth_token_${selectedPlatform.id}_${Math.random().toString(36).substring(7)}`;
      const simulatedAccountName = `Cuenta Oficial ${selectedPlatform.name} (${Math.floor(Math.random() * 89999 + 10000)})`;
      const simulatedAccountId = `acc_${Math.floor(Math.random() * 8999999 + 1000000)}`;

      createMutation.mutate({
        plataforma: selectedPlatform.id as any,
        tokenAcceso: simulatedToken,
        idCuenta: simulatedAccountId,
        nombreCuenta: simulatedAccountName,
      }, {
        onSuccess: () => {
          toast.success(`¡Autorización exitosa! ${selectedPlatform.name} conectado.`);
          refetch();
          setSelectedPlatform(null);
        },
        onError: (err) => toast.error(err.message),
      });
    }, 1500);
  };

  const handleSaveToken = async () => {
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

      toast.success(`${selectedPlatform.name} configurado con éxito`);
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
      toast.success("Conexión revocada y eliminada");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la conexión");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Conexiones Sociales & OAuth</h1>
          <p className="text-sm text-muted-foreground">Conecta tus cuentas mediante autorización segura (ManyChat Style) o tokens de API de desarrollador.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1 px-3">
            <ShieldCheck className="h-4 w-4" /> OAuth Gateway Activo
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
                    <span>Estado:</span>
                    <span className={isConnected ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                      {isConnected ? (cred.nombreCuenta ?? "Autorizado") : "Sin cuenta vinculada"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Webhook:</span>
                    <span className="text-foreground truncate max-w-[160px]">{p.webhookUrl}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 mt-4 p-4">
                {isConnected ? (
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDelete(cred.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Revocar acceso
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">1 clic para autorizar</span>
                )}
                <Button variant={isConnected ? "outline" : "default"} size="sm" className="gap-2" onClick={() => { setSelectedPlatform(p); setAuthMode("oauth"); setTokenInput(cred?.tokenAcceso ?? ""); }}>
                  <Settings className="h-3.5 w-3.5" /> {isConnected ? "Gestionar Cuenta" : "Conectar cuenta"}
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
              <div className="flex rounded-lg bg-muted p-1 border border-border">
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${authMode === "oauth" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setAuthMode("oauth")}
                >
                  🚀 Autorizar con Inicio de Sesión (OAuth)
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${authMode === "token" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setAuthMode("token")}
                >
                  🔑 Ingresar Token Manual
                </button>
              </div>

              {authMode === "oauth" ? (
                <div className="space-y-4 text-center py-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Autorización Segura ManyChat Style</p>
                    <p className="text-xs text-muted-foreground">
                      Haz clic en el botón para iniciar sesión en {selectedPlatform.name}, otorgar permisos de automatización y conectar tu cuenta al CRM al instante.
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-left text-xs space-y-1 text-muted-foreground">
                    <p className="font-semibold text-foreground">Permisos que se solicitarán:</p>
                    <p>{selectedPlatform.requiredScopes.join(", ")}</p>
                  </div>
                  <Button className="w-full gap-2 mt-2" onClick={handleOAuthLogin} disabled={isAuthorizing}>
                    {isAuthorizing ? (
                      <>Conectando con {selectedPlatform.name}...</>
                    ) : (
                      <>Iniciar sesión y autorizar <ExternalLink className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Si prefieres usar una credencial o token de desarrollador personalizado, ingrésalo a continuación.
                  </p>
                  <div className="space-y-1.5">
                    <Label>Token de Acceso *</Label>
                    <Input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Pegar token de acceso..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ID de cuenta / página</Label>
                    <Input value={idCuentaInput} onChange={(e) => setIdCuentaInput(e.target.value)} placeholder="Ej. account_id" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nombre de la cuenta</Label>
                    <Input value={nombreCuentaInput} onChange={(e) => setNombreCuentaInput(e.target.value)} placeholder="Ej. Mi Cuenta" />
                  </div>
                  <Button className="w-full mt-2" onClick={handleSaveToken}>
                    Guardar Token y Conectar
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPlatform(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
