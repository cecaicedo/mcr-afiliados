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

      for (const lead of leadsAplicables) {
        // Registrar interacción de recordatorio
        await db.createInteraccion({
          leadId: lead.id,
          tipo: "mensaje_enviado",
          contenido: plantillaContenido,
          estadoMensaje: "pendiente",
          plantillaId: regla.plantillaId || undefined,
        });

        // Crear registro de recordatorio ejecutado
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
