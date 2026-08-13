## Context

A página de perfil do usuário (`src/app/profile/page.tsx`) mantinha um visual simples e levemente ultrapassado se comparado às páginas recém-reformuladas (como o Painel de Administração e Pessoas). Além disso, a navegação em dispositivos móveis requeria ajustes para garantir alvos de toque amplos e visualização limpa em telas de smartphone.

## Goals / Non-Goals

**Goals:**
- **Mobile-First UX Core**: Projetar a interface garantindo excelente usabilidade em telas sensíveis ao toque (< 640px), expandindo suavemente para telas desktop.
- Criar um hero/header de perfil em destaque no topo da tela com foto ampla, gradiente glowing, inicial fallback, badge de papel (`ADMIN`/`USER`) e atalhos.
- Garantir alvos de toque tátil com altura mínima de 44px para campos de texto e botões de atalho.
- Manter e aprimorar todas as funcionalidades existentes (upload de avatar, máscara de telefone PT-BR, troca de tema, acesso ao painel admin, logout e limpeza de dados).
- Utilizar os tokens visuais do sistema (`var(--card)`, `var(--primary)`, glassmorphism e animações Framer Motion).

**Non-Goals:**
- Alterar as APIs existentes (`/api/profile`, `/api/auth/me`, `/api/clear-data`, `/api/logout`).
- Criar modais desnecessários para ações de uso diário (como troca de tema ou links de navegação).

## Decisions

### Decisão 1: Header de Perfil Mobile-First
**Opção Escolhida**: Banner/hero centralizado no mobile com layout adaptável que se ajusta a alinhamento horizontal em visores maiores. Avatar proeminente com botão de atalho de câmera/upload fácil de tocar.
**Razão**: Facilita a identificação imediata e a troca da foto de perfil com um único toque no celular.

### Decisão 2: Separação entre Ações Frequentes (Card Inline) e Ações Destrutivas (Modal Exclusivo)
**Opção Escolhida**:
- **Preferências do Sistema (Card Inline)**: Mantido nativamente na tela para acesso instantâneo com 1 toque (trocar tema claro/escuro, link para painel Admin e Logout).
- **Zona de Perigo (Modal Dedicado)**: Acionado via botão de gatilho seguro que abre o modal com cartões descritivos e confirmação de duplo nível.
**Razão**: Ações frequentes (como alternar tema) precisam de zero fricção e feedback imediato. Ações de perigo (limpeza de dados) exigem isolamento, contexto explicativo e proteção contra toques acidentais no smartphone.

### Decisão 3: Empilhamento Fluido em Coluna Única no Mobile (Breakpoints Responsivos)
**Opção Escolhida**: No mobile (<768px), os cards (Header, Edição de Cadastro, Configurações do Sistema e Card Gatilho da Danger Zone) empilham verticalmente de forma fluida com margens seguras. Em telas maiores (>=768px), dividem-se em um grid de duas colunas.
**Razão**: Evita compressão de texto e garante rolagem confortável com uma mão.

## Risks / Trade-offs

- [Risco] Sobrecarga visual em telas muito pequenas (ex: iPhone SE / 360px de largura).
  → **Mitigação**: Padding responsivo dinâmico (`padding: 1rem` em mobile, `2rem` em desktop) e uso de fontes escaláveis.
