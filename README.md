# Financial Manager - Controle de Gastos Compartilhados (v1.0.0)

Uma aplicação web moderna e elegante construída com Next.js, Prisma e SQLite para facilitar o controle de gastos compartilhados e divisão de contas. O sistema permite a importação de faturas em formato PDF, processamento de despesas em tempo real e atribuição automatizada de gastos aos integrantes do grupo de forma inteligente.

---

## 🚀 Funcionalidades Principais

* **📂 Importação Inteligente de PDFs**: Extraia gastos automaticamente de faturas de cartão de crédito (Nubank, Itaú, Santander, etc.).
* **⚡ Regras de Atribuição Automática**: Defina palavras-chave (ex: "uber", "ifood") para associar transações automaticamente a uma pessoa.
* **🛡️ Prevenção contra Duplicidade**: O sistema impede a criação de transações idênticas (mesmo dia, descrição, valor e cartão) tanto no envio de PDFs quanto na digitação manual.
* **✍️ Lançamento Manual**: Adicione despesas avulsas de forma simples com máscara monetária nativa em BRL.
* **📊 Painel por Integrante**: Exibe a prestação de contas de forma limpa, consolidando o total gasto por cada membro do grupo.
* **⚙️ Gerenciamento Centralizado**: Limpe dados específicos, gerencie regras e modifique o banco com facilidade.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: [Next.js (App Router)](https://nextjs.org/)
* **ORM**: [Prisma](https://www.prisma.io/)
* **Banco de Dados**: SQLite (Armazenado localmente em `prisma/dev.db`)
* **Interface & Estilo**: Vanilla CSS com micro-animações em Framer Motion e ícones Lucide React
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

2. Configure o banco de dados SQLite local executando as migrações do Prisma:
   ```bash
   npx prisma db push
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse o painel pelo navegador em: [http://localhost:3000](http://localhost:3000)

*Nota: Se você estiver utilizando o Windows, também pode executar o arquivo `iniciar.bat` presente na raiz do projeto para subir a aplicação de forma automatizada.*

---

## ⚖️ Contrato de Uso Genérico (Termos e Condições)

Ao utilizar este software localmente ou em rede privada, você concorda com os seguintes termos:

1. **Uso Pessoal e Não Comercial**: Esta aplicação foi projetada e disponibilizada para fins de organização financeira privada e de gastos compartilhados entre indivíduos de comum acordo.
2. **Privacidade de Dados**: Todos os dados cadastrados, incluindo faturas de cartão de crédito importadas e nomes de integrantes, são armazenados única e exclusivamente no banco de dados SQLite local (`dev.db`) contido na máquina executando o servidor. Nenhuma informação é enviada a servidores externos ou de terceiros.
3. **Isenção de Responsabilidade**: A ferramenta realiza a leitura automatizada de arquivos PDF através de expressões regulares básicas. É responsabilidade do usuário revisar os valores e as atribuições. O autor não se responsabiliza por quaisquer decisões financeiras tomadas, erros de interpretação de faturas, perdas financeiras ou corrupção de arquivos de dados locais.
4. **Modificações**: O código é aberto para customização de acordo com as necessidades do usuário final, desde que mantidos os créditos originais de desenvolvimento.

---

## ✍️ Autor

Desenvolvido por **Diógenes Viana**.  
*Todos os direitos reservados © 2026.*
