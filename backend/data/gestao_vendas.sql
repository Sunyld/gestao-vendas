-- =====================================================
-- Banco de dados: gestao_vendas (com dados antigos)
-- =====================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Criar schema
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `gestao_vendas` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `gestao_vendas`;

-- -----------------------------------------------------
-- Tabela company
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `company` (
  `id` VARCHAR(36) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT current_timestamp() ON UPDATE current_timestamp,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Tabela customers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `cpf_cnpj` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT NULL,
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `cpf_cnpj`, `address`, `city`, `state`, `postal_code`, `created_at`, `updated_at`) VALUES
('1991178d-89cc-41b1-92fb-e37bcef63ec9', 'Jose Somaila matapa', 'sunyldjosesomailamatapa@gmail.com', '848914009', '123456789', '3100 nammpula North', 'nampula', 'Nampula', '3100', '2025-07-03 10:05:23', '2025-07-03 15:26:49');

-- -----------------------------------------------------
-- Tabela products
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INT(11) DEFAULT 0,
  `min_stock` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `products` (`id`, `code`, `name`, `category`, `price`, `stock`, `min_stock`, `created_at`, `updated_at`) VALUES
('6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 'B1', 'Mouse gamer', 'Eletrônico', 120.00, 88, 10, '2025-07-03 00:51:30', '2025-07-03 16:06:47'),
('ac8e8e18-797a-474c-bf02-4bad4408ca9c', 'AL12', 'Arroz', 'Alimentação', 100.00, 97, 10, '2025-07-03 14:50:33', '2025-07-03 16:03:12');

-- -----------------------------------------------------
-- Tabela sales
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` VARCHAR(36) NOT NULL,
  `sale_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `quantity` INT(11) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `sale_date` DATETIME NOT NULL DEFAULT current_timestamp(),
  `customer_id` VARCHAR(36) DEFAULT NULL,
  `payment_method` ENUM('dinheiro','pix','cartao') NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_sales_product` (`product_id`),
  INDEX `idx_sale_date` (`sale_date`),
  INDEX `idx_sale_id` (`sale_id`),
  INDEX `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `sales` (`id`, `sale_id`, `product_id`, `quantity`, `price`, `total`, `sale_date`, `customer_id`, `payment_method`) VALUES
('0dee4369-27b7-44e4-b19b-d636aeb6aed3', '', 'ac8e8e18-797a-474c-bf02-4bad4408ca9c', 1, 100.00, 100.00, '2025-07-03 00:00:00', NULL, 'dinheiro'),
('9635e396-2c3b-40ea-96d4-c7648b454611', '', '6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 1, 120.00, 120.00, '2025-07-03 00:00:00', NULL, 'dinheiro');

-- -----------------------------------------------------
-- Tabela stock_movements
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) DEFAULT NULL,
  `type` ENUM('in','out') NOT NULL,
  `quantity` INT(11) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  INDEX `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `stock_movements` (`id`, `product_id`, `type`, `quantity`, `description`, `created_at`) VALUES
('1cdf8a38-8af4-4468-91ba-90a49d80145c', 'ac8e8e18-797a-474c-bf02-4bad4408ca9c', 'out', 1, 'Venda realizada', '2025-07-03 16:03:12'),
('d6ba5153-749c-4bcd-9d4d-3f19d44ea727', '6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 'out', 1, 'Venda realizada', '2025-07-03 16:06:47');

-- -----------------------------------------------------
-- Tabela suppliers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(36) NOT NULL,
  `company_name` VARCHAR(100) NOT NULL,
  `cnpj` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT NULL,
  `contact_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `suppliers` (`id`, `company_name`, `cnpj`, `email`, `phone`, `address`, `city`, `state`, `contact_name`, `created_at`, `updated_at`) VALUES
('6bf9b9e3-e97a-4e02-867d-615779686687', 'Sunyld', '12345', 'sunyldjosesomailamatapa@gmail.com', '848914009', '3100 nammpula North', 'nampula', 'Nampula', 'Jose Somaila matapa', '2025-07-03 10:30:46', '2025-07-03 10:30:53'),
('921f977d-a35c-471a-8788-d7faa642ef33', 'Sunyld', '123456', 'sunyldjosesomailamatapa@gmail.com', '848914009', '3100 nammpula North', 'nampula', 'Nampula', 'Jose Somaila matapa', '2025-07-03 05:31:31', '2025-07-03 05:31:31');

-- -----------------------------------------------------
-- Tabela users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','caixa') NOT NULL DEFAULT 'caixa',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23873 DEFAULT CHARSET=utf8mb4;

-- Dados antigos
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(7, 'Admin', 'admin@email.com', '$2b$10$xdsi9uHVq37OqkXTfyIJLO/w0cjXLnyQA9GbfWSPgZTxOxbcpk..G', 'admin', '2025-07-02 21:04:26'),
(8, 'Sunyld', 'sunyld@gmail.com', '$2b$10$z/ogOE5GQMpXU0cd57ydNeyT/BDLVHGuizQ5yOFY8g3sRkN6MVU3G', 'caixa', '2025-07-03 16:36:06'),
(23872, 'Jose', 'jose@email.com', '$2b$10$SrYY7kPohcqiBmqNsi/Nsu9F5v3NEvgA5nUdER6SMHueN3TjJR.w.', 'admin', '2025-07-03 16:43:47');

-- -----------------------------------------------------
-- Tabelas novas: vehicles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(36) NOT NULL,
  `customer_id` VARCHAR(36) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `plate` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp,
  PRIMARY KEY (`id`),
  INDEX `customer_id` (`customer_id`),
  CONSTRAINT `vehicles_ibfk_1`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Tabelas novas: repair_items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `repair_items` (
  `id` VARCHAR(36) NOT NULL,
  `vehicle_id` VARCHAR(36) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `cost` DECIMAL(10,2) NOT NULL,
  `paid` TINYINT(1) DEFAULT 0,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `paid_value` DECIMAL(10,2) DEFAULT NULL,
  `change_value` DECIMAL(10,2) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
