import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
  getProductoById: vi.fn().mockResolvedValue({ id: 1, nombre: "Producto Test", enlaceAfiliado: "https://example.com/producto" }),
  createLead: vi.fn().mockResolvedValue({ id: 1, nombre: "Test Lead", estado: "nuevo" }),
  updateLead: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  getProductos: vi.fn().mockResolvedValue([]),
  createProducto: vi.fn().mockResolvedValue({ id: 1, nombre: "Producto Test", precio: 100 }),
  updateProducto: vi.fn().mockResolvedValue(undefined),
  deleteProducto: vi.fn().mockResolvedValue(undefined),
  getPlantillas: vi.fn().mockResolvedValue([]),
  getPlantillaById: vi.fn().mockResolvedValue(null),
  createPlantilla: vi.fn().mockResolvedValue({ id: 1, nombre: "Plantilla Test", contenido: "Hola {{nombre}}" }),
  updatePlantilla: vi.fn().mockResolvedValue(undefined),
  deletePlantilla: vi.fn().mockResolvedValue(undefined),
  getFlujos: vi.fn().mockResolvedValue([]),
  getFlujoById: vi.fn().mockResolvedValue(null),
  createFlujo: vi.fn().mockResolvedValue({ id: 1, nombre: "Flujo Test" }),
  updateFlujo: vi.fn().mockResolvedValue(undefined),
  deleteFlujo: vi.fn().mockResolvedValue(undefined),
  getPasosFlujo: vi.fn().mockResolvedValue([]),
  createPasoFlujo: vi.fn().mockResolvedValue({ id: 1 }),
  updatePasoFlujo: vi.fn().mockResolvedValue(undefined),
  deletePasoFlujo: vi.fn().mockResolvedValue(undefined),
  getInteraccionesByLeadId: vi.fn().mockResolvedValue([]),
  createInteraccion: vi.fn().mockResolvedValue({ id: 1 }),
  getEtiquetas: vi.fn().mockResolvedValue([]),
  createEtiqueta: vi.fn().mockResolvedValue({ id: 1, nombre: "VIP", color: "#6366f1" }),
  updateEtiqueta: vi.fn().mockResolvedValue(undefined),
  deleteEtiqueta: vi.fn().mockResolvedValue(undefined),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    totalLeads: 10,
    porEstado: [{ estado: "nuevo", count: 5 }, { estado: "compro", count: 2 }],
    conversiones: 2,
    tasaConversion: 20,
    ventasPorProducto: [],
    totalComisiones: 150,
  }),
  getWebhooksHotmart: vi.fn().mockResolvedValue([]),
  getReglasSeguimiento: vi.fn().mockResolvedValue([]),
  createReglaSeguimiento: vi.fn().mockResolvedValue({ id: 1, nombre: "Regla Test", diasInactividad: 3 }),
  updateReglaSeguimiento: vi.fn().mockResolvedValue(undefined),
  deleteReglaSeguimiento: vi.fn().mockResolvedValue(undefined),
  getLeadsInactivos: vi.fn().mockResolvedValue([]),
  getRecordatoriosPendientes: vi.fn().mockResolvedValue([]),
  createRecordatorio: vi.fn().mockResolvedValue({ id: 1 }),
  markRecordatorioEjecutado: vi.fn().mockResolvedValue(undefined),
  getApiCredentials: vi.fn().mockResolvedValue([]),
  createApiCredential: vi.fn().mockResolvedValue({ id: 1 }),
  updateApiCredential: vi.fn().mockResolvedValue(undefined),
  deleteApiCredential: vi.fn().mockResolvedValue(undefined),
  createMensajeWhatsapp: vi.fn().mockResolvedValue({ insertId: 1 }),
  getMensajesByLead: vi.fn().mockResolvedValue([]),
  updateMensajeWhatsapp: vi.fn().mockResolvedValue(undefined),
  createPublicacion: vi.fn().mockResolvedValue({ insertId: 1 }),
  getPublicaciones: vi.fn().mockResolvedValue([]),
  getPublicacionById: vi.fn().mockResolvedValue(undefined),
  updatePublicacion: vi.fn().mockResolvedValue(undefined),
  deletePublicacion: vi.fn().mockResolvedValue(undefined),
  getWelcomeMessages: vi.fn().mockResolvedValue([]),
  getActiveWelcomeMessage: vi.fn().mockResolvedValue(undefined),
  createWelcomeMessage: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateWelcomeMessage: vi.fn().mockResolvedValue(undefined),
  deleteWelcomeMessage: vi.fn().mockResolvedValue(undefined),
}));

// Mock notifyOwner
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({
      nombre: "Bienvenida IA",
      contenido: "Hola {{nombre}}, te presentamos {{producto}}. Más info: {{enlace}}",
      variables: ["nombre", "producto", "enlace"],
    }) } }],
  }),
}));

// ─── Context factory ──────────────────────────────────────────────────────────
function makeCtx(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner-test",
      name: "Test Owner",
      email: "owner@test.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("devuelve el usuario autenticado", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Owner");
  });

  it("devuelve null para usuario no autenticado", async () => {
    const ctx: TrpcContext = { ...makeCtx(), user: null };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("leads.list", () => {
  it("devuelve lista vacía de leads", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("acepta filtros de estado y fuente", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.list({ estado: "nuevo", fuente: "instagram" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("leads.create", () => {
  it("crea un lead con datos válidos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.create({
      nombre: "Juan Pérez",
      email: "juan@test.com",
      telefono: "+573001234567",
      estado: "nuevo",
      fuente: "instagram",
    });
    expect(result).toBeDefined();
    expect(result.nombre).toBe("Test Lead");
  });

  it("falla con email inválido", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.leads.create({ nombre: "Test", email: "no-es-email" })
    ).rejects.toThrow();
  });

  it("falla con estado inválido", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.leads.create({ nombre: "Test", estado: "invalido" as any })
    ).rejects.toThrow();
  });
});

describe("leads.byId - lead no encontrado", () => {
  it("lanza NOT_FOUND cuando el lead no existe", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.leads.byId({ id: 999 })).rejects.toThrow("Lead no encontrado");
  });
});

describe("productos.list", () => {
  it("devuelve lista vacía de productos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.productos.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("productos.create", () => {
  it("crea un producto con datos válidos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.productos.create({
      nombre: "Curso de Marketing Digital",
      precio: 197,
      enlaceAfiliado: "https://hotmart.com/product/curso-marketing",
      categoria: "Marketing",
    });
    expect(result).toBeDefined();
  });

  it("falla con URL de afiliado inválida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.productos.create({
        nombre: "Producto",
        precio: 100,
        enlaceAfiliado: "no-es-url",
      })
    ).rejects.toThrow();
  });
});

describe("plantillas.list", () => {
  it("devuelve lista vacía de plantillas", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.plantillas.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("plantillas.create", () => {
  it("crea una plantilla con datos válidos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.plantillas.create({
      nombre: "Bienvenida",
      contenido: "Hola {{nombre}}, te damos la bienvenida...",
      categoria: "bienvenida",
    });
    expect(result).toBeDefined();
  });
});

describe("plantillas.generarConIA", () => {
  it("genera una plantilla usando IA", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.plantillas.generarConIA({
      productoNombre: "Curso de Finanzas",
      etapaEmbudo: "bienvenida",
      perfilLead: "Emprendedor interesado en finanzas personales",
    });
    expect(result).toBeDefined();
    expect(typeof result.contenido).toBe("string");
    expect(result.contenido.length).toBeGreaterThan(0);
  });
});

describe("flujos.list", () => {
  it("devuelve lista vacía de flujos", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.flujos.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("etiquetas.list", () => {
  it("devuelve lista vacía de etiquetas", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.etiquetas.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("etiquetas.create", () => {
  it("crea una etiqueta con color válido", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.etiquetas.create({ nombre: "VIP", color: "#6366f1" });
    expect(result).toBeDefined();
    expect(result.nombre).toBe("VIP");
  });
});

describe("analytics.summary", () => {
  it("devuelve resumen de analíticas con métricas clave", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.summary();
    expect(result).toBeDefined();
    expect(typeof result.totalLeads).toBe("number");
    expect(typeof result.conversiones).toBe("number");
    expect(typeof result.tasaConversion).toBe("number");
    expect(Array.isArray(result.porEstado)).toBe(true);
  });

  it("incluye distribución por estado correcta", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.summary();
    const estados = result.porEstado.map((e: any) => e.estado);
    expect(estados).toContain("nuevo");
    expect(estados).toContain("compro");
  });
});

describe("analytics.webhooksRecientes", () => {
  it("devuelve lista de webhooks recientes", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.analytics.webhooksRecientes();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("reglas.list", () => {
  it("devuelve lista vacía de reglas", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reglas.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("reglas.create", () => {
  it("crea una regla de seguimiento válida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reglas.create({
      nombre: "Seguimiento 3 días",
      diasInactividad: 3,
      estadosAplicables: ["nuevo", "contactado"],
      plantillaId: 1,
      activo: true,
    });
    expect(result).toBeDefined();
  });

  it("falla con diasInactividad menor a 1", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.reglas.create({
        nombre: "Regla inválida",
        diasInactividad: 0,
        estadosAplicables: ["nuevo"],
        plantillaId: 1,
      })
    ).rejects.toThrow();
  });
});

describe("interacciones.registrarMensaje", () => {
  it("registra un mensaje enviado a un lead", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.interacciones.registrarMensaje({
      leadId: 1,
      contenido: "Hola Juan, ¿cómo estás?",
      tipo: "mensaje_enviado",
      estadoMensaje: "enviado",
    });
    expect(result).toEqual({ success: true });
  });

  it("falla con contenido vacío", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.interacciones.registrarMensaje({ leadId: 1, contenido: "" })
    ).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("limpia la cookie de sesión y retorna success", async () => {
    const ctx = makeCtx();
    const clearedCookies: string[] = [];
    (ctx.res as any).clearCookie = (name: string) => clearedCookies.push(name);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });
});


describe("APIs Multicanal - Credenciales", () => {
  it("crea una credencial de WhatsApp", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.credenciales.create({
      plataforma: "whatsapp",
      tokenAcceso: "test_token_whatsapp_123",
      numeroTelefono: "573001234567",
    });
    expect(result).toBeDefined();
  });

  it("lista credenciales de APIs", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.credenciales.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("APIs Multicanal - WhatsApp", () => {
  it("falla al enviar mensaje si el lead no existe", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.apis.whatsapp.enviarMensaje({ leadId: 999, contenido: "Mensaje" }))
      .rejects.toThrow("Lead no encontrado");
  });

  it("envía un mensaje real mediante WhatsApp Cloud API y guarda su estado", async () => {
    vi.mocked(db.getLeadById).mockResolvedValueOnce({ id: 1, nombre: "Laura", telefono: "57 300 123 4567" } as any);
    vi.mocked(db.getApiCredentials).mockResolvedValueOnce([{ activo: true, tokenAcceso: "meta-token", idCuenta: "phone-number-id" }] as any);
    vi.mocked(db.createMensajeWhatsapp).mockResolvedValueOnce({ insertId: 42 } as any);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.test-1" }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.whatsapp.enviarMensaje({ leadId: 1, contenido: "Hola Laura" });

    expect(result).toMatchObject({ success: true, mensajeId: 42, providerId: "wamid.test-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/phone-number-id/messages"),
      expect.objectContaining({ method: "POST" }),
    );
    vi.unstubAllGlobals();
  });

  it("expone el historial de mensajes por lead", async () => {
    vi.mocked(db.getMensajesByLead).mockResolvedValueOnce([{ id: 1, leadId: 1, estado: "enviado" }] as any);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.whatsapp.listarMensajes({ leadId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ leadId: 1 });
  });
});

describe("APIs Multicanal - Redes Sociales", () => {
  it("lista publicaciones por plataforma", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.redes.listar({ plataforma: "instagram" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("crea un borrador sin llamar a la API externa", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.redes.crearPublicacion({
      plataforma: "instagram",
      contenido: "Mi primer post en Instagram",
      hashtags: ["#marketing", "#hotmart"],
      estado: "borrador",
    });
    expect(result).toMatchObject({ success: true, estado: "borrador" });
  });

  it("publica una imagen real en Instagram con el flujo de contenedor y publicación", async () => {
    vi.mocked(db.getApiCredentials).mockResolvedValueOnce([{ activo: true, tokenAcceso: "instagram-token", idCuenta: "ig-account-id" }] as any);
    vi.mocked(db.createPublicacion).mockResolvedValueOnce({ insertId: 7 } as any);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "container-7" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "media-7" }) });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.redes.crearPublicacion({
      plataforma: "instagram",
      contenido: "Post de lanzamiento",
      imagenes: ["https://cdn.example.com/lanzamiento.jpg"],
      hashtags: ["#mcr"],
      estado: "publicada",
    });

    expect(result).toMatchObject({ success: true, publicacionId: 7, providerId: "media-7", estado: "publicada" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/ig-account-id/media");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/ig-account-id/media_publish");
    vi.unstubAllGlobals();
  });

  it("inicializa una publicación real de vídeo en TikTok", async () => {
    vi.mocked(db.getApiCredentials).mockResolvedValueOnce([{ activo: true, tokenAcceso: "tiktok-token", idCuenta: "tiktok-open-id" }] as any);
    vi.mocked(db.createPublicacion).mockResolvedValueOnce({ insertId: 8 } as any);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { publish_id: "tiktok-publish-8" } }) });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.redes.crearPublicacion({
      plataforma: "tiktok",
      contenido: "Video de bienvenida",
      videos: ["https://cdn.example.com/video.mp4"],
      estado: "publicada",
    });

    expect(result).toMatchObject({ success: true, publicacionId: 8, providerId: "tiktok-publish-8", estado: "publicada" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      expect.objectContaining({ method: "POST" }),
    );
    vi.unstubAllGlobals();
  });
});


describe("Welcome Messages", () => {
  it("lista mensajes de bienvenida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.welcomeMessages.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("crea un mensaje de bienvenida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.welcomeMessages.create({
      productoId: 1,
      contenido: "¡Hola! Bienvenido a nuestro producto exclusivo. Aquí encontrarás todo lo que necesitas.",
      activo: true,
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("actualiza un mensaje de bienvenida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.welcomeMessages.update({
      id: 1,
      contenido: "Contenido actualizado del mensaje de bienvenida",
      activo: true,
    });
    expect(result.success).toBe(true);
  });

  it("elimina un mensaje de bienvenida", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.welcomeMessages.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("envía automáticamente la bienvenida activa al crear un lead con producto", async () => {
    vi.mocked(db.createLead).mockResolvedValueOnce({ insertId: 99 } as any);
    vi.mocked(db.getActiveWelcomeMessage).mockResolvedValueOnce({
      productoId: 1,
      contenido: "Hola {{nombre}}, conoce {{producto}} aquí: {{enlace}}",
      activo: true,
    } as any);
    vi.mocked(db.getApiCredentials).mockResolvedValueOnce([{ activo: true, tokenAcceso: "meta-token", idCuenta: "phone-id" }] as any);
    vi.mocked(db.createMensajeWhatsapp).mockResolvedValueOnce({ insertId: 100 } as any);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid.welcome-1" }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leads.create({
      nombre: "Laura",
      telefono: "573001234567",
      whatsappOptIn: true,
      productoInteresId: 1,
      estado: "nuevo",
    });

    expect(result).toMatchObject({ insertId: 99 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string).text.body).toContain("Hola Laura");
    vi.unstubAllGlobals();
  });

  it("no envía bienvenida si el lead no dio consentimiento WhatsApp", async () => {
    vi.mocked(db.createLead).mockResolvedValueOnce({ insertId: 100 } as any);
    vi.mocked(db.getActiveWelcomeMessage).mockResolvedValueOnce({ productoId: 1, contenido: "Hola {{nombre}}", activo: true } as any);
    vi.mocked(db.getApiCredentials).mockResolvedValueOnce([{ activo: true, tokenAcceso: "meta-token", idCuenta: "phone-id" }] as any);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(makeCtx());
    await caller.leads.create({ nombre: "Sin consentimiento", telefono: "573001234567", productoInteresId: 1, estado: "nuevo" });

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
