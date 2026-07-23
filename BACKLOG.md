# 📋 Backlog de Desenvolvimento

Este documento registra o plano de melhorias, correções de bugs, refatorações e novas funcionalidades priorizadas para o **Financial Manager Lite**.

---

## 📊 Visão Geral de Prioridades

| ID | Item | Categoria | Prioridade | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Suporte a Lanterna no Leitor de QR Code (NFC-e) | Bugfix | 🟡 Média | 🔍 Em Investigação |
| **FEAT-01** | Distribuição como Aplicativo Android (PWA / TWA) | Feature | 🟢 Alta | 📅 Planejado |
| **FEAT-02** | Otimização do Parser de Nota Fiscal (NFC-e) | Feature | 🟡 Média | 📅 Planejado |

---

## 🐛 Bugs e Ajustes Pendentes

### 🔦 BUG-01: Suporte a Lanterna no Leitor de QR Code (NFC-e)

- **Descrição**: O botão de acender a lanterna (ícone de raio) não é exibido ou falha em aparecer em alguns dispositivos móveis/navegadores específicos, mesmo após a adição da rotina de sondagem de capacidades da faixa de vídeo WebRTC (`MediaStreamTrack`).
- **Status**: 🔍 Em Investigação
- **Prioridade**: 🟡 Média
- **Contexto Técnico**:
  - Em navegadores webviews internos (Instagram, WhatsApp, Telegram), as permissões de hardware de câmera são restritas.
  - No Safari (iOS), a propriedade `torch` não é exposta pela API `MediaStreamTrack`.
- **Próximos Passos**:
  1. Forçar a exibição do botão caso o dispositivo seja Android (identificação via User-Agent).
  2. Interceptar exceções de chamada no método `applyVideoConstraints()` e exibir toast informativo gracioso.

---

## 🚀 Novas Funcionalidades e Melhorias

### 📱 FEAT-01: Distribuição como Aplicativo Android (PWA / TWA)

- **Descrição**: Empacotar e distribuir a aplicação como um aplicativo móvel instalável de alta performance.
- **Status**: 📅 Planejado
- **Prioridade**: 🟢 Alta
- **Passos de Implementação**:
  1. Instalar e configurar `@ducanh2912/next-pwa` no Next.js.
  2. Gerar manifesto de aplicação (`public/manifest.json`), ícones responsivos e splash screens.
  3. Configurar estratégia de caching offline básico de shell do app (`CacheFirst` / `StaleWhileRevalidate`).
  4. Gerar pacote Android (`.apk` / `.aab`) via **Bubblewrap CLI** para instalação direta e publicação.

---

### ⚡ FEAT-02: Otimização do Parser de Nota Fiscal (NFC-e)

- **Descrição**: Ampliar a cobertura do parser de cupons fiscais eletrônicos de venda ao consumidor para múltiplos estados brasileiros.
- **Status**: 📅 Planejado
- **Prioridade**: 🟡 Média
- **Passos de Implementação**:
  1. Mapear e testar URLs de NFC-e dos portais SEFAZ dos estados de SP, RJ, MG, RS e PR.
  2. Adicionar rotina de resiliência e retentativa em caso de instabilidade na SEFAZ de destino.
  3. Suportar leitura alternativa por extração OCR de imagem caso o QR Code esteja ilegível.
