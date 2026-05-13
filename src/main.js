import { engine } from "./core/engine.js";
import { historyService } from "./core/history.js";
import { markup, realMargin, formatResult, validateInputs } from "./core/commercial/commercial.js";
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

// ─── Formatação do visor principal ───────────────────────────────────────────

function renderValueHTML(raw) {
  const formatted = formatDisplayValue(raw);
  if (!formatted) return `<span class="value-int"></span>`;
  if (formatted === "Erro" || formatted === "∞") {
    return `<span class="value-int">${formatted}</span>`;
  }
  const commaIdx = formatted.indexOf(",");
  if (commaIdx === -1) return `<span class="value-int">${formatted}</span>`;
  const intPart = formatted.slice(0, commaIdx);
  const decPart = formatted.slice(commaIdx);
  return `<span class="value-int">${intPart}</span><span class="value-dec">${decPart}</span>`;
}

/**
 * Formata o buffer do engine para exibição:
 * - Usa vírgula como separador decimal (pt-BR)
 * - Adiciona separador de milhar
 * - Limita a 12 dígitos inteiros + 10 decimais
 * - Passa strings de erro/status diretamente
 */
function formatDisplayValue(buffer) {
  // Estados especiais: erro, infinito, etc.
  if (buffer === "Erro" || buffer === "∞" || buffer === "") return buffer;

  // Se o buffer termina com ponto (usuário digitando decimal), mantém
  const trailingDot = buffer.endsWith(".");

  const n = Number(buffer);
  if (!Number.isFinite(n)) return buffer; // Segurança

  // Parte inteira e decimal
  const [intPart, decPart] = buffer.split(".");

  // Formata parte inteira com milhar
  const intFormatted = Math.abs(parseInt(intPart, 10))
    .toLocaleString("pt-BR");
  const sign = n < 0 ? "-" : "";

  if (decPart !== undefined) {
    // Está editando decimais — exibe como digitado, mas com vírgula
    return `${sign}${intFormatted},${decPart}`; // FIX: ramo morto removido
  }

  return `${sign}${intFormatted}${trailingDot ? "," : ""}`;
}

/**
 * Formata a expressão (linha de cima do visor):
 * Substitui ponto decimal por vírgula para consistência pt-BR.
 */
function formatExpression(expr) {
  return expr.replace(/\./g, ",");
}

function render() {
  const raw = engine.buffer;
  const formatted = formatDisplayValue(raw);

  elVal.style.fontSize = "";
  elVal.innerHTML = renderValueHTML(raw);

  // Ajusta tamanho de fonte do inteiro para não transbordar
  const intSpan = elVal.querySelector(".value-int");
  if (intSpan) {
    const len = formatted.length;
    if (len > 14) {
      intSpan.style.fontSize = "clamp(1.4rem, 5vw, 1.8rem)";
    } else if (len > 10) {
      intSpan.style.fontSize = "clamp(1.8rem, 6vw, 2.4rem)";
    } else {
      intSpan.style.fontSize = "";
    }
  }

  elExp.textContent = formatExpression(engine.expression);

  // Chip de memória com valor formatado
  if (elMem) {
    if (memoryService.has()) {
      const memVal = memoryService.get();
      const memFmt = memVal !== null
        ? Number(memVal).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0";
      elMem.textContent = `M ${memFmt}`;
      elMem.hidden = false;
    } else {
      elMem.hidden = true;
    }
  }

  const histScroll = document.getElementById("hist-scroll");
  if (histScroll) {
    const filtered = historyService.getAll().slice(0, 5)
      .filter(i => i && i.result !== undefined);
    histScroll.innerHTML = filtered
      .map((i, idx) => {
        const isCurrent = idx === 0;
        const val = String(formatResult(Number(i.result)))
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const expr = i.type === "normal"
          ? String(i.expression ?? "").replace(/\./g, ",")
              .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          : (i.mode === "mu" ? "MU" : "MR");
        const dot = idx < filtered.length - 1
          ? '<span class="hist-dot"></span>' : "";
        return `<span class="hist-entry${isCurrent ? " current" : ""}" data-result="${Number(i.result)}">${expr}=${val}</span>${dot}`;
      })
      .join("");

    histScroll.querySelectorAll(".hist-entry").forEach(el => {
      el.addEventListener("click", () => {
        const v = Number(el.dataset.result);
        engine.buffer = Number.isFinite(v)
          ? String(parseFloat(v.toPrecision(10))) : "0";
        render();
      });
    });

    histScroll.scrollLeft = 0;
  }
}

// ─── Painel lateral ───────────────────────────────────────────────────────────

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

// Fecha clicando no backdrop
backdrop.addEventListener("click", closePanel);

document.getElementById("btn-theme").addEventListener("click", () => toggleTheme());

// ─── Teclado físico ───────────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  // FIX: Escape fecha painel se aberto — evita conflito com engine.clear()
  if (e.key === "Escape") {
    if (panel.classList.contains("active")) { closePanel(); return; }
    engine.clear(); render(); return;
  }
  if (panel.classList.contains("active")) return;
  const key = e.key;
  if (key >= "0" && key <= "9") engine.digit(key);
  else if (key === "," || key === ".") engine.dot();
  else if (key === "Backspace") engine.back();
  else if (key === "+" || key === "-") engine.setOp(key);
  else if (key === "*") engine.setOp("×");
  else if (key === "/") { e.preventDefault(); engine.setOp("÷"); }
  else if (key === "%" ) engine.percent();
  else if (key === "Enter" || key === "=") {
    const result = engine.equals();
    if (result) historyService.add({ type: "normal", expression: result.expr, result: result.res, timestamp: Date.now() });
  }
  else return; // Ignora teclas não mapeadas
  render();
});

// ─── Tap feedback ─────────────────────────────────────────────────────────────
document.getElementById("keypad").addEventListener("pointerdown", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  btn.classList.remove("tapped");
  void btn.offsetWidth; // reinicia animação se teclada rapidamente
  btn.classList.add("tapped");
  btn.addEventListener("animationend", () => btn.classList.remove("tapped"), { once: true });
});

// ─── Keypad (clique) ─────────────────────────────────────────────────────────
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

// ─── Modo Comercial ───────────────────────────────────────────────────────────

document.getElementById("btn-commercial").addEventListener("click", () => {
  openPanel("Modo Comercial");
  renderCommercial();
});

/**
 * Converte string do input (aceita vírgula ou ponto) para Number.
 * Retorna NaN se inválido.
 */
function toNumber(value) {
  const s = String(value ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Marca campo de input como inválido visualmente */
function setInputError(el, hasError) {
  if (!el) return;
  el.style.outline = hasError ? "2px solid #e05252" : "";
  el.style.borderColor = hasError ? "#e05252" : "";
}

function renderCommercial() {
  panelContent.innerHTML = `
    <div class="comm-form">
      <div>
        <div class="comm-label">CUSTO</div>
        <input class="comm-input" id="comm-cost" inputmode="decimal" placeholder="0,00" autocomplete="off" />
      </div>

      <div>
        <div class="comm-label">PERCENTUAL (%)</div>
        <input class="comm-input" id="comm-percent" inputmode="decimal" placeholder="0" autocomplete="off" />
      </div>

      <div class="comm-segment" role="tablist" aria-label="Tipo de cálculo">
        <button class="comm-option active" id="opt-mu" type="button" role="tab" aria-selected="true">Markup</button>
        <button class="comm-option" id="opt-mr" type="button" role="tab" aria-selected="false">Margem Real</button>
      </div>

      <div class="comm-mode-hint" id="comm-mode-hint" aria-live="polite"></div>

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
  const modeHint = document.getElementById("comm-mode-hint");

  // Pré-preenche custo com o valor atual do visor (se positivo)
  const currentVal = engine.value();
  if (Number.isFinite(currentVal) && currentVal > 0) {
    costEl.value = String(currentVal).replace(".", ",");
  }

  const modeHints = {
    mu: "Markup: % sobre o custo. Custo 100 + 30% → R$ 130,00",
    mr: "Margem Real: % sobre o preço de venda. Custo 100, margem 30% → R$ 142,86",
  };

  function setMode(next) {
    mode = next;
    optMu.classList.toggle("active", mode === "mu");
    optMr.classList.toggle("active", mode === "mr");
    optMu.setAttribute("aria-selected", String(mode === "mu"));
    optMr.setAttribute("aria-selected", String(mode === "mr"));
    modeHint.textContent = modeHints[mode];
    // Limpa resultado ao trocar modo para evitar confusão
    resultBox.hidden = true;
    setInputError(percEl, false);
  }

  setMode("mu"); // inicializa hint

  optMu.addEventListener("click", () => setMode("mu"));
  optMr.addEventListener("click", () => setMode("mr"));

  // Limpa erro visual ao editar
  costEl.addEventListener("input", () => setInputError(costEl, false));
  percEl.addEventListener("input", () => setInputError(percEl, false));

  // Permite calcular com Enter nos inputs
  [costEl, percEl].forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") calcBtn.click();
    });
  });

  let last = null;

  calcBtn.addEventListener("click", () => {
    const cost = toNumber(costEl.value);
    const percent = toNumber(percEl.value);

    // Limpa erros anteriores
    setInputError(costEl, false);
    setInputError(percEl, false);

    const validation = validateInputs(cost, percent, mode);
    if (!validation.ok) {
      resultBox.hidden = false;
      resultVal.textContent = "—";
      resultExpr.textContent = validation.message;
      last = null;
      // Destaca o campo com problema
      if (validation.field === "cost") setInputError(costEl, true);
      if (validation.field === "percent") setInputError(percEl, true);
      return;
    }

    const r = mode === "mu" ? markup(cost, percent) : realMargin(cost, percent);

    // Segurança extra: valida o resultado calculado
    if (!Number.isFinite(r) || r <= 0) {
      resultBox.hidden = false;
      resultVal.textContent = "—";
      resultExpr.textContent = "Resultado inválido. Verifique os valores.";
      last = null;
      return;
    }

    last = { mode, cost, percent, result: r };

    const label = mode === "mu" ? "Markup" : "Margem Real";
    const costFmt = formatResult(cost);
    const percFmt = formatResult(percent);

    resultBox.hidden = false;
    resultVal.textContent = formatResult(r);
    resultExpr.textContent = `${label}: custo ${costFmt} + ${percFmt}% → ${formatResult(r)}`;
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

// ─── Histórico ────────────────────────────────────────────────────────────────

document.getElementById("btn-history").addEventListener("click", () => {
  openPanel("Histórico");
  renderHistory();
});

function formatTime(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
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
      if (!i || i.result === undefined) return; // Ignora entradas malformadas

      const el = document.createElement("div");
      el.className = "history-item";

      const safeResult = formatResult(Number(i.result));
      let expr = "";

      if (i.type === "normal") {
        expr = String(i.expression ?? "").replace(/\./g, ",");
      } else if (i.type === "commercial") {
        const label = i.mode === "mu" ? "Markup" : "Margem Real";
        expr = `${label} • Custo ${formatResult(Number(i.cost))} • ${formatResult(Number(i.percent))}%`;
      }

      el.innerHTML = `
        <div class="hist-result">${safeResult}</div>
        <div class="hist-expr">${expr}</div>
        <div class="hist-meta">${formatTime(i.timestamp)}</div>
      `;

      el.addEventListener("click", () => {
        const v = Number(i.result);
        // FIX: arredonda para evitar reinserir floating-point noise do localStorage
        engine.buffer = Number.isFinite(v) ? String(parseFloat(v.toPrecision(10))) : "0";
        closePanel();
        render();
      });

      list.appendChild(el);
    });
  }

  document.getElementById("btn-clear-history").addEventListener("click", () => {
    historyService.clear();
    renderHistory(); // Re-renderiza no lugar de fechar — melhor UX
  });
  document.getElementById("btn-close-history").addEventListener("click", closePanel);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

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
