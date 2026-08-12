import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MessageCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";

const DEFAULT_MESSAGE = "Hola {{nombre}}, gracias por tu interés en {{producto}}. Estoy aquí para ayudarte. {{enlace}}";

export function WelcomeMessagesConfig() {
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productoId, setProductoId] = useState<string>("");
  const [contenido, setContenido] = useState(DEFAULT_MESSAGE);
  const [activo, setActivo] = useState(true);

  const { data: productos = [], isLoading: loadingProducts } = trpc.productos.list.useQuery();
  const { data: mensajes = [], isLoading: loadingMessages } = trpc.welcomeMessages.list.useQuery();

  const create = trpc.welcomeMessages.create.useMutation({
    onSuccess: () => {
      toast.success("Mensaje de bienvenida guardado");
      utils.welcomeMessages.list.invalidate();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.welcomeMessages.update.useMutation({
    onSuccess: () => {
      toast.success("Mensaje actualizado");
      utils.welcomeMessages.list.invalidate();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.welcomeMessages.delete.useMutation({
    onSuccess: () => {
      toast.success("Mensaje eliminado");
      utils.welcomeMessages.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const selectedProduct = useMemo(
    () => productos.find((product: any) => String(product.id) === productoId),
    [productos, productoId],
  );

  function resetForm() {
    setEditingId(null);
    setProductoId("");
    setContenido(DEFAULT_MESSAGE);
    setActivo(true);
  }

  function editMessage(message: any) {
    setEditingId(message.id);
    setProductoId(String(message.productoId));
    setContenido(message.contenido);
    setActivo(message.activo);
  }

  function saveMessage() {
    const numericProductId = Number(productoId);
    if (!numericProductId) {
      toast.error("Selecciona un producto Hotmart");
      return;
    }
    if (contenido.trim().length < 10) {
      toast.error("El mensaje debe tener al menos 10 caracteres");
      return;
    }

    if (editingId) {
      update.mutate({ id: editingId, contenido: contenido.trim(), activo });
    } else {
      create.mutate({ productoId: numericProductId, contenido: contenido.trim(), activo });
    }
  }

  function toggleMessage(message: any) {
    update.mutate({ id: message.id, activo: !message.activo });
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-primary" />
            Mensajes de bienvenida automáticos
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Configura el primer mensaje que se enviará a un lead nuevo cuando tenga un producto de interés. Usa las variables para personalizarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-1.5">
              <Label>Producto Hotmart *</Label>
              {loadingProducts ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={productoId} onValueChange={setProductoId} disabled={Boolean(editingId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((product: any) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {editingId && <p className="text-[11px] text-muted-foreground">El producto no se puede cambiar al editar.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <Textarea
                value={contenido}
                onChange={(event) => setContenido(event.target.value)}
                rows={5}
                placeholder={DEFAULT_MESSAGE}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Variables disponibles: <code>{"{{nombre}}"}</code>, <code>{"{{producto}}"}</code>, <code>{"{{enlace}}"}</code>
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Vista previa
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {contenido
                  .replaceAll("{{nombre}}", "Laura")
                  .replaceAll("{{producto}}", selectedProduct?.nombre ?? "tu producto")
                  .replaceAll("{{enlace}}", selectedProduct?.enlaceAfiliado ?? "tu enlace")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
                <Switch checked={activo} onCheckedChange={setActivo} />
                <span>{activo ? "Activo" : "Inactivo"}</span>
              </div>
              {editingId && (
                <Button variant="outline" onClick={resetForm} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
              )}
              <Button onClick={saveMessage} disabled={saving || loadingProducts} className="gap-1.5">
                {editingId ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar mensaje"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Mensajes por producto</h3>
          <p className="text-xs text-muted-foreground">Solo un mensaje activo se utilizará para cada producto al registrar un lead nuevo.</p>
        </div>
        {loadingMessages ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : mensajes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aún no hay mensajes de bienvenida configurados.</p>
            </CardContent>
          </Card>
        ) : (
          mensajes.map((message: any) => {
            const product = productos.find((item: any) => item.id === message.productoId);
            return (
              <Card key={message.id}>
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{product?.nombre ?? `Producto #${message.productoId}`}</p>
                      <Badge variant={message.activo ? "default" : "secondary"}>{message.activo ? "Activo" : "Inactivo"}</Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message.contenido}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Switch checked={message.activo} onCheckedChange={() => toggleMessage(message)} aria-label="Activar mensaje" />
                    <Button variant="ghost" size="sm" onClick={() => editMessage(message)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove.mutate({ id: message.id })}
                      disabled={remove.isPending}
                      className="text-destructive hover:text-destructive"
                      aria-label="Eliminar mensaje"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
