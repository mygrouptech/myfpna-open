CREATE TABLE `actuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_code` varchar(50),
	`category` varchar(100),
	`period` timestamp NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(100),
	`imported_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actuals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`organization_id` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`entity_type` varchar(100),
	`entity_id` int,
	`details` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `background_jobs` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`job_type` varchar(100) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`result_url` varchar(512),
	`error_message` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `background_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenario_id` int NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_code` varchar(50),
	`category` varchar(100),
	`sub_category` varchar(100),
	`period` timestamp NOT NULL,
	`amount` int NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`scenario_id` int,
	`name` varchar(255) NOT NULL,
	`forecast_type` enum('revenue','expense','cash_flow','comprehensive') NOT NULL,
	`period` timestamp NOT NULL,
	`predicted_amount` int NOT NULL,
	`confidence` int,
	`methodology` varchar(100),
	`ai_insights` text,
	`created_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`stripe_customer_id` varchar(255),
	`subscription_status` enum('trial','active','cancelled','past_due') DEFAULT 'trial',
	`subscription_tier` enum('free','professional','enterprise') DEFAULT 'free',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`created_by` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`report_type` varchar(100) NOT NULL,
	`configuration` text NOT NULL,
	`is_public` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`scenario_type` enum('budget','forecast','actual','what_if') NOT NULL DEFAULT 'budget',
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('draft','active','archived','approved') NOT NULL DEFAULT 'draft',
	`created_by` int NOT NULL,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','analyst','viewer') NOT NULL DEFAULT 'analyst';--> statement-breakpoint
ALTER TABLE `users` ADD `organization_id` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `actuals_org_idx` ON `actuals` (`organization_id`);--> statement-breakpoint
CREATE INDEX `actuals_period_idx` ON `actuals` (`period`);--> statement-breakpoint
CREATE INDEX `actuals_account_idx` ON `actuals` (`account_name`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_org_idx` ON `audit_logs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `job_user_idx` ON `background_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_status_idx` ON `background_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `budget_scenario_idx` ON `budget_line_items` (`scenario_id`);--> statement-breakpoint
CREATE INDEX `budget_period_idx` ON `budget_line_items` (`period`);--> statement-breakpoint
CREATE INDEX `budget_account_idx` ON `budget_line_items` (`account_name`);--> statement-breakpoint
CREATE INDEX `forecast_org_idx` ON `forecasts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `forecast_scenario_idx` ON `forecasts` (`scenario_id`);--> statement-breakpoint
CREATE INDEX `report_org_idx` ON `saved_reports` (`organization_id`);--> statement-breakpoint
CREATE INDEX `report_creator_idx` ON `saved_reports` (`created_by`);--> statement-breakpoint
CREATE INDEX `scenario_org_idx` ON `scenarios` (`organization_id`);--> statement-breakpoint
CREATE INDEX `scenario_status_idx` ON `scenarios` (`status`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `users` (`organization_id`);