/**
 * Markup: preço de venda com base no custo + percentual sobre o CUSTO
 * Fórmula: custo * (1 + percent/100)
 * Ex: custo=100, markup=30% → venda=130,00
 */
export function markup(cost, percent) {
  if (!Number.isFinite(cost) || cost <= 0) return NaN;
  if (!Number.isFinite(percent) || percent < 0) return NaN;
  return cost * (1 + percent / 100);
}

/**
 * Margem Real: preço de venda onde a margem representa % sobre o PREÇO DE VENDA
 * Fórmula: custo / (1 - percent/100)
 * Ex: custo=100, margem=30% → venda=142,86 (100 é 70% de 142,86)
 * GUARDA: percent deve ser < 100, caso contrário resultado é inválido.
 */
export function realMargin(cost, percent) {
  if (!Number.isFinite(cost) || cost <= 0) return NaN;
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) return NaN;
  return cost / (1 - percent / 100);
}

/**
 * Formata número para exibição com separadores pt-BR e até 10 casas decimais
 * significativas (sem zeros à direita desnecessários).
 */
export function formatResult(n) {
  if (!Number.isFinite(n)) return "—";
  // Determina casas decimais: até 10, mas sem trailing zeros
  const str = n.toFixed(10).replace(/\.?0+$/, "");
  const parts = str.split(".");
  const decimals = parts[1] ? parts[1].length : 0;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals > 2 ? 2 : decimals,
    maximumFractionDigits: Math.min(decimals, 10),
  });
}

/**
 * Valida entradas do formulário comercial.
 * Retorna { ok: true } ou { ok: false, field: 'cost'|'percent', message: string }
 */
export function validateInputs(cost, percent, mode) {
  if (!Number.isFinite(cost) || cost <= 0) {
    return { ok: false, field: "cost", message: "Custo inválido. Informe um valor positivo." };
  }
  if (!Number.isFinite(percent) || percent < 0) {
    return { ok: false, field: "percent", message: "Percentual inválido. Informe um valor ≥ 0." };
  }
  if (mode === "mr" && percent >= 100) {
    return { ok: false, field: "percent", message: "Margem Real não pode ser 100% ou mais." };
  }
  return { ok: true };
}
