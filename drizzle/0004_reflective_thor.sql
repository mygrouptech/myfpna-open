CREATE TABLE `magic_link_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magic_link_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `magic_link_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `magic_link_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `magic_link_tokens` (`token`);