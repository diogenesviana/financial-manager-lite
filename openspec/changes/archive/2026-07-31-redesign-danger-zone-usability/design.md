## Context

Anteriormente, o componente `DangerZone.tsx` exibia ações sensíveis diretamente no corpo das páginas. Para evitar poluição visual e proteger contra acionamentos não intencionais, a Zona de Perigo agora funcionará através de um **Card de Gatilho + Modal Interativo Dedicado**.

## Goals / Non-Goals

**Goals:**
- Criar um **Card Gatilho da Zona de Perigo** na página contendo aviso de atenção, contagem/ícone de proteção e botão chamativo ("Gerenciar Zona de Perigo").
- Implementar o modal com o componente reutilizável `Modal` do projeto:
  - Cabeçalho de alerta em vermelho/danger com ícone `ShieldAlert`.
  - Corpo rolável com suporte a múltiplos cartões descritivos (`DangerZoneItem`).
  - Botão de fechar modal rápido.
- Cada `DangerZoneItem` dentro do modal terá:
  - **Título claro** (ex: "Desatribuir Gastos").
  - **Descrição inline explicativa** das consequências.
  - **Badge de Nível de Impacto** (`Moderado`, `Alto`, `Crítico`).
  - **Botão de Ação Destrutiva** com confirmação de segundo nível (`ConfirmModal`).
- Design Mobile-First completo com área de toque mínima de 44px e visualização limpa em telas de smartphone.

**Non-Goals:**
- Alterar as APIs existentes `/api/clear-data` ou `/api/admin/wipe`.

## Decisions

### Decisão 1: Abordagem Modal vs. Accordion na Tela
**Opção Escolhida**: Usar um **Modal dedicado**.
**Razão**: Aumenta dramaticamente a segurança (o usuário precisa intencionalmente clicar para abrir o modal antes de ver botões vermelhos) e mantém a página de perfil super limpa, elegante e compacta.

### Decisão 2: Segundo Nível de Confirmação (`ConfirmModal`)
**Opção Escolhida**: Mesmo dentro do modal da Zona de Perigo, clicar em qualquer botão de ação ainda disparará o `ConfirmModal` com a mensagem específica de confirmação.
**Razão**: Camada dupla de proteção contra perda de dados por erro de toque no celular.

## Risks / Trade-offs

- [Risco] Usuário não encontrar a opção de limpeza por estar dentro de um modal.
  → **Mitigação**: O Card Gatilho na página terá destaque com borda avermelhada, ícone de aviso `ShieldAlert` e rótulo claro ("Gerenciar Zona de Perigo").
