CREATE TABLE `embudos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`slug` varchar(150) NOT NULL,
	`productoId` int NOT NULL,
	`tipo` enum('registro','whatsapp','venta') NOT NULL DEFAULT 'registro',
	`tituloHero` varchar(300) NOT NULL,
	`subtituloHero` text,
	`imagenHeroUrl` text,
	`ctaTexto` varchar(100) NOT NULL DEFAULT 'Obtener Acceso Inmediato',
	`colorTema` varchar(50) NOT NULL DEFAULT 'emerald',
	`activo` boolean NOT NULL DEFAULT true,
	`visitasCount` int NOT NULL DEFAULT 0,
	`conversionesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `embudos_id` PRIMARY KEY(`id`),
	CONSTRAINT `embudos_slug_unique` UNIQUE(`slug`)
);
