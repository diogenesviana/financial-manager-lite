## Why

A tela de perfil do usuário (`/profile`) utilizava um layout defasado em relação às recentes melhorias de UX e design moderno aplicadas nas demais telas da aplicação (como o painel admin, pessoas e dashboard). Sendo o **suporte mobile-first** um dos pilares fundamentais do sistema, esta reformulação é necessária para garantir uma experiência tátil fluida em telas pequenas, ótima hierarquia visual, acessibilidade e organização clara das configurações.

## What Changes

- Redesenhar a interface da tela de perfil (`src/app/profile/page.tsx`) com um layout mobile-first em seções bem estruturadas (Perfil & Avatar, Preferências & Sistema, Ações da Conta e Zona de Perigo).
- Implementar cabeçalho hero de perfil otimizado para dispositivos móveis com avatar enriquecido em gradiente, iniciais dinâmicas, badge de papel (ADMIN/Usuário) e e-mail.
- Garantir alvos de toque adequados (mínimo de 44px) para botões, upload de avatar e controles de formulário no mobile.
- Reestruturar as ações da "Zona de Perigo" em cards colapsáveis/organizados com espaçamento e contraste ideais para navegação em telas sensíveis ao toque.

## Capabilities

### New Capabilities

- `user-profile-redesign`: Reformulação visual e funcional da tela de perfil e configurações de conta com foco em UX mobile-first e novo design system.

### Modified Capabilities

## Impact

- `src/app/profile/page.tsx`: Reestruturação completa do componente React e seus estilos com responsividade avançada.
- `src/components/MainLayout.tsx` e `src/components/Sidebar.tsx`: Sincronização imediata dos dados de perfil atualizados (nome e avatar).
