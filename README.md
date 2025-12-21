# 🎓 Portal Alumni - IME Júnior

Sistema de gestão e networking para egressos da instituição. Este projeto visa conectar ex-alunos, permitindo o cadastro de perfis profissionais e a busca por rede de contatos.

## 🚀 Stack Tecnológica

- **Frontend:** React (Vite)
- **Backend:** Node.js (Express)
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Estilização:** CSS puro / CSS Modules (Sem Tailwind)

---

## 📂 Estrutura do Projeto

```text
portal-alumni/
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Telas principais
│   │   └── styles/      # CSS (kebab-case.css)
├── server/          # Backend Node.js
│   ├── src/
│   │   ├── controllers/ # Lógica de negócio
│   │   ├── routes/      # Definição de rotas
│   │   └── database/    # Configuração Prisma
└── README.md