# 📡 Documentação de Integração MikroTik
## VPS1 Backend ↔ VPS2 MikroTik API

### 🏗️ **Arquitetura Geral**

```
Frontend React (VPS1) → Backend Node.js (VPS1) → MikroTik API (VPS2) → RouterOS
                           ↓
                      Supabase Database
```

---

## 🔧 **Componentes da Integração**

### **1. Backend VPS1 (mikropix-backend-vps1)**

#### **Estrutura de Arquivos:**
```
src/
├── server.js                 # Servidor principal
├── routes/
│   └── mikrotik.js           # Rotas da API MikroTik
├── controllers/
│   └── mikrotikController.js # Lógica de integração
├── middleware/
│   └── auth.js              # Autenticação Supabase
└── config/
    └── database.js          # Configuração Supabase
```

#### **Variáveis de Ambiente:**
```env
MIKROTIK_API_URL=http://api.mikropix.online  # URL da API MikroTik na VPS2
MIKROTIK_API_TOKEN=                          # Token opcional para autenticação
SUPABASE_URL=                                # URL do Supabase
SUPABASE_SERVICE_ROLE_KEY=                   # Chave de serviço do Supabase
```

---

## 🔐 **Fluxo de Autenticação**

### **1. Autenticação do Usuário:**
```javascript
// middleware/auth.js
const authenticateUser = async (req, res, next) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    req.user = user; // Usuário disponível em todas as rotas
};
```

### **2. Validação de Credenciais MikroTik:**
```javascript
// controllers/mikrotikController.js
const getMikrotikCredentials = async (mikrotikId, userId) => {
    const { data: mikrotik } = await supabase
        .from('mikrotiks')
        .select('*')
        .eq('id', mikrotikId)
        .eq('user_id', userId)  // Garante que o usuário é dono do MikroTik
        .single();

    return {
        ip: mikrotik.ip_address,
        username: mikrotik.usuario,
        password: mikrotik.senha,
        port: mikrotik.porta || 8728
    };
};
```

---

## 🌐 **Comunicação com VPS2**

### **Função Principal de Requisição:**
```javascript
const makeApiRequest = async (endpoint, credentials, method = 'GET', data = null) => {
    const url = `${MIKROTIK_API_URL}${endpoint}`;
    const params = {
        ip: credentials.ip,
        username: credentials.username,
        password: credentials.password,
        port: credentials.port
    };

    const config = {
        method,
        url,
        params,
        timeout: 15000,
        headers: {
            'Authorization': `Bearer ${process.env.MIKROTIK_API_TOKEN}`, // Opcional
            'Content-Type': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
    }

    const response = await axios(config);
    return response.data;
};
```

### **Estrutura da URL de Requisição:**
```
GET http://api.mikropix.online/hotspot/users?ip=10.8.0.3&username=admin&password=260520&port=8728
```

---

## 📋 **Endpoints Disponíveis**

### **🔥 Hotspot Management**

#### **Usuários:**
```javascript
// Listar usuários
GET /api/mikrotik/hotspot/users/:mikrotikId
→ GET {VPS2}/hotspot/users?ip=X&username=Y&password=Z&port=8728

// Criar usuário
POST /api/mikrotik/hotspot/users/:mikrotikId
→ POST {VPS2}/hotspot/users?ip=X&username=Y&password=Z&port=8728

// Atualizar usuário
PUT /api/mikrotik/hotspot/users/:mikrotikId/:userId
→ PUT {VPS2}/hotspot/users?ip=X&username=Y&password=Z&port=8728&id=userId

// Deletar usuário
DELETE /api/mikrotik/hotspot/users/:mikrotikId/:userId
→ DELETE {VPS2}/hotspot/users?ip=X&username=Y&password=Z&port=8728&id=userId
```

#### **Perfis/Planos:**
```javascript
// Listar perfis
GET /api/mikrotik/hotspot/profiles/:mikrotikId
→ GET {VPS2}/hotspot/profiles?ip=X&username=Y&password=Z&port=8728

// Criar perfil
POST /api/mikrotik/hotspot/profiles/:mikrotikId
→ POST {VPS2}/hotspot/profiles?ip=X&username=Y&password=Z&port=8728

// Atualizar perfil
PUT /api/mikrotik/hotspot/profiles/:mikrotikId/:profileId
→ PUT {VPS2}/hotspot/profiles?ip=X&username=Y&password=Z&port=8728&id=profileId
```

#### **Usuários Ativos:**
```javascript
// Listar usuários ativos
GET /api/mikrotik/hotspot/active-users/:mikrotikId
→ GET {VPS2}/hotspot/active-users?ip=X&username=Y&password=Z&port=8728

// Desconectar usuário
POST /api/mikrotik/hotspot/disconnect/:mikrotikId/:userId
→ POST {VPS2}/hotspot/disconnect?ip=X&username=Y&password=Z&port=8728&id=userId
```

### **⚙️ System Management**

```javascript
// Estatísticas do sistema
GET /api/mikrotik/stats/:mikrotikId
→ Combina múltiplas chamadas:
  - GET {VPS2}/hotspot/stats
  - GET {VPS2}/system/info
  - GET {VPS2}/system/resource

// Informações do sistema
GET /api/mikrotik/system/info/:mikrotikId
→ GET {VPS2}/system/info?ip=X&username=Y&password=Z&port=8728

// Recursos do sistema
GET /api/mikrotik/system/resource/:mikrotikId
→ GET {VPS2}/system/resource?ip=X&username=Y&password=Z&port=8728

// Reiniciar sistema
POST /api/mikrotik/system/restart/:mikrotikId
→ POST {VPS2}/system/reboot?ip=X&username=Y&password=Z&port=8728
```

---

## 🔄 **Fluxo de Dados Completo**

### **Exemplo: Listar Usuários Hotspot**

```javascript
// 1. Frontend faz requisição
fetch('/api/mikrotik/hotspot/users/46c46d86-3e5e-4ea4-80db-428556421287', {
    headers: { 'Authorization': 'Bearer eyJ...' }
});

// 2. Backend autentica usuário
const user = await supabase.auth.getUser(token);

// 3. Backend busca credenciais do MikroTik
const credentials = await getMikrotikCredentials(mikrotikId, user.id);
// Retorna: { ip: '10.8.0.3', username: 'admin', password: '260520', port: 8728 }

// 4. Backend faz requisição para VPS2
const response = await axios.get('http://api.mikropix.online/hotspot/users', {
    params: {
        ip: '10.8.0.3',
        username: 'admin',
        password: '260520',
        port: 8728
    }
});

// 5. VPS2 conecta no MikroTik e retorna dados
// 6. Backend retorna dados para o frontend
```

---

## 🗄️ **Integração com Banco de Dados**

### **Tabela `mikrotiks`:**
```sql
CREATE TABLE mikrotiks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    nome VARCHAR(255),
    ip_address VARCHAR(15),
    usuario VARCHAR(100),
    senha VARCHAR(255),
    porta INTEGER DEFAULT 8728,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Sincronização de Planos:**
```javascript
// Buscar planos do banco para enriquecer perfis do MikroTik
const { data: dbPlans } = await supabase
    .from('planos')
    .select('*')
    .eq('mikrotik_id', mikrotikId);

// Combinar dados MikroTik + Banco
const enhancedProfiles = mikrotikProfiles.map(profile => ({
    ...profile,
    valor: matchingPlan?.valor || 0,
    inDatabase: !!matchingPlan,
    supabaseId: matchingPlan?.id
}));
```

---

## 🛡️ **Segurança**

### **1. Autenticação em Camadas:**
- ✅ **Frontend → Backend:** Token JWT do Supabase
- ✅ **Backend → VPS2:** Token opcional da API MikroTik
- ✅ **VPS2 → MikroTik:** Credenciais RouterOS (username/password)

### **2. Validação de Propriedade:**
```javascript
// Garante que o usuário só acessa seus próprios MikroTiks
.eq('user_id', req.user.id)
```

### **3. Timeout e Tratamento de Erros:**
```javascript
const config = {
    timeout: 15000,  // 15 segundos
    // Tratamento de erros de conexão, autenticação e API
};
```

---

## 🚀 **Exemplo de Implementação Frontend**

### **Função Toggle User (Corrigida):**
```javascript
const handleToggleUser = async (user) => {
    const mikrotikParams = getMikrotikParams(); // Obtém dados dinâmicos
    const url = new URL(`${baseUrl}/api/mikrotik/hotspot/users`);
    
    // Parâmetros são enviados via query string para VPS2
    url.searchParams.append('ip', mikrotikParams.ip);
    url.searchParams.append('username', mikrotikParams.username);
    url.searchParams.append('password', mikrotikParams.password);
    url.searchParams.append('port', mikrotikParams.port);
    url.searchParams.append('id', user['.id']);

    const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
            name: user.name,
            password: user.password,
            profile: user.profile,
            disabled: !user.disabled
        })
    });
};
```

---

## 🔍 **Monitoramento e Logs**

### **Logs Detalhados:**
```javascript
console.log('[AUTH] User authenticated:', user.id);
console.log('[MIKROTIK] Making request to:', url);
console.log('[MIKROTIK] Credentials for:', credentials.ip);
console.error('[ERROR] API Request failed:', error.message);
```

### **Estrutura de Resposta Padrão:**
```json
{
    "success": true,
    "data": { /* dados do MikroTik */ },
    "count": 10,
    "timestamp": "2025-06-27T01:34:54.161Z"
}
```

---

## ⚡ **Performance e Otimizações**

### **1. Requisições Paralelas:**
```javascript
const [hotspotStats, systemInfo, systemResource] = await Promise.all([
    makeApiRequest('/hotspot/stats', credentials),
    makeApiRequest('/system/info', credentials),
    makeApiRequest('/system/resource', credentials)
]);
```

### **2. Cache de Credenciais:**
- Credenciais são buscadas uma vez por requisição
- Reutilizadas em múltiplas chamadas para VPS2

### **3. Timeout Configurável:**
- 15 segundos para evitar travamentos
- Tratamento gracioso de timeouts

---

## 🐛 **Troubleshooting**

### **Problemas Comuns:**

1. **Erro 500 - "Cannot read properties of undefined"**
   - ✅ **Causa:** URL incorreta ou parâmetros em falta
   - ✅ **Solução:** Usar query parameters em vez de path parameters

2. **Erro 401 - "Authentication required"**
   - ✅ **Causa:** Token Supabase inválido ou expirado
   - ✅ **Solução:** Renovar sessão no frontend

3. **Erro 404 - "MikroTik não encontrado"**
   - ✅ **Causa:** MikroTik não pertence ao usuário
   - ✅ **Solução:** Verificar propriedade na tabela `mikrotiks`

4. **Timeout de Conexão**
   - ✅ **Causa:** MikroTik offline ou credenciais incorretas
   - ✅ **Solução:** Verificar conectividade e credenciais

---

## 📈 **Métricas e Monitoramento**

### **Endpoints de Health Check:**
```javascript
// VPS1
GET /health
→ Status do backend principal

// VPS2 (via VPS1)
GET /api/mikrotik/stats/:mikrotikId
→ Status da conexão com MikroTik
```

### **Logs Estruturados:**
- Todas as requisições são logadas com timestamp
- Erros incluem stack trace em desenvolvimento
- Autenticação é auditada com ID do usuário

---

## 🔧 **Configuração de Desenvolvimento**

### **1. Variáveis de Ambiente:**
```env
NODE_ENV=development
PORT=3000
MIKROTIK_API_URL=http://localhost:8080  # Para desenvolvimento local
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

### **2. CORS Configuration:**
```javascript
app.use(cors({
    origin: [
        'http://localhost:5173',    # Vite dev server
        'https://mikropix.online'   # Produção
    ],
    credentials: true
}));
```

---

## 📝 **Resumo da Arquitetura**

```
Frontend (React) 
    ↓ Bearer Token
Backend VPS1 (Node.js + Express)
    ↓ HTTP Request + MikroTik Credentials
VPS2 MikroTik API
    ↓ RouterOS API
MikroTik RouterOS
```

**Vantagens desta Arquitetura:**
- ✅ **Segurança:** Credenciais nunca expostas no frontend
- ✅ **Escalabilidade:** Um backend pode gerenciar múltiplos MikroTiks
- ✅ **Flexibilidade:** Fácil adição de novos endpoints
- ✅ **Auditoria:** Todos os acessos são logados e autenticados

---

## 🔗 **URLs de Exemplo**

### **Produção:**
- **Frontend:** https://mikropix.online
- **Backend VPS1:** https://api.mikropix.online
- **MikroTik API VPS2:** http://api.mikropix.online (porta diferente)

### **Desenvolvimento:**
- **Frontend:** http://localhost:5173
- **Backend VPS1:** http://localhost:3000
- **MikroTik API VPS2:** http://localhost:8080

---

## 🎯 **Conclusão**

Esta arquitetura permite uma separação clara de responsabilidades:

1. **VPS1:** Gerencia autenticação, autorização e lógica de negócio
2. **VPS2:** Foca exclusivamente na comunicação com RouterOS
3. **Supabase:** Armazena dados de usuários, MikroTiks e planos
4. **Frontend:** Interface limpa sem exposição de credenciais

O resultado é um sistema seguro, escalável e de fácil manutenção. 