CREATE TABLE `mensajes_bienvenida` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productoId` int NOT NULL,
	`contenido` text NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mensajes_bienvenida_id` PRIMARY KEY(`id`)
);
