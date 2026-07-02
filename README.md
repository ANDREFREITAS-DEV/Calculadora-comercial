# Calc+ — Calculadora Completa (PWA)

Calculadora moderna inspirada no Calculator Plus, construída com React + Vite como PWA instalável.

## Funcionalidades

- **Calculadora básica + científica** — expressões multi-etapa com parênteses, sin/cos/tan (graus), ln, log, √, potência, π e e
- **Porcentagem contextual** — `200 + 10%` = 220 (convenção de calculadoras comerciais)
- **Memória** — MC, MR, M+, M− persistente
- **Histórico com notas** — fita de bobina acima do display; toque para abrir o histórico completo, anotar cálculos e reutilizar resultados (persistente via localStorage, até 200 entradas)
- **Modo Porcentagem** — desconto, acréscimo, gorjeta e margem de lucro
- **Conversor de unidades** — comprimento, peso, temperatura, volume e área
- **Conversor de moedas** — cotações em tempo real via AwesomeAPI (USD, EUR, GBP, ARS, BTC ↔ BRL) com cache offline de 10 minutos
- **Calculadora de datas** — dias entre datas, somar/subtrair dias e idade
- **PWA** — instalável, funciona offline (app shell pré-cacheado + cotações em cache)

## Stack

React 18 · Vite 6 · vite-plugin-pwa (Workbox) · CSS puro · zero dependências de runtime além do React

## Rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
npm run preview   # testar o build (inclui service worker)
```

## Deploy no Vercel

1. Suba o repositório no GitHub:

```bash
git init
git add .
git commit -m "feat: Calc+ v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/calc-plus.git
git push -u origin main
```

2. No Vercel: **Add New Project** → importe o repositório. O Vercel detecta Vite automaticamente (build `npm run build`, output `dist`). Nenhuma variável de ambiente é necessária.

3. Após o deploy, abra no celular e use **Adicionar à tela inicial** para instalar como app.

## Arquitetura

```
src/
├── lib/
│   ├── engine.js     # parser recursivo seguro (sem eval), % contextual, trig em graus
│   ├── format.js     # formatação pt-BR (vírgula decimal)
│   ├── units.js      # tabelas de conversão
│   ├── currency.js   # AwesomeAPI + cache localStorage (pivô BRL)
│   ├── dates.js      # cálculos de calendário
│   └── storage.js    # helpers localStorage
├── hooks/useLocalStorage.js
├── components/       # ModeBar, Tape (fita), HistorySheet
└── views/            # CalcView, PercentView, UnitsView, CurrencyView, DateView
```

Decisões de arquitetura:

- **Sem `eval()`** — expressões são tokenizadas e interpretadas por parser recursivo próprio, imune a injeção
- **BRL como pivô cambial** — uma única chamada à API cobre todas as combinações de moedas
- **Cache em camadas para moedas** — localStorage (10 min) + runtime cache do Workbox (NetworkFirst) para resiliência offline
- **localStorage com fallback silencioso** — o app segue funcionando em memória se o storage estiver indisponível
