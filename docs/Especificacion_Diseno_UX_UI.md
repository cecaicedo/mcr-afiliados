# Especificación de Diseño UX/UI: MCR Caicedo Digital (Estrategia 30+ Ebooks)

## 1. Fundamentos Psicológicos y Cognitivos

El diseño de la interfaz y la experiencia de usuario (UX/UI) de **MCR Caicedo Digital** se fundamenta en tres leyes científicas de la interacción humana y seis principios rectores de arquitectura de interfaces:

### Leyes Cognitivas Aplicadas
1. **Ley de Fitts**: El tiempo necesario para alcanzar un objetivo (como el botón de "Enviar WhatsApp", "Publicar" o "Guardar") es una función de la distancia al objetivo y su tamaño. Las acciones principales y CTAs comerciales críticos se sitúan en zonas de fácil alcance visual y táctico, con áreas de interacción superiores a 48x48 píxeles.
2. **Ley de Gestalt (Principios de Proximidad y Cierre)**: Los 30+ ebooks se organizan en tarjetas agrupadas visualmente por nichos temáticos. Los bordes y contenedores de tarjetas emplean proximidad espacial para que el cerebro asocie instantáneamente el producto, su categoría y su HotLink de afiliado sin carga cognitiva innecesaria.
3. **Ley de Hick**: El tiempo de toma de decisiones aumenta con el número y la complejidad de las opciones. Para evitar la parálisis del comprador ante más de 30 ebooks, la interfaz segmenta el catálogo en filtros por categoría (Nichos) y búsqueda instantánea, reduciendo las opciones visibles a grupos manejables de 4 a 6 elementos por vista.

### Principios de Diseño
- **Estructura**: Jerarquía visual estricta mediante tipografía contrastada, tipos de contenedores y separación espacial consistente basada en múltiplos de 4px.
- **Simplicidad**: Eliminación de elementos decorativos innecesarios. Cada pantalla prioriza una única acción principal por bloque visual.
- **Visibilidad**: Los estados del sistema (leads nuevos, carritos abandonados recuperados, mensajes enviados por WhatsApp con doble check, publicaciones programadas) son visibles en todo momento mediante insignias y notificaciones en tiempo real.
- **Concepto Affordance**: Los elementos interactivos (botones, pestañas, selectores, interruptores) poseen sombras sutiles, cambios de estado al pasar el cursor (*hover*) y cursores específicos que comunican de forma intuitiva su capacidad de interacción.
- **Retroalimentación (*Feedback*)**: Cada acción del usuario genera una respuesta inmediata: indicadores de carga (*spinners*), notificaciones toast con Sonner, animaciones fluidas y confirmaciones visuales al actualizar estados o registrar conversiones.
- **Reutilización**: Componentes modulares unificados (tarjetas de métricas, tablas de leads, constructores de plantillas y modales de IA) que se reutilizan en todo el CRM para mantener la consistencia visual y reducir la fricción de aprendizaje.

---

## 2. Estructura de Navegación Orientada a la Venta de Ebooks

La barra lateral (*CRMLayout*) se organiza en secciones lógicas que acompañan el embudo comercial del afiliado:
- **Dashboard**: Vista general de comisiones estimadas, tasa de conversión y leads calientes.
- **Catálogo & Nichos**: Gestión de los 30+ ebooks clasificados por categorías y enlaces de afiliado.
- **Leads & Embudo**: Gestión de prospectos con estados de avance y historial de WhatsApp.
- **Automatizaciones**: Configuración de mensajes de bienvenida, secuencias y recuperación de carritos.
- **Plantillas & IA**: Generación de copys comerciales optimizados para conversión.
- **Publicador Multicanal**: Programación de contenido en Instagram y TikTok.
- **Analíticas**: Rendimiento de ventas por ebook y fuente de tráfico.
- **Configuración**: Credenciales de APIs (WhatsApp, Meta, TikTok) y webhooks de Hotmart.
