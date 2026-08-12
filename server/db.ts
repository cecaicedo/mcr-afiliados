import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  etiquetas,
  flujos,
  InsertEtiqueta,
  InsertFlujo,
  InsertInteraccion,
  InsertLead,
  InsertPasoFlujo,
  InsertPlantillaMensaje,
  InsertProducto,
  InsertReglaSeguimiento,
  InsertRecordatorio,
  InsertWebhookHotmart,
  InsertUser,
  interacciones,
  leads,
  pasosFlujo,
  plantillasMensajes,
  productos,
  recordatorios,
  reglasSeguimiento,
  users,
  webhooksHotmart,
  apiCredentials,
  InsertApiCredential,
  mensajesWhatsapp,
  InsertMensajeWhatsapp,
  publicacionesRedes,
  InsertPublicacionRed,
  mensajesBienvenida,
  InsertMensajeBienvenida,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((f) => {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function getLeads(filters?: { estado?: string; fuente?: string; campana?: string; productoInteresId?: number; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(leads);
  const conditions = [];
  if (filters?.estado) conditions.push(eq(leads.estado, filters.estado as any));
  if (filters?.fuente) conditions.push(eq(leads.fuente, filters.fuente));
  if (filters?.campana) conditions.push(eq(leads.campana, filters.campana));
  if (filters?.productoInteresId) conditions.push(eq(leads.productoInteresId, filters.productoInteresId));
  if (conditions.length > 0) return (query as any).where(and(...conditions)).orderBy(desc(leads.createdAt));
  return query.orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return result;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(leads).where(eq(leads.id, id));
}

// ─── Productos ────────────────────────────────────────────────────────────────
export async function getProductos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productos).orderBy(desc(productos.createdAt));
}

export async function getProductoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productos).where(eq(productos.id, id)).limit(1);
  return result[0];
}

export async function createProducto(data: InsertProducto) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(productos).values(data);
}

export async function updateProducto(id: number, data: Partial<InsertProducto>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(productos).set({ ...data, updatedAt: new Date() }).where(eq(productos.id, id));
}

export async function deleteProducto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(productos).where(eq(productos.id, id));
}

// ─── Plantillas ───────────────────────────────────────────────────────────────
export async function getPlantillas(categoria?: string) {
  const db = await getDb();
  if (!db) return [];
  if (categoria) return db.select().from(plantillasMensajes).where(eq(plantillasMensajes.categoria, categoria as any)).orderBy(desc(plantillasMensajes.createdAt));
  return db.select().from(plantillasMensajes).orderBy(desc(plantillasMensajes.createdAt));
}

export async function getPlantillaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plantillasMensajes).where(eq(plantillasMensajes.id, id)).limit(1);
  return result[0];
}

export async function createPlantilla(data: InsertPlantillaMensaje) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(plantillasMensajes).values(data);
}

export async function updatePlantilla(id: number, data: Partial<InsertPlantillaMensaje>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(plantillasMensajes).set({ ...data, updatedAt: new Date() }).where(eq(plantillasMensajes.id, id));
}

export async function deletePlantilla(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(plantillasMensajes).where(eq(plantillasMensajes.id, id));
}

// ─── Flujos ───────────────────────────────────────────────────────────────────
export async function getFlujos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flujos).orderBy(desc(flujos.createdAt));
}

export async function getFlujoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(flujos).where(eq(flujos.id, id)).limit(1);
  return result[0];
}

export async function createFlujo(data: InsertFlujo) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(flujos).values(data);
}

export async function updateFlujo(id: number, data: Partial<InsertFlujo>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(flujos).set({ ...data, updatedAt: new Date() }).where(eq(flujos.id, id));
}

export async function deleteFlujo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(flujos).where(eq(flujos.id, id));
}

// ─── Pasos de Flujo ───────────────────────────────────────────────────────────
export async function getPasosByFlujoId(flujoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pasosFlujo).where(eq(pasosFlujo.flujoId, flujoId)).orderBy(pasosFlujo.orden);
}

export async function createPaso(data: InsertPasoFlujo) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(pasosFlujo).values(data);
}

export async function updatePaso(id: number, data: Partial<InsertPasoFlujo>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(pasosFlujo).set(data).where(eq(pasosFlujo.id, id));
}

export async function deletePaso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(pasosFlujo).where(eq(pasosFlujo.id, id));
}

export async function deletePasosByFlujoId(flujoId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(pasosFlujo).where(eq(pasosFlujo.flujoId, flujoId));
}

// ─── Interacciones ────────────────────────────────────────────────────────────
export async function getInteraccionesByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interacciones).where(eq(interacciones.leadId, leadId)).orderBy(desc(interacciones.createdAt));
}

export async function createInteraccion(data: InsertInteraccion) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(interacciones).values(data);
}

// ─── Etiquetas ────────────────────────────────────────────────────────────────
export async function getEtiquetas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(etiquetas).orderBy(etiquetas.nombre);
}

export async function createEtiqueta(data: InsertEtiqueta) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(etiquetas).values(data);
}

export async function updateEtiqueta(id: number, data: Partial<InsertEtiqueta>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(etiquetas).set(data).where(eq(etiquetas.id, id));
}

export async function deleteEtiqueta(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(etiquetas).where(eq(etiquetas.id, id));
}

// ─── Webhooks Hotmart ─────────────────────────────────────────────────────────
export async function createWebhookHotmart(data: InsertWebhookHotmart) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(webhooksHotmart).values(data);
}

export async function getWebhooksHotmart(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooksHotmart).orderBy(desc(webhooksHotmart.createdAt)).limit(limit);
}

export async function markWebhookProcesado(id: number, leadId?: number, error?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(webhooksHotmart).set({ procesado: true, leadId, error }).where(eq(webhooksHotmart.id, id));
}

// ─── Reglas de Seguimiento ────────────────────────────────────────────────────
export async function getReglasSeguimiento() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reglasSeguimiento).orderBy(desc(reglasSeguimiento.createdAt));
}

export async function createReglaSeguimiento(data: InsertReglaSeguimiento) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(reglasSeguimiento).values(data);
}

export async function updateReglaSeguimiento(id: number, data: Partial<InsertReglaSeguimiento>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(reglasSeguimiento).set({ ...data, updatedAt: new Date() }).where(eq(reglasSeguimiento.id, id));
}

export async function deleteReglaSeguimiento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(reglasSeguimiento).where(eq(reglasSeguimiento.id, id));
}

// ─── Recordatorios ────────────────────────────────────────────────────────────
export async function createRecordatorio(data: InsertRecordatorio) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(recordatorios).values(data);
}

export async function getRecordatoriosPendientes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recordatorios)
    .where(and(eq(recordatorios.ejecutado, false), lte(recordatorios.fechaEjecucion, new Date())));
}

export async function markRecordatorioEjecutado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(recordatorios).set({ ejecutado: true }).where(eq(recordatorios.id, id));
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary() {
  const db = await getDb();
  if (!db) return { totalLeads: 0, porEstado: [], conversiones: 0, tasaConversion: 0 };

  const allLeads = await db.select().from(leads);
  const totalLeads = allLeads.length;
  const comprados = allLeads.filter(l => l.estado === "compro").length;
  const tasaConversion = totalLeads > 0 ? Math.round((comprados / totalLeads) * 100) : 0;

  const estadoMap: Record<string, number> = {};
  allLeads.forEach(l => { estadoMap[l.estado] = (estadoMap[l.estado] || 0) + 1; });
  const porEstado = Object.entries(estadoMap).map(([estado, count]) => ({ estado, count }));

  const allProductos = await db.select().from(productos);
  const ventasPorProducto = await Promise.all(
    allProductos.map(async (p) => {
      const leadsProducto = allLeads.filter(l => l.productoInteresId === p.id && l.estado === "compro");
      return { productoId: p.id, nombre: p.nombre, ventas: leadsProducto.length, comision: leadsProducto.length * p.precio * 0.4 };
    })
  );

  const totalComisiones = ventasPorProducto.reduce((acc, v) => acc + v.comision, 0);

  return { totalLeads, porEstado, conversiones: comprados, tasaConversion, ventasPorProducto, totalComisiones };
}

export async function getLeadsInactivos(diasInactividad: number, estados: string[]) {
  const db = await getDb();
  if (!db) return [];
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);

  return db.select().from(leads).where(
    and(
      or(
        lte(leads.ultimaInteraccion, fechaLimite),
        isNull(leads.ultimaInteraccion)
      )
    )
  );
}

// ─── API Credentials ──────────────────────────────────────────────────────────
export async function getApiCredentials(plataforma?: string) {
  const db = await getDb();
  if (!db) return [];
  if (plataforma) {
    return db.select().from(apiCredentials).where(eq(apiCredentials.plataforma, plataforma as any));
  }
  return db.select().from(apiCredentials);
}

export async function createApiCredential(data: InsertApiCredential) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apiCredentials).values(data);
  return result;
}

export async function updateApiCredential(id: number, data: Partial<InsertApiCredential>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(apiCredentials).set(data).where(eq(apiCredentials.id, id));
}

export async function deleteApiCredential(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(apiCredentials).where(eq(apiCredentials.id, id));
}

// ─── Mensajes WhatsApp ────────────────────────────────────────────────────────
export async function createMensajeWhatsapp(data: InsertMensajeWhatsapp) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(mensajesWhatsapp).values(data);
}

export async function getMensajesByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mensajesWhatsapp).where(eq(mensajesWhatsapp.leadId, leadId)).orderBy(desc(mensajesWhatsapp.createdAt));
}

export async function updateMensajeWhatsapp(id: number, data: Partial<InsertMensajeWhatsapp>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(mensajesWhatsapp).set(data).where(eq(mensajesWhatsapp.id, id));
}

// ─── Publicaciones en Redes ───────────────────────────────────────────────────
export async function createPublicacion(data: InsertPublicacionRed) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(publicacionesRedes).values(data);
}

export async function getPublicaciones(plataforma?: string) {
  const db = await getDb();
  if (!db) return [];
  if (plataforma) {
    return db.select().from(publicacionesRedes).where(eq(publicacionesRedes.plataforma, plataforma as any)).orderBy(desc(publicacionesRedes.createdAt));
  }
  return db.select().from(publicacionesRedes).orderBy(desc(publicacionesRedes.createdAt));
}

export async function getPublicacionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(publicacionesRedes).where(eq(publicacionesRedes.id, id)).limit(1);
  return result[0];
}

export async function updatePublicacion(id: number, data: Partial<InsertPublicacionRed>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(publicacionesRedes).set(data).where(eq(publicacionesRedes.id, id));
}

export async function deletePublicacion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(publicacionesRedes).where(eq(publicacionesRedes.id, id));
}


// ─── Welcome Messages ─────────────────────────────────────────────────────────
export async function getWelcomeMessages(productoId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(mensajesBienvenida);
  if (productoId) {
    return query.where(eq(mensajesBienvenida.productoId, productoId)).orderBy(desc(mensajesBienvenida.createdAt));
  }
  return query.orderBy(desc(mensajesBienvenida.createdAt));
}

export async function getActiveWelcomeMessage(productoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mensajesBienvenida).where(
    and(eq(mensajesBienvenida.productoId, productoId), eq(mensajesBienvenida.activo, true))
  ).orderBy(desc(mensajesBienvenida.createdAt)).limit(1);
  return result[0];
}

export async function createWelcomeMessage(data: InsertMensajeBienvenida) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(mensajesBienvenida).values(data);
}

export async function updateWelcomeMessage(id: number, data: Partial<InsertMensajeBienvenida>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(mensajesBienvenida).set({ ...data, updatedAt: new Date() }).where(eq(mensajesBienvenida.id, id));
}

export async function deleteWelcomeMessage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(mensajesBienvenida).where(eq(mensajesBienvenida.id, id));
}
