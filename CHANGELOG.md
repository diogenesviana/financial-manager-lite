# Changelog

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

---

## [1.2.0] - 2026-06-12

### ✨ Novo — Cadastro de Integrante Redesenhado (Progressive Disclosure)

O fluxo de adição de novo integrante foi completamente reformulado para eliminar ambiguidade técnica e guiar o usuário de forma natural.

**Fluxo anterior:** perguntava "Como este integrante usará o sistema?" com opções técnicas.

**Fluxo novo:**
1. Pergunta objetiva: **"Esta pessoa tem e-mail?"**
2. Se **sim** → campo de e-mail com busca automática no sistema:
   - ✅ Usuário encontrado: exibe preview (avatar + nome) e botão "Convidar [Nome]" — sem exigir digitação do nome
   - ⚠️ E-mail não cadastrado: exibe campos de nome + celular com explicação do porquê do celular
3. Se **não** → campos de nome + celular diretamente

### ✨ Novo — Lookup de Usuário por E-mail

- Nova API `GET /api/users/lookup?email=xxx` para busca de perfil público por e-mail
- Debounce de 500ms — pesquisa só dispara após parar de digitar
- Preview animado com 3 estados: buscando, encontrado, não encontrado
- Borda verde no input quando usuário é encontrado
- Nome preenchido automaticamente ao confirmar convite

### 🎨 UX — Terminologia simplificada

- "Membro Local (WhatsApp)" → **"Não usa o app"**
- "Acesso ao App (E-mail)" → **"Já usa o app"**  
- Textos explicativos reescritos em linguagem natural e orientados ao contexto real de uso

### 🔧 Correções anteriores (sessão)

- Fix: dropdown de atribuição rápida na tela de importação não ficava mais cortado pelo `overflow` da tabela
- Fix: z-index do dropdown elevado para `1000`, garantindo sobreposição correta
- Fix: alinhamento do dropdown centralizado com `left: 50% + translateX(-50%)`
- Fix: lógica de direcionamento (abre para cima/baixo) — agora só abre para cima se houver ≥ 3 linhas acima
- Fix: `minHeight: 280px` no container da tabela previne corte em listas curtas

---

## [1.1.0] - anterior

Versão base antes desta sessão.
