-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: gestao_vendas
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `cnpj` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cpf_cnpj` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('1991178d-89cc-41b1-92fb-e37bcef63ec9','Jose Somaila matapa','sunyldjosesomailamatapa@gmail.com','848914009','123456789','3100 nammpula North','nampula','Nampula','3100','2025-07-03 10:05:23','2025-07-03 15:26:49');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `min_stock` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('3883fbb6-54e6-44cc-9b9b-6a63d838db28','123123','Feijão','Alimento',12.99,18,1,'2025-07-07 03:03:14','2025-07-07 03:11:01'),('6a84de9c-f773-407b-9ec7-328b7f1c9e7f','B1','Mouse gamer','Eletrônico',120.00,88,10,'2025-07-03 00:51:30','2025-07-03 16:06:47'),('ac8e8e18-797a-474c-bf02-4bad4408ca9c','AL12','Arroz','Alimentação',100.00,93,10,'2025-07-03 14:50:33','2025-07-07 03:11:01');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `sale_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_method` enum('dinheiro','pix','cartao') COLLATE utf8mb4_general_ci NOT NULL,
  `seller_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_sales_product` (`product_id`),
  KEY `idx_sale_date` (`sale_date`),
  KEY `idx_sale_id` (`sale_id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `fk_sales_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sales_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('0dee4369-27b7-44e4-b19b-d636aeb6aed3','1','ac8e8e18-797a-474c-bf02-4bad4408ca9c',1,100.00,100.00,'2025-07-03 00:00:00',NULL,'dinheiro',NULL),('0ffb5399-b97d-4d49-a462-c20c1ec59cc1',NULL,'ac8e8e18-797a-474c-bf02-4bad4408ca9c',1,100.00,100.00,'2025-07-07 00:00:00',NULL,'dinheiro',NULL),('5409ed13-c8af-472f-ab0f-deb5cb297fcc',NULL,'ac8e8e18-797a-474c-bf02-4bad4408ca9c',1,100.00,100.00,'2025-07-07 00:00:00',NULL,'dinheiro',NULL),('88b033e0-be10-4636-988f-184d4a884f23',NULL,'ac8e8e18-797a-474c-bf02-4bad4408ca9c',1,100.00,100.00,'2025-07-07 00:00:00',NULL,'dinheiro',NULL),('9635e396-2c3b-40ea-96d4-c7648b454611','2','6a84de9c-f773-407b-9ec7-328b7f1c9e7f',1,120.00,120.00,'2025-07-03 00:00:00',NULL,'dinheiro',NULL),('b2dad56d-fbba-469a-a998-dc0dd5260a7b',NULL,'3883fbb6-54e6-44cc-9b9b-6a63d838db28',1,12.99,12.99,'2025-07-07 00:00:00',NULL,'dinheiro',NULL),('e7003405-5132-4ead-9eb9-8adca919eef3',NULL,'ac8e8e18-797a-474c-bf02-4bad4408ca9c',1,100.00,100.00,'2025-07-07 00:00:00',NULL,'dinheiro',NULL);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `product_id` varchar(36) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` enum('in','out') COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES ('13f508d5-87cb-401c-93d1-86d9bfe206d8','ac8e8e18-797a-474c-bf02-4bad4408ca9c','out',1,'Venda realizada','2025-07-07 03:01:06'),('1cdf8a38-8af4-4468-91ba-90a49d80145c','ac8e8e18-797a-474c-bf02-4bad4408ca9c','out',1,'Venda realizada','2025-07-03 16:03:12'),('2fd6c03d-8613-43db-8657-8883651fa6fe','ac8e8e18-797a-474c-bf02-4bad4408ca9c','out',1,'Venda realizada','2025-07-07 03:02:31'),('73b749e7-0e0d-4d22-8e26-1533dffc084c','ac8e8e18-797a-474c-bf02-4bad4408ca9c','out',1,'Venda realizada','2025-07-07 03:01:00'),('8c21cba5-0311-4631-979d-28656d9c658a','ac8e8e18-797a-474c-bf02-4bad4408ca9c','out',1,'Venda realizada','2025-07-07 03:11:01'),('d6ba5153-749c-4bcd-9d4d-3f19d44ea727','6a84de9c-f773-407b-9ec7-328b7f1c9e7f','out',1,'Venda realizada','2025-07-03 16:06:47'),('d7dca6a2-11c1-441c-a787-930014f3618e','3883fbb6-54e6-44cc-9b9b-6a63d838db28','out',1,'Venda realizada','2025-07-07 03:11:01');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(36) COLLATE utf8mb4_general_ci NOT NULL,
  `company_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `cnpj` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('6bf9b9e3-e97a-4e02-867d-615779686687','Sunyld','12345','sunyldjosesomailamatapa@gmail.com','848914009','3100 nammpula North','nampula','Nampula','Jose Somaila matapa','2025-07-03 10:30:46','2025-07-03 10:30:53'),('921f977d-a35c-471a-8788-d7faa642ef33','Sunyld','123456','sunyldjosesomailamatapa@gmail.com','848914009','3100 nammpula North','nampula','Nampula','Jose Somaila matapa','2025-07-03 05:31:31','2025-07-03 05:31:31');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','caixa') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'caixa',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23873 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (7,'Admin','admin@email.com','$2b$10$xdsi9uHVq37OqkXTfyIJLO/w0cjXLnyQA9GbfWSPgZTxOxbcpk..G','admin','2025-07-02 21:04:26'),(8,'Sunyld','sunyld@gmail.com','$2b$10$z/ogOE5GQMpXU0cd57ydNeyT/BDLVHGuizQ5yOFY8g3sRkN6MVU3G','caixa','2025-07-03 16:36:06'),(23872,'Jose','jose@email.com','$2b$10$SrYY7kPohcqiBmqNsi/Nsu9F5v3NEvgA5nUdER6SMHueN3TjJR.w.','admin','2025-07-03 16:43:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-06 23:34:43
