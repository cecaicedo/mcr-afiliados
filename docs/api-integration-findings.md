# Hallazgos de integración multicanal

## WhatsApp Cloud API
La documentación oficial de Meta confirma el endpoint `POST https://graph.facebook.com/{Version}/{Phone-Number-ID}/messages`. Requiere `Authorization: Bearer <token>`, `Content-Type: application/json` y un cuerpo con `messaging_product: "whatsapp"`, `recipient_type: "individual"`, `to`, `type: "text"` y `text.body`.

Fuente: https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api

## Instagram Content Publishing
La documentación oficial de Meta confirma el flujo de dos pasos para cuentas profesionales: crear contenedor con `POST /<IG_ID>/media` y publicar con `POST /<IG_ID>/media_publish`. El contenido multimedia debe estar alojado en un servidor público; para imágenes se usa `image_url`, para vídeo `video_url`. Requiere token y permisos de publicación apropiados.

Fuente: https://developers.facebook.com/documentation/instagram-platform/content-publishing

## TikTok Content Posting API
La documentación oficial de TikTok confirma que la publicación directa requiere una app registrada, el producto Content Posting API, configuración Direct Post, aprobación del scope `video.publish`, autorización del usuario y access token/open ID. Los vídeos deben ser accesibles por archivo o URL de dominio verificado; las fotos también requieren URL de dominio verificado.

Fuente: https://developers.tiktok.com/doc/content-posting-api-get-started

## Decisiones de implementación
Se implementará envío real de WhatsApp mediante la API Graph. Instagram admitirá publicación real cuando exista `imagenes` o `videos` con URL pública, manteniendo borradores sin llamar a la API. TikTok admitirá publicación directa de vídeo mediante el flujo `video/init` y carga desde URL pública; si solo se proporciona texto, se conservará como borrador y se devolverá un error explicativo al intentar publicar.
