import { engine } from "./core/engine.js";
import { historyService } from "./core/history.js";
import { markup, realMargin } from "./core/commercial/commercial.js";
import { initTheme, toggleTheme } from "./core/theme.js";
import { memoryService } from "./core/memory.js";
import { initPWA } from "./core/pwa.js";
import {
  shouldShowOnboarding,
  renderOnboarding
} from "./core/onboarding.js";

initTheme();
initPWA();

const elVal = document.getElementById("value");
const elExp = document.getElementById("expression");
const elMem = document.getElementById("mem-indicator");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panel-title");
const panelContent = document.getElementById("panel-content");
const panelClose = document.getElementById("panel-close");
const backdrop = document.getElementById("backdrop");

function render() {
  elVal.textContent = engine.buffer;
  elExp.textContent = engine.expression;
  if (elMem) elMem.hidden = !memoryService.has();
}

function openPanel(title) {
  if (document.activeElement) document.activeElement.blur();
  panelTitle.textContent = title;
  panel.classList.add("active");
  panel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
}

function closePanel() {
  if (document.activeElement) document.activeElement.blur();
  panel.classList.remove("active");
  panel.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
}

panelClose.addEventListener("click", closePanel);
document.getElementById("btn-theme").addEventListener("click", () => toggleTheme());

document.getElementById("keypad").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  if (action === "digit") engine.digit(btn.dataset.digit);
  if (action === "dot") engine.dot();
  if (action === "clear") engine.clear();
  if (action === "back") engine.back();
  if (action === "percent") engine.percent();
  if (action === "op") engine.setOp(btn.dataset.op);

  if (action === "mem") {
    const kind = btn.dataset.mem;
    if (kind === "mc") memoryService.clear();
    if (kind === "mr") {
      const v = memoryService.get();
      if (v !== null) engine.buffer = String(v);
    }
    if (kind === "mplus") memoryService.add(engine.value());
    if (kind === "mminus") memoryService.sub(engine.value());
  }

  if (action === "equals") {
    const result = engine.equals();
    if (result) {
      historyService.add({
        type: "normal",
        expression: result.expr,
        result: result.res,
        timestamp: Date.now()
      });
    }
  }
  render();
});

document.getElementById("btn-commercial").addEventListener("click", () => {
  openPanel("Modo Comercial");
  renderCommercial();
});

function toNumber(value) {
  const s = String(value ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function renderCommercial() {
  panelContent.innerHTML = `
    <div class="comm-form">
      <div>
        <div class="comm-label">CUSTO</div>
        <input class="comm-input" id="comm-cost" inputmode="decimal" placeholder="0,00" />
      </div>

      <div>
        <div class="comm-label">PERCENTUAL</div>
        <input class="comm-input" id="comm-percent" inputmode="decimal" placeholder="0" />
      </div>

      <div class="comm-segment" role="tablist" aria-label="Tipo de cálculo">
        <button class="comm-option active" id="opt-mu" type="button">Markup</button>
        <button class="comm-option" id="opt-mr" type="button">Margem Real</button>
      </div>

      <button class="comm-calc" id="comm-calc" type="button">Calcular</button>

      <div class="comm-result" id="comm-result" hidden>
        <div class="comm-result-value" id="comm-result-value">0</div>
        <div class="comm-result-expr" id="comm-result-expr"></div>
        <button class="comm-apply" id="comm-apply" type="button">Aplicar ao visor</button>
      </div>
    </div>
  `;

  let mode = "mu";
  const optMu = document.getElementById("opt-mu");
  const optMr = document.getElementById("opt-mr");
  const costEl = document.getElementById("comm-cost");
  const percEl = document.getElementById("comm-percent");
  const calcBtn = document.getElementById("comm-calc");
  const resultBox = document.getElementById("comm-result");
  const resultVal = document.getElementById("comm-result-value");
  const resultExpr = document.getElementById("comm-result-expr");
  const applyBtn = document.getElementById("comm-apply");

  function setMode(next) {
    mode = next;
    optMu.classList.toggle("active", mode === "mu");
    optMr.classList.toggle("active", mode === "mr");
  }

  optMu.addEventListener("click", () => setMode("mu"));
  optMr.addEventListener("click", () => setMode("mr"));

  let last = null;

  calcBtn.addEventListener("click", () => {
    const cost = toNumber(costEl.value);
    const percent = toNumber(percEl.value);

    if (!Number.isFinite(cost) || cost <= 0) {
      resultBox.hidden = false;
      resultVal.textContent = "—";
      resultExpr.textContent = "Custo inválido.";
      last = null;
      return;
    }
    if (!Number.isFinite(percent) || percent < 0) {
      resultBox.hidden = false;
      resultVal.textContent = "—";
      resultExpr.textContent = "Percentual inválido.";
      last = null;
      return;
    }
    if (mode === "mr" && percent >= 100) {
      resultBox.hidden = false;
      resultVal.textContent = "—";
      resultExpr.textContent = "Margem não pode ser 100%+.";
      last = null;
      return;
    }

    const r = mode === "mu" ? markup(cost, percent) : realMargin(cost, percent);
    last = { mode, cost, percent, result: r };

    resultBox.hidden = false;
    resultVal.textContent = String(r);
    resultExpr.textContent = mode === "mu"
      ? `MU(${cost}, ${percent}%)`
      : `MR(${cost}, ${percent}%)`;
  });

  applyBtn.addEventListener("click", () => {
    if (!last) return;
    engine.buffer = String(last.result);
    historyService.add({
      type: "commercial",
      mode: last.mode,
      cost: last.cost,
      percent: last.percent,
      result: last.result,
      timestamp: Date.now()
    });
    closePanel();
    render();
  });
}

document.getElementById("btn-history").addEventListener("click", () => {
  openPanel("Histórico");
  renderHistory();
});

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function renderHistory() {
  const items = historyService.getAll();

  panelContent.innerHTML = `
    <div class="history-list" id="history-list"></div>
    <div class="panel-actions">
      <button class="btn-small" id="btn-clear-history" type="button">Limpar</button>
      <button class="btn-small primary" id="btn-close-history" type="button">Fechar</button>
    </div>
  `;

  const list = document.getElementById("history-list");

  if (!items.length) {
    list.innerHTML = `<div class="history-item"><div class="hist-expr">Sem histórico ainda.</div></div>`;
  } else {
    items.forEach((i) => {
      const el = document.createElement("div");
      el.className = "history-item";

      const expr = i.type === "normal"
        ? i.expression
        : (i.mode === "mu"
            ? `Markup • Custo ${i.cost} • ${i.percent}%`
            : `Margem Real • Custo ${i.cost} • ${i.percent}%`);

      el.innerHTML = `
        <div class="hist-result">${i.result}</div>
        <div class="hist-expr">${expr}</div>
        <div class="hist-meta">${formatTime(i.timestamp)}</div>
      `;

      el.addEventListener("click", () => {
        engine.buffer = String(i.result);
        closePanel();
        render();
      });

      list.appendChild(el);
    });
  }

  document.getElementById("btn-clear-history").addEventListener("click", () => {
    historyService.clear();
    closePanel();
  });
  document.getElementById("btn-close-history").addEventListener("click", closePanel);
}

render();

if (shouldShowOnboarding()) {
  openPanel("Bem-vindo 👋");
  renderOnboarding(panelContent, closePanel);
}


window.addEventListener("load", () => {
  const loader = document.getElementById("app-loading");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 400);
  }
});
