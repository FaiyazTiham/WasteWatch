-- WasteWatch Initial Seed Data
USE `wastewatch_db`;

-- Insert Default Categories
INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `color`) VALUES
(1, 'Household Waste', 'household-waste', 'Domestic trash, organic waste, kitchen leftovers & bags', 'Trash2', '#10B981'),
(2, 'Plastic & Packaging', 'plastic', 'Bottles, single-use bags, packaging materials, styrofoam', 'ShoppingBag', '#3B82F6'),
(3, 'Construction Debris', 'construction-waste', 'Bricks, concrete rubble, wood tiles, drywall remnants', 'HardHat', '#F59E0B'),
(4, 'Industrial Waste', 'industrial-waste', 'Chemical drums, metal scraps, rubber tires, toxic containers', 'Factory', '#EF4444'),
(5, 'Drain & Sewer Waste', 'drain-sewer', 'Clogged storm drains, overflowing sewers, grease runoff', 'Droplets', '#8B5CF6'),
(6, 'Roadside Garbage', 'roadside-garbage', 'Littered sidewalks, median dumpings, highway roadside piles', 'AlertTriangle', '#EC4899'),
(7, 'Water Pollution', 'water-pollution', 'Contaminated lakes, floating river trash, coastal canal plastics', 'Waves', '#06B6D4'),
(8, 'Other Hazardous Waste', 'other', 'Electronic waste, broken glass, batteries, medical materials', 'HelpCircle', '#6B7280');

-- Insert Demo Users
-- Passwords: citizen -> password123, admin -> admin123, staff -> staff123
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `avatar`, `bio`, `phone`, `status`) VALUES
(1, 'Sarah Jenkins', 'citizen@wastewatch.org', '$2b$10$w09uV1nfg14eQ3pXvQ/z.e5XkXnCg1W7m5/2x1M5H7b9A9bX8Y5kG', 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 'Eco-conscious citizen passionate about zero-waste neighborhoods.', '+1 (555) 234-5678', 'active'),
(2, 'Marcus Vance', 'admin@wastewatch.org', '$2b$10$3p4B28A/Wf/w1l.0U9/eVeX3vM7Cg1W7m5/2x1M5H7b9A9bX8Y5kG', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Chief Municipal Sanitation Supervisor.', '+1 (555) 876-5432', 'active'),
(3, 'Alex Rivera', 'staff@wastewatch.org', '$2b$10$1r2C34D/Ef/g5h.6I7/jKeX3vM7Cg1W7m5/2x1M5H7b9A9bX8Y5kG', 'cleanup_staff', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 'Senior Rapid Response Sanitation Officer.', '+1 (555) 432-1098', 'active');
