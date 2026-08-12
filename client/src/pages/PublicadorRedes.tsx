import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Image as ImageIcon, Video, Hash } from "lucide-react";

export default function PublicadorRedes() {
  const [open, setOpen] = useState(false);
  const [plataforma, setPlataforma] = useState<"instagram" | "tiktok">("instagram");
  const [contenido, setContenido] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [nuevoHashtag, setNuevoHashtag] = useState("");
  const [estado, setEstado] = useState<"borrador" | "programada" | "publicada">("borrador");
  const [mediaUrl, setMediaUrl] = useState("");

  const { data: publicaciones = [], refetch } = trpc.apis.redes.listar.useQuery({ plataforma });
  const createMutation = trpc.apis.redes.crearPublicacion.useMutation();
  const updateMutation = trpc.apis.redes.actualizar.useMutation();
  const publishMutation = trpc.apis.redes.publicar.useMutation();
  const deleteMutation = trpc.apis.redes.eliminar.useMutation();

  const handleAgregarHashtag = () => {
    if (nuevoHashtag.trim() && !hashtags.includes(nuevoHashtag)) {
      setHashtags([...hashtags, nuevoHashtag]);
      setNuevoHashtag("");
    }
  };

  const handleEliminarHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const handleCrear = async () => {
    if (!contenido.trim()) {
      toast.error("El contenido no puede estar vacío");
      return;
    }

    try {
      await createMutation.mutateAsync({
        plataforma,
        contenido,
          hashtags,
          estado,
          imagenes: plataforma === "instagram" && mediaUrl.trim() ? [mediaUrl.trim()] : undefined,
          videos: plataforma === "tiktok" && mediaUrl.trim() ? [mediaUrl.trim()] : undefined,
        });

      toast.success("Publicación creada correctamente");
      setOpen(false);
      setContenido("");
      setHashtags([]);
      setEstado("borrador");
      setMediaUrl("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la publicación");
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Publicación eliminada");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const handlePublicar = async (id: number) => {
    try {
      await publishMutation.mutateAsync({ id });
      toast.success("Publicación enviada a " + plataforma);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Error al publicar");
    }
  };

  const getEstadoBadge = (est: string) => {
    const variants: Record<string, any> = {
      borrador: "secondary",
      programada: "outline",
      publicada: "default",
      error: "destructive",
    };
    const labels: Record<string, string> = {
      borrador: "Borrador",
      programada: "Programada",
      publicada: "Publicada",
      error: "Error",
    };
    return <Badge variant={variants[est] || "secondary"}>{labels[est] || est}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Publicador de Redes Sociales</h1>
          <p className="text-muted-foreground mt-1">Crea y publica contenido en Instagram y TikTok</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Publicación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Publicación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Plataforma</Label>
                <Select value={plataforma} onValueChange={(v) => setPlataforma(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Contenido</Label>
                <Textarea
                  placeholder="Escribe el contenido de tu publicación..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  maxLength={2200}
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">{contenido.length}/2200</p>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Hashtags
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Ej: #marketing"
                    value={nuevoHashtag}
                    onChange={(e) => setNuevoHashtag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAgregarHashtag()}
                  />
                  <Button onClick={handleAgregarHashtag} variant="outline" size="sm">
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleEliminarHashtag(tag)} className="ml-1 hover:opacity-70">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  {plataforma === "instagram" ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  URL pública de {plataforma === "instagram" ? "imagen o vídeo" : "vídeo"}
                </Label>
                <Input
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                  placeholder={plataforma === "instagram" ? "https://tu-dominio.com/imagen.jpg" : "https://tu-dominio-verificado.com/video.mp4"}
                />
                <p className="mt-1 text-xs text-muted-foreground">La URL debe ser pública. TikTok requiere un dominio verificado para extraer el vídeo.</p>
              </div>

              <div>
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="publicada">Publicar Ahora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCrear} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creando..." : "Crear Publicación"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={plataforma === "instagram" ? "default" : "outline"}
          onClick={() => setPlataforma("instagram")}
        >
          Instagram
        </Button>
        <Button
          variant={plataforma === "tiktok" ? "default" : "outline"}
          onClick={() => setPlataforma("tiktok")}
        >
          TikTok
        </Button>
      </div>

      <div className="grid gap-4">
        {publicaciones.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay publicaciones en {plataforma}</p>
              <p className="text-xs mt-1">Crea una nueva para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          publicaciones.map((pub) => (
            <Card key={pub.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2">{pub.contenido}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(pub.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(pub.estado)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminar(pub.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pub.hashtags && pub.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pub.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {pub.estado === "borrador" && (
                  <Button
                    onClick={() => handlePublicar(pub.id)}
                    disabled={publishMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    Publicar Ahora
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
