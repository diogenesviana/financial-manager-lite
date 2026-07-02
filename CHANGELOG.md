# Novidades do App

---

## Versão 1.3.5 — 02 de julho de 2026

### 🔄 Compras Parceladas: Inteligência Automática
O app agora **detecta automaticamente** quando um gasto importado do PDF é uma compra parcelada (ex: "Parcela 3 de 12" ou "03/10") e age de forma inteligente quando você atribui esse gasto a um integrante:

- **Geração automática das outras parcelas:** Assim que você atribuir um gasto parcelado a uma pessoa, o app cria nos meses corretos todas as outras parcelas que ainda não existem no seu histórico — tanto as passadas quanto as futuras. Assim você não precisa importar todas as faturas uma por uma.
- **Sem duplicatas:** Se você já tiver importado uma dessas parcelas anteriormente, o app reconhece e não a duplica.
- **Resposta instantânea:** A atribuição do integrante acontece imediatamente na tela. A criação das outras parcelas ocorre em segundo plano, sem travar o app.

### ✏️ Editar um gasto parcelado atualiza todas as parcelas
Ao renomear, mudar a categoria ou reatribuir uma parcela de uma compra parcelada, o app propaga a alteração automaticamente para todas as outras parcelas do mesmo grupo — mantendo sempre o número da parcela correspondente de cada mês.

### 🏷️ Sincronização de Categorias Melhorada
- **Ordenação por mês:** A lista de gastos que serão recategorizados na sincronização agora aparece ordenada do **mês mais recente para o mais antigo**, facilitando a revisão.
- **Nome editado como fallback:** Se você tiver renomeado um gasto e nenhuma regra bater com o nome original, o app agora tenta casar a regra com o nome personalizado que você deu ao gasto — nenhum gasto fica esquecido.

---

## Versão 1.4.3 — 01 de julho de 2026

### 🖼️ Modals de Adição e Edição Reformulados
Redesenhamos os formulários de **Novo Gasto Manual** e **Editar Gasto** para uma estrutura moderna de **duas colunas**.
- **Mais intuitivo e compacto:** As informações gerais do gasto (descrição, valor e categoria) agora ficam à esquerda, enquanto os dados de data, mês de fatura e banco ficam organizados à direita.
- **Adequado a qualquer tela:** Em computadores e tablets, os dados ficam perfeitamente distribuídos lado a lado (sem rolagem na tela). Em celulares, o formulário se adapta em uma coluna tátil e confortável.

### 🔔 Notificações Automáticas de Pagamento
Agora, os devedores são informados instantaneamente quando suas despesas compartilhadas são pagas!
- **Notificação individual e mensal:** Sempre que o criador do gasto marcar um item compartilhado como pago ou quitar as despesas consolidadas do mês de um integrante, o devedor associado receberá um alerta na central de notificações do app.
- **Apenas Visualização para Devedores:** Quem está devendo passa a ter acesso de "apenas visualização" no histórico de despesas compartilhadas, evitando que alterações acidentais baguncem as faturas.

### ⚡ Autocomplete Inteligente no Gasto Manual
Facilitamos o preenchimento de despesas frequentes (como Uber, iFood, mercado, etc.).
- **Sugestões com 3 caracteres:** O histórico de descrições começa a aparecer automaticamente a partir do terceiro caractere digitado (ex: digite "ube" para carregar opções como "Uber Dayse" e "Uber Denise").
- **Design Premium Integrado:** As sugestões aparecem em uma lista flutuante estilizada em glassmorphism (fundo translúcido e sombreado), combinando com a identidade visual do app.

### 📅 Novo Seletor de Meses Premium
Substituímos os dropdowns de seleção de mês antigos por um **seletor interativo em grade (3x4)** na aba Integrantes e no Painel Geral. A navegação de anos e a escolha do mês da fatura ficaram muito mais ágeis e visuais.

### 📊 Estabilidade Visual no Painel (Faturas Zeradas)
Quando o mês selecionado não possuir nenhum gasto cadastrado, o app exibe um gráfico de divisão de faturas no formato Donut cinza de `R$ 0,00` e uma lista com todos os integrantes zerados. Isso impede que a tela fique vazia ou com blocos desalinhados.

---

## Versão 1.4.2 — 25 de junho de 2026

### 🏷️ Inteligência na Categorização de Gastos
- **Sugestão Automática de Categorias:** O app agora utiliza inteligência artificial para classificar e sugerir automaticamente a categoria de novos gastos importados de PDF baseando-se no nome da transação.
- **Sugestão de Regras:** Ao alterar manualmente a categoria de uma despesa, o sistema sugere a criação de uma regra automática para futuros gastos similares, economizando seu tempo.
- **Fallback Automático:** Caso nenhuma regra ou IA consiga identificar, o gasto é atribuído à categoria "Outros".

---

## Versão 1.4.1 — 19 de junho de 2026

### ✏️ Edição Completa de Gastos

Agora você tem o poder de editar qualquer despesa depois de criada! Adicionamos um ícone de lápis em todas as tabelas (Importação, Dashboard e Integrantes) para facilitar.

- **Edição Inteligente de PDFs:** Se você alterar o nome de um gasto que veio do seu PDF, o sistema criará um "apelido" para ele em parênteses, mas continuará lembrando do nome original para evitar duplicatas nas suas próximas importações. E melhor: o apelido é opcional! Se quiser, mude apenas o valor.
- **Design Padronizado:** A tela de edição usa a mesma interface limpa e intuitiva do cadastro manual de gastos.

### 🚀 Performance e Estabilidade
- Ajustamos a configuração do banco de dados e arquivos locais para acabar de vez com os travamentos e erros de "Falha na conexão" (Erro 500 / P2024) ao navegar no app.

---

## Versão 1.2.1 — 12 de junho de 2026

### ✍️ Lançamento manual de gastos aprimorado

Trouxemos o mesmo design moderno e simplificado para o registro manual de gastos.

- **Tela mais limpa:** o formulário agora inicia recolhido sob um botão discreto.
- **Passo a passo intuitivo:** ao invés de exibir todos os campos de uma vez, o app te ajuda a escolher o integrante responsável primeiro (ou deixar pendente) e, em seguida, abre a inserção dos detalhes do gasto (data, valor, descrição e cartão).
- **Feedback visual imediato:** você consegue ver quem é o responsável direto e o avatar da pessoa no topo da inserção.

---

## Versão 1.2.0 — 12 de junho de 2026

### 🧑‍🤝‍🧑 Adicionar integrante ficou muito mais fácil

Redesenhamos o fluxo de cadastro de novos integrantes para ser mais intuitivo e direto.

Agora o sistema faz uma pergunta simples: **"Esta pessoa tem e-mail?"**

- **Se sim:** você digita o e-mail e o app busca automaticamente se essa pessoa já tem uma conta. Se encontrar, mostra o nome e a foto dela antes de você confirmar o convite. Se não tiver conta ainda, você preenche o nome e o celular para poder enviar os gastos pelo WhatsApp enquanto ela não se cadastra.
- **Se não:** você preenche o nome e o celular diretamente.

Chega de dúvida sobre o que preencher — o app te guia pelo caminho certo.

### 🔍 O app agora reconhece quem você está convidando

Ao digitar o e-mail de um novo integrante, o sistema busca automaticamente se aquela pessoa já tem uma conta. Se encontrar, aparece o nome e a foto dela para você confirmar — assim você tem certeza de que está convidando a pessoa certa antes de salvar.

### 🛠️ Correções e melhorias gerais

- Corrigida uma falha onde o menu de atribuição de gastos ficava parcialmente escondido atrás de outros elementos da tela
- Melhorias visuais na tela de importação para listas com poucos itens

---

## Versão 1.1.0 — versão anterior
