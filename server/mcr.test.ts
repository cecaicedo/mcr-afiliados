import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
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
  updatePublicacion: vi.fn().mockResolvedValue(undefined),
  deletePublicacion: vi.fn().mockResolvedValue(undefined),
  getWelcomeMessages: vi.fn().mockResolvedValue([]),
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
    try {
      await caller.apis.whatsapp.enviarMensaje({
        leadId: 999,
        contenido: "Hola, este es un mensaje de prueba",
      });
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("Lead no encontrado");
    }
  });
});

describe("APIs Multicanal - Redes Sociales", () => {
  it("lista publicaciones por plataforma", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.apis.redes.listar({ plataforma: "instagram" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("falla al crear publicación sin credenciales configuradas", async () => {
    const caller = appRouter.createCaller(makeCtx());
    try {
      await caller.apis.redes.crearPublicacion({
        plataforma: "instagram",
        contenido: "Mi primer post en Instagram",
        hashtags: ["#marketing", "#hotmart"],
        estado: "borrador",
      });
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.message).toContain("no está configurado");
    }
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
});
