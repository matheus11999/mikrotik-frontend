# MikroPix - Dashboard de Vendas Pix

Sistema de dashboard para gerenciar vendas feitas via Pix em hotspots (captive portals) usando MikroTik.

## 🚀 Tecnologias

- **Frontend**: Vite + React + TypeScript
- **UI**: Aceternity UI + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Estado**: TanStack Query + Context API
- **Formulários**: React Hook Form + Zod
- **Routing**: React Router Dom

## ⚙️ Configuração

### 1. Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm ou yarn
- Conta no Supabase

### 2. Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd mikropix

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### 3. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Vá para o SQL Editor e execute o script `supabase_schema.sql`
3. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Executar o projeto

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/           # Componentes base (Button, Card, Input, etc.)
│   ├── layout/       # Layout components (Navbar, Sidebar)
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── supabase.ts   # Cliente Supabase
│   └── utils.ts      # Utilitários
├── pages/
│   ├── auth/         # Login e Register
│   └── dashboard/    # Dashboard principal
├── types/
│   └── index.ts      # Tipos TypeScript
└── App.tsx
```

## 👤 Roles e Permissões

### Admin
- Visualizar todas as vendas e usuários
- Gerenciar mikrotiks de todos os usuários
- Aprovar/rejeitar saques
- Ver relatórios completos
- Acesso ao histórico de MACs

### User
- Visualizar apenas seus dados
- Gerenciar seus próprios mikrotiks
- Solicitar saques (mínimo R$ 50)
- Ver histórico de vendas e transações
- Visualizar MACs dos seus mikrotiks

## 🗄️ Schema do Banco

O banco utiliza as seguintes tabelas principais:

- `users` - Perfis de usuário (extends auth.users)
- `mikrotiks` - Configurações dos roteadores
- `vendas` - Histórico de vendas com snapshot dos planos
- `transacoes` - Movimentação financeira (créditos/débitos)
- `macs` - Tracking de MACs com estatísticas
- `saques` - Solicitações de saque

## 🔐 Segurança

- **Row Level Security (RLS)** ativo em todas as tabelas
- Usuários só acessam seus próprios dados
- Admins têm acesso completo
- Autenticação via Supabase Auth

## 📱 Features Implementadas

### ✅ Concluídas
- ✅ Configuração do projeto (Vite + React + TS)
- ✅ Integração com Supabase
- ✅ Sistema de autenticação
- ✅ Estrutura de componentes UI
- ✅ Dashboard básico com estatísticas
- ✅ Schema completo do banco de dados
- ✅ RLS policies configuradas
- ✅ Layout responsivo

### 🚧 Em Desenvolvimento
- Gestão de Mikrotiks
- Histórico de Vendas
- Sistema de Saques
- Tracking de MACs
- Relatórios e Exportação

## 🌐 Deploy

### Easypanel

1. Configure as variáveis de ambiente no painel
2. Use o mesmo `.env` do desenvolvimento
3. Build automático via GitHub Actions (configurar)

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 🔧 Scripts de Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Lint
npm run lint

# Type check
npm run type-check
```

## 📋 TODO

- [ ] Implementar CRUD de Mikrotiks
- [ ] Página de vendas com filtros
- [ ] Sistema completo de saques
- [ ] Tracking de MACs com API
- [ ] Relatórios exportáveis (CSV)
- [ ] Simulador de vendas para testes
- [ ] Documentação das APIs dos scripts MD
- [ ] Testes unitários

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.