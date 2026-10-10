# DevMock — API Contract & Mocking para Front-end

> **Build your frontend without waiting for the backend.**

## 1. Visão do produto

O **DevMock** é uma ferramenta de Developer Experience (DX) para desenvolvimento de aplicações Front-end.

A ideia central é permitir que o desenvolvedor defina ou importe um **contrato de API** e, a partir desse contrato, gere automaticamente:

- Mock API local
- Dados fictícios realistas
- Cenários de resposta
- Documentação
- OpenAPI / JSON Schema
- Tipos TypeScript
- Exemplos de request/response
- Futuramente, validação da API real contra o contrato

O conceito principal é:

> **O Schema é a fonte única da verdade.**

A partir dele, todo o restante do ambiente de desenvolvimento é derivado.

---

# 2. Problema

Durante o desenvolvimento Front-end, é comum depender da implementação do Backend para:

- conhecer o formato final dos dados;
- testar estados de sucesso e erro;
- validar paginação;
- testar loading e timeout;
- testar respostas vazias;
- testar diferentes códigos HTTP;
- desenvolver telas antes da API existir;
- entender quais campos são obrigatórios;
- alinhar tipos e estruturas com o Backend.

Isso gera um fluxo de dependência:

```text
Frontend
   │
   ├── espera contrato
   │
   ├── espera backend
   │
   └── espera API
          │
          ▼
       Desenvolvimento
```

O DevMock tenta inverter esse fluxo:

```text
Frontend
   │
   ▼
Define contrato
   │
   ├── Mock API
   ├── Dados fictícios
   ├── Cenários
   ├── Documentação
   ├── OpenAPI
   └── Tipos
   │
   ▼
Desenvolvimento independente
   │
   ▼
Backend implementa contrato
   │
   ▼
Validação da API real
```

---

# 3. Público-alvo

Inicialmente:

- Desenvolvedores Front-end
- Desenvolvedores Full Stack
- Times pequenos de desenvolvimento
- Desenvolvedores que trabalham com APIs REST
- Projetos React, Vue, Angular, Svelte etc.

A primeira interface será uma **extensão para VS Code**.

---

# 4. Conceito central

O DevMock não deve ser apenas um gerador de dados ou um servidor mock.

Ele deve funcionar como uma camada entre **Front-end e Backend**.

```text
                    DEV MOCK

                 API Contract
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    Mock API      Fake Data      Documentation
        │             │             │
        ▼             ▼             ▼
    Front-end       Testes        Backend
```

O contrato pode ser criado pelo Front-end ou importado de uma especificação existente.

---

# 5. Fluxo principal

## 5.1 Instalação

O desenvolvedor instala a extensão:

```text
DevMock
API Contract & Mocking for Front-end
```

Depois abre seu projeto no VS Code.

---

## 5.2 Inicialização do projeto

Se o projeto ainda não possui configuração do DevMock, a extensão apresenta:

```text
DevMock

Este projeto ainda não possui configuração.

[ Initialize Project ]
```

Ao inicializar, é criada uma estrutura no projeto:

```text
.dev-mock/
├── config.json
├── schemas/
├── scenarios/
├── docs/
└── openapi/
```

Essa estrutura faz parte do projeto e pode ser versionada com Git.

---

# 6. Interface no VS Code

A extensão terá uma área própria no Explorer:

```text
DEV MOCK

Project
├── Schemas
│   ├── User
│   ├── Product
│   └── Order
│
├── Endpoints
│   ├── GET /users
│   ├── GET /users/:id
│   ├── POST /users
│   └── DELETE /users/:id
│
├── Scenarios
│   ├── Default
│   ├── Empty
│   ├── Unauthorized
│   └── Server Error
│
├── Documentation
│
└── Settings

Mock Server
🟢 localhost:4010
```

A extensão deve oferecer uma experiência visual simples, mas também permitir edição direta dos arquivos de configuração.

---

# 7. Criando uma API

Existem três formas principais de iniciar.

## 7.1 Criar do zero

O desenvolvedor seleciona:

```text
Create API

○ From scratch
○ Import OpenAPI
○ Detect from project
```

Ao escolher **From scratch**, cria um Schema.

Exemplo:

```text
User

id
  Type: UUID
  Required: true

name
  Type: String
  Generator: br.name

email
  Type: String
  Generator: email

cpf
  Type: String
  Generator: br.cpf

status
  Type: Enum
  Values:
    ACTIVE
    BLOCKED
    PENDING

balance
  Type: Number
  Format: BRL
```

---

# 8. Geradores de dados

O DevMock terá geradores de dados realistas.

## Globais

```text
UUID
Name
Email
Phone
Date
DateTime
Image
Number
Boolean
String
```

## Brasil

```text
CPF
CNPJ
CEP
Telefone
Celular
PIX
Banco
Agência
Conta
BRL
Nome brasileiro
Endereço brasileiro
```

Exemplo:

```text
cpf
  generator: br.cpf
```

Resultado:

```json
{
  "cpf": "123.456.789-09"
}
```

A ideia é que a camada brasileira seja um diferencial inicial do produto.

---

# 9. Geração de dados

Depois de definir o Schema:

```text
Generate Fake Data

Records: 20
Seed: 12345

[ Generate ]
```

Resultado:

```json
[
  {
    "id": "7c9c...",
    "name": "João da Silva",
    "email": "joao@example.com",
    "cpf": "123.456.789-09",
    "status": "ACTIVE",
    "balance": 1520.50
  }
]
```

O uso de **seed** permite gerar dados determinísticos.

Isso facilita testes e reprodução de cenários.

---

# 10. Geração automática da API

A partir do Schema, o DevMock pode gerar endpoints REST.

Exemplo:

```text
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

O servidor fica disponível localmente:

```text
http://localhost:4010
```

O Front-end pode então apontar sua camada de API para:

```text
http://localhost:4010
```

Sem precisar esperar o Backend.

---

# 11. Configuração dos endpoints

Cada endpoint pode possuir configurações próprias:

```text
GET /users

Status:
200

Records:
20

Delay:
300ms

Pagination:
enabled

Error rate:
0%
```

Possíveis configurações:

- Status HTTP
- Delay
- Quantidade de registros
- Paginação
- Headers
- Erros
- Latência
- Rate limit
- Cenário padrão

---

# 12. Cenários

Uma das funcionalidades mais importantes é permitir testar situações diferentes.

Exemplo:

```text
GET /users

Scenarios

✓ Default
○ Empty
○ Unauthorized
○ Forbidden
○ Server Error
○ Slow Network
○ Rate Limited
```

### Default

```http
200 OK
```

### Empty

```json
{
  "data": [],
  "total": 0
}
```

### Unauthorized

```http
401 Unauthorized
```

### Server Error

```http
500 Internal Server Error
```

### Slow Network

```text
Delay: 5000ms
```

Isso permite ao Front-end testar:

- Loading
- Empty state
- Error state
- Timeout
- Unauthorized
- Forbidden
- Retry
- Paginação
- Mensagens de erro

---

# 13. Desenvolvimento do Front-end

Com o Mock Server ativo:

```text
🟢 DevMock
http://localhost:4010
```

O desenvolvedor trabalha normalmente no Front-end.

```text
Frontend
   │
   ▼
localhost:4010
   │
   ▼
DevMock
   │
   ▼
Fake Data
```

O Backend não precisa estar pronto.

---

# 14. Log de requisições

A extensão pode mostrar as requisições realizadas pelo Front-end:

```text
REQUEST LOG

GET    /users          200    124ms
GET    /users/1        200     89ms
POST   /users          201    102ms
GET    /products       500    301ms
GET    /orders         401     90ms
```

Isso ajuda o desenvolvedor a entender o comportamento da aplicação.

---

# 15. Documentação automática

O Schema também gera documentação.

Exemplo:

```text
Users API

GET /users

Returns a list of users.

Query Parameters

page
  Type: number

limit
  Type: number

Response 200

User[]

User
  id       UUID
  name     string
  email    string
  cpf      string
  status   ACTIVE | BLOCKED | PENDING
  balance  number
```

A documentação pode ser gerada em:

- Markdown
- HTML
- OpenAPI
- JSON Schema

---

# 16. Compartilhamento com o Backend

Essa é uma das funcionalidades mais importantes do conceito.

O Front-end pode exportar o contrato:

```text
Export Contract

✓ OpenAPI JSON
✓ OpenAPI YAML
✓ JSON Schema
✓ TypeScript Types
✓ Markdown Documentation
```

O Backend recebe algo como:

```text
API Contract

GET /users
GET /users/:id
POST /users

User
├── id: UUID
├── name: string
├── email: string
├── cpf: string
├── status: ACTIVE | BLOCKED | PENDING
└── balance: number
```

Assim, o Backend sabe exatamente qual estrutura o Front-end espera.

---

# 17. Fluxo Front-end → Backend

```text
┌───────────────┐
│   Front-end   │
└───────┬───────┘
        │
        │ Define
        ▼
┌───────────────┐
│    Schema     │
└───────┬───────┘
        │
        ├───────────────┐
        ▼               ▼
┌───────────────┐  ┌───────────────┐
│   Mock API    │  │ Documentation │
└───────┬───────┘  └───────┬───────┘
        │                  │
        │                  │
        ▼                  ▼
   Desenvolvimento     Backend
                           │
                           ▼
                    Implementação API
```

---

# 18. Backend → DevMock

O fluxo também pode começar pelo Backend.

O Backend fornece:

```text
openapi.yaml
```

O Front-end importa:

```text
DevMock
   │
   ▼
Import OpenAPI
   │
   ▼
Schemas
   │
   ▼
Mock API
```

Assim, o DevMock também funciona como uma ferramenta de consumo de contratos existentes.

---

# 19. Importação de OpenAPI

O desenvolvedor pode selecionar:

```text
Import API

File:
openapi.yaml

[ Import ]
```

O DevMock transforma a especificação em:

```text
Schemas
Endpoints
Scenarios
Fake Data
Documentation
```

---

# 20. Detecção automática do projeto

Uma funcionalidade futura seria:

```text
Detect API from project
```

A extensão analisa arquivos como:

```text
src/
├── services/
├── api/
├── types/
├── models/
└── hooks/
```

Por exemplo, encontra:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}
```

E sugere:

```text
DevMock detected a User model.

Create schema from User?

[ Create Schema ]
```

Também poderia detectar chamadas:

```typescript
api.get('/users')
```

e sugerir:

```text
GET /users

Create DevMock endpoint?

[ Create ]
```

---

# 21. Contrato como fonte única

O principal conceito arquitetural do produto:

```text
                 ┌─────────────┐
                 │    Schema   │
                 └──────┬──────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
   Fake Data         Mock API      Documentation
       │                │                │
       │                │                │
       ▼                ▼                ▼
   Examples         Front-end       Backend
                        │
                        ▼
                   Real API
                        │
                        ▼
                   Validation
```

Uma alteração no Schema pode refletir nos demais artefatos.

---

# 22. Validação da API real

Uma funcionalidade futura é validar a API real contra o contrato.

Exemplo:

O Schema define:

```text
balance
  type: number
```

A API real retorna:

```json
{
  "balance": "1500.00"
}
```

O DevMock identifica:

```text
Contract mismatch

GET /users/1

Field:
balance

Expected:
number

Received:
string

Status:
⚠ Warning
```

Outro exemplo:

```text
Expected:
status = ACTIVE | BLOCKED | PENDING

Received:
status = SUSPENDED
```

Resultado:

```text
✕ Contract incompatible
```

---

# 23. Visão futura de validação

```text
Frontend Contract
       │
       ▼
    DevMock
       │
       ▼
Real API
       │
       ▼
Contract Validation
       │
       ├── ✓ Compatible
       ├── ⚠ Warning
       └── ✕ Breaking Change
```

Exemplo:

```text
API Contract Validation

32 endpoints checked

✓ 29 compatible
⚠ 2 warnings
✕ 1 breaking change
```

---

# 24. Estrutura do projeto

Uma possível estrutura:

```text
my-project/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── types/
│
├── package.json
│
└── .devmock/
    ├── config.json
    │
    ├── schemas/
    │   ├── user.json
    │   ├── product.json
    │   └── order.json
    │
    ├── scenarios/
    │   ├── user-empty.json
    │   ├── user-unauthorized.json
    │   └── server-error.json
    │
    ├── docs/
    │
    └── openapi/
        └── generated.yaml
```

O `.devmock` pode ser versionado no Git.

Isso permite que todo o time trabalhe com o mesmo contrato.

---

# 25. Fluxo completo

O fluxo ideal do produto:

```text
1. Instalar DevMock
        │
        ▼
2. Inicializar projeto
        │
        ▼
3. Criar ou importar contrato
        │
        ▼
4. Definir Schema
        │
        ▼
5. Gerar dados fictícios
        │
        ▼
6. Gerar Mock API
        │
        ▼
7. Configurar cenários
        │
        ▼
8. Iniciar Mock Server
        │
        ▼
9. Desenvolver Front-end
        │
        ▼
10. Gerar documentação
        │
        ▼
11. Exportar contrato
        │
        ▼
12. Backend implementa API
        │
        ▼
13. DevMock valida API real
```

---

# 26. Três níveis de interação

O DevMock deve atender diferentes níveis de experiência.

## Simples

Para quem quer apenas começar:

```text
Schema
   ↓
Start Mock
   ↓
API funcionando
```

Poucas configurações.

---

## Avançado

Para desenvolvedores que precisam de controle:

```text
Schemas
Endpoints
Fake Data
Scenarios
Documentation
OpenAPI
Settings
```

---

## Power User

Para usuários avançados:

```text
.devmock/
CLI
VS Code Extension
Git
CI/CD
OpenAPI
Contract Validation
```

---

# 27. CLI futura

Embora a primeira versão seja focada em VS Code, o core pode futuramente possuir CLI:

```bash
devmock init
devmock start
devmock generate
devmock export
devmock validate
```

Isso abre possibilidades de integração com:

- CI/CD
- GitHub Actions
- GitLab CI
- pipelines de testes
- automações
- outros editores

---

# 28. Arquitetura conceitual

O produto pode ser pensado em duas camadas:

```text
                  DevMock Core
                       │
          ┌────────────┴────────────┐
          │                         │
   VS Code Extension              CLI
          │                         │
          └────────────┬────────────┘
                       │
                  Mock Server
                       │
                       ▼
                   Schemas
```

A extensão não precisa conter toda a lógica do produto.

Ela funciona como uma interface sobre um **DevMock Core** reutilizável.

---

# 29. MVP conceitual

A primeira versão não precisa implementar tudo.

O MVP pode focar em:

```text
✓ VS Code Extension
✓ Initialize Project
✓ Schema
✓ Fake Data
✓ Mock REST API
✓ Basic endpoint configuration
✓ Scenarios
✓ OpenAPI export
✓ Markdown documentation
✓ TypeScript types
```

Ficam para etapas posteriores:

```text
○ Import OpenAPI
○ Detect from project
○ Request logs avançados
○ Contract validation
○ CLI
○ CI/CD
○ Team features
```

---

# 30. Evolução do produto

## Fase 1 — Mocking

```text
Schema
   ↓
Fake Data
   ↓
Mock API
```

## Fase 2 — Contract

```text
Schema
   ↓
OpenAPI
   ↓
Documentation
   ↓
Backend
```

## Fase 3 — Validation

```text
Schema
   ↓
Real API
   ↓
Contract Validation
```

## Fase 4 — Developer Platform

```text
                 DevMock
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   VS Code        CLI          CI/CD
       │            │            │
       └────────────┼────────────┘
                    ▼
             API Contract
```

---

# 31. Diferencial do produto

O DevMock não deve ser apresentado apenas como:

> “Uma ferramenta para criar APIs falsas.”

A proposta é mais ampla:

> **Uma ferramenta para criar, simular, documentar e validar contratos de API durante o desenvolvimento Front-end.**

O diferencial está no fluxo integrado:

```text
Contract
   ↓
Mock
   ↓
Develop
   ↓
Document
   ↓
Share
   ↓
Implement
   ↓
Validate
```

---

# 32. Possível posicionamento

### Nome

**DevMock**

### Descrição

> API Contract & Mocking for Front-end

### Possíveis slogans

> **Build your frontend without waiting for the backend.**

ou

> **Design the contract. Mock the API. Build before the backend.**

ou

> **Turn an API contract into a complete development environment.**

---

# 33. Princípios do produto

O DevMock deve seguir alguns princípios:

### 1. Schema First

O contrato é a fonte da verdade.

### 2. Zero Backend Dependency

O Front-end deve conseguir começar o desenvolvimento sem esperar a API.

### 3. Realistic Data

Dados fictícios devem parecer dados reais.

### 4. Reproducible

Seeds e configurações devem permitir reproduzir cenários.

### 5. Git Friendly

Configurações devem ser arquivos versionáveis.

### 6. Developer Friendly

A ferramenta deve reduzir trabalho, não adicionar burocracia.

### 7. Progressive Complexity

Começar simples e permitir configurações avançadas quando necessário.

---

# 34. Visão final

O DevMock pode evoluir de uma simples ferramenta de mocking para uma camada de **API Contract Development**.

A visão de longo prazo é:

```text
                  DEV MOCK
                     │
          ┌──────────┴──────────┐
          │                     │
      Front-end              Backend
          │                     │
          └──────────┬──────────┘
                     │
               API Contract
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
        Mock      Docs       Types
          │          │          │
          └──────────┼──────────┘
                     ▼
                Real API
                     │
                     ▼
               Validation
```

A ideia central permanece simples:

> **Defina o contrato uma vez e use-o para desenvolver, testar, documentar, compartilhar e validar a API.**
