import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// ─── Leads Router ─────────────────────────────────────────────────────────────
const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      fuente: z.string().optional(),
      campana: z.string().optional(),
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
      estado: z.enum(["nuevo", "contactado", "interesado", "compro", "perdido"]).default("nuevo"),
      fuente: z.string().optional(),
      campana: z.string().optional(),
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
      activo: z.boolean().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return db.updateProducto(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteProducto(input.id)),
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

      const estados = (regla.estadosAplicables as string[]) ?? ["nuevo", "contactado", "interesado"];
      const leadsInactivos = await db.getLeadsInactivos(regla.diasInactividad, estados);
      const leadsAplicables = leadsInactivos.filter(l => estados.includes(l.estado));

      let procesados = 0;
      for (const lead of leadsAplicables) {
        await db.createInteraccion({
          leadId: lead.id,
          tipo: "mensaje_enviado",
          contenido: `[Recordatorio automático] ${plantilla.contenido}`,
          estadoMensaje: "pendiente",
          plantillaId: plantilla.id,
        });
        await db.updateLead(lead.id, { ultimaInteraccion: new Date() });
        procesados++;
      }
      return { procesados };
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

        const credencial = await db.getApiCredentials("whatsapp");
        if (!credencial || credencial.length === 0 || !credencial[0].activo) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "WhatsApp no está configurado" });
        }

        // Registrar mensaje como pendiente
        const resultado = await db.createMensajeWhatsapp({
          leadId: input.leadId,
          contenido: input.contenido,
          estado: "pendiente",
        });

        // Aquí iría la lógica real de envío a WhatsApp Business API
        // Por ahora, simulamos el envío
        await new Promise(resolve => setTimeout(resolve, 500));

        // Actualizar estado a enviado
        const mensajeId = (resultado as any).insertId || 1;
        await db.updateMensajeWhatsapp(mensajeId, {
          estado: "enviado",
          enviadoEn: new Date(),
        });

        // Registrar interacción
        await db.createInteraccion({
          leadId: input.leadId,
          tipo: "mensaje_enviado",
          contenido: input.contenido,
          estadoMensaje: "enviado",
        });

        return { success: true, mensajeId };
      }),

    historial: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getMensajesByLead(input.leadId);
      }),
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
        const credencial = await db.getApiCredentials(input.plataforma);
        if (!credencial || credencial.length === 0 || !credencial[0].activo) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${input.plataforma} no está configurado` });
        }

        const resultado = await db.createPublicacion({
          plataforma: input.plataforma as any,
          contenido: input.contenido,
          imagenes: input.imagenes || [],
          videos: input.videos || [],
          hashtags: input.hashtags || [],
          estado: input.estado as any,
          fechaPublicacion: input.fechaPublicacion,
        });

        const publicacionId = (resultado as any).insertId || 1;
        return { success: true, publicacionId };
      }),

    listar: protectedProcedure
      .input(z.object({ plataforma: z.enum(["instagram", "tiktok"]).optional() }))
      .query(async ({ input }) => {
        return db.getPublicaciones(input.plataforma);
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
  plantillas: plantillasRouter,
  flujos: flujosRouter,
  interacciones: interaccionesRouter,
  etiquetas: etiquetasRouter,
  analytics: analyticsRouter,
  reglas: reglasRouter,
  apis: apisRouter,
});

export type AppRouter = typeof appRouter;
