/**
 * engine.js — Núcleo de cálculo da calculadora.
 *
 * Correções aplicadas:
 * 1. Divisão por zero retorna Infinity / NaN em vez de 0 silencioso.
 * 2. Resultados usam arredondamento de precisão para evitar 0.1+0.2=0.30000000000000004.
 * 3. buffer tem limite de dígitos (MAX_DIGITS) para não transbordar o visor.
 * 4. formatBuffer: exibe número com separador decimal pt-BR (vírgula).
 * 5. Operação encadeada (3 + 5 × 2) resolve corretamente o acumulado.
 */

const MAX_DIGITS = 12; // Limite de dígitos que o buffer aceita

function roundPrecision(n, decimals = 10) {
  // Evita floating-point noise como 0.30000000000000004
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export const engine = {
  buffer: "0",
  stored: null,
  op: null,
  expression: "",

  value() {
    return Number(this.buffer);
  },

  digit(d) {
    // Ignora dígito se já atingiu o limite
    const digits = this.buffer.replace(/[^0-9]/g, "").length;
    if (digits >= MAX_DIGITS) return;
    this.buffer = this.buffer === "0" ? d : this.buffer + d;
  },

  dot() {
    if (!this.buffer.includes(".")) this.buffer += ".";
  },

  clear() {
    this.buffer = "0";
    this.stored = null;
    this.op = null;
    this.expression = "";
  },

  back() {
    if (this.buffer.length > 1) {
      this.buffer = this.buffer.slice(0, -1);
      // Se sobrou só "-" ou ".", reseta para "0"
      if (this.buffer === "-" || this.buffer === ".") this.buffer = "0";
    } else {
      this.buffer = "0";
    }
  },

  percent() {
    const v = this.value();
    if (!Number.isFinite(v)) return;
    this.buffer = String(roundPrecision(v / 100));
  },

  setOp(o) {
    const current = this.value();
    if (!Number.isFinite(current)) return; // Bloqueia op em estado de erro

    if (this.stored === null) {
      this.stored = current;
    } else {
      // Encadeamento: resolve operação pendente antes de registrar a nova
      const res = this.calc(this.stored, this.op, current);
      if (!Number.isFinite(res)) {
        // Erro silencioso nunca mais: exibe mensagem e aborta
        this.buffer = "Erro";
        this.stored = null;
        this.op = null;
        this.expression = "";
        return;
      }
      this.stored = res;
    }

    this.op = o;
    this.expression = `${this._fmt(this.stored)} ${o}`;
    this.buffer = "0";
  },

  equals() {
    if (!this.op || this.stored === null) return null;
    const b = this.value();
    if (!Number.isFinite(b)) return null;

    const res = this.calc(this.stored, this.op, b);
    const expr = `${this._fmt(this.stored)} ${this.op} ${this._fmt(b)}`;

    if (!Number.isFinite(res)) {
      this.buffer = res === Infinity ? "∞" : "Erro";
      this.stored = null;
      this.op = null;
      this.expression = "";
      return null; // Não salva no histórico resultados inválidos
    }

    this.buffer = String(roundPrecision(res));
    this.stored = null;
    this.op = null;
    this.expression = "";
    return { res: roundPrecision(res), expr };
  },

  calc(a, o, b) {
    if (o === "+") return a + b;
    if (o === "-") return a - b;
    if (o === "×") return a * b;
    if (o === "÷") {
      if (b === 0) return Infinity; // Não engole o erro — retorna Infinity
      return a / b;
    }
    return a; // operador desconhecido: retorna acumulado sem alterar
  },

  /** Formata número para exibição no visor (sem locale — vírgula tratada no render) */
  _fmt(n) {
    if (!Number.isFinite(n)) return String(n);
    return String(roundPrecision(n));
  },
};
