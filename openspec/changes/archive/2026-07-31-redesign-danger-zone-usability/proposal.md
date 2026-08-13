## Why

Os botões de ações destrutivas na "Zona de Perigo" do perfil do usuário apresentavam baixa clareza e ocupavam espaço excessivo na tela. Dependiam de tooltips flutuantes no hover (incompatíveis com o mobile) e expunham botões vermelhos perigosos de imediato. Transformar a Zona de Perigo em um **Modal Interativo Dedicado ("Gerenciar Zona de Perigo")** isola completamente as ações destrutivas, oferecendo descrições explicativas nativas no mobile e desktop.

## What Changes

- Reformular a Zona de Perigo para operar como um **Modal Modal/Overlay dedicado** (`DangerZoneModal` ou trigger com modal).
- Na página de perfil/admin, exibir um card de acesso seguro com botão que abre o modal ("Abrir Zona de Perigo").
- Dentro do modal, apresentar a lista de cartões descritivos (`DangerZoneItem`) com título explicativo, texto com as consequências da ação (visível nativamente no mobile e desktop), badge de nível de impacto (`Moderado`, `Alto`, `Crítico`) e botão de confirmação.

## Capabilities

### New Capabilities

- `danger-zone-usability-redesign`: Modal interativo da Zona de Perigo com descrições inline explicativas e UX tátil responsiva.

### Modified Capabilities

## Impact

- `src/components/DangerZone.tsx`: Reestruturação do componente para atuar como container/modal com gatilho visual seguro.
- `src/app/profile/page.tsx`: Atualização da chamada para acionar o modal da Zona de Perigo.
- `src/app/admin/page.tsx`: Ajuste da Zona de Perigo do painel administrativo.
