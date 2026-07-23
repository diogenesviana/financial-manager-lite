# Diretrizes de UX/UI — Financial Manager Lite

Este documento estabelece as diretrizes de experiência do usuário (UX), design visual (UI) e padrões arquiteturais de componentes adotados no **Financial Manager Lite**. Toda e qualquer nova funcionalidade ou refatoração deve seguir rigorosamente estes padrões para manter o sistema coeso, limpo, responsivo e de nível premium.

> ⬅️ [Voltar para a documentação principal](../README.md#-%EF%B8%8F-documenta%C3%A7%C3%A3o)

---

## 1. Princípios Fundamentais de UX

### 1.1 Proximidade e Coesão Conceitual (CRUD Unificado)
* **Regra**: Toda entidade de negócio (ex: *Integrantes*, *Regras*, *Cartões*) deve ter seu ciclo completo de gerenciamento (Criar, Ler, Atualizar, Deletar - CRUD) centralizado em sua **tela dedicada**.
* **Anti-padrão**: Ter o cadastro de integrantes na tela de importação de despesas e a exclusão na tela de detalhamento.
* **Solução**:
  * `/people`: Centraliza visualização, edição, cadastro (Novo Integrante) e exclusão.
  * `/import`: Foca estritamente em upload de arquivos (PDF) e lançamento de despesas avulsas.

### 1.2 Prevenção de Ações Destrutivas Acidentais
* **Regra**: Ações de exclusão de dados cruciais (como deletar despesas ou integrantes) **nunca** devem ser acionadas por cliques simples e sem confirmação.
* **Implementação**:
  * O botão de lixeira (`Trash2`) em listagens principais deve acionar um modal de confirmação dialogado (`setConfirmDialog`).
  * Em listagens rápidas ou indicadores da Home (Painel Geral), botões rápidos de exclusão direta são proibidos para evitar erros de toque ("fat-finger").

---

## 2. Design System & Tokens de UI

### 2.1 Cores e Feedback Visual
Utilizar apenas variáveis do sistema mapeadas em CSS (`globals.css`) para garantir compatibilidade nativa com o **Modo Escuro**:

| Semântica | Variável CSS | Cor Base (Light) | Cor Base (Dark) |
| :--- | :--- | :--- | :--- |
| **Primária** | `var(--primary)` | Rosa Vibrante (`#db1460`) | Rosa Vibrante (`#db1460`) |
| **Bordas** | `var(--border)` | Slate Médio / Translúcido | Slate Opaco |
| **Status Conectado** | N/A | Verde (`#10b981`) | Verde (`#10b981`) |
| **Status Pendente** | N/A | Âmbar (`#f59e0b`) | Âmbar (`#f59e0b`) |
| **Status Local** | N/A | Cinza (`#94a3b8`) | Cinza (`#94a3b8`) |

### 2.2 Tipografia e Hierarquia de Textos
* **Títulos Principais (H2)**: `fontSize: '1.5rem'`, `fontWeight: 800`.
* **Subtítulos de Seção (H3)**: `fontSize: '1.1rem'`, `fontWeight: 700`.
* **Cabeçalhos de Formulários (H4)**: `fontSize: '0.95rem'`, `fontWeight: 800` ou `700`.
* **Textos de Apoio/Muted**: `fontSize: '0.85rem'`, `color: 'var(--text-muted)'`.

---

## 3. Padrões de Componentes e Micro-interações

### 3.0 Componentização Máxima para Reuso
* **Regra**: Tudo o que puder ser abstraído em um componente reutilizável (por exemplo: seletores de mês, modais de perigo/Danger Zones, alertas visuais, barras de ações em lote), **deve** ser extraído para a pasta `src/components`.
* **Motivação**: Evita duplicação de código visual, garante que futuras atualizações de UI reflitam automaticamente no sistema inteiro (ex: ao atualizar um estilo de botão ou padding de card), e reduz o tamanho dos arquivos de páginas (`page.tsx`).

### 3.1 Controles Segmentados (Segmented Controls)
Para alternar opções binárias ou ternárias (ex: WhatsApp vs. E-mail), substitua checkboxes ou switches por grids de botões segmentados:
* Grid de largura igual (`display: 'grid'`, `gridTemplateColumns: '1fr 1fr'`).
* Fundo contrastante escuro e bordas arredondadas.
* Opção ativa destacada por cor de destaque (`var(--primary)`) e elevação/sombra sutil.

### 3.2 Avatares e Chips Identificadores
* **Regra**: Integrantes e usuários do sistema são sempre representados por seus avatares circulares de imagem. Caso não possuam foto, o sistema deve renderizar o fallback de iniciais (`getInitials`) com as cores do tema.
* **Uso em Gráficos (Dashboard)**: A legenda de gráficos de divisão deve usar o avatar do integrante cercado por uma borda correspondente à cor de sua respectiva fatia no gráfico.

### 3.3 Menus Dropdown e Popovers
* **Comportamento**: Menus suspensos e seletores dinâmicos (como o seletor "Atribuir a...") devem abrir verticalmente sobrepostos de forma absoluta (`position: 'absolute'`), respeitando a pilha do `zIndex`.
* **Click-Away**: Todo popover ativo precisa de um elemento overlay invisível que cubra a tela (`position: 'fixed'`) e feche o menu caso o usuário clique fora dele.

---

## 4. Diretrizes de Responsividade (Mobile-First & Desktop-Friendly)

* **Flexbox Elástico**: Em layouts de duas ou mais colunas, use `flex: '1 1 <min-width>'` para permitir que os cartões se organizem automaticamente de forma vertical no celular e horizontal no desktop.
* **Prevenção de Esmagamento**: Elementos cruciais como ícones de alerta e avatares dentro de linhas de flexbox devem sempre ter `flexShrink: 0` para evitar deformações em larguras menores.
* **Inputs Textuais**: Em dispositivos móveis, inputs de formulário devem possuir no mínimo `0.45rem` a `0.55rem` de padding para facilidade de toque.
