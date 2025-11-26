-- Migration: Add Premium Features Support
-- Date: 2025-11-25
-- Description: Adds tables and columns for feature flags, AI usage tracking, and anomaly detection

-- ============================================================================
-- Feature Flags Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `feature_flags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `user_id` INT NULL,
  `feature_key` VARCHAR(100) NOT NULL,
  `enabled` BOOLEAN DEFAULT FALSE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `feature_flags_org_idx` (`organization_id`),
  INDEX `feature_flags_user_idx` (`user_id`),
  INDEX `feature_flags_key_idx` (`feature_key`),
  UNIQUE KEY `feature_flags_unique` (`organization_id`, `user_id`, `feature_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI Usage Tracking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ai_usage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `feature` VARCHAR(50) NOT NULL COMMENT 'ai_forecast, ai_commentary, ai_anomaly_detection',
  `model` VARCHAR(50) NULL COMMENT 'gpt-4, claude, manus-forge',
  `tokens_used` INT NULL,
  `cost_cents` INT NULL COMMENT 'Cost in cents',
  `success` BOOLEAN DEFAULT TRUE NOT NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `ai_usage_user_idx` (`user_id`),
  INDEX `ai_usage_org_idx` (`organization_id`),
  INDEX `ai_usage_feature_idx` (`feature`),
  INDEX `ai_usage_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Anomalies Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `anomalies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `actual_id` INT NOT NULL,
  `anomaly_type` VARCHAR(50) NOT NULL COMMENT 'outlier, trend_break, unusual_pattern, budget_overrun',
  `severity` ENUM('low', 'medium', 'high') NOT NULL,
  `description` TEXT NOT NULL,
  `confidence` INT NOT NULL COMMENT '0-100 percentage',
  `metadata` TEXT NULL COMMENT 'JSON metadata',
  `detected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` TIMESTAMP NULL,
  `status` ENUM('new', 'reviewed', 'false_positive', 'confirmed') DEFAULT 'new' NOT NULL,
  INDEX `anomalies_org_idx` (`organization_id`),
  INDEX `anomalies_actual_idx` (`actual_id`),
  INDEX `anomalies_status_idx` (`status`),
  INDEX `anomalies_severity_idx` (`severity`),
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`actual_id`) REFERENCES `actuals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Update Users Table for Premium Features
-- ============================================================================
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `is_donor` BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS `donor_tier` VARCHAR(50) NULL COMMENT 'basic, supporter, patron',
ADD COLUMN IF NOT EXISTS `donor_since` TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS `ai_forecast_limit` INT DEFAULT 10 NOT NULL COMMENT 'Monthly limit for AI forecasts',
ADD COLUMN IF NOT EXISTS `ai_forecast_used` INT DEFAULT 0 NOT NULL COMMENT 'AI forecasts used this month',
ADD COLUMN IF NOT EXISTS `ai_forecast_reset_at` TIMESTAMP NULL COMMENT 'When the usage counter resets',
ADD COLUMN IF NOT EXISTS `ai_commentary_limit` INT DEFAULT 5 NOT NULL COMMENT 'Monthly limit for AI commentary',
ADD COLUMN IF NOT EXISTS `ai_commentary_used` INT DEFAULT 0 NOT NULL COMMENT 'AI commentary used this month';

-- ============================================================================
-- Saved Commentaries Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `saved_commentaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `report_type` VARCHAR(50) NOT NULL COMMENT 'variance, forecast, kpi',
  `entity_id` INT NULL COMMENT 'Related scenario or forecast ID',
  `executive_summary` TEXT NOT NULL,
  `key_insights` TEXT NOT NULL COMMENT 'JSON array',
  `recommendations` TEXT NOT NULL COMMENT 'JSON array',
  `risk_factors` TEXT NULL COMMENT 'JSON array',
  `opportunities` TEXT NULL COMMENT 'JSON array',
  `model` VARCHAR(50) NOT NULL,
  `confidence` INT NOT NULL,
  `status` ENUM('draft', 'reviewed', 'approved', 'published') DEFAULT 'draft' NOT NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `commentaries_org_idx` (`organization_id`),
  INDEX `commentaries_user_idx` (`user_id`),
  INDEX `commentaries_type_idx` (`report_type`),
  INDEX `commentaries_status_idx` (`status`),
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Export Jobs Table (for async PDF/Excel generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `export_jobs` (
  `id` VARCHAR(255) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `organization_id` INT NOT NULL,
  `export_type` VARCHAR(50) NOT NULL COMMENT 'csv, excel, pdf',
  `report_type` VARCHAR(50) NOT NULL COMMENT 'budget, actuals, variance, forecast',
  `entity_id` INT NULL COMMENT 'Related scenario or forecast ID',
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  `progress` INT DEFAULT 0 NOT NULL COMMENT '0-100 percentage',
  `file_url` VARCHAR(512) NULL COMMENT 'S3 URL or local path',
  `file_size` INT NULL COMMENT 'File size in bytes',
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `completed_at` TIMESTAMP NULL,
  INDEX `export_jobs_user_idx` (`user_id`),
  INDEX `export_jobs_org_idx` (`organization_id`),
  INDEX `export_jobs_status_idx` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Update Organizations Table for Premium Features
-- ============================================================================
ALTER TABLE `organizations`
ADD COLUMN IF NOT EXISTS `license_type` ENUM('open', 'premium') DEFAULT 'open' NOT NULL,
ADD COLUMN IF NOT EXISTS `ai_features_enabled` BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS `export_features_enabled` BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS `max_users` INT DEFAULT 5 NOT NULL,
ADD COLUMN IF NOT EXISTS `storage_limit_mb` INT DEFAULT 1000 NOT NULL;
