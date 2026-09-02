-- =========================================================================
-- WasteWatch Complete MySQL Schema & Cloud Seeding Query
-- Suitable for Cloud Databases (Aiven, PlanetScale, Railway, TiDB, AWS RDS, etc.)
-- =========================================================================

-- Disable foreign key constraints and strict auto-increment behavior during import
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ---------------------------------------------------------
-- 1. Table Schemas (DDL)
-- ---------------------------------------------------------

-- Users Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'Trash2',
  `color` VARCHAR(20) DEFAULT '#10B981',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Additional Photos Table
CREATE TABLE IF NOT EXISTS `report_photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `photo_url` VARCHAR(500) NOT NULL,
  `photo_type` ENUM('before', 'after', 'progress') DEFAULT 'before',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Status History Logs Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upvotes Table
CREATE TABLE IF NOT EXISTS `upvotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_report_upvote` (`report_id`, `user_id`),
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments Table
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flags Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'resolved') DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------
-- 2. Seed Data (Existing Local Database Records)
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- Data for table `categories` (8 records)
-- ---------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `color`, `is_active`, `created_at`) VALUES
  (1, 'Household Waste', 'household-waste', 'Domestic trash, organic waste, kitchen leftovers & bags', 'Trash2', '#10B981', 1, '2026-09-02 10:38:28'),
  (2, 'Plastic & Packaging', 'plastic', 'Bottles, single-use bags, packaging materials, styrofoam', 'ShoppingBag', '#3B82F6', 1, '2026-09-02 10:38:28'),
  (3, 'Construction Debris', 'construction-waste', 'Bricks, concrete rubble, wood tiles, drywall remnants', 'HardHat', '#F59E0B', 1, '2026-09-02 10:38:28'),
  (4, 'Industrial Waste', 'industrial-waste', 'Chemical drums, metal scraps, rubber tires, toxic containers', 'Factory', '#EF4444', 1, '2026-09-02 10:38:28'),
  (5, 'Drain & Sewer Waste', 'drain-sewer', 'Clogged storm drains, overflowing sewers, grease runoff', 'Droplets', '#8B5CF6', 1, '2026-09-02 10:38:28'),
  (6, 'Roadside Garbage', 'roadside-garbage', 'Littered sidewalks, median dumpings, highway roadside piles', 'AlertTriangle', '#EC4899', 1, '2026-09-02 10:38:28'),
  (7, 'Water Pollution', 'water-pollution', 'Contaminated lakes, floating river trash, coastal canal plastics', 'Waves', '#06B6D4', 1, '2026-09-02 10:38:28'),
  (8, 'Other Hazardous Waste', 'other', 'Electronic waste, broken glass, batteries, medical materials', 'HelpCircle', '#6B7280', 1, '2026-09-02 10:38:28')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `slug`=VALUES(`slug`), `description`=VALUES(`description`), `icon`=VALUES(`icon`), `color`=VALUES(`color`);

-- ---------------------------------------------------------
-- Data for table `users` (7 records)
-- ---------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar`, `bio`, `phone`, `status`, `created_at`, `updated_at`) VALUES
  (1, 'Faiyaz', 'faiyaz@gmail.com', '$2b$10$7mkhcWZlKLMxaEe1QRKkveCseIAywHNfGvSdd9FS1CuU9k/oPsO5S', 'admin', '/uploads/waste-1788366942251-271923026.jpg', 'System Administrator & WasteWatch Lead Supervisor', '+1 (555) 019-9999', 'active', '2026-09-02 16:33:52', '2026-09-02 16:35:42'),
  (2, 'Ridia', 'ffcallbackfriend1@gmail.com', '$2b$10$yNGrfoR11itIPP90Wlzc0e/5UWMu6YUeVmGUFutiWWHgjmOBH3xx6', 'user', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ridia', NULL, NULL, 'active', '2026-09-02 16:39:16', '2026-09-02 16:39:16'),
  (3, 'Rifat', 'ffcallbackfriend2@gmail.com', '$2b$10$/eL9485huw3.5L/Z3bL25./Y.rv0a.nx5PYUhIoz4Q3hzoAUW4sFe', 'cleanup_staff', 'https://api.dicebear.com/7.x/bottts/svg?seed=Rifat', NULL, NULL, 'active', '2026-09-02 16:43:20', '2026-09-02 16:55:16'),
  (4, 'Ra3', 'ffcallbackfriend3@gmail.com', '$2b$10$d4l1QwTPi29iAgZKBTSZKOMCT.QVeGLU45mUQ0ZvzW4IjDbrR05DO', 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ra3', NULL, NULL, 'active', '2026-09-02 16:45:38', '2026-09-02 16:45:47'),
  (5, 'Dur E Fishan', 'bounerd@gmail.com', '$2b$10$4MXWzNNkY0JaVrZKzyo/YuUXl6Y5tVaEjGdODKOc6OIHj8MxO91We', 'user', 'https://api.dicebear.com/7.x/bottts/svg?seed=Dur%20E%20Fishan', NULL, NULL, 'active', '2026-09-02 17:00:23', '2026-09-02 17:00:23'),
  (6, 'Sunny', 'ffcallbackfriend4@gmail.com', '$2b$10$g8PlnqbRdrOD5q.tr2Q2cOzMgS4vfpyKRnVjfRMDSv9Quf/X611bS', 'user', 'https://api.dicebear.com/7.x/bottts/svg?seed=Sunny', NULL, NULL, 'active', '2026-09-02 17:02:09', '2026-09-02 17:02:09'),
  (7, 'Faiyo', 'kunerd@gmail.com', '$2b$10$SnB1p1iauCk13MBUIn8bGOZKXIoHqxcjdz8x7HXo2mTud1ccBp65W', 'cleanup_staff', 'https://api.dicebear.com/7.x/bottts/svg?seed=Faiyo', NULL, NULL, 'active', '2026-09-02 17:02:47', '2026-09-02 17:05:42')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `email`=VALUES(`email`), `password_hash`=VALUES(`password_hash`), `role`=VALUES(`role`), `avatar`=VALUES(`avatar`), `bio`=VALUES(`bio`), `phone`=VALUES(`phone`), `status`=VALUES(`status`);

-- ---------------------------------------------------------
-- Data for table `reports` (6 records)
-- ---------------------------------------------------------
INSERT INTO `reports` (`id`, `user_id`, `title`, `description`, `category_id`, `severity`, `status`, `latitude`, `longitude`, `address`, `area_district`, `primary_photo`, `cleaned_photo`, `assigned_to`, `verified_at`, `cleaned_at`, `closed_at`, `views_count`, `created_at`, `updated_at`) VALUES
  (2, 2, 'Plastic Waste', 'Roadside wastage are causing dailylife problem & bad smell.', 2, 'low', 'reported', 22.87079640, 91.09429147, 'Noakhali, Noakhali Sadar Upazila, Noakhali District, Chattogram Division, Bangladesh', 'Noakhali', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80', NULL, NULL, NULL, NULL, NULL, 8, '2026-09-02 16:51:36', '2026-09-02 16:52:52'),
  (3, 2, 'Filth', 'Filths are causing daily life problem', 2, 'low', 'verified', 22.87083575, 91.09412655, 'Noakhali, Noakhali Sadar Upazila, Noakhali District, Chattogram Division, Bangladesh', 'Noakhali', '/uploads/waste-1788368031084-965003408.png', NULL, NULL, '2026-09-02 17:11:25', NULL, NULL, 8, '2026-09-02 16:53:52', '2026-09-02 17:11:25'),
  (4, 2, 'Drainage Problem', 'Drain water overflowing towards main street.', 5, 'high', 'assigned', 22.87080305, 91.09597288, 'Noakhali, Noakhali Sadar Upazila, Noakhali District, Chattogram Division, Bangladesh', 'Noakhali', '/uploads/waste-1788368287730-228631042.jpg', NULL, 7, NULL, NULL, NULL, 6, '2026-09-02 16:58:09', '2026-09-02 17:08:41'),
  (5, 5, 'Garbage', 'Odor', 2, 'medium', 'assigned', 22.83884499, 91.18652358, 'R148, Kabirhat, Noakhali Sadar Upazila, Noakhali District, Chattogram Division, Bangladesh', 'Noakhali Sadar Upazila', '/uploads/waste-1788368455777-145462621.jpg', NULL, 7, NULL, NULL, NULL, 4, '2026-09-02 17:00:56', '2026-09-02 17:06:00'),
  (6, 5, 'Garbage', 'Odor', 2, 'medium', 'reported', 23.82984325, 90.24627687, 'Singair Subdistrict, Manikganj District, Dhaka Division, 1347, Bangladesh', 'Singair Subdistrict', '/uploads/waste-1788368505557-100738648.jpg', NULL, NULL, NULL, NULL, NULL, 8, '2026-09-02 17:01:45', '2026-09-02 17:10:27'),
  (7, 7, 'Garbage', 'Potential hazard', 2, 'high', 'cleaned', 24.73394233, 89.53857447, 'Dhunat Upazila, Bogura District, Rajshahi Division, Bangladesh', 'Dhunat Upazila', '/uploads/waste-1788368618239-18976238.jpg', '/uploads/waste-1788369280867-151135231.jpg', 3, '2026-09-02 17:04:43', '2026-09-02 17:12:56', NULL, 14, '2026-09-02 17:03:38', '2026-09-02 17:18:31')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- ---------------------------------------------------------
-- Data for table `report_status_logs` (18 records)
-- ---------------------------------------------------------
INSERT INTO `report_status_logs` (`id`, `report_id`, `changed_by_user_id`, `from_status`, `to_status`, `notes`, `photo_url`, `created_at`) VALUES
  (1, 1, 2, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 16:42:41'),
  (2, 1, 1, 'reported', 'in_progress', 'Status updated to in_progress', NULL, '2026-09-02 16:44:51'),
  (3, 1, 4, 'in_progress', 'assigned', 'Status updated to assigned', NULL, '2026-09-02 16:46:39'),
  (4, 2, 2, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 16:51:36'),
  (5, 3, 2, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 16:53:52'),
  (6, 4, 2, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 16:58:09'),
  (7, 5, 5, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 17:00:56'),
  (8, 6, 5, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 17:01:45'),
  (9, 4, 1, 'reported', 'reported', 'Status updated to reported', NULL, '2026-09-02 17:03:36'),
  (10, 7, 7, NULL, 'reported', 'Citizen complaint submitted.', NULL, '2026-09-02 17:03:38'),
  (11, 4, 1, 'reported', 'in_progress', 'Status updated to in_progress', NULL, '2026-09-02 17:03:41'),
  (12, 7, 1, 'reported', 'verified', 'Status updated to verified', NULL, '2026-09-02 17:04:43'),
  (13, 7, 1, 'verified', 'verified', 'Status updated to verified', NULL, '2026-09-02 17:05:01'),
  (14, 5, 1, 'reported', 'assigned', 'Status updated to assigned', NULL, '2026-09-02 17:06:00'),
  (15, 4, 1, 'in_progress', 'assigned', 'Status updated to assigned', NULL, '2026-09-02 17:08:41'),
  (16, 3, 1, 'reported', 'verified', 'Status updated to verified', NULL, '2026-09-02 17:11:25'),
  (17, 7, 3, 'verified', 'cleaned', 'Status updated to cleaned', '/uploads/waste-1788369168423-93658691.jpg', '2026-09-02 17:12:56'),
  (18, 7, 3, 'cleaned', 'cleaned', 'Status updated to cleaned', '/uploads/waste-1788369280867-151135231.jpg', '2026-09-02 17:14:41')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- ---------------------------------------------------------
-- Data for table `notifications` (27 records)
-- ---------------------------------------------------------
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `link_url`, `is_read`, `created_at`) VALUES
  (1, 2, 'Report Submitted! 📋', 'Your complaint \"Drainage Problem...\" has been logged for municipal review.', 'status_change', '/reports/1', 0, '2026-09-02 16:42:42'),
  (2, 1, 'New Access Approval Request 🛡️', 'Rifat (ffcallbackfriend2@gmail.com) has registered as Cleanup Staff and is waiting for your approval.', 'approval_request', '/admin/users', 1, '2026-09-02 16:43:20'),
  (3, 3, 'Account Approved! 🎉', 'Your requested cleanup_staff account has been approved by the administrator.', 'approval', '/profile', 0, '2026-09-02 16:44:24'),
  (4, 3, 'New Cleanup Assignment 🧹', 'You have been assigned to handle report #1: \"Drainage Problem...\".', 'assignment', '/reports/1', 0, '2026-09-02 16:44:51'),
  (5, 2, 'Status Update: IN_PROGRESS', 'Your report \"Drainage Problem...\" moved to status: in_progress.', 'status_change', '/reports/1', 0, '2026-09-02 16:44:51'),
  (6, 1, 'New Access Approval Request 🛡️', 'Ra3 (ffcallbackfriend3@gmail.com) has registered as Administrator and is waiting for your approval.', 'approval_request', '/admin/users', 1, '2026-09-02 16:45:38'),
  (7, 4, 'Account Approved! 🎉', 'Your requested admin account has been approved by the administrator.', 'approval', '/profile', 0, '2026-09-02 16:45:47'),
  (8, 2, 'Status Update: ASSIGNED', 'Your report \"Drainage Problem...\" moved to status: assigned.', 'status_change', '/reports/1', 0, '2026-09-02 16:46:39'),
  (9, 2, 'Report Submitted! 📋', 'Your complaint \"Plastic Waste...\" has been logged for municipal review.', 'status_change', '/reports/2', 0, '2026-09-02 16:51:36'),
  (10, 2, 'Report Submitted! 📋', 'Your complaint \"Filth...\" has been logged for municipal review.', 'status_change', '/reports/3', 0, '2026-09-02 16:53:52'),
  (11, 2, 'Report Submitted! 📋', 'Your complaint \"Drainage Problem...\" has been logged for municipal review.', 'status_change', '/reports/4', 0, '2026-09-02 16:58:09'),
  (12, 5, 'Report Submitted! 📋', 'Your complaint \"Garbage...\" has been logged for municipal review.', 'status_change', '/reports/5', 0, '2026-09-02 17:00:56'),
  (13, 5, 'Report Submitted! 📋', 'Your complaint \"Garbage...\" has been logged for municipal review.', 'status_change', '/reports/6', 0, '2026-09-02 17:01:45'),
  (14, 3, 'New Cleanup Assignment 🧹', 'You have been assigned to handle report #4: \"Drainage Problem...\".', 'assignment', '/reports/4', 0, '2026-09-02 17:03:36'),
  (15, 2, 'Status Update: REPORTED', 'Your report \"Drainage Problem...\" moved to status: reported.', 'status_change', '/reports/4', 0, '2026-09-02 17:03:36'),
  (16, 7, 'Report Submitted! 📋', 'Your complaint \"Garbage...\" has been logged for municipal review.', 'status_change', '/reports/7', 0, '2026-09-02 17:03:38'),
  (17, 2, 'Status Update: IN_PROGRESS', 'Your report \"Drainage Problem...\" moved to status: in_progress.', 'status_change', '/reports/4', 0, '2026-09-02 17:03:41'),
  (18, 7, 'Status Update: VERIFIED', 'Your report \"Garbage...\" moved to status: verified.', 'status_change', '/reports/7', 0, '2026-09-02 17:04:43'),
  (19, 3, 'New Cleanup Assignment 🧹', 'You have been assigned to handle report #7: \"Garbage...\".', 'assignment', '/reports/7', 0, '2026-09-02 17:05:01'),
  (20, 7, 'Status Update: VERIFIED', 'Your report \"Garbage...\" moved to status: verified.', 'status_change', '/reports/7', 0, '2026-09-02 17:05:01'),
  (21, 7, 'New Cleanup Assignment 🧹', 'You have been assigned to handle report #5: \"Garbage...\".', 'assignment', '/reports/5', 0, '2026-09-02 17:06:00'),
  (22, 5, 'Status Update: ASSIGNED', 'Your report \"Garbage...\" moved to status: assigned.', 'status_change', '/reports/5', 0, '2026-09-02 17:06:00'),
  (23, 7, 'New Cleanup Assignment 🧹', 'You have been assigned to handle report #4: \"Drainage Problem...\".', 'assignment', '/reports/4', 0, '2026-09-02 17:08:41'),
  (24, 2, 'Status Update: ASSIGNED', 'Your report \"Drainage Problem...\" moved to status: assigned.', 'status_change', '/reports/4', 0, '2026-09-02 17:08:41'),
  (25, 2, 'Status Update: VERIFIED', 'Your report \"Filth...\" moved to status: verified.', 'status_change', '/reports/3', 0, '2026-09-02 17:11:25'),
  (26, 7, 'Status Update: CLEANED', 'Your report \"Garbage...\" moved to status: cleaned.', 'status_change', '/reports/7', 0, '2026-09-02 17:12:56'),
  (27, 7, 'Status Update: CLEANED', 'Your report \"Garbage...\" moved to status: cleaned.', 'status_change', '/reports/7', 0, '2026-09-02 17:14:41')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- ---------------------------------------------------------
-- Re-enable foreign key constraints
-- ---------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- Finished Cloud Seeding Script
-- =========================================================
