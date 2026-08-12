CREATE TABLE `plantillas_sociales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`plataforma` enum('instagram','tiktok','facebook','youtube') NOT NULL,
	`palabraClave` varchar(100) NOT NULL,
	`mensajeRespuesta` text NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plantillas_sociales_id` PRIMARY KEY(`id`)
);
