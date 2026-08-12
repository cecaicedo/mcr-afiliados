import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

/**
 * Handler periódico: ejecuta recordatorios automáticos para leads inactivos.
 * Se llama cada hora via Heartbeat cron.
 * Path: POST /api/scheduled/recordatorios
 */
export async function recordatoriosHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const reglas = await db.getReglasSeguimiento();
    const reglasActivas = reglas.filter((r: any) => r.activo);

    let totalProcesados = 0;
    const resumen: string[] = [];

    for (const regla of reglasActivas) {
      const estados = (regla.estadosAplicables as string[]) ?? ["nuevo", "contactado", "interesado"];
      const leadsInactivos = await db.getLeadsInactivos(regla.diasInactividad, estados);

      // Verificar que no se haya enviado ya un recordatorio reciente
      const recordatoriosPendientes = await db.getRecordatoriosPendientes();
      const leadIdsConRecordatorio = new Set(recordatoriosPendientes.map((r: any) => r.leadId));

      const leadsAplicables = leadsInactivos.filter(
        (l: any) => !leadIdsConRecordatorio.has(l.id)
      );

      if (leadsAplicables.length === 0) continue;

      // Obtener plantilla si existe
      let plantillaContenido = `[Recordatorio automático - Regla: ${regla.nombre}] Han pasado ${regla.diasInactividad} días sin actividad.`;
      if (regla.plantillaId) {
        const plantilla = await db.getPlantillaById(regla.plantillaId);
        if (plantilla) plantillaContenido = `[Recordatorio automático] ${plantilla.contenido}`;
      }

      const credentials = await db.getApiCredentials("whatsapp");
      const credential = credentials[0];
      const hasActiveWhatsApp = credential?.activo && credential.tokenAcceso && credential.idCuenta;

      for (const lead of leadsAplicables) {
        if (!lead.telefono || !lead.whatsappOptIn) {
          continue; // Respetar estrictamente el Opt-In y requerir teléfono
        }

        const product = lead.productoInteresId ? await db.getProductoById(lead.productoInteresId) : undefined;
        // Reemplazar variables correctamente
        const contenidoFinal = plantillaContenido
          .replaceAll("{{nombre}}", lead.nombre ?? "amigo")
          .replaceAll("{{producto}}", product?.nombre ?? "tu producto")
          .replaceAll("{{enlace}}", product?.enlaceAfiliado ?? "");

        const pending = await db.createMensajeWhatsapp({ leadId: lead.id, contenido: contenidoFinal, estado: "pendiente" });
        const messageId = Number((pending as any).insertId ?? 0);

        if (hasActiveWhatsApp) {
          try {
            const resp = await fetch(`https://graph.facebook.com/v23.0/${credential.idCuenta}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${credential.tokenAcceso}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: lead.telefono.replace(/[^\d]/g, ""),
                type: "text",
                text: { preview_url: true, body: contenidoFinal },
              }),
            });
            const bodyResp = await resp.json().catch(() => ({}));
            if (!resp.ok) {
              throw new Error((bodyResp as any)?.error?.message || `WhatsApp respondió ${resp.status}`);
            }

            await db.updateMensajeWhatsapp(messageId, {
              estado: "enviado",
              idMensajeWhatsapp: (bodyResp as any).messages?.[0]?.id,
              enviadoEn: new Date(),
            });
            await db.createInteraccion({ leadId: lead.id, tipo: "mensaje_enviado", contenido: contenidoFinal, estadoMensaje: "enviado", plantillaId: regla.plantillaId || undefined });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Error desconocido WhatsApp";
            await db.updateMensajeWhatsapp(messageId, { estado: "error", error: errMsg });
            await db.createInteraccion({ leadId: lead.id, tipo: "mensaje_enviado", contenido: contenidoFinal, estadoMensaje: "fallido", plantillaId: regla.plantillaId || undefined, metadatos: { error: errMsg } });
          }
        } else {
          await db.updateMensajeWhatsapp(messageId, { estado: "error", error: "Credenciales de WhatsApp inactivas" });
        }

        await db.createRecordatorio({
          leadId: lead.id,
          reglaId: regla.id,
          fechaEjecucion: new Date(),
          plantillaId: regla.plantillaId || 0,
        });

        await db.updateLead(lead.id, { ultimaInteraccion: new Date() });
        totalProcesados++;
      }

      if (leadsAplicables.length > 0) {
        resumen.push(`Regla "${regla.nombre}": ${leadsAplicables.length} leads procesados`);
      }
    }

    // Notificar al propietario si hubo actividad
    if (totalProcesados > 0) {
      await notifyOwner({
        title: `🔔 Recordatorios automáticos ejecutados`,
        content: `Se procesaron ${totalProcesados} leads inactivos:\n${resumen.join("\n")}`,
      }).catch(() => {});
    }

    return res.json({
      ok: true,
      totalProcesados,
      resumen,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[Recordatorios Handler] Error:", error);
    return res.status(500).json({
      error: error?.message ?? "Error interno",
      stack: error?.stack,
      context: { url: req.url, taskUid: req.headers["x-task-uid"] },
      timestamp: new Date().toISOString(),
    });
  }
}
