-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 05-Jul-2025 às 03:51
-- Versão do servidor: 10.4.28-MariaDB
-- versão do PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `gestao_vendas`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `company`
--

CREATE TABLE `company` (
  `id` varchar(36) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `customers`
--

CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `customers`
--

INSERT INTO `customers` (`id`, `name`, `email`, `phone`, `cpf_cnpj`, `address`, `city`, `state`, `postal_code`, `created_at`, `updated_at`) VALUES
('1991178d-89cc-41b1-92fb-e37bcef63ec9', 'Jose Somaila matapa', 'sunyldjosesomailamatapa@gmail.com', '848914009', '123456789', '3100 nammpula North', 'nampula', 'Nampula', '3100', '2025-07-03 10:05:23', '2025-07-03 15:26:49');

-- --------------------------------------------------------

--
-- Estrutura da tabela `products`
--

CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `min_stock` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `products`
--

INSERT INTO `products` (`id`, `code`, `name`, `category`, `price`, `stock`, `min_stock`, `created_at`, `updated_at`) VALUES
('6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 'B1', 'Mouse gamer', 'Eletrônico', 120.00, 88, 10, '2025-07-03 00:51:30', '2025-07-03 16:06:47'),
('ac8e8e18-797a-474c-bf02-4bad4408ca9c', 'AL12', 'Arroz', 'Alimentação', 100.00, 97, 10, '2025-07-03 14:50:33', '2025-07-03 16:03:12');

-- --------------------------------------------------------

--
-- Estrutura da tabela `sales`
--

CREATE TABLE `sales` (
  `id` varchar(36) NOT NULL,
  `sale_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `sale_date` datetime NOT NULL DEFAULT current_timestamp(),
  `customer_id` varchar(36) DEFAULT NULL,
  `payment_method` enum('dinheiro','pix','cartao') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `sales`
--

INSERT INTO `sales` (`id`, `sale_id`, `product_id`, `quantity`, `price`, `total`, `sale_date`, `customer_id`, `payment_method`) VALUES
('0dee4369-27b7-44e4-b19b-d636aeb6aed3', '', 'ac8e8e18-797a-474c-bf02-4bad4408ca9c', 1, 100.00, 100.00, '2025-07-03 00:00:00', NULL, 'dinheiro'),
('9635e396-2c3b-40ea-96d4-c7648b454611', '', '6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 1, 120.00, 120.00, '2025-07-03 00:00:00', NULL, 'dinheiro');

-- --------------------------------------------------------

--
-- Estrutura da tabela `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `type` enum('in','out') NOT NULL,
  `quantity` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `product_id`, `type`, `quantity`, `description`, `created_at`) VALUES
('1cdf8a38-8af4-4468-91ba-90a49d80145c', 'ac8e8e18-797a-474c-bf02-4bad4408ca9c', 'out', 1, 'Venda realizada', '2025-07-03 16:03:12'),
('d6ba5153-749c-4bcd-9d4d-3f19d44ea727', '6a84de9c-f773-407b-9ec7-328b7f1c9e7f', 'out', 1, 'Venda realizada', '2025-07-03 16:06:47');

-- --------------------------------------------------------

--
-- Estrutura da tabela `suppliers`
--

CREATE TABLE `suppliers` (
  `id` varchar(36) NOT NULL,
  `company_name` varchar(100) NOT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `suppliers`
--

INSERT INTO `suppliers` (`id`, `company_name`, `cnpj`, `email`, `phone`, `address`, `city`, `state`, `contact_name`, `created_at`, `updated_at`) VALUES
('6bf9b9e3-e97a-4e02-867d-615779686687', 'Sunyld', '12345', 'sunyldjosesomailamatapa@gmail.com', '848914009', '3100 nammpula North', 'nampula', 'Nampula', 'Jose Somaila matapa', '2025-07-03 10:30:46', '2025-07-03 10:30:53'),
('921f977d-a35c-471a-8788-d7faa642ef33', 'Sunyld', '123456', 'sunyldjosesomailamatapa@gmail.com', '848914009', '3100 nammpula North', 'nampula', 'Nampula', 'Jose Somaila matapa', '2025-07-03 05:31:31', '2025-07-03 05:31:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','caixa') NOT NULL DEFAULT 'caixa',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(7, 'Admin', 'admin@email.com', '$2b$10$xdsi9uHVq37OqkXTfyIJLO/w0cjXLnyQA9GbfWSPgZTxOxbcpk..G', 'admin', '2025-07-02 21:04:26'),
(8, 'Sunyld', 'sunyld@gmail.com', '$2b$10$z/ogOE5GQMpXU0cd57ydNeyT/BDLVHGuizQ5yOFY8g3sRkN6MVU3G', 'caixa', '2025-07-03 16:36:06'),
(23872, 'Jose', 'jose@email.com', '$2b$10$SrYY7kPohcqiBmqNsi/Nsu9F5v3NEvgA5nUdER6SMHueN3TjJR.w.', 'admin', '2025-07-03 16:43:47');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cnpj` (`cnpj`);

--
-- Índices para tabela `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sales_product` (`product_id`),
  ADD KEY `idx_sale_date` (`sale_date`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_customer_id` (`customer_id`);

--
-- Índices para tabela `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Índices para tabela `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23873;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sales_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
