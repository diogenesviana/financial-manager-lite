# Referência da API REST (API Reference)

Este documento especifica todas as rotas de API disponíveis no **Financial Manager Lite**, incluindo métodos HTTP, parâmetros esperados, formato de requisição e respostas.

> ⬅️ [Voltar para a documentação principal](../README.md#-%EF%B8%8F-documenta%C3%A7%C3%A7%C3%A3o)

---

## 🔐 Autenticação e Sessão

A aplicação utiliza autenticação baseada em **JSON Web Tokens (JWT)** armazenados em cookies seguros `HTTP-Only`.

- **Cookie de Sessão**: `token`
- **Base URL**: `http://localhost:3000/api`

---

## 📑 Sumário de Endpoints

| Categoria | Método | Endpoint | Descrição |
| :--- | :--- | :--- | :--- |
| **Autenticação** | `POST` | `/api/login` | Realiza autenticação do usuário e gera cookie JWT |
| | `POST` | `/api/logout` | Encerra a sessão limpando o cookie |
| | `GET` | `/api/auth/google` | Inicia fluxo OAuth2 do Google SSO |
| | `GET` | `/api/auth/callback` | Callback de confirmação do Google OAuth2 |
| **Despesas** | `GET`, `POST` | `/api/expenses` | Lista despesas com filtros ou lança nova despesa |
| | `PUT`, `DELETE` | `/api/expenses/[id]` | Atualiza ou remove uma despesa específica |
| | `POST` | `/api/upload` | Upload e parsing de fatura PDF via IA Gemini |
| **Integrantes** | `GET`, `POST` | `/api/people` | Lista integrantes criados ou adiciona novo |
| | `PUT`, `DELETE` | `/api/people/[id]` | Atualiza dados ou remove integrante |
| | `POST` | `/api/invites` | Aceita ou recusa convite de compartilhamento |
| **Regras** | `GET`, `POST`, `DELETE` | `/api/rules` | Gerencia regras automáticas de atribuição |
| | `GET`, `POST`, `DELETE` | `/api/category-rules` | Gerencia regras de categorização inteligente |
| **Notificações** | `GET`, `PUT` | `/api/notifications` | Lista notificações do usuário ou marca lidas |
| **Perfil & Admin** | `GET`, `PUT` | `/api/profile` | Dados do perfil do usuário e alteração de senha |
| | `GET`, `POST`, `DELETE` | `/api/users` | (Admin) Gerenciamento de usuários do sistema |
| | `GET` | `/api/admin/audit-logs` | (Admin) Consulta de logs de auditoria do sistema |
| | `GET` | `/api/admin/integration-logs` | (Admin) Logs de integrações externas (Gemini/SEFAZ) |
| **Utilitários** | `GET` | `/api/banks` | Lista bancos cadastrados no sistema |
| | `GET` | `/api/categories` | Lista categorias de despesas disponíveis |
| | `GET` | `/api/cnpj/[cnpj]` | Consulta dados cadastrais de empresa via CNPJ |
| | `DELETE` | `/api/clear-data` | Limpa dados de transações do usuário logado |

---

## 🔍 Detalhamento por Endpoint

### 1. Autenticação

#### `POST /api/login`
Autentica o usuário no sistema.

- **Body (JSON)**:
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "suasenhasegura"
  }
  ```
- **Resposta Sucesso (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "cuid...",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "USER"
    }
  }
  ```

#### `POST /api/logout`
Limpa o cookie de sessão HTTP-Only.

- **Resposta Sucesso (200 OK)**:
  ```json
  { "message": "Logout realizado com sucesso" }
  ```

---

### 2. Despesas (`/api/expenses`)

#### `GET /api/expenses`
Retorna histórico de despesas com suporte a paginação e filtros.

- **Query Parameters**:
  - `month` (opcional): Mês de referência (ex: `2026-07`)
  - `personId` (opcional): ID do integrante responsável
  - `search` (opcional): Termo para busca na descrição
  - `page` (opcional, default `1`)
  - `limit` (opcional, default `50`)

- **Resposta (200 OK)**:
  ```json
  {
    "expenses": [
      {
        "id": "clx...",
        "description": "Uber *Trip",
        "amount": 29.90,
        "date": "2026-07-15T14:30:00.000Z",
        "month": "2026-07",
        "category": "Transporte",
        "card": "Nubank",
        "isManual": false,
        "person": {
          "id": "clx_person...",
          "name": "Maria Silva"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
  ```

#### `POST /api/expenses`
Registra um novo gasto manual.

- **Body (JSON)**:
  ```json
  {
    "description": "Supermercado",
    "amount": 150.00,
    "date": "2026-07-20",
    "month": "2026-07",
    "personId": "clx_person_id",
    "category": "Alimentação",
    "card": "Itaú"
  }
  ```

#### `POST /api/upload`
Processa arquivo PDF de fatura de cartão via IA Google Gemini.

- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Arquivo `.pdf` da fatura
  - `password` (opcional): Senha do arquivo caso protegido
- **Resposta (200 OK)**:
  ```json
  {
    "success": true,
    "count": 14,
    "message": "Fatura processada e 14 despesas importadas com sucesso."
  }
  ```

---

### 3. Integrantes (`/api/people`)

#### `GET /api/people`
Retorna a lista de integrantes cadastrados para o grupo do usuário.

#### `POST /api/people`
Cria um novo integrante no grupo.

- **Body (JSON)**:
  ```json
  {
    "name": "João Santos",
    "phone": "5511999999999",
    "inviteEmail": "joao@exemplo.com"
  }
  ```

---

### 4. Regras (`/api/rules` & `/api/category-rules`)

#### `POST /api/rules`
Cria uma regra de atribuição automática por palavra-chave.

- **Body (JSON)**:
  ```json
  {
    "keyword": "uber",
    "personId": "clx_person_id"
  }
  ```

#### `POST /api/category-rules`
Cria uma regra de categorização automática.

- **Body (JSON)**:
  ```json
  {
    "keyword": "ifood",
    "category": "Alimentação"
  }
  ```

---

### 5. Notificações (`/api/notifications`)

#### `GET /api/notifications`
Lista as notificações pendentes e lidas do usuário autenticado.

#### `PUT /api/notifications`
Marca notificações específicas ou todas como lidas (`isRead: true`).

---

### 6. Admin & Auditoria (`/api/admin/*`)

#### `GET /api/admin/audit-logs`
*Requer role `ADMIN`*. Retorna histórico de operações registradas pela auditoria.

#### `GET /api/admin/integration-logs`
*Requer role `ADMIN`*. Retorna métricas de tempo de resposta, payloads e falhas de serviços externos.
