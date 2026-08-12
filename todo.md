# MCR Caicedo Digital - TODO

## Base de datos
- [x] Tabla leads (id, nombre, email, telefono, estado, etiquetas, fuente, campana, productoInteres, notas, creadoEn, actualizadoEn)
- [x] Tabla productos (id, nombre, descripcion, enlaceAfiliado, precio, categoria, activo, creadoEn)
- [x] Tabla flujos (id, nombre, descripcion, trigger, activo, creadoEn)
- [x] Tabla pasos_flujo (id, flujoId, orden, plantillaId, delayHoras, condicion)
- [x] Tabla plantillas_mensajes (id, nombre, contenido, variables, categoria, creadoEn)
- [x] Tabla interacciones (id, leadId, tipo, contenido, estado, creadoEn)
- [x] Tabla etiquetas (id, nombre, color)
- [x] Tabla webhooks_hotmart (id, evento, payload, procesado, creadoEn)
- [x] Tabla recordatorios (id, leadId, fechaEjecucion, reglaId, ejecutado)
- [x] Tabla reglas_seguimiento (id, nombre, diasInactividad, plantillaId, activo)
- [x] Tabla mensajes_bienvenida (id, productoId, contenido, activo, createdAt, updatedAt)

## Backend - tRPC Routers
- [x] Router leads: CRUD completo + cambio de estado + filtros
- [x] Router productos: CRUD completo
- [x] Router flujos: CRUD + activar/desactivar + pasos
- [x] Router plantillas: CRUD + generación IA
- [x] Router interacciones: registro y consulta por lead
- [x] Router etiquetas: CRUD
- [x] Router analytics: métricas dashboard, conversiones, embudo
- [x] Router webhooks: endpoint público Hotmart + procesamiento
- [x] Router reglas_seguimiento: CRUD + ejecución manual
- [x] Router notificaciones: envío al propietario

## Frontend - Módulos
- [x] Layout principal con sidebar elegante (CRMLayout)
- [x] Página Dashboard con métricas clave (leads, conversión, ventas, comisiones)
- [x] Página Leads: tabla filtrable, estados, notas, etiquetas
- [x] Página detalle de Lead: historial de interacciones, cambio de estado, notas
- [x] Página Productos: catálogo con CRUD
- [x] Página Flujos de automatización: constructor visual de secuencias
- [x] Página Plantillas de mensajes: editor con variables dinámicas
- [x] Página Analíticas: gráficos de conversión, embudo, efectividad
- [x] Página Configuración: webhooks Hotmart, reglas de seguimiento, etiquetas
- [x] Generador IA de plantillas (modal con formulario)

## Nuevas Funcionalidades - Integraciones Multicanal
- [x] Tabla de configuración de APIs (WhatsApp Business, Instagram, TikTok)
- [x] Tabla de historial de envíos WhatsApp
- [x] Tabla de publicaciones en redes sociales
- [x] Router tRPC para enviar mensajes WhatsApp
- [x] Router tRPC para publicar en Instagram
- [x] Router tRPC para publicar en TikTok
- [x] Página de Configuración de APIs (credenciales, tokens)
- [x] Módulo de envío WhatsApp desde detalle de lead
- [x] Módulo de publicador de redes sociales
- [x] Historial de envíos WhatsApp por lead
- [x] Historial de publicaciones en redes

## Funcionalidades Anteriores (Completadas)
- [x] Sección de Mensajes de Bienvenida Automáticos en Configuración
- [x] Router tRPC para CRUD de mensajes de bienvenida
- [x] Componente WelcomeMessagesConfig con formulario y vista previa
- [x] Activación/desactivación de flujos de bienvenida por producto
- [x] Integración con flujos automáticos existentes

## Integraciones y Automatización
- [x] Webhook público /api/hotmart/webhook para recibir eventos
- [x] Procesamiento de evento: compra_completada
- [x] Procesamiento de evento: carrito_abandonado
- [x] Procesamiento de evento: reembolso
- [x] Cron job: recordatorios a leads inactivos según reglas (handler /api/scheduled/recordatorios)
- [x] Notificaciones al propietario: nuevo lead, avance de etapa, venta confirmada
- [x] Generación IA de plantillas de WhatsApp optimizadas

## Calidad y Pruebas
- [x] Tests vitest para routers principales (27 tests pasando)
- [x] Validación de estados de lead (nuevo, contactado, interesado, compró, perdido)
- [x] Manejo de errores en webhooks

## Cierre de funcionalidades pendientes
- [x] Verificar y completar la sección visible de mensajes de bienvenida en Configuración
- [x] Crear componente WelcomeMessagesConfig con formulario, vista previa y estados de UI
- [x] Persistir producto asociado y estado activo de mensajes de bienvenida
- [x] Integrar el mensaje de bienvenida con el alta de nuevos leads
- [x] Agregar procedimiento tRPC para listar historial de WhatsApp por lead
- [x] Mostrar historial de mensajes WhatsApp en LeadDetalle
- [x] Implementar publicación real en Instagram con manejo de API y errores
- [x] Implementar publicación real en TikTok con manejo de API y errores
- [x] Añadir pruebas exitosas de las integraciones multicanal
- [x] Ejecutar pruebas, comprobación de servidor y guardar checkpoint final

## Rediseño UX/UI para plan comercial integrado
- [x] Aplicar sistema visual basado en Fitts, Gestalt y Hick en navegación y CTAs
- [x] Reorganizar navegación por Catálogo & Nichos, Leads & Embudo, Automatizaciones, Contenido y Analíticas
- [x] Añadir agrupación y filtros de catálogo por nicho para 30+ ebooks
- [x] Añadir ficha comercial de producto con HotLink, fuente, campaña y CTA principal
- [x] Añadir panel de campañas y captación con UTMs y origen de lead
- [x] Conectar mensajes de bienvenida, secuencias y recuperación de carritos a los segmentos
- [x] Añadir recomendaciones de venta cruzada por producto y categoría
- [x] Mejorar dashboard y analíticas con rendimiento por ebook, nicho, fuente y campaña
- [x] Añadir estados de feedback, accesibilidad y responsive en los módulos rediseñados
- [x] Escribir y ejecutar pruebas del rediseño comercial antes del checkpoint
- [x] Incorporar consentimiento explícito de WhatsApp en el perfil del lead antes de automatizar mensajes
- [x] Convertir recordatorios automáticos en envíos reales con variables y registro de resultado

## Correcciones de cierre UX/comercial
- [x] Definir y documentar el alcance correcto de fuente/campaña: producto vs lead/campaña
- [x] Crear panel específico de campañas y captación con UTMs y asociación verificable a leads
- [x] Implementar segmentación persistente por nicho, campaña, fuente o etiquetas y conectarla a flujos
- [x] Completar revisión de accesibilidad, responsive y estados loading/error/empty de los módulos rediseñados
- [x] Asegurar descubrimiento y ejecución explícita de las pruebas nuevas de utilidades comerciales
- [x] Adaptar el handler programado /api/scheduled/recordatorios al envío real con consentimiento, variables y resultado
