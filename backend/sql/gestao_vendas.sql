-- =====================================================
-- Banco de dados: gestao_vendas (estrutura + dados sem duplicar)
-- =====================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS; SET UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS; SET FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE; SET SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE DATABASE IF NOT EXISTS `gestao_vendas` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `gestao_vendas`;

-- users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'caixa') NOT NULL DEFAULT 'caixa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36),
  type ENUM('in', 'out') NOT NULL,
  quantity INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  cnpj VARCHAR(20),
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  contact_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  model VARCHAR(100) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- repair_items
CREATE TABLE IF NOT EXISTS repair_items (
  id VARCHAR(36) PRIMARY KEY,
  vehicle_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT NULL,
  paid_value DECIMAL(10,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- sales
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_id VARCHAR(36) DEFAULT NULL,
  payment_method ENUM('dinheiro','pix','cartao') NOT NULL,
  INDEX idx_sale_date (sale_date),
  INDEX idx_sale_id (sale_id),
  INDEX idx_customer_id (customer_id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Garantias idempotentes para colunas/índices da sales
SET @c_price := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='sales' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='price');
SET @c_total := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='sales' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='total');
SET @c_saleid := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='sales' AND TABLE_SCHEMA=DATABASE() AND COLUMN_NAME='sale_id');

SET @s1 := IF(@c_price=0, "ALTER TABLE sales ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER quantity", "SELECT 1");
PREPARE st1 FROM @s1; EXECUTE st1; DEALLOCATE PREPARE st1;

SET @s2 := IF(@c_total=0, "ALTER TABLE sales ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER price", "SELECT 1");
PREPARE st2 FROM @s2; EXECUTE st2; DEALLOCATE PREPARE st2;

SET @s3 := IF(@c_saleid=0, "ALTER TABLE sales ADD COLUMN sale_id VARCHAR(36) NULL AFTER id", "SELECT 1");
PREPARE st3 FROM @s3; EXECUTE st3; DEALLOCATE PREPARE st3;

SET @idx_sale := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sales' AND INDEX_NAME='idx_sale_id');
SET @s4 := IF(@idx_sale=0, "CREATE INDEX idx_sale_id ON sales (sale_id)", "SELECT 1");
PREPARE st4 FROM @s4; EXECUTE st4; DEALLOCATE PREPARE st4;

-- Restaurar configurações
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gestao_vendas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestao_vendas;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'caixa') NOT NULL DEFAULT 'caixa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36),
  type ENUM('in', 'out') NOT NULL,
  quantity INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(36) PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  cnpj VARCHAR(20),
  email VARCHAR(150),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  contact_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de veículos dos clientes
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  model VARCHAR(100) NOT NULL,
  plate VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabela de itens de reparo por veículo
CREATE TABLE IF NOT EXISTS repair_items (
  id VARCHAR(36) PRIMARY KEY,
  vehicle_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT NULL,
  paid_value DECIMAL(10,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Tabela de vendas detalhada por item
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(36) PRIMARY KEY,
  sale_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_id VARCHAR(36) DEFAULT NULL,
  payment_method ENUM('dinheiro','pix','cartao') NOT NULL,
  INDEX idx_sale_date (sale_date),
  INDEX idx_sale_id (sale_id),
  INDEX idx_customer_id (customer_id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);



  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE

);



-- Tabela de clientes

CREATE TABLE IF NOT EXISTS customers (

  id VARCHAR(36) PRIMARY KEY,

  name VARCHAR(100) NOT NULL,

  email VARCHAR(150),

  phone VARCHAR(20),

  cpf_cnpj VARCHAR(20),

  address TEXT,

  city VARCHAR(100),

  state VARCHAR(50),

  postal_code VARCHAR(20),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);



-- Tabela de fornecedores

CREATE TABLE IF NOT EXISTS suppliers (

  id VARCHAR(36) PRIMARY KEY,

  company_name VARCHAR(100) NOT NULL,

  cnpj VARCHAR(20),

  email VARCHAR(150),

  phone VARCHAR(20),

  address TEXT,

  city VARCHAR(100),

  state VARCHAR(50),

  contact_name VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);





