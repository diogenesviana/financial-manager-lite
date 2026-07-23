# Financial Manager Lite

![Versão](https://img.shields.io/badge/version-1.4.5-blue.svg)
![Licença](https://img.shields.io/badge/license-Proprietary-red.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black.svg)
![React](https://img.shields.io/badge/React-19.2.4-61dafb.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.2.1-2D3748.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)

Uma aplicação web moderna, elegante e de nível premium construída com **Next.js 16**, **Prisma** e **PostgreSQL / SQLite** para controle de gastos pessoais e gestão compartilhada de faturas de cartão de crédito.

O sistema integra inteligência artificial via **Google Gemini API** para extração automática de compras de faturas em PDF, atribuição automatizada baseada em regras personalizáveis, gráficos interativos e suporte a compras parceladas com propagação inteligente.

---

## 📑 Sumário

- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📚 Documentação do Projeto](#-documenta%C3%A7%C3%A7%C3%A3o-do-projeto)
- [⚖️ Licença e Termos de Uso](#%EF%B8%8F-licen%C3%A7a-e-termos-de-uso)
- [✍️ Autor](#%EF%B8%8F-autor)

---

## ✨ Funcionalidades Principais

- 📂 **Importação Inteligente de PDFs**: Extração automática de transações de faturas de cartão de crédito (Nubank, Itaú, Santander, Bradesco, etc.) via Google Gemini API com resiliência por fallback de modelo (`gemini-2.5-flash` → `gemini-1.5-flash`).
- 🎨 **Estética Analytics Premium (Leetify UI)**: Interface escura refinada (`#13111a`) com destaques neon (`#ff1a77`), micro-animações fluidas com Framer Motion e suporte a alternador de tema claro/escuro.
- ⚡ **Regras de Atribuição e Categorização**: Vinculação de palavras-chave a integrantes do grupo ou categorias automáticas para preenchimento ágil durante a importação.
- 🔄 **Gestão Inteligente de Compras Parceladas**: Detecção automática de compras parceladas com geração retroativa/futura transparente sem duplicatas e atualização em lote.
- 🔔 **Notificações e Histórico Compartilhado**: Notificação em tempo real para integrantes sobre baixas e pagamentos de faturas com controle de acesso diferenciado.
- 📱 **Leitor de NFC-e via QR Code**: Leitura rápida de cupons fiscais eletrônicos diretamente pela câmera do dispositivo.

---

## 🛠️ Tech Stack

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16 (App Router)](https://nextjs.org/) | React Framework com Server Actions e App Router |
| **UI & Styling** | Vanilla CSS + [Framer Motion](https://framer.com/motion) | Tokens CSS customizados, glassmorphic design e animações fluidas |
| **Ícones** | [Lucide React](https://lucide.dev/) | Pacote de ícones vetoriais modernos |
| **Backend & ORM** | [Prisma 6](https://www.prisma.io/) | Mapeamento objeto-relacional para PostgreSQL / SQLite |
| **Banco de Dados** | PostgreSQL / SQLite | Persistência relacional com suporte a migrações declarativas |
| **Inteligência Artificial**| [Google Gemini API](https://ai.google.dev/) | Leitura e estruturação JSON de faturas em PDF |
| **Autenticação** | JOSE (JWT) + Bcrypt.js | Sessões seguras via cookies HTTP-Only e hash de senhas |
| **Testes** | [Jest](https://jestjs.io/) + ts-jest | Suíte de testes automatizados unitários e de regressão |

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js**: `v20.0.0` ou superior
- **npm**: `v10.0.0` ou superior
- Chave de API da **Google Gemini** (obtenha gratuitamente no [Google AI Studio](https://aistudio.google.com/))

### Instalação e Execução

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/diogenesviana/financial-manager-lite.git
   cd financial-manager-lite
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   Crie o arquivo `.env` na raiz baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha no `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/financial_db"
   JWT_SECRET="sua_chave_secreta_jwt_longa"
   GEMINI_API_KEY="sua_chave_gemini"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Executar migrações do banco de dados:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

*Nota: Em ambientes Windows, você também pode subir o servidor executando o script `iniciar.bat`.*

---

## 📚 Documentação do Projeto

A documentação técnica do sistema é organizada de acordo com as boas práticas do **Software Design Document (SDD)** e está localizada no diretório [`docs/`](./docs/):

- 🏗️ [**Arquitetura do Sistema (SDD)**](./docs/ARCHITECTURE.md): Visão detalhada da arquitetura Clean Architecture (Entities, Ports, Use Cases, Adapters, App Router) e diagrama de fluxo de dados.
- 📡 [**Referência da API REST**](./docs/API_REFERENCE.md): Mapeamento completo dos 18 endpoints da aplicação com parâmetros, métodos HTTP e autenticação.
- 🗄️ [**Esquema do Banco de Dados**](./docs/DATABASE.md): Diagrama Entidade-Relacionamento (ER) em Mermaid, especificação dos 11 modelos Prisma, índices e relacionamentos.
- 🎨 [**Diretrizes de UX/UI**](./docs/UX_GUIDELINES.md): Princípios de experiência do usuário, design system, paleta de cores e padrões de componentes.
- 🤝 [**Guia de Contribuição**](./docs/CONTRIBUTING.md): Instruções para desenvolvedores, convenções de código, padrões de commit, fluxo de testes e PRs.
- 📋 [**Backlog de Tarefas**](./BACKLOG.md): Tabela de melhorias e novas funcionalidades planejadas com status e priorização.
- 📝 [**Histórico de Versões**](./CHANGELOG.md): Registro de atualizações e alterações organizadas pelo padrão *Keep a Changelog*.

---

## ⚖️ Licença e Termos de Uso

Este projeto é disponibilizado para uso **estritamente pessoal e não comercial**.

1. **Uso Não Comercial**: É vedada a venda, revenda, locação, sublicenciamento ou comercialização deste software como serviço (SaaS).
2. **Atribuição**: Modificações e forks devem manter obrigatoriamente a atribuição de autoria original.
3. **Privacidade**: O processamento de dados é mantido na infraestrutura local do usuário, exceto pelo envio do texto das faturas PDF para a API do Google Gemini.
4. **Isenção de Garantia**: O software é fornecido "no estado em que se encontra" (*AS IS*), sem garantias implícitas de qualquer tipo.

---

## ✍️ Autor

Desenvolvido por **Diógenes Viana**.  
*Todos os direitos reservados © 2026.*
