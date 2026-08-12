import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { storagePut } from "./storage";

const META_GRAPH_VERSION = "v23.0";

async function requestExternalJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (body as any)?.error?.message || (body as any)?.message || `La API externa respondió ${response.status}`;
    throw new Error(message);
  }
  return body as any;
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function withHashtags(contenido: string, hashtags?: string[]) {
  const tags = (hashtags ?? []).filter(Boolean).join(" ");
  return tags ? `${contenido.trim()}\n\n${tags}` : contenido.trim();
}

async function sendWhatsAppCloudMessage(params: { token: string; phoneNumberId: string; to: string; body: string }) {
  return requestExternalJson(`https://graph.facebook.com/${META_GRAPH_VERSION}/${params.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizePhoneNumber(params.to),
      type: "text",
      text: { preview_url: true, body: params.body },
    }),
  });
}

function renderLeadTemplate(content: string, lead: { nombre?: string | null }, product?: { nombre?: string | null; enlaceAfiliado?: string | null; categoria?: string | null }) {
  return content
    .replaceAll("{{nombre}}", lead.nombre ?? "amigo")
    .replaceAll("{{producto}}", product?.nombre ?? "tu ebook")
    .replaceAll("{{enlace}}", product?.enlaceAfiliado ?? "")
    .replaceAll("{{categoria}}", product?.categoria ?? "");
}

async function publishInstagramContent(params: { token: string; accountId: string; contenido: string; imagenes: string[]; videos: string[]; hashtags: string[] }) {
  const caption = withHashtags(params.contenido, params.hashtags);
  const media = params.videos[0]
    ? { media_type: "REELS", video_url: params.videos[0], caption }
    : params.imagenes[0]
      ? { image_url: params.imagenes[0], caption }
      : null;
  if (!media) throw new Error("Instagram requiere una URL pública de imagen o vídeo para publicar");

  const container = await requestExternalJson(`https://graph.facebook.com/${META_GRAPH_VERSION}/${params.accountId}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(media),
  });
  if (!container.id) throw new Error("Instagram no devolvió un identificador de contenedor");

  const published = await requestExternalJson(`https://graph.facebook.com/${META_GRAPH_VERSION}/${params.accountId}/media_publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ creation_id: container.id }),
  });
  return { id: published.id ?? container.id };
}

async function publishTikTokVideo(params: { token: string; contenido: string; videos: string[]; hashtags: string[] }) {
  const videoUrl = params.videos[0];
  if (!videoUrl) throw new Error("TikTok requiere una URL pública de vídeo verificada");

  const response = await requestExternalJson("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: withHashtags(params.contenido, params.hashtags),
        privacy_level: "SELF_ONLY",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });
  const publishId = response.publish_id ?? response.data?.publish_id;
  if (!publishId) throw new Error("TikTok no devolvió el identificador de publicación");
  return { id: publishId };
}

// ─── Leads Router ─────────────────────────────────────────────────────────────
const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      fuente: z.string().optional(),
      campana: z.string().optional(),
      campanaId: z.number().optional(),
      productoInteresId: z.number().optional(),
    }).optional())
    .query(({ input }) => db.getLeads(input)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await db.getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado" });
      return lead;
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      email: z.string().email().optional().or(z.literal("")),
      telefono: z.string().optional(),
      whatsappOptIn: z.boolean().default(false),
      estado: z.enum(["nuevo", "contactado", "interesado", "compro", "perdido"]).default("nuevo"),
      fuente: z.string().optional(),
      campana: z.string().optional(),
      campanaId: z.number().optional(),
      productoInteresId: z.number().optional(),
      etiquetasIds: z.array(z.number()).optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.createLead({
        ...input,
        email: input.email || undefined,
        etiquetasIds: input.etiquetasIds ?? [],
      });

      const leadId = Number((result as any).insertId ?? 0);
      if (leadId && input.productoInteresId && input.telefono && input.whatsappOptIn) {
        const welcome = await db.getActiveWelcomeMessage(input.productoInteresId);
        const credentials = await db.getApiCredentials("whatsapp");
        const credential = credentials[0];
        if (welcome && credential?.activo && credential.tokenAcceso && credential.idCuenta) {
          const product = await db.getProductoById(input.productoInteresId);
          const body = welcome.contenido
            .replaceAll("{{nombre}}", input.nombre)
            .replaceAll("{{producto}}", product?.nombre ?? "tu producto")
            .replaceAll("{{enlace}}", product?.enlaceAfiliado ?? "");
          const pending = await db.createMensajeWhatsapp({ leadId, contenido: body, estado: "pendiente" });
          const messageId = Number((pending as any).insertId ?? 0);
          try {
            const response = await sendWhatsAppCloudMessage({
              token: credential.tokenAcceso,
              phoneNumberId: credential.idCuenta,
              to: input.telefono,
              body,
            });
            await db.updateMensajeWhatsapp(messageId, {
              estado: "enviado",
              idMensajeWhatsapp: response.messages?.[0]?.id,
              enviadoEn: new Date(),
            });
            await db.createInteraccion({ leadId, tipo: "mensaje_enviado", contenido: body, estadoMensaje: "enviado" });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido de WhatsApp";
            await db.updateMensajeWhatsapp(messageId, { estado: "error", error: errorMessage });
            await db.createInteraccion({ leadId, tipo: "mensaje_enviado", contenido: body, estadoMensaje: "fallido", metadatos: { error: errorMessage } });
          }
        }
      }

      // Notificar al propietario
      await notifyOwner({
        title: "🆕 Nuevo lead captado",
        content: `Se ha registrado un nuevo lead: **${input.nombre}**${input.fuente ? ` desde ${input.fuente}` : ""}.`,
      }).catch(() => {});
      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().min(1).optional(),
      email: z.string().email().optional().or(z.literal("")),
      telefono: z.string().optional(),
      estado: z.enum(["nuevo", "contactado", "interesado", "compro", "perdido"]).optional(),
      fuente: z.string().optional(),
      campana: z.string().optional(),
      campanaId: z.number().optional().nullable(),
      productoInteresId: z.number().optional().nullable(),
      etiquetasIds: z.array(z.number()).optional(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const leadAnterior = await db.getLeadById(id);
      await db.updateLead(id, data as any);

      if (data.estado && leadAnterior && data.estado !== leadAnterior.estado) {
        await db.createInteraccion({
          leadId: id,
          tipo: "cambio_estado",
          contenido: `Estado cambiado de "${leadAnterior.estado}" a "${data.estado}"`,
        });
        // Notificar avance de etapa
        if (data.estado === "interesado" || data.estado === "compro") {
          const titulo = data.estado === "compro"
            ? "✅ Venta confirmada en Hotmart"
            : "📈 Lead avanzó a etapa de decisión";
          const contenido = data.estado === "compro"
            ? `El lead **${leadAnterior.nombre}** completó una compra.`
            : `El lead **${leadAnterior.nombre}** avanzó al estado "interesado".`;
          await notifyOwner({ title: titulo, content: contenido }).catch(() => {});
        }
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteLead(input.id)),

  addNota: protectedProcedure
    .input(z.object({ leadId: z.number(), nota: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.createInteraccion({ leadId: input.leadId, tipo: "nota", contenido: input.nota });
      await db.updateLead(input.leadId, { ultimaInteraccion: new Date() });
      return { success: true };
    }),
});

// ─── Productos Router ─────────────────────────────────────────────────────────
const productosRouter = router({
  list: protectedProcedure.query(() => db.getProductos()),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await db.getProductoById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      descripcion: z.string().optional(),
      enlaceAfiliado: z.string().url(),
      precio: z.number().min(0),
      categoria: z.string().optional(),
      imagenUrl: z.string().optional(),
      rating: z.number().optional(),
      comentariosCount: z.number().optional(),
      activo: z.boolean().default(true),
    }))
    .mutation(({ input }) => db.createProducto(input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().min(1).optional(),
      descripcion: z.string().optional(),
      enlaceAfiliado: z.string().url().optional(),
      precio: z.number().min(0).optional(),
      categoria: z.string().optional(),
      imagenUrl: z.string().optional(),
      rating: z.number().optional(),
      comentariosCount: z.number().optional(),
      activo: z.boolean().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return db.updateProducto(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteProducto(input.id)),

  uploadImage: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.fileData, "base64");
        const relKey = `productos/${Date.now()}_${input.fileName}`;
        const { url } = await storagePut(relKey, buffer, input.mimeType);
        return { url };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error al subir imagen: ${String(err)}` });
      }
    }),
});

// ─── Plantillas Router ────────────────────────────────────────────────────────
const plantillasRouter = router({
  list: protectedProcedure
    .input(z.object({ categoria: z.string().optional() }).optional())
    .query(({ input }) => db.getPlantillas(input?.categoria)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await db.getPlantillaById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      contenido: z.string().min(1),
      variables: z.array(z.string()).optional(),
      categoria: z.enum(["bienvenida", "seguimiento", "carrito_abandonado", "post_venta", "recordatorio", "general"]).default("general"),
    }))
    .mutation(({ input }) => db.createPlantilla({ ...input, variables: input.variables ?? [] })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().min(1).optional(),
      contenido: z.string().min(1).optional(),
      variables: z.array(z.string()).optional(),
      categoria: z.enum(["bienvenida", "seguimiento", "carrito_abandonado", "post_venta", "recordatorio", "general"]).optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return db.updatePlantilla(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deletePlantilla(input.id)),

  generarConIA: protectedProcedure
    .input(z.object({
      productoNombre: z.string(),
      productoDescripcion: z.string().optional(),
      etapaEmbudo: z.enum(["bienvenida", "seguimiento", "carrito_abandonado", "post_venta", "recordatorio"]),
      perfilLead: z.string().optional(),
      enlaceAfiliado: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `Eres un experto en marketing de afiliados de Hotmart y copywriting para WhatsApp. 
Creas mensajes persuasivos, personales y de alta conversión. 
Usa variables dinámicas entre llaves dobles: {{nombre}}, {{producto}}, {{enlace}}, {{precio}}.
Los mensajes deben ser naturales, no robóticos. Máximo 300 palabras.`;

      const userPrompt = `Crea una plantilla de mensaje de WhatsApp para la etapa "${input.etapaEmbudo}" del embudo de ventas.
Producto: ${input.productoNombre}
${input.productoDescripcion ? `Descripción: ${input.productoDescripcion}` : ""}
${input.perfilLead ? `Perfil del lead: ${input.perfilLead}` : ""}
${input.enlaceAfiliado ? `Enlace de afiliado: ${input.enlaceAfiliado}` : ""}

Devuelve un JSON con:
- nombre: nombre descriptivo de la plantilla
- contenido: el mensaje de WhatsApp con variables {{nombre}}, {{producto}}, {{enlace}} donde aplique
- variables: array con los nombres de las variables usadas (sin llaves)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "plantilla_whatsapp",
            strict: true,
            schema: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                contenido: { type: "string" },
                variables: { type: "array", items: { type: "string" } },
              },
              required: ["nombre", "contenido", "variables"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al generar plantilla" });

      const parsed = JSON.parse(content);
      const result = await db.createPlantilla({
        nombre: parsed.nombre,
        contenido: parsed.contenido,
        variables: parsed.variables,
        categoria: input.etapaEmbudo as any,
        generadaPorIA: true,
      });
      return { ...parsed, id: (result as any).insertId };
    }),
});

// ─── Flujos Router ────────────────────────────────────────────────────────────
const flujosRouter = router({
  list: protectedProcedure.query(() => db.getFlujos()),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const flujo = await db.getFlujoById(input.id);
      if (!flujo) throw new TRPCError({ code: "NOT_FOUND" });
      const pasos = await db.getPasosByFlujoId(input.id);
      return { ...flujo, pasos };
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      descripcion: z.string().optional(),
      trigger: z.enum(["nuevo_lead", "estado_contactado", "estado_interesado", "estado_compro", "estado_perdido", "carrito_abandonado", "post_venta", "manual"]),
      activo: z.boolean().default(true),
      pasos: z.array(z.object({
        orden: z.number(),
        plantillaId: z.number(),
        delayHoras: z.number().default(0),
        condicion: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { pasos, ...flujoData } = input;
      const result = await db.createFlujo(flujoData);
      const flujoId = (result as any).insertId;
      if (pasos && pasos.length > 0) {
        for (const paso of pasos) {
          await db.createPaso({ ...paso, flujoId });
        }
      }
      return { id: flujoId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().min(1).optional(),
      descripcion: z.string().optional(),
      trigger: z.enum(["nuevo_lead", "estado_contactado", "estado_interesado", "estado_compro", "estado_perdido", "carrito_abandonado", "post_venta", "manual"]).optional(),
      activo: z.boolean().optional(),
      pasos: z.array(z.object({
        orden: z.number(),
        plantillaId: z.number(),
        delayHoras: z.number().default(0),
        condicion: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, pasos, ...flujoData } = input;
      await db.updateFlujo(id, flujoData);
      if (pasos !== undefined) {
        await db.deletePasosByFlujoId(id);
        for (const paso of pasos) {
          await db.createPaso({ ...paso, flujoId: id });
        }
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePasosByFlujoId(input.id);
      await db.deleteFlujo(input.id);
      return { success: true };
    }),
});

// ─── Interacciones Router ─────────────────────────────────────────────────────
const interaccionesRouter = router({
  byLeadId: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(({ input }) => db.getInteraccionesByLeadId(input.leadId)),

  registrarMensaje: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      contenido: z.string().min(1),
      tipo: z.enum(["mensaje_enviado", "mensaje_recibido", "nota"]).default("mensaje_enviado"),
      estadoMensaje: z.enum(["pendiente", "enviado", "entregado", "leido", "fallido"]).optional(),
      plantillaId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createInteraccion(input);
      await db.updateLead(input.leadId, { ultimaInteraccion: new Date() });
      return { success: true };
    }),
});

// ─── Etiquetas Router ─────────────────────────────────────────────────────────
const etiquetasRouter = router({
  list: protectedProcedure.query(() => db.getEtiquetas()),

  create: protectedProcedure
    .input(z.object({ nombre: z.string().min(1), color: z.string().default("#6366f1") }))
    .mutation(({ input }) => db.createEtiqueta(input)),

  update: protectedProcedure
    .input(z.object({ id: z.number(), nombre: z.string().optional(), color: z.string().optional() }))
    .mutation(({ input }) => { const { id, ...data } = input; return db.updateEtiqueta(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteEtiqueta(input.id)),
});

// ─── Analytics Router ─────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: protectedProcedure.query(() => db.getAnalyticsSummary()),
  webhooksRecientes: protectedProcedure.query(() => db.getWebhooksHotmart(20)),
});

// ─── Reglas de Seguimiento Router ─────────────────────────────────────────────
const reglasRouter = router({
  list: protectedProcedure.query(() => db.getReglasSeguimiento()),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      diasInactividad: z.number().min(1).default(3),
      estadosAplicables: z.array(z.string()).default(["nuevo", "contactado", "interesado"]),
      plantillaId: z.number(),
      activo: z.boolean().default(true),
    }))
    .mutation(({ input }) => db.createReglaSeguimiento(input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().optional(),
      diasInactividad: z.number().min(1).optional(),
      estadosAplicables: z.array(z.string()).optional(),
      plantillaId: z.number().optional(),
      activo: z.boolean().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return db.updateReglaSeguimiento(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteReglaSeguimiento(input.id)),

  ejecutarAhora: protectedProcedure
    .input(z.object({ reglaId: z.number() }))
    .mutation(async ({ input }) => {
      const reglas = await db.getReglasSeguimiento();
      const regla = reglas.find(r => r.id === input.reglaId);
      if (!regla) throw new TRPCError({ code: "NOT_FOUND" });

      const plantilla = await db.getPlantillaById(regla.plantillaId);
      if (!plantilla) throw new TRPCError({ code: "NOT_FOUND", message: "Plantilla no encontrada" });
      const credential = (await db.getApiCredentials("whatsapp"))[0];
      if (!credential?.activo || !credential.tokenAcceso || !credential.idCuenta) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Activa las credenciales de WhatsApp antes de ejecutar recordatorios" });
      }

      const estados = (regla.estadosAplicables as string[]) ?? ["nuevo", "contactado", "interesado"];
      const leadsInactivos = await db.getLeadsInactivos(regla.diasInactividad, estados);
      const leadsAplicables = leadsInactivos.filter((lead) => estados.includes(lead.estado));
      let procesados = 0;
      let errores = 0;
      let omitidosSinTelefono = 0;

      for (const lead of leadsAplicables) {
        if (!lead.telefono || !lead.whatsappOptIn) {
          omitidosSinTelefono++;
          continue;
        }
        const product = lead.productoInteresId ? await db.getProductoById(lead.productoInteresId) : undefined;
        const content = renderLeadTemplate(plantilla.contenido, lead, product);
        const pending = await db.createMensajeWhatsapp({ leadId: lead.id, contenido: content, estado: "pendiente" });
        const messageId = Number((pending as any).insertId ?? 0);
        try {
          const response = await sendWhatsAppCloudMessage({ token: credential.tokenAcceso, phoneNumberId: credential.idCuenta, to: lead.telefono, body: content });
          await db.updateMensajeWhatsapp(messageId, { estado: "enviado", idMensajeWhatsapp: response.messages?.[0]?.id, enviadoEn: new Date() });
          await db.createInteraccion({ leadId: lead.id, tipo: "mensaje_enviado", contenido: content, estadoMensaje: "enviado", plantillaId: plantilla.id });
          await db.updateLead(lead.id, { ultimaInteraccion: new Date() });
          procesados++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido de WhatsApp";
          await db.updateMensajeWhatsapp(messageId, { estado: "error", error: errorMessage });
          await db.createInteraccion({ leadId: lead.id, tipo: "mensaje_enviado", contenido: content, estadoMensaje: "fallido", plantillaId: plantilla.id, metadatos: { error: errorMessage } });
          errores++;
        }
      }
      return { procesados, errores, omitidosSinTelefono };
    }),
});

// ─── APIs Multicanal Router ──────────────────────────────────────────────────
const apisRouter = router({
  // Credenciales
  credenciales: router({
    list: protectedProcedure
      .query(() => db.getApiCredentials()),

    create: protectedProcedure
      .input(z.object({
        plataforma: z.enum(["whatsapp", "instagram", "tiktok"]),
        tokenAcceso: z.string().min(1),
        numeroTelefono: z.string().optional(),
        idCuenta: z.string().optional(),
        nombreCuenta: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createApiCredential(input as any);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tokenAcceso: z.string().optional(),
        numeroTelefono: z.string().optional(),
        nombreCuenta: z.string().optional(),
        activo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateApiCredential(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteApiCredential(input.id);
        return { success: true };
      }),
  }),

  // WhatsApp
  whatsapp: router({
    enviarMensaje: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        contenido: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado" });
        if (!lead.telefono) throw new TRPCError({ code: "BAD_REQUEST", message: "El lead no tiene teléfono registrado" });

        const credentials = await db.getApiCredentials("whatsapp");
        const credential = credentials[0];
        if (!credential?.activo || !credential.tokenAcceso || !credential.idCuenta) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp requiere token activo e ID del número de teléfono" });
        }

        const pending = await db.createMensajeWhatsapp({
          leadId: input.leadId,
          contenido: input.contenido,
          estado: "pendiente",
        });
        const mensajeId = Number((pending as any).insertId ?? 0);

        try {
          const response = await sendWhatsAppCloudMessage({
            token: credential.tokenAcceso,
            phoneNumberId: credential.idCuenta,
            to: lead.telefono,
            body: input.contenido,
          });
          await db.updateMensajeWhatsapp(mensajeId, {
            estado: "enviado",
            idMensajeWhatsapp: response.messages?.[0]?.id,
            enviadoEn: new Date(),
          });
          await db.createInteraccion({
            leadId: input.leadId,
            tipo: "mensaje_enviado",
            contenido: input.contenido,
            estadoMensaje: "enviado",
          });
          return { success: true, mensajeId, providerId: response.messages?.[0]?.id };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido de WhatsApp";
          await db.updateMensajeWhatsapp(mensajeId, { estado: "error", error: errorMessage });
          await db.createInteraccion({
            leadId: input.leadId,
            tipo: "mensaje_enviado",
            contenido: input.contenido,
            estadoMensaje: "fallido",
            metadatos: { error: errorMessage },
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
        }
      }),

    historial: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(({ input }) => db.getMensajesByLead(input.leadId)),

    listarMensajes: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(({ input }) => db.getMensajesByLead(input.leadId)),
  }),

  // Redes Sociales
  redes: router({
    crearPublicacion: protectedProcedure
      .input(z.object({
        plataforma: z.enum(["instagram", "tiktok"]),
        contenido: z.string().min(1),
        imagenes: z.array(z.string()).optional(),
        videos: z.array(z.string()).optional(),
        hashtags: z.array(z.string()).optional(),
        estado: z.enum(["borrador", "programada", "publicada"]).default("borrador"),
        fechaPublicacion: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const imagenes = input.imagenes ?? [];
        const videos = input.videos ?? [];
        const hashtags = input.hashtags ?? [];
        const wantsPublish = input.estado === "publicada";
        const credentials = await db.getApiCredentials(input.plataforma);
        const credential = credentials[0];

        if (wantsPublish && (!credential?.activo || !credential.tokenAcceso || !credential.idCuenta)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${input.plataforma} requiere credenciales activas y un ID de cuenta` });
        }

        const resultado = await db.createPublicacion({
          plataforma: input.plataforma,
          contenido: input.contenido,
          imagenes,
          videos,
          hashtags,
          estado: wantsPublish ? "borrador" : input.estado,
          fechaPublicacion: input.fechaPublicacion,
        });
        const publicacionId = Number((resultado as any).insertId ?? 0);

        if (!wantsPublish) return { success: true, publicacionId, estado: input.estado };

        try {
          const published = input.plataforma === "instagram"
            ? await publishInstagramContent({ token: credential!.tokenAcceso, accountId: credential!.idCuenta!, contenido: input.contenido, imagenes, videos, hashtags })
            : await publishTikTokVideo({ token: credential!.tokenAcceso, contenido: input.contenido, videos, hashtags });
          await db.updatePublicacion(publicacionId, { estado: "publicada", idPublicacion: published.id, fechaPublicacion: new Date(), error: null });
          return { success: true, publicacionId, providerId: published.id, estado: "publicada" as const };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido de publicación";
          await db.updatePublicacion(publicacionId, { estado: "error", error: errorMessage });
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
        }
      }),

    listar: protectedProcedure
      .input(z.object({ plataforma: z.enum(["instagram", "tiktok"]).optional() }))
      .query(({ input }) => db.getPublicaciones(input.plataforma)),

    publicar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const publication = await db.getPublicacionById(input.id);
        if (!publication) throw new TRPCError({ code: "NOT_FOUND", message: "Publicación no encontrada" });
        const credentials = await db.getApiCredentials(publication.plataforma);
        const credential = credentials[0];
        if (!credential?.activo || !credential.tokenAcceso || !credential.idCuenta) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${publication.plataforma} requiere credenciales activas y un ID de cuenta` });
        }

        try {
          const published = publication.plataforma === "instagram"
            ? await publishInstagramContent({ token: credential.tokenAcceso, accountId: credential.idCuenta, contenido: publication.contenido, imagenes: publication.imagenes ?? [], videos: publication.videos ?? [], hashtags: publication.hashtags ?? [] })
            : await publishTikTokVideo({ token: credential.tokenAcceso, contenido: publication.contenido, videos: publication.videos ?? [], hashtags: publication.hashtags ?? [] });
          await db.updatePublicacion(input.id, { estado: "publicada", idPublicacion: published.id, fechaPublicacion: new Date(), error: null });
          return { success: true, providerId: published.id };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido de publicación";
          await db.updatePublicacion(input.id, { estado: "error", error: errorMessage });
          throw new TRPCError({ code: "BAD_REQUEST", message: errorMessage });
        }
      }),

    actualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        contenido: z.string().optional(),
        estado: z.enum(["borrador", "programada", "publicada", "error"]).optional(),
        error: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePublicacion(id, data as any);
        return { success: true };
      }),

    eliminar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePublicacion(input.id);
        return { success: true };
      }),
  }),
});

// ─── Welcome Messages Router ─────────────────────────────────────────────────────
const welcomeMessagesRouter = router({
  list: protectedProcedure
    .input(z.object({ productoId: z.number().optional() }).optional())
    .query(({ input }) => db.getWelcomeMessages(input?.productoId)),

  create: protectedProcedure
    .input(z.object({
      productoId: z.number(),
      contenido: z.string().min(10),
      activo: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const result = await db.createWelcomeMessage(input);
      return { success: true, id: Number((result as any).insertId ?? 0) };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      contenido: z.string().min(10).optional(),
      activo: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateWelcomeMessage(input.id, input);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteWelcomeMessage(input.id);
      return { success: true };
    }),
});

// ─── Campañas y atribución Router ──────────────────────────────────────────────
const campanasRouter = router({
  list: protectedProcedure.query(async () => {
    const [campanas, leads] = await Promise.all([db.getCampanas(), db.getLeads()]);
    return campanas.map(campana => ({
      ...campana,
      leadsCount: leads.filter((lead: { campanaId: number | null; campana: string | null }) => lead.campanaId === campana.id || lead.campana === campana.nombre).length,
      hotmartUtm: [campana.utmSource, campana.utmMedium, campana.utmCampaign]
        .filter(Boolean)
        .join(" / "),
    }));
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campana = await db.getCampanaById(input.id);
      if (!campana) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada" });
      return campana;
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(2),
      descripcion: z.string().optional(),
      fuente: z.string().min(2),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      productoId: z.number().nullable().optional(),
      activo: z.boolean().default(true),
    }))
    .mutation(({ input }) => db.createCampana(input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nombre: z.string().min(2).optional(),
      descripcion: z.string().optional(),
      fuente: z.string().min(2).optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      productoId: z.number().nullable().optional(),
      activo: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCampana(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCampana(input.id);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  leads: leadsRouter,
  productos: productosRouter,
  campanas: campanasRouter,
  plantillas: plantillasRouter,
  flujos: flujosRouter,
  interacciones: interaccionesRouter,
  etiquetas: etiquetasRouter,
  analytics: analyticsRouter,
  reglas: reglasRouter,
  apis: apisRouter,
  welcomeMessages: welcomeMessagesRouter,
});

export type AppRouter = typeof appRouter;
