# 🎓 Portal Alumni - IME Júnior

Sistema centralizado para gestão e networking de egressos da instituição. O projeto permite o cadastro de perfis profissionais, visualização de ex-alunos e busca filtrada por curso e ano de formatura.

---

## 🚀 Stack Tecnológica

**Aplicação:**
- **Frontend:** React.js (Vite), CSS Puro / Modules
- **Backend:** Node.js (Express), CORS, Helmet
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Upload de Arquivos:** Cloudinary

**Infraestrutura (Produção):**
- **Servidor:** Debian Linux
- **Orquestração:** Docker & Docker Compose
- **Proxy Reverso:** Nginx
- **Segurança:** UFW (Firewall) e HTTPS (Certbot)

---

## 📂 Estrutura do Projeto

```text
portal-alumni/
├── client/              # Frontend (React)
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Telas principais
│   │   └── styles/      # Estilos (kebab-case.module.css)
├── server/              # Backend (Node.js)
│   ├── src/
│   │   ├── controllers/ # Lógica de negócio
│   │   ├── routes/      # Definição de endpoints
│   │   └── database/    # Configuração do Prisma
├── docker-compose.yml   # Formatação automática de código
└── README.md
```

---

## 📏 Guia de Padronização Técnica

Para garantir a consistência do código entre os desenvolvedores, adotamos os seguintes padrões:

| Categoria     | Item                | Padrão Adotado | Exemplo                |
| :------------ | :------------------ | :------------- | :--------------------- |
| **Código**    | Variáveis e Funções | camelCase      | const listaAlunos = [] |
| **Interface** | Componentes React   | PascalCase     | CardAlumni.jsx         |
| **Estilos**   | Arquivos CSS        | kebab-case     | main-layout.css        |
| **Banco**     | Colunas do Banco    | snake_case     | data_formatura         |
| **Git**       | Mensagens de Commit | Conventional   | feat: adicionar busca  |

---

## 🛠️ Configuração do Ambiente de Desenvolvimento

### 1. Requisitos Obrigatórios (VS Code)

Para que a padronização automática funcione, todos os desenvolvedores devem instalar:

- **Prettier - Code formatter**
- **EditorConfig for VS Code**

> **Importante:** Ative o **"Format on Save"** nas configurações do seu VS Code (`Ctrl + ,`).

### 2. Instalação e Execução Local

**Passo 1: Clonar e configurar Upstream**

```bash
# Clone o SEU fork
git clone https://github.com/fsmith01539/portal-alumni.git
cd portal-alumni

# Configure o repositório original como fonte de atualizações
git remote add upstream https://github.com/fsmith01539/portal-alumni.git
```

**Passo 2: Configurar o Frontend**

```bash
cd client
npm install
npm run dev
```

**Passo 3: Configurar o Backend**

```bash
cd ../server
npm install
# Crie seu arquivo .env baseado no .env.example antes de iniciar
```

---

### 🚀 Ambiente de Produção (Servidor)

O sistema está hospedado em um servidor Debian, utilizando **Docker** para isolamento e **Nginx** como Proxy Reverso.

- **Domínio Oficial**: https://portal.alumniime.com.br

## Segurança e CORS

O Backend possui uma whitelist estrita de CORS. A API só responderá às requisições se a origem for autorizada. Se criar um novo ambiente, adicione a URL no arquivo `server/src/server.js`.
As portas internas do Docker (`3001` e `8080`) são mapeadas apenas para `127.0.0.1`, ficando inacessíveis pela internet externa. O Nginx gerencia o tráfego nas portas 80 e 443.

**Como atualizar a Produção**

Acesse o terminal do servidor Debian e execute:

```bash
cd ~/portal-alumni
git pull origin main
docker compose up -d --build
```
---

## 👥 Equipe Desenvolvedora

Desenvolvido pela **IME Júnior** (2025/2026)

- **Gerente de Projeto & Desenvolvedor:** José Arthur Ferreira Cardoso
- **Desenvolvedor:** Thiago Domingos Ferreira da Silva
- **Desenvolvedor:** Francisco do Nascimento Miranda

---
