// format.js — formatação numérica pt-BR

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 10 });
const fmtMoney = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata número para exibição (vírgula decimal, milhar com ponto). */
export function formatNumber(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) {
    return n.toExponential(6).replace('.', ',');
  }
  return fmt.format(n);
}

/** Formata como moeda (2 casas), sem símbolo. */
export function formatMoney(n) {
  if (!Number.isFinite(n)) return '—';
  return fmtMoney.format(n);
}

/** Converte string digitada em pt-BR ("1.234,56" ou "1234,56") para número. */
export function parseLocaleNumber(str) {
  if (typeof str !== 'string') return NaN;
  const clean = str.trim().replace(/\./g, '').replace(',', '.');
  if (clean === '' || clean === '-') return NaN;
  return Number(clean);
}

/** Converte número interno para string de edição na expressão (ponto decimal). */
export function numberToExpr(n) {
  return String(n);
}

// ---- Formatação de expressões (fita, display e histórico) ----

const PRETTY_TOKENS = {
  '*': ' × ',
  '/': ' ÷ ',
  '+': ' + ',
  '-': ' − ',
  '^': '^',
  'sqrt(': '√(',
  pi: 'π',
  '.': ',',
};

// Token numérico completo (ex.: "24.32", "-3", "1.5e-7" vindos de numberToExpr)
const NUMBER_TOKEN = /^-?[0-9]+(\.[0-9]+)?(e[+-]?[0-9]+)?$/i;

/**
 * Converte a lista de tokens internos em texto de exibição pt-BR
 * (× ÷ − e vírgula decimal, inclusive em tokens numéricos inteiros
 * como resultados reaproveitados após "=").
 */
export function prettyPrint(tokens) {
  return tokens
    .map((t) => {
      if (PRETTY_TOKENS[t] !== undefined) return PRETTY_TOKENS[t];
      if (NUMBER_TOKEN.test(t)) return t.replace('.', ',').replace(/^-/, '−');
      return t;
    })
    .join('');
}
