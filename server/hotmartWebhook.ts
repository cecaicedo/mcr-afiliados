import { Router, Request, Response } from "express";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

export const hotmartRouter = Router();

// Endpoint público para recibir webhooks de Hotmart
hotmartRouter.post("/api/hotmart/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body as Record<string, unknown>;
    const evento = (payload?.event as string) || (payload?.hottok as string) || "desconocido";

    // Registrar el webhook recibido
    const webhookResult = await db.createWebhookHotmart({ evento, payload, procesado: false });
    const webhookId = (webhookResult as any).insertId;

    // Procesar según el tipo de evento
    let leadId: number | undefined;
    let errorMsg: string | undefined;

    try {
      const purchase = (payload?.data as any)?.purchase;
      const buyer = (payload?.data as any)?.buyer;
      const product = (payload?.data as any)?.product;

      const buyerEmail = buyer?.email as string | undefined;
      const buyerName = buyer?.name as string | undefined;
      const productName = product?.name as string | undefined;

      if (evento === "PURCHASE_COMPLETE" || evento === "purchase.complete") {
        // Buscar lead existente por email
        const todosLeads = await db.getLeads();
        const leadExistente = buyerEmail ? todosLeads.find((l: any) => l.email === buyerEmail) : undefined;

        if (leadExistente) {
          await db.updateLead(leadExistente.id, { estado: "compro", ultimaInteraccion: new Date() });
          await db.createInteraccion({
            leadId: leadExistente.id,
            tipo: "webhook",
            contenido: `✅ Compra completada en Hotmart. Producto: ${productName || "N/A"}. Transacción: ${purchase?.transaction || "N/A"}`,
            metadatos: payload,
          });
          leadId = leadExistente.id;
        } else if (buyerName || buyerEmail) {
          // Crear nuevo lead desde la compra
          const newLead = await db.createLead({
            nombre: buyerName || buyerEmail || "Comprador Hotmart",
            email: buyerEmail,
            estado: "compro",
            fuente: "hotmart_webhook",
            ultimaInteraccion: new Date(),
          });
          leadId = (newLead as any).insertId;
          if (leadId) {
            await db.createInteraccion({
              leadId,
              tipo: "webhook",
              contenido: `✅ Compra completada en Hotmart. Producto: ${productName || "N/A"}`,
              metadatos: payload,
            });
          }
        }

        await notifyOwner({
          title: "✅ Venta confirmada en Hotmart",
          content: `**${buyerName || buyerEmail || "Un comprador"}** completó la compra de **${productName || "un producto"}**.`,
        }).catch(() => {});

      } else if (evento === "PURCHASE_CANCELED" || evento === "purchase.refunded") {
        const todosLeads = await db.getLeads();
        const leadExistente = buyerEmail ? todosLeads.find((l: any) => l.email === buyerEmail) : undefined;
        if (leadExistente) {
          await db.createInteraccion({
            leadId: leadExistente.id,
            tipo: "webhook",
            contenido: `🔄 Reembolso procesado en Hotmart. Producto: ${productName || "N/A"}`,
            metadatos: payload,
          });
          leadId = leadExistente.id;
        }

      } else if (evento === "PURCHASE_ABANDONED" || evento === "purchase.abandoned") {
        const todosLeads = await db.getLeads();
        const leadExistente = buyerEmail ? todosLeads.find((l: any) => l.email === buyerEmail) : undefined;

        if (leadExistente) {
          await db.updateLead(leadExistente.id, { estado: "interesado", ultimaInteraccion: new Date() });
          await db.createInteraccion({
            leadId: leadExistente.id,
            tipo: "webhook",
            contenido: `🛒 Carrito abandonado en Hotmart. Producto: ${productName || "N/A"}`,
            metadatos: payload,
          });
          leadId = leadExistente.id;
        } else if (buyerName || buyerEmail) {
          const newLead = await db.createLead({
            nombre: buyerName || buyerEmail || "Prospecto Hotmart",
            email: buyerEmail,
            estado: "interesado",
            fuente: "hotmart_carrito_abandonado",
            ultimaInteraccion: new Date(),
          });
          leadId = (newLead as any).insertId;
          if (leadId) {
            await db.createInteraccion({
              leadId,
              tipo: "webhook",
              contenido: `🛒 Carrito abandonado en Hotmart. Producto: ${productName || "N/A"}`,
              metadatos: payload,
            });
          }
        }

        await notifyOwner({
          title: "🛒 Carrito abandonado en Hotmart",
          content: `**${buyerName || buyerEmail || "Un prospecto"}** abandonó el carrito del producto **${productName || "N/A"}**.`,
        }).catch(() => {});
      }

    } catch (processingError: any) {
      errorMsg = processingError?.message || "Error al procesar evento";
    }

    await db.markWebhookProcesado(webhookId, leadId, errorMsg);
    res.status(200).json({ received: true, webhookId });

  } catch (error: any) {
    console.error("[Hotmart Webhook] Error:", error);
    res.status(500).json({ error: "Error interno al procesar webhook" });
  }
});
