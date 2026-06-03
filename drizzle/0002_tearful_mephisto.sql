CREATE TABLE `api_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plataforma` enum('whatsapp','instagram','tiktok') NOT NULL,
	`tokenAcceso` text NOT NULL,
	`numeroTelefono` varchar(20),
	`idCuenta` varchar(200),
	`nombreCuenta` varchar(200),
	`activo` boolean NOT NULL DEFAULT true,
	`ultimaVerificacion` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mensajes_whatsapp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`contenido` text NOT NULL,
	`estado` enum('pendiente','enviado','entregado','leido','error') NOT NULL DEFAULT 'pendiente',
	`idMensajeWhatsapp` varchar(200),
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`enviadoEn` timestamp,
	CONSTRAINT `mensajes_whatsapp_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publicaciones_redes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plataforma` enum('instagram','tiktok') NOT NULL,
	`contenido` text NOT NULL,
	`imagenes` json DEFAULT ('[]'),
	`videos` json DEFAULT ('[]'),
	`hashtags` json DEFAULT ('[]'),
	`estado` enum('borrador','programada','publicada','error') NOT NULL DEFAULT 'borrador',
	`idPublicacion` varchar(200),
	`fechaPublicacion` timestamp,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publicaciones_redes_id` PRIMARY KEY(`id`)
);
