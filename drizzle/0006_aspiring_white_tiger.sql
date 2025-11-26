CREATE TABLE `ai_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`feature` varchar(50) NOT NULL,
	`model` varchar(50),
	`tokens_used` int,
	`cost_cents` int,
	`success` boolean NOT NULL DEFAULT true,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anomalies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`actual_id` int NOT NULL,
	`anomaly_type` varchar(50) NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`description` text NOT NULL,
	`confidence` int NOT NULL,
	`metadata` text,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`status` enum('new','reviewed','false_positive','confirmed') NOT NULL DEFAULT 'new',
	CONSTRAINT `anomalies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`export_type` varchar(50) NOT NULL,
	`report_type` varchar(50) NOT NULL,
	`entity_id` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`file_url` varchar(512),
	`file_size` int,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completed_at` timestamp,
	CONSTRAINT `export_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int,
	`feature_key` varchar(100) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_commentaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int NOT NULL,
	`report_type` varchar(50) NOT NULL,
	`entity_id` int,
	`executive_summary` text NOT NULL,
	`key_insights` text NOT NULL,
	`recommendations` text NOT NULL,
	`risk_factors` text,
	`opportunities` text,
	`model` varchar(50) NOT NULL,
	`confidence` int NOT NULL,
	`status` enum('draft','reviewed','approved','published') NOT NULL DEFAULT 'draft',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_commentaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_usage_user_idx` ON `ai_usage` (`user_id`);--> statement-breakpoint
CREATE INDEX `ai_usage_org_idx` ON `ai_usage` (`organization_id`);--> statement-breakpoint
CREATE INDEX `ai_usage_feature_idx` ON `ai_usage` (`feature`);--> statement-breakpoint
CREATE INDEX `ai_usage_created_idx` ON `ai_usage` (`created_at`);--> statement-breakpoint
CREATE INDEX `anomalies_org_idx` ON `anomalies` (`organization_id`);--> statement-breakpoint
CREATE INDEX `anomalies_actual_idx` ON `anomalies` (`actual_id`);--> statement-breakpoint
CREATE INDEX `anomalies_status_idx` ON `anomalies` (`status`);--> statement-breakpoint
CREATE INDEX `anomalies_severity_idx` ON `anomalies` (`severity`);--> statement-breakpoint
CREATE INDEX `export_jobs_user_idx` ON `export_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `export_jobs_org_idx` ON `export_jobs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `export_jobs_status_idx` ON `export_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `feature_flags_org_idx` ON `feature_flags` (`organization_id`);--> statement-breakpoint
CREATE INDEX `feature_flags_user_idx` ON `feature_flags` (`user_id`);--> statement-breakpoint
CREATE INDEX `feature_flags_key_idx` ON `feature_flags` (`feature_key`);--> statement-breakpoint
CREATE INDEX `feature_flags_unique` ON `feature_flags` (`organization_id`,`user_id`,`feature_key`);--> statement-breakpoint
CREATE INDEX `commentaries_org_idx` ON `saved_commentaries` (`organization_id`);--> statement-breakpoint
CREATE INDEX `commentaries_user_idx` ON `saved_commentaries` (`user_id`);--> statement-breakpoint
CREATE INDEX `commentaries_type_idx` ON `saved_commentaries` (`report_type`);--> statement-breakpoint
CREATE INDEX `commentaries_status_idx` ON `saved_commentaries` (`status`);