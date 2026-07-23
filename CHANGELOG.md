# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.4.5] - 2026-07-10

### Added
- **Visualização de Senha em PDFs Protegidos**: Adicionado ícone de olho no modal de inserção de senha de PDFs para alternar visibilidade.
- **Identificação Individual de Patch Notes**: Status de leitura de notas de atualização gravado por usuário (`seen-patch-notes-version-${userId}`).

### Changed
- **Segurança no Campo de Senha de PDF**: Alterado o input de senha para tipo texto com `WebkitTextSecurity`, evitando autocompletar e sugestão de salvar senha pelo navegador.
- **Rótulo de Mês de Referência na Importação**: Substituído o dropdown de mês de destino por uma etiqueta informativa estática (`Fatura: Mês / Ano`).
- **Ações em Lote Centralizadas**: Removidos os botões duplicados no topo da tabela da tela de importação, centralizando as ações na barra flutuante inferior.
- **Indicadores de Mês Compactos**: Substituídas as tags expansivas de mês de destino por tags compactas (ex: `→ Ago`) ao lado da data.

---

## [1.4.4] - 2026-07-02

### Added
- **Detecção e Geração Automática de Compras Parceladas**: Reconhecimento automático de padrões parcelados (ex: "Parcela 3 de 12") na importação de PDFs, com criação em segundo plano das parcelas anteriores e futuras.
- **Propagação de Edição em Parcelas**: Alteração de nome, categoria ou integrante em uma parcela é replicada automaticamente em todas as parcelas da mesma compra.

### Changed
- **Ordenação na Sincronização de Categorias**: Lista de despesas para recategorização agora aparece ordenada do mês mais recente para o mais antigo.
- **Fallback de Busca por Nome Editado**: Regras de categorização tentam casar primeiramente com o nome original da fatura e, em seguida, com o nome editado pelo usuário.

---

## [1.4.3] - 2026-07-01

### Added
- **Notificações Automáticas de Pagamento**: Notificação em tempo real enviada aos integrantes quando o criador marca despesas compartilhadas como pagas.
- **Autocomplete Inteligente em Lançamento Manual**: Sugestões instantâneas de descrições frequentes a partir de 3 caracteres digitados.
- **Seletor de Meses em Grade**: Componente de seleção de mês em grade 3x4 na aba de Integrantes e no Painel Geral.

### Changed
- **Modais de Adição e Edição Reformulados**: Formulários de gasto manual e edição reestruturados em layout responsivo de duas colunas.
- **Modo Somente Leitura para Devedores**: Integrantes devedores passam a ter acesso restrito à visualização de faturas consolidadas.
- **Gráfico Donut para Faturas Zeradas**: Exibição de donut de apoio cinza em meses sem lançamentos para manter a estabilidade do layout.

---

## [1.4.2] - 2026-06-25

### Added
- **Categorização Automática via IA**: Classificação inteligente de categorias para despesas importadas via PDF com base no histórico e semântica.
- **Sugestão Dinâmica de Criar Regras**: Alerta com sugestão de criação de regra automática ao alterar a categoria de uma despesa manualmente.

---

## [1.4.1] - 2026-06-19

### Added
- **Edição Completa de Despesas**: Adicionado botão de edição em todas as tabelas (Importação, Dashboard e Integrantes).
- **Apelido em Despesas Importadas**: Suporte a inclusão de apelidos em despesas originadas de PDF sem perder a referência ao nome original para deduplicação.

### Fixed
- **Estabilidade no Banco de Dados**: Ajustadas as conexões do Prisma ORM para eliminação de travamentos e erros HTTP 500 / P2024.

---

## [1.2.1] - 2026-06-12

### Changed
- **Fluxo de Lançamento Manual Recolhível**: Formulário de inclusão manual inicia recolhido em botão com assistente passo a passo e avatar do integrante.

---

## [1.2.0] - 2026-06-12

### Added
- **Cadastro Simplificado de Integrantes**: Assistente condicional para cadastro por e-mail ou dados diretos (nome + WhatsApp).
- **Verificação Prévia de Contas Existentes**: Busca automática de usuários cadastrados no sistema durante a digitação do e-mail de convite.

### Fixed
- **Sobreposição em Menus Dropdown**: Corrigido `zIndex` do menu de atribuição de gastos que ficava oculto sob linhas da tabela.

---

## [1.1.0] - 2026-06-01

### Added
- **Painel Geral de Gastos Compartilhados**: Lançamento inicial do painel com gráficos de divisão de faturas e exportação em PDF.
- **Importação de Faturas via Google Gemini API**: Processamento básico de faturas de cartão em formato PDF.
- **Regras de Atribuição por Palavra-Chave**: Associação automática de transações a integrantes do grupo.
