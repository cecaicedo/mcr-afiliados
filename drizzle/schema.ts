import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Etiquetas ────────────────────────────────────────────────────────────────
export const etiquetas = mysqlTable("etiquetas", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#6366f1"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Etiqueta = typeof etiquetas.$inferSelect;
export type InsertEtiqueta = typeof etiquetas.$inferInsert;

// ─── Productos Hotmart ────────────────────────────────────────────────────────
export const productos = mysqlTable("productos", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  enlaceAfiliado: text("enlaceAfiliado").notNull(),
  precio: float("precio").notNull().default(0),
  categoria: varchar("categoria", { length: 100 }),
  imagenUrl: text("imagenUrl"),
  rating: float("rating").default(9.5),
  comentariosCount: int("comentariosCount").default(120),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Producto = typeof productos.$inferSelect;
export type InsertProducto = typeof productos.$inferInsert;

// ─── Campañas y atribución ─────────────────────────────────────────────────────
export const campanas = mysqlTable("campanas", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  fuente: varchar("fuente", { length: 100 }).notNull(),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 150 }),
  productoId: int("productoId"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campana = typeof campanas.$inferSelect;
export type InsertCampana = typeof campanas.$inferInsert;

// ─── Leads / Prospectos ───────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefono: varchar("telefono", { length: 30 }),
  whatsappOptIn: boolean("whatsappOptIn").notNull().default(false),
  estado: mysqlEnum("estado", ["nuevo", "contactado", "interesado", "compro", "perdido"])
    .notNull()
    .default("nuevo"),
  fuente: varchar("fuente", { length: 100 }),
  campana: varchar("campana", { length: 100 }),
  campanaId: int("campanaId"),
  productoInteresId: int("productoInteresId"),
  etiquetasIds: json("etiquetasIds").$type<number[]>().default([]),
  notas: text("notas"),
  ultimaInteraccion: timestamp("ultimaInteraccion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Plantillas de Mensajes WhatsApp ─────────────────────────────────────────
export const plantillasMensajes = mysqlTable("plantillas_mensajes", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  contenido: text("contenido").notNull(),
  variables: json("variables").$type<string[]>().default([]),
  categoria: mysqlEnum("categoria", ["bienvenida", "seguimiento", "carrito_abandonado", "post_venta", "recordatorio", "general"])
    .notNull()
    .default("general"),
  generadaPorIA: boolean("generadaPorIA").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlantillaMensaje = typeof plantillasMensajes.$inferSelect;
export type InsertPlantillaMensaje = typeof plantillasMensajes.$inferInsert;

// ─── Flujos de Automatización ─────────────────────────────────────────────────
export const flujos = mysqlTable("flujos", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  trigger: mysqlEnum("trigger", [
    "nuevo_lead",
    "estado_contactado",
    "estado_interesado",
    "estado_compro",
    "estado_perdido",
    "carrito_abandonado",
    "post_venta",
    "manual",
  ]).notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Flujo = typeof flujos.$inferSelect;
export type InsertFlujo = typeof flujos.$inferInsert;

// ─── Pasos de Flujo ───────────────────────────────────────────────────────────
export const pasosFlujo = mysqlTable("pasos_flujo", {
  id: int("id").autoincrement().primaryKey(),
  flujoId: int("flujoId").notNull(),
  orden: int("orden").notNull().default(1),
  plantillaId: int("plantillaId").notNull(),
  delayHoras: int("delayHoras").notNull().default(0),
  condicion: varchar("condicion", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasoFlujo = typeof pasosFlujo.$inferSelect;
export type InsertPasoFlujo = typeof pasosFlujo.$inferInsert;

// ─── Interacciones / Historial ────────────────────────────────────────────────
export const interacciones = mysqlTable("interacciones", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  tipo: mysqlEnum("tipo", ["mensaje_enviado", "mensaje_recibido", "nota", "cambio_estado", "webhook"])
    .notNull()
    .default("nota"),
  contenido: text("contenido").notNull(),
  estadoMensaje: mysqlEnum("estadoMensaje", ["pendiente", "enviado", "entregado", "leido", "fallido"]),
  plantillaId: int("plantillaId"),
  metadatos: json("metadatos").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaccion = typeof interacciones.$inferSelect;
export type InsertInteraccion = typeof interacciones.$inferInsert;

// ─── Webhooks Hotmart ─────────────────────────────────────────────────────────
export const webhooksHotmart = mysqlTable("webhooks_hotmart", {
  id: int("id").autoincrement().primaryKey(),
  evento: varchar("evento", { length: 100 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  procesado: boolean("procesado").notNull().default(false),
  leadId: int("leadId"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookHotmart = typeof webhooksHotmart.$inferSelect;
export type InsertWebhookHotmart = typeof webhooksHotmart.$inferInsert;

// ─── Reglas de Seguimiento ────────────────────────────────────────────────────
export const reglasSeguimiento = mysqlTable("reglas_seguimiento", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  diasInactividad: int("diasInactividad").notNull().default(3),
  estadosAplicables: json("estadosAplicables").$type<string[]>().default(["nuevo", "contactado", "interesado"]),
  plantillaId: int("plantillaId").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReglaSeguimiento = typeof reglasSeguimiento.$inferSelect;
export type InsertReglaSeguimiento = typeof reglasSeguimiento.$inferInsert;

// ─── Recordatorios Programados ────────────────────────────────────────────────
export const recordatorios = mysqlTable("recordatorios", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  reglaId: int("reglaId").notNull(),
  plantillaId: int("plantillaId").notNull(),
  fechaEjecucion: timestamp("fechaEjecucion").notNull(),
  ejecutado: boolean("ejecutado").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Recordatorio = typeof recordatorios.$inferSelect;
export type InsertRecordatorio = typeof recordatorios.$inferInsert;

// ─── Configuración de APIs Multicanal ─────────────────────────────────────────
export const apiCredentials = mysqlTable("api_credentials", {
  id: int("id").autoincrement().primaryKey(),
  plataforma: mysqlEnum("plataforma", ["whatsapp", "instagram", "tiktok"]).notNull(),
  tokenAcceso: text("tokenAcceso").notNull(),
  numeroTelefono: varchar("numeroTelefono", { length: 20 }),
  idCuenta: varchar("idCuenta", { length: 200 }),
  nombreCuenta: varchar("nombreCuenta", { length: 200 }),
  activo: boolean("activo").notNull().default(true),
  ultimaVerificacion: timestamp("ultimaVerificacion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = typeof apiCredentials.$inferInsert;

// ─── Historial de Mensajes WhatsApp ───────────────────────────────────────────
export const mensajesWhatsapp = mysqlTable("mensajes_whatsapp", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  contenido: text("contenido").notNull(),
  estado: mysqlEnum("estado", ["pendiente", "enviado", "entregado", "leido", "error"]).notNull().default("pendiente"),
  idMensajeWhatsapp: varchar("idMensajeWhatsapp", { length: 200 }),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  enviadoEn: timestamp("enviadoEn"),
});

export type MensajeWhatsapp = typeof mensajesWhatsapp.$inferSelect;
export type InsertMensajeWhatsapp = typeof mensajesWhatsapp.$inferInsert;

// ─── Plantillas de Respuesta Social (Instagram / TikTok) ──────────────────────
export const plantillasSociales = mysqlTable("plantillas_sociales", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  plataforma: mysqlEnum("plataforma", ["instagram", "tiktok", "facebook", "youtube"]).notNull(),
  palabraClave: varchar("palabraClave", { length: 100 }).notNull(), // ej. "INFO", "LIBRO", "PRECIO"
  mensajeRespuesta: text("mensajeRespuesta").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlantillaSocial = typeof plantillasSociales.$inferSelect;
export type InsertPlantillaSocial = typeof plantillasSociales.$inferInsert;

// ─── Publicaciones en Redes Sociales ───────────────────────────────────────────
export const publicacionesRedes = mysqlTable("publicaciones_redes", {
  id: int("id").autoincrement().primaryKey(),
  plataforma: mysqlEnum("plataforma", ["instagram", "tiktok"]).notNull(),
  contenido: text("contenido").notNull(),
  imagenes: json("imagenes").$type<string[]>().default([]),
  videos: json("videos").$type<string[]>().default([]),
  hashtags: json("hashtags").$type<string[]>().default([]),
  estado: mysqlEnum("estado", ["borrador", "programada", "publicada", "error"]).notNull().default("borrador"),
  idPublicacion: varchar("idPublicacion", { length: 200 }),
  fechaPublicacion: timestamp("fechaPublicacion"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PublicacionRed = typeof publicacionesRedes.$inferSelect;
export type InsertPublicacionRed = typeof publicacionesRedes.$inferInsert;


// ─── Mensajes de Bienvenida Automáticos ───────────────────────────────────────
export const mensajesBienvenida = mysqlTable("mensajes_bienvenida", {
  id: int("id").autoincrement().primaryKey(),
  productoId: int("productoId").notNull(),
  contenido: text("contenido").notNull(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MensajeBienvenida = typeof mensajesBienvenida.$inferSelect;
export type InsertMensajeBienvenida = typeof mensajesBienvenida.$inferInsert;
