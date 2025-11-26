CREATE TABLE `donations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`stripe_session_id` varchar(255) NOT NULL,
	`stripe_customer_id` varchar(255),
	`stripe_payment_intent_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `donations_id` PRIMARY KEY(`id`),
	CONSTRAINT `donations_stripe_session_id_unique` UNIQUE(`stripe_session_id`)
);
--> statement-breakpoint
CREATE INDEX `donation_user_idx` ON `donations` (`user_id`);--> statement-breakpoint
CREATE INDEX `donation_session_idx` ON `donations` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `donation_created_idx` ON `donations` (`created_at`);