-- =========================================================
-- WasteWatch Complete MySQL Schema & Initial Seed Data
-- =========================================================

CREATE DATABASE IF NOT EXISTS `wastewatch_db`;
USE `wastewatch_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin', 'cleanup_staff') NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `status` ENUM('active', 'pending_approval', 'banned') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'Trash2',
  `color` VARCHAR(20) DEFAULT '#10B981',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` INT NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('reported', 'verified', 'assigned', 'in_progress', 'cleaned', 'closed') NOT NULL DEFAULT 'reported',
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `area_district` VARCHAR(100) DEFAULT 'Downtown',
  `primary_photo` VARCHAR(500) NOT NULL,
  `cleaned_photo` VARCHAR(500) DEFAULT NULL,
  `assigned_to` INT DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  `cleaned_at` TIMESTAMP NULL DEFAULT NULL,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `views_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- 4. Report Additional Photos Table
CREATE TABLE IF NOT EXISTS `report_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `photo_url` VARCHAR(500) NOT NULL,
  `photo_type` ENUM('before', 'after', 'progress') DEFAULT 'before',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE
);

-- 5. Report Status History Logs
CREATE TABLE IF NOT EXISTS `report_status_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `changed_by_user_id` INT NOT NULL,
  `from_status` VARCHAR(50) DEFAULT NULL,
  `to_status` VARCHAR(50) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `photo_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 6. Upvotes Table
CREATE TABLE IF NOT EXISTS `upvotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_report_upvote` (`report_id`, `user_id`),
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 8. Flags Table
CREATE TABLE IF NOT EXISTS `flags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `reason` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `link_url` VARCHAR(255) DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 10. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'resolved') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SEED DATA INSERTION
-- =========================================================

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `color`) VALUES
(1, 'Household Waste', 'household-waste', 'Domestic trash, organic waste, kitchen leftovers & bags', 'Trash2', '#10B981'),
(2, 'Plastic & Packaging', 'plastic', 'Bottles, single-use bags, packaging materials, styrofoam', 'ShoppingBag', '#3B82F6'),
(3, 'Construction Debris', 'construction-waste', 'Bricks, concrete rubble, wood tiles, drywall remnants', 'HardHat', '#F59E0B'),
(4, 'Industrial Waste', 'industrial-waste', 'Chemical drums, metal scraps, rubber tires, toxic containers', 'Factory', '#EF4444'),
(5, 'Drain & Sewer Waste', 'drain-sewer', 'Clogged storm drains, overflowing sewers, grease runoff', 'Droplets', '#8B5CF6'),
(6, 'Roadside Garbage', 'roadside-garbage', 'Littered sidewalks, median dumpings, highway roadside piles', 'AlertTriangle', '#EC4899'),
(7, 'Water Pollution', 'water-pollution', 'Contaminated lakes, floating river trash, coastal canal plastics', 'Waves', '#06B6D4'),
(8, 'Other Hazardous Waste', 'other', 'Electronic waste, broken glass, batteries, medical materials', 'HelpCircle', '#6B7280')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `slug`=VALUES(`slug`), `description`=VALUES(`description`), `icon`=VALUES(`icon`), `color`=VALUES(`color`);

-- Default Administrator: Faiyaz (Password: 7799fftt)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar`, `bio`, `phone`, `status`) VALUES
(1, 'Faiyaz', 'faiyaz@gmail.com', '$2b$10$QVvwR2hXY5iKH901i72BO.LD7Hr/z4Qu/RFVVCEXa6y5Sgw/bjB3a', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'System Administrator & WasteWatch Lead Supervisor', '+1 (555) 019-9999', 'active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `email`=VALUES(`email`), `role`=VALUES(`role`), `status`=VALUES(`status`);

