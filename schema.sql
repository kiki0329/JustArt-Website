CREATE DATABASE IF NOT EXISTS `justart`;
USE `justart`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Paintings Table
CREATE TABLE IF NOT EXISTS `paintings` (
    `id` INT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `artist` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `featured` TINYINT DEFAULT 0
) ENGINE=InnoDB;

-- Cart Items Table
CREATE TABLE IF NOT EXISTS `cart_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `painting_id` INT NOT NULL,
    `qty` INT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`painting_id`) REFERENCES `paintings`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `user_painting_idx` (`user_id`, `painting_id`)
) ENGINE=InnoDB;

-- Wishlist Items Table
CREATE TABLE IF NOT EXISTS `wishlist_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `painting_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`painting_id`) REFERENCES `paintings`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `user_painting_idx` (`user_id`, `painting_id`)
) ENGINE=InnoDB;
