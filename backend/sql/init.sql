-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS gestao_vendas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestao_vendas;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
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


