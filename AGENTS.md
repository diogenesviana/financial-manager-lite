<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Diretrizes para Migrações do Prisma (Ambiente Não-Interativo)

Em ambientes automatizados de agentes de IA, comandos como `prisma migrate dev` falham porque o terminal é **não-interativo** (sem TTY). Para criar e aplicar migrações do Prisma sem problemas, utilize sempre o seguinte procedimento:

1. **Geração Offline da Migração (SQL):**
   * Recupere a versão anterior do esquema usando o Git:
     ```bash
     git show HEAD:prisma/schema.prisma > prisma/old_schema.prisma
     ```
   * Aplique as alterações desejadas no `prisma/schema.prisma`.
   * Compare os dois esquemas estáticos (sem necessidade de banco de dados shadow) para extrair o script SQL:
     ```bash
     npx prisma migrate diff --from-schema-datamodel prisma/old_schema.prisma --to-schema-datamodel prisma/schema.prisma --script
     ```
   * Crie a pasta da migração seguindo a convenção de timestamp (ex: `prisma/migrations/YYYYMMDDHHMMSS_nome_da_migracao/`) e salve o SQL gerado em um arquivo `migration.sql`.
   * Exclua o arquivo temporário `prisma/old_schema.prisma`.

2. **Resolução de Conflitos no Banco:**
   * Caso o banco já possua alguma tabela ou coluna criada previamente (por exemplo, via `db push`), execute um comando para remover a tabela/coluna conflitante e permitir que a migração rode limpa:
     ```bash
     # Crie um arquivo temporário prisma/temp.sql com o SQL de drop (ex: ALTER TABLE ... DROP COLUMN ...)
     # Execute o script no banco:
     npx prisma db execute --file prisma/temp.sql
     # Exclua o arquivo prisma/temp.sql
     ```

3. **Aplicação Segura da Migração:**
   * Aplique a migração de forma não-interativa e registre-a na tabela `_prisma_migrations`:
     ```bash
     npx prisma migrate deploy
     ```

4. **Geração do Client Prisma (Resolução de Bloqueio no Windows):**
   * Se o comando `npx prisma generate` falhar com `EPERM` (arquivo do motor do Prisma bloqueado pelo servidor Next.js em execução), execute:
     * Identifique o PID do servidor Next.js na porta 3000: `netstat -ano | findstr :3000`
     * Encerre o processo: `taskkill /f /pid <PID>`
     * Execute a geração: `npx prisma generate`
     * Reinicie o servidor: `npm run dev`

