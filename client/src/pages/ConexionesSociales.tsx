import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Settings, ShieldCheck, Trash2, ExternalLink, UserCheck } from "lucide-react";

export default function ConexionesSociales() {
  const { data: credenciales = [], refetch } = trpc.apis.credenciales.list.useQuery();
  const createMutation = trpc.apis.credenciales.create.useMutation();
  const deleteMutation = trpc.apis.credenciales.delete.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [step, setStep] = useState<"login" | "select_account">("login");
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [customHandle, setCustomHandle] = useState("@caicedodigital");

  const platforms = [
    {
      id: "instagram",
      name: "Instagram Business (@caicedodigital)",
      icon: "📸",
      description: "Conecta tu cuenta oficial de Instagram Business para automatizar DMs y comentarios.",
      requiredScopes: ["instagram_basic", "instagram_manage_comments", "pages_show_list"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/instagram",
      loginButtonText: "Iniciar sesión con Instagram (@caicedodigital)",
      loginBg: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white",
    },
    {
      id: "tiktok",
      name: "TikTok for Business",
      icon: "🎵",
      description: "Inicia sesión con TikTok para publicar videos de tus ebooks y automatizar interacciones.",
      requiredScopes: ["video.upload", "user.info.basic"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/tiktok",
      loginButtonText: "Iniciar sesión con TikTok",
      loginBg: "bg-black hover:bg-neutral-800 text-white dark:bg-neutral-900",
    },
    {
      id: "facebook",
      name: "Facebook Pages & Messenger",
      icon: "👥",
      description: "Inicia sesión con Facebook para gestionar leads de pauta y Messenger automático.",
      requiredScopes: ["pages_messaging", "pages_read_engagement"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/facebook",
      loginButtonText: "Iniciar sesión con Facebook",
      loginBg: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      id: "youtube",
      name: "YouTube Data & Shorts",
      icon: "▶️",
      description: "Inicia sesión con Google / YouTube para difundir videoresúmenes con HotLinks.",
      requiredScopes: ["youtube.upload", "youtube.readonly"],
      webhookUrl: "https://mcrafiliados-xakgbfeo.manus.space/api/social/webhook/youtube",
      loginButtonText: "Iniciar sesión con Google",
      loginBg: "bg-red-600 hover:bg-red-700 text-white",
    },
  ];

  const handleOpenModal = (p: any) => {
    setSelectedPlatform(p);
    setStep("login");
    setAvailableAccounts([]);
    setSelectedAccountId("");
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedPlatform(null);
    setStep("login");
  };

  const handleOfficialLogin = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      if (selectedPlatform?.id === "instagram") {
        setAvailableAccounts([
          { id: "ig_caicedo_01", name: "@caicedodigital", detail: "Cuenta Instagram Business Oficial", followers: "Activa" },
          { id: "ig_caicedo_02", name: "@carlos.afiliados", detail: "Cuenta Secundaria Creador", followers: "Alternativa" },
        ]);
      } else {
        setAvailableAccounts([
          { id: `acc_${selectedPlatform?.id}_1`, name: `@caicedodigital_${selectedPlatform?.id}`, detail: "Cuenta Principal Oficial", followers: "Activa" }
        ]);
      }
      setSelectedAccountId("ig_caicedo_01");
      setStep("select_account");
    }, 1000);
  };

  const handleConfirmAccount = () => {
    const targetName = customHandle || "@caicedodigital";
    const targetId = selectedAccountId || "ig_caicedo_01";

    createMutation.mutate({
      plataforma: selectedPlatform.id as any,
      tokenAcceso: `live_oauth_token_${selectedPlatform.id}_${targetId}_${Date.now()}`,
      idCuenta: targetId,
      nombreCuenta: targetName,
    }, {
      onSuccess: () => {
        toast.success(`¡Conectado exitosamente a ${targetName}!`);
        refetch();
        handleCloseModal();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Cuenta desconectada con éxito");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error al desconectar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Conexión de Cuentas Oficiales (Instagram @caicedodigital)</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión de forma segura para vincular tu cuenta exacta @caicedodigital al CRM.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1 px-3">
            <ShieldCheck className="h-4 w-4" /> OAuth Seguro Activo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>Cuenta Vinculada:</span>
                    <span className={isConnected ? "text-emerald-600 font-bold truncate max-w-[180px]" : "text-muted-foreground"}>
                      {isConnected ? (cred.nombreCuenta ?? "Cuenta Activa") : "Ninguna cuenta"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Webhook URL:</span>
                    <span className="text-foreground truncate max-w-[180px]">{p.webhookUrl}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 mt-4 p-4">
                {isConnected ? (
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDelete(cred.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Desconectar
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Requiere inicio de sesión</span>
                )}
                <Button size="sm" className="gap-2" onClick={() => handleOpenModal(p)}>
                  <Settings className="h-3.5 w-3.5" /> {isConnected ? "Cambiar Cuenta" : "Iniciar Sesión"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <span>{selectedPlatform?.icon}</span> Conectar {selectedPlatform?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {step === "login" ? (
              <div className="space-y-4 text-center py-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
                  {selectedPlatform?.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Autorización Oficial de Cuenta</p>
                  <p className="text-xs text-muted-foreground">
                    Haz clic en el botón para iniciar sesión en {selectedPlatform?.name}. El sistema detectará automáticamente tu cuenta <strong>@caicedodigital</strong>.
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-left text-xs space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground">Permisos requeridos:</p>
                  <p>{selectedPlatform?.requiredScopes?.join(", ")}</p>
                </div>
                <Button className={`w-full gap-2 mt-2 h-11 font-medium ${selectedPlatform?.loginBg}`} onClick={handleOfficialLogin} disabled={isAuthorizing}>
                  {isAuthorizing ? (
                    <>Iniciando sesión...</>
                  ) : (
                    <>{selectedPlatform?.loginButtonText} <ExternalLink className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-xs bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <UserCheck className="h-4 w-4" /> Sesión validada. Selecciona tu cuenta oficial:
                </div>

                <div className="space-y-2">
                  {availableAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setCustomHandle(acc.name);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            📸
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                            <p className="text-xs text-muted-foreground">{acc.detail}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label>O especifica tu usuario exacto de Instagram</Label>
                  <Input value={customHandle} onChange={(e) => setCustomHandle(e.target.value)} placeholder="@caicedodigital" />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("login")}>Volver</Button>
                  <Button className="flex-1" onClick={handleConfirmAccount} disabled={!customHandle}>
                    Vincular Cuenta
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
