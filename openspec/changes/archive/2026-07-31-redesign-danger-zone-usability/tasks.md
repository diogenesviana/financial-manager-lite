## 1. Redesenho do Componente DangerZone em Formato de Modal

- [x] 1.1 Atualizar `src/components/DangerZone.tsx` para operar como Card Gatilho e Modal dedicado (`Modal`), com estado para controle de abertura (`isOpen`).
- [x] 1.2 Implementar/Ajustar o subcomponente de cartão `DangerZoneItem` contendo título claro, descrição em texto legível inline, badge de risco/impacto (`MODERADO`, `ALTO`, `CRÍTICO`) e botão de ação tátil (≥44px).

## 2. Atualização das Páginas que Utilizam a Zona de Perigo

- [x] 2.1 Refatorar a Zona de Perigo na tela de Perfil (`src/app/profile/page.tsx`) para acionar o modal da Zona de Perigo com os 5 cartões descritivos (desatribuir gastos, apagar despesas, apagar integrantes, apagar regras e reset total).
- [x] 2.2 Atualizar a chamada da Zona de Perigo no Painel de Administração (`src/app/admin/page.tsx`) para acionar o modal para a ação de limpeza total.

## 3. Validação e Testes

- [x] 3.1 Executar a compilação TypeScript (`npx tsc --noEmit`) e suíte de testes Jest (`npm test`).
- [x] 3.2 Verificar a experiência de abertura do modal e execução das confirmações no ambiente de desenvolvimento mobile e desktop.
