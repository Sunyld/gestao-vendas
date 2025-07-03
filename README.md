# gestao-vendas
Sistema de Gestão de Vendas: Aplicação completa para gerenciamento de vendas com controle de estoque, usuários, relatórios e configurações administrativas. Desenvolvido com React, Node.js, MySQL e Tailwind CSS.


* Como instalar e rodar o projeto.
* Como configurar o banco no XAMPP/MySQL Workbench.
* Como rodar backend e frontend.
* Quais dependências são usadas.
* Como as partes se conectam.

---

### ✅ README.md completo para o seu projeto de Gestão de Vendas

```markdown
# 📊 Sistema de Gestão de Vendas

Projeto completo de gestão de vendas com **React (frontend)** + **Node.js/Express (backend)** + **MySQL (XAMPP ou Workbench)**.

---

## 📁 Estrutura do Projeto

```

D:\PROJECTOS\Reactjs\project
├── backend             # API Node.js com Express e MySQL
├── src                # Aplicação React (frontend)
├── sql                # Scripts para criação de banco de dados

````

---

## 🔧 Requisitos

- [Node.js](https://nodejs.org)
- [XAMPP](https://www.apachefriends.org/) (MySQL)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) (opcional para gerenciar o banco)
- npm ou yarn

---

## ⚙️ Configuração do Banco de Dados

1. Inicie o **XAMPP** e ative o **MySQL**.
2. Abra o **phpMyAdmin** via [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
3. Crie o banco de dados:
   - Nome: `gestao_vendas`
4. Importe o script SQL:
   - Arquivo: `backend/sql/gestao_vendas.sql` ou `init.sql`

> Alternativamente, você pode usar o MySQL Workbench para importar os arquivos SQL.

---

## 🔐 Configuração de Variáveis de Ambiente (backend)

Crie um arquivo `.env` dentro da pasta `backend/` com o seguinte conteúdo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestao_vendas
````

---

## 📦 Instalação das Dependências

### Backend (Node.js)

```bash
cd backend
npm install
```

Dependências principais:

* express
* mysql2
* dotenv
* bcrypt
* cors
* jsonwebtoken

### Frontend (React + Vite + Tailwind)

```bash
cd ..
npm install
```

Dependências principais:

* react
* axios
* tailwindcss
* chart.js
* typescript

---

## ▶️ Como Rodar o Projeto

### 1. Backend

```bash
cd backend
node server.js
```

O servidor rodará em: `http://localhost:3001`

### 2. Frontend

```bash
npm run dev
```

O app estará em: `http://localhost:5173`

---

## 🔄 Como tudo se conecta

* O frontend (`src/`) envia requisições HTTP para o backend (localhost:3001).
* O backend se conecta ao MySQL (XAMPP) usando `mysql2`.
* As rotas de autenticação estão em `backend/routes/auth.js`.
* A lógica de autenticação está em `backend/controllers/authController.js`.
* O banco de dados está estruturado conforme o script SQL em `backend/sql`.

---

## 🛠️ Funcionalidades

* Login e autenticação com JWT
* Listagem de vendas, categorias, clientes, produtos
* Gráficos de vendas por categoria (`SalesChart.tsx`, `CategoryChart.tsx`)
* Cadastro de clientes, inventário, fornecedores
* Sistema modular e escalável

---

## 🧪 Testes

Você pode testar as conexões com:

```bash
node test-bcrypt.js
```

E gerar senhas criptografadas com:

```bash
node gerar-hash.js
```

## ✨ Créditos

Desenvolvido por [Sunyld José](https://github.com/Sunyld)

## 📌 Observações

* A porta do backend pode ser alterada no `.env`.
* Certifique-se de que o MySQL do XAMPP está ativo antes de iniciar o backend.

```
