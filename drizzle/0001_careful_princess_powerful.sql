CREATE TABLE `etiquetas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#6366f1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `etiquetas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flujos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`descripcion` text,
	`trigger` enum('nuevo_lead','estado_contactado','estado_interesado','estado_compro','estado_perdido','carrito_abandonado','post_venta','manual') NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flujos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interacciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`tipo` enum('mensaje_enviado','mensaje_recibido','nota','cambio_estado','webhook') NOT NULL DEFAULT 'nota',
	`contenido` text NOT NULL,
	`estadoMensaje` enum('pendiente','enviado','entregado','leido','fallido'),
	`plantillaId` int,
	`metadatos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interacciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`email` varchar(320),
	`telefono` varchar(30),
	`estado` enum('nuevo','contactado','interesado','compro','perdido') NOT NULL DEFAULT 'nuevo',
	`fuente` varchar(100),
	`campana` varchar(100),
	`productoInteresId` int,
	`etiquetasIds` json DEFAULT ('[]'),
	`notas` text,
	`ultimaInteraccion` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pasos_flujo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flujoId` int NOT NULL,
	`orden` int NOT NULL DEFAULT 1,
	`plantillaId` int NOT NULL,
	`delayHoras` int NOT NULL DEFAULT 0,
	`condicion` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pasos_flujo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plantillas_mensajes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`contenido` text NOT NULL,
	`variables` json DEFAULT ('[]'),
	`categoria` enum('bienvenida','seguimiento','carrito_abandonado','post_venta','recordatorio','general') NOT NULL DEFAULT 'general',
	`generadaPorIA` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plantillas_mensajes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`descripcion` text,
	`enlaceAfiliado` text NOT NULL,
	`precio` float NOT NULL DEFAULT 0,
	`categoria` varchar(100),
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recordatorios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`reglaId` int NOT NULL,
	`plantillaId` int NOT NULL,
	`fechaEjecucion` timestamp NOT NULL,
	`ejecutado` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recordatorios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reglas_seguimiento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`diasInactividad` int NOT NULL DEFAULT 3,
	`estadosAplicables` json DEFAULT ('["nuevo","contactado","interesado"]'),
	`plantillaId` int NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reglas_seguimiento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks_hotmart` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evento` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`procesado` boolean NOT NULL DEFAULT false,
	`leadId` int,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhooks_hotmart_id` PRIMARY KEY(`id`)
);
