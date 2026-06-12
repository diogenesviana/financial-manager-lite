# Financial Manager - Controle de Gastos Compartilhados (v1.2.1)

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

## ⚖️ Contrato de Uso e Licença (Termos e Condições)

Ao utilizar, copiar ou modificar este software, você concorda expressamente com os seguintes termos:

1. **Uso Exclusivamente Pessoal e Não Comercial**: O software é licenciado sob caráter estritamente de uso pessoal, privado e não comercial. É terminantemente proibida qualquer forma de exploração comercial, incluindo, mas não se limitando a:
   - Comercialização direta, revenda, locação, sublicenciamento ou distribuição do software (no todo ou em partes);
   - Oferecimento do sistema como serviço pago (SaaS - Software as a Service);
   - Uso da aplicação no âmbito de atividades empresariais lucrativas ou de prestação de serviços comerciais para terceiros;
   - Inclusão de anúncios, cobranças ou qualquer método de monetização sobre o software ou suas modificações.
2. **Propriedade Intelectual e Modificações**: O código é aberto para customização e estudo individual. Contudo, qualquer modificação, cópia ou derivação deve manter obrigatoriamente a atribuição de autoria original ao criador (**Diógenes Viana**). Projetos derivados continuam restritos à mesma licença não comercial.
3. **Privacidade de Dados**: Todos os dados cadastrados, incluindo faturas de cartão de crédito importadas e nomes de integrantes, são armazenados localmente na máquina executando o servidor. Nenhuma informação é enviada a servidores externos ou de terceiros (com exceção do texto extraído das faturas para processamento via API oficial da Google Gemini sob responsabilidade das chaves de API providas pelo usuário).
4. **Isenção Total de Garantias e Responsabilidade**: O software é fornecido "no estado em que se encontra" (AS IS), sem garantias de qualquer tipo, expressas ou implícitas (incluindo garantias de precisão de cálculo, interpretação de arquivos PDF ou adequação a fins específicos). O autor não se responsabiliza em nenhuma circunstância por perdas financeiras, decisões baseadas no sistema, falhas operacionais, corrupção de banco de dados ou vazamentos decorrentes de má configuração da infraestrutura local do usuário.

---

## ✍️ Autor

Desenvolvido por **Diógenes Viana**.  
*Todos os direitos reservados © 2026.*
