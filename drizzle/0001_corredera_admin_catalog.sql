-- =============================================================================
-- Migration: 0001_corredera_admin_catalog.sql
-- Purpose: Non-destructive creation of `orders`, `catalog_products`, and `admin_audit_logs`
-- Safety: Uses CREATE TABLE IF NOT EXISTS. Does not drop or alter existing user rows.
-- Rollback Procedure (Manual, only if needed before production data is stored):
--   DROP TABLE IF EXISTS `admin_audit_logs`;
--   DROP TABLE IF EXISTS `catalog_products`;
--   DROP TABLE IF EXISTS `orders`;
-- =============================================================================

CREATE TABLE IF NOT EXISTS `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(32) NOT NULL,
	`status` enum('pending_whatsapp_confirmation','confirmed_by_store','in_preparation','ready_for_pickup','completed','cancelled') NOT NULL DEFAULT 'pending_whatsapp_confirmation',
	`modality` enum('pickup','reservation','event') NOT NULL,
	`customerName` varchar(128),
	`desiredTime` varchar(128),
	`notes` text,
	`itemsCount` int NOT NULL,
	`itemsJson` text NOT NULL,
	`estimatedTotal` varchar(32) NOT NULL,
	`hasVariableItems` int NOT NULL DEFAULT 0,
	`whatsappMessage` text NOT NULL,
	`clientIpHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderCode_unique` UNIQUE(`orderCode`)
);

CREATE TABLE IF NOT EXISTS `catalog_products` (
	`id` varchar(64) NOT NULL,
	`mode` enum('bakery','gourmet') NOT NULL,
	`category` varchar(64) NOT NULL,
	`name` varchar(180) NOT NULL,
	`nameEn` varchar(180) NOT NULL,
	`desc` text NOT NULL,
	`descEn` text NOT NULL,
	`price` varchar(64) NOT NULL,
	`badge` varchar(80),
	`badgeEn` varchar(80),
	`icon` enum('coffee','cake','bag','ham','cheese','wine','sandwich') NOT NULL DEFAULT 'coffee',
	`imageUrl` varchar(512) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_products_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorOpenId` varchar(64) NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetProductId` varchar(64),
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
