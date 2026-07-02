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
