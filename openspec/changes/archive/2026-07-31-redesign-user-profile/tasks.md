## 1. Reformulação da Interface do Perfil (Mobile-First)

- [x] 1.1 Atualizar o layout de `src/app/profile/page.tsx` com um hero/header de perfil contendo avatar enriquecido, iniciais dinâmicas, e-mail e cargo (`ADMIN`/`USER`) adaptável para telas mobile e desktop.
- [x] 1.2 Redesenhar os cards de formulário (Nome Completo, WhatsApp/Telefone, Upload de Imagem) garantindo alvos de toque maiores ou iguais a 44px e foco visual responsivo.
- [x] 1.3 Reformular os cards de Configurações do Sistema (Tema claro/escuro, Acesso Admin e Encerramento de Sessão) com alinhamento fluido para mobile.

## 2. Ajuste dos Componentes, Zona de Perigo e Responsividade

- [x] 2.1 Refatorar a Zona de Perigo para empilhamento vertical limpo em telas de smartphone (<768px), prevenindo toques acidentais e mantendo contraste visual alto.
- [x] 2.2 Atualizar o skeleton de carregamento (`ProfileSkeleton`) para refletir o empilhamento responsivo da tela.

## 3. Validação e Testes

- [x] 3.1 Executar a verificação de compilação TypeScript e testes de regressão de auth/profile.
- [x] 3.2 Verificar o comportamento visual e de toque no ambiente de desenvolvimento em visores móveis e desktop.
