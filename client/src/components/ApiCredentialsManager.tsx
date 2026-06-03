import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Plus, AlertCircle } from "lucide-react";

export function ApiCredentialsManager() {
  const [open, setOpen] = useState(false);
  const [plataforma, setPlataforma] = useState<"whatsapp" | "instagram" | "tiktok">("whatsapp");
  const [token, setToken] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [idCuenta, setIdCuenta] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("");

  const { data: credenciales = [], refetch } = trpc.apis.credenciales.list.useQuery();
  const createMutation = trpc.apis.credenciales.create.useMutation();
  const updateMutation = trpc.apis.credenciales.update.useMutation();
  const deleteMutation = trpc.apis.credenciales.delete.useMutation();

  const handleCreate = async () => {
    if (!token) {
      toast.error("El token de acceso es requerido");
      return;
    }

    try {
      await createMutation.mutateAsync({
        plataforma,
        tokenAcceso: token,
        numeroTelefono: numeroTelefono || undefined,
        idCuenta: idCuenta || undefined,
        nombreCuenta: nombreCuenta || undefined,
      });

      toast.success(`${plataforma} configurado correctamente`);
      setOpen(false);
      setToken("");
      setNumeroTelefono("");
      setIdCuenta("");
      setNombreCuenta("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al configurar la API");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Credencial eliminada");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const handleToggle = async (id: number, activo: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, activo: !activo });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    }
  };

  const getPlatformaLabel = (plat: string) => {
    const labels: Record<string, string> = {
      whatsapp: "WhatsApp Business",
      instagram: "Instagram",
      tiktok: "TikTok",
    };
    return labels[plat] || plat;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Integraciones de APIs</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Credencial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Nueva API</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plataforma">Plataforma</Label>
                <Select value={plataforma} onValueChange={(v) => setPlataforma(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="token">Token de Acceso</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Pega tu token de acceso aquí"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El token se encriptará y almacenará de forma segura
                </p>
              </div>

              {plataforma === "whatsapp" && (
                <div>
                  <Label htmlFor="numeroTelefono">Número de Teléfono (con código de país)</Label>
                  <Input
                    id="numeroTelefono"
                    placeholder="Ej: 573001234567"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                  />
                </div>
              )}

              {(plataforma === "instagram" || plataforma === "tiktok") && (
                <>
                  <div>
                    <Label htmlFor="idCuenta">ID de Cuenta</Label>
                    <Input
                      id="idCuenta"
                      placeholder="ID de tu cuenta"
                      value={idCuenta}
                      onChange={(e) => setIdCuenta(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombreCuenta">Nombre de Usuario</Label>
                    <Input
                      id="nombreCuenta"
                      placeholder="Tu nombre de usuario"
                      value={nombreCuenta}
                      onChange={(e) => setNombreCuenta(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Guardando..." : "Guardar Credencial"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {credenciales.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay credenciales configuradas</p>
              <p className="text-xs mt-1">Agrega una para comenzar a enviar mensajes y publicar contenido</p>
            </CardContent>
          </Card>
        ) : (
          credenciales.map((cred) => (
            <Card key={cred.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{getPlatformaLabel(cred.plataforma)}</CardTitle>
                    {cred.nombreCuenta && <CardDescription>{cred.nombreCuenta}</CardDescription>}
                    {cred.numeroTelefono && <CardDescription>{cred.numeroTelefono}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cred.activo}
                      onCheckedChange={() => handleToggle(cred.id, cred.activo)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cred.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>Token: {cred.tokenAcceso.substring(0, 20)}...{cred.tokenAcceso.substring(cred.tokenAcceso.length - 10)}</p>
                {cred.ultimaVerificacion && (
                  <p>Última verificación: {new Date(cred.ultimaVerificacion).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
