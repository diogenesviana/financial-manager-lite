# Financial Manager - Controle de Gastos Compartilhados (v1.0.1)

Uma aplicação web moderna e elegante construída com Next.js, Prisma e SQLite para facilitar o controle de gastos compartilhados e divisão de contas. O sistema conta com inteligência artificial para leitura e importação de faturas em formato PDF, processamento de despesas em tempo real, atribuição automatizada inteligente e uma interface altamente refinada.

---

## 🚀 Funcionalidades Principais

* **📂 Importação Inteligente de PDFs**: Extraia gastos automaticamente de faturas de cartão de crédito (Nubank, Itaú, Santander, etc.) usando processamento baseado em Inteligência Artificial.
* **🎨 Estética Analytics Premium (Leetify UI)**: Interface gamer/analytics escura e sofisticada, com paleta de roxo/cinza profundo (`#13111a`), sidebar contrastante, cantos arredondados modernos e destaques no rosa/magenta neon (`#ff1a77`).
* **🌓 Alternador de Temas Sincronizado**: Controle inteligente de tema (Escuro/Claro) com detecção automática das preferências do sistema e persistência reativa no navegador.
* **✨ Animações Fluidas (Framer Motion)**: Micro-animações premium em todas as telas:
  - Entrada de cartões em cascata com atraso progressivo (`staggered delay`).
  - Transição ao alterar integrante na visualização de detalhes (fade-in + slide-up de 15px).
  - Remoção de atribuição com efeito de slide lateral e reajuste dinâmico de layout.
  - Animação de escala suave ao criar e remover badges de integrantes.
* **⚡ Regras de Atribuição Automática**: Vincule palavras-chave (ex: "uber", "ifood", "netflix") a pessoas do grupo para associar transações automaticamente durante a importação.
* **🛡️ Prevenção e Exclusão Segura (Hard Delete)**: Prevenção contra transações idênticas duplicadas. Fluxo de exclusão física permanente (Hard Delete) que evita conflitos em re-uploads de faturas.
* **🔄 Resiliência por Fallback de IA**: O parser de inteligência artificial detecta instabilidades de cota ou erros no modelo principal (`gemini-2.5-flash`) e executa um fallback automático e transparente para o modelo estável `gemini-1.5-flash`.
* **🚀 Inserção Otimizada em Lote**: A leitura de faturas processa as atribuições de palavras-chave na memória e realiza inserções em lote (`createMany`), minimizando chamadas redundantes de escrita no banco de dados.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: [Next.js (App Router)](https://nextjs.org/)
* **IA**: [Google Gemini Developer API](https://ai.google.dev/)
* **ORM**: [Prisma](https://www.prisma.io/)
* **Banco de Dados**: SQLite (Armazenado localmente em `prisma/dev.db`)
* **Interface & Estilo**: Vanilla CSS, micro-animações em Framer Motion e ícones Lucide React
* **Parser de PDF**: `pdf-parse`

---

## 🏃 Como Executar Localmente

### Pré-requisitos
Certifique-se de ter o **Node.js** instalado em sua máquina.

### Passos para Inicialização
1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Crie e configure o arquivo `.env` na raiz do projeto contendo sua chave da API da Google Gemini:
   ```env
   GEMINI_API_KEY="sua_chave_aqui"
   JWT_SECRET="seu_segredo_jwt"
   ```

3. Configure o banco de dados SQLite local executando as migrações do Prisma:
   ```bash
   npx prisma migrate deploy
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse o painel pelo navegador em: [http://localhost:3000](http://localhost:3000)

*Nota: Se você estiver utilizando o Windows, também pode executar o arquivo `iniciar.bat` presente na raiz do projeto para subir a aplicação de forma automatizada.*

---

## ⚖️ Contrato de Uso Genérico (Termos e Condições)

Ao utilizar este software localmente ou em rede privada, você concorda com os seguintes termos:

1. **Uso Pessoal e Não Comercial**: Esta aplicação foi projetada e disponibilizada para fins de organização financeira privada e de gastos compartilhados entre indivíduos de comum acordo.
2. **Privacidade de Dados**: Todos os dados cadastrados, incluindo faturas de cartão de crédito importadas e nomes de integrantes, são armazenados única e exclusivamente no banco de dados SQLite local (`dev.db`) contido na máquina executando o servidor. Nenhuma informação é enviada a servidores externos ou de terceiros (com exceção do texto extraído das faturas para processamento via API da Google Gemini).
3. **Isenção de Responsabilidade**: A ferramenta realiza a leitura automatizada de arquivos PDF através de Inteligência Artificial. É responsabilidade do usuário revisar os valores e as atribuições. O autor não se responsabiliza por quaisquer decisões financeiras tomadas, erros de interpretação de faturas, perdas financeiras ou corrupção de arquivos de dados locais.
4. **Modificações**: O código é aberto para customização de acordo com as necessidades do usuário final, desde que mantidos os créditos originais de desenvolvimento.

---

## ✍️ Autor

Desenvolvido por **Diógenes Viana**.  
*Todos os direitos reservados © 2026.*
