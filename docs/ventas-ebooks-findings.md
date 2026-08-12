# Hallazgos para la estrategia de venta de ebooks Hotmart

Fecha de consulta: 2026-08-12

## Hotmart

- Hotmart indica que el afiliado debe utilizar su Link de Divulgación (HotLink) para que la venta pueda atribuirse a su cuenta; sin el HotLink, la plataforma no puede asociar el origen de la venta.
- Los materiales de promoción, páginas alternativas y recursos disponibles dependen de cada productor y no están garantizados para todos los productos.
- El seguimiento de accesos, clics y ventas es necesario para ajustar las estrategias de promoción.
- El webhook de compra envía el encabezado `X-HOTMART-HOTTOK`, que Hotmart recomienda validar antes de procesar el payload.
- La documentación de compra contempla eventos como `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED` y otros.
- El webhook de abandono de carrito usa el evento `PURCHASE_OUT_OF_SHOPPING_CART`, se genera después de que el comprador completa datos en checkout y la verificación puede ocurrir cada 30 minutos.

## WhatsApp Business Platform

- Los mensajes de servicio de texto libre solo pueden enviarse dentro de la ventana de atención de 24 horas iniciada por un mensaje o llamada del usuario.
- Fuera de esa ventana, se requieren plantillas aprobadas por Meta; las plantillas tienen categorías, idioma, parámetros y revisión de estado.
- Meta exige opt-in previo y respetar las solicitudes de baja/bloqueo.
- La respuesta exitosa de la Messages API solo confirma que Meta aceptó la solicitud; la entrega real debe seguirse mediante webhooks de estados de mensajes.
- Meta recomienda incluir el signo `+` y el código de país al enviar el número de WhatsApp.

## Implicaciones para MCR Caicedo Digital

1. El catálogo debe conservar un identificador Hotmart estable por producto (id o ucode), además del HotLink y la oferta concreta; actualmente el modelo `productos` conserva el enlace, pero no un `hotmartProductId`/`ucode` explícito.
2. Los eventos oficiales deben normalizarse con sus nombres reales y el webhook debe validar `X-HOTMART-HOTTOK`, aplicar idempotencia por `id` de evento y asociar la compra a producto por id/ucode.
3. La secuencia de WhatsApp no debe enviar mensajes libres periódicos sin consentimiento ni fuera de la ventana de 24 horas. Debe soportar plantillas aprobadas, opt-in, bajas y estados de entrega.
4. Para 30+ ebooks, la arquitectura correcta es segmentar por necesidad/problema y no enviar el catálogo completo a cada lead.

## Fuentes

- Hotmart, “¿Cómo hacer mi primera venta como Afiliado?”: https://help.hotmart.com/es/article/26573141054477/-como-hacer-mi-primera-venta-como-afiliado-
- Hotmart Developers, “Eventos de solicitud”: https://developers.hotmart.com/docs/es/2.0.0/webhook/purchase-webhook/
- Hotmart Developers, “Evento de abandono de carrito”: https://developers.hotmart.com/docs/es/2.0.0/webhook/cart-abandonment-webhook/
- Meta Developers, “Service messages”: https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages
- Meta Developers, “Template fundamentals”: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview
- WhatsApp Business, “WhatsApp Business Messaging Policy”: https://whatsappbusiness.com/policy/
- Hotmart, “Política General de Uso Responsable”: https://hotmart.com/es/legal/politicas-de-uso
