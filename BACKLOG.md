# 📋 Backlog do Financial Manager Lite

Este arquivo registra melhorias, correções de bugs, novas ideias e tarefas que foram priorizadas para desenvolvimento futuro na aplicação.

---

## 🐛 Bugs e Ajustes Pendentes

### 🔦 Suporte a Lanterna no Leitor de QR Code (NFC-e)
- **Descrição:** O botão de acender a lanterna (ícone de raio) não é exibido ou falha em aparecer em alguns dispositivos móveis/navegadores específicos, mesmo após a adição da rotina de sondagem de capacidades da faixa de vídeo WebRTC (`MediaStreamTrack`).
- **Investigação necessária:**
  - Validar compatibilidade em navegadores webviews internos (como navegadores integrados do Instagram, WhatsApp ou Telegram).
  - Tratar a incompatibilidade do Safari no iOS (que atualmente não expõe a capacidade `torch` nas propriedades de vídeo).
  - **Próximo passo sugerido:** Forçar a exibição do botão caso o sistema identifique um dispositivo Android (via User-Agent) e interceptar possíveis erros na chamada do método `applyVideoConstraints()` graciosamente.

---

## 🚀 Novas Funcionalidades e Melhorias

### 📱 Distribuição como Aplicativo Android (PWA / TWA)
- **Descrição:** Empacotar e distribuir o sistema como um aplicativo móvel instalável.
- **Passos planejados:**
  - Instalar e configurar `@ducanh2912/next-pwa` no Next.js.
  - Criar ícones, splash screens e o arquivo `manifest.json`.
  - Configurar suporte offline básico de layout e caching.
  - Gerar o pacote `.apk` / `.aab` por meio do **Bubblewrap CLI** para publicação e testes na Google Play Store.

### ⚡ Otimização do Parser de Nota Fiscal (NFC-e)
- **Descrição:** Ampliar o suporte a diferentes modelos e formatos estaduais de notas fiscais de venda ao consumidor.
- **Passos planejados:**
  - Mapear e testar links de NFC-e de diferentes estados brasileiros (atualmente focado nos padrões de SP, RJ e MG).
  - Adicionar heurísticas de fallback caso a nota demore a responder ou o QR Code seja de um formato não-convencional.
