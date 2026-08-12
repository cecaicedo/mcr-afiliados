CREATE TABLE `campanas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`descripcion` text,
	`fuente` varchar(100) NOT NULL,
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(150),
	`productoId` int,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campanas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `campanaId` int;