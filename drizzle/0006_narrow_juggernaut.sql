ALTER TABLE `productos` ADD `imagenUrl` text;--> statement-breakpoint
ALTER TABLE `productos` ADD `rating` float DEFAULT 9.5;--> statement-breakpoint
ALTER TABLE `productos` ADD `comentariosCount` int DEFAULT 120;