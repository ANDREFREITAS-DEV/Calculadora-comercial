// units.js — tabelas de conversão de unidades
// Fator = valor da unidade expresso na unidade-base da categoria.

export const UNIT_CATEGORIES = [
  {
    id: 'length',
    label: 'Comprimento',
    units: [
      { id: 'mm', label: 'milímetros (mm)', factor: 0.001 },
      { id: 'cm', label: 'centímetros (cm)', factor: 0.01 },
      { id: 'm', label: 'metros (m)', factor: 1 },
      { id: 'km', label: 'quilômetros (km)', factor: 1000 },
      { id: 'in', label: 'polegadas (in)', factor: 0.0254 },
      { id: 'ft', label: 'pés (ft)', factor: 0.3048 },
      { id: 'mi', label: 'milhas (mi)', factor: 1609.344 },
    ],
    defaults: ['km', 'mi'],
  },
  {
    id: 'weight',
    label: 'Peso',
    units: [
      { id: 'g', label: 'gramas (g)', factor: 0.001 },
      { id: 'kg', label: 'quilogramas (kg)', factor: 1 },
      { id: 't', label: 'toneladas (t)', factor: 1000 },
      { id: 'oz', label: 'onças (oz)', factor: 0.0283495 },
      { id: 'lb', label: 'libras (lb)', factor: 0.45359237 },
    ],
    defaults: ['kg', 'lb'],
  },
  {
    id: 'temp',
    label: 'Temperatura',
    units: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' },
    ],
    defaults: ['c', 'f'],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      { id: 'ml', label: 'mililitros (ml)', factor: 0.001 },
      { id: 'l', label: 'litros (L)', factor: 1 },
      { id: 'm3', label: 'metros cúbicos (m³)', factor: 1000 },
      { id: 'gal', label: 'galões US (gal)', factor: 3.785411784 },
      { id: 'floz', label: 'onças líquidas (fl oz)', factor: 0.0295735 },
    ],
    defaults: ['l', 'gal'],
  },
  {
    id: 'area',
    label: 'Área',
    units: [
      { id: 'cm2', label: 'centímetros² (cm²)', factor: 0.0001 },
      { id: 'm2', label: 'metros² (m²)', factor: 1 },
      { id: 'ha', label: 'hectares (ha)', factor: 10000 },
      { id: 'km2', label: 'quilômetros² (km²)', factor: 1e6 },
      { id: 'ft2', label: 'pés² (ft²)', factor: 0.09290304 },
    ],
    defaults: ['m2', 'ft2'],
  },
];

function tempToCelsius(v, from) {
  if (from === 'c') return v;
  if (from === 'f') return ((v - 32) * 5) / 9;
  return v - 273.15; // k
}

function tempFromCelsius(c, to) {
  if (to === 'c') return c;
  if (to === 'f') return (c * 9) / 5 + 32;
  return c + 273.15; // k
}

/** Converte valor entre duas unidades da mesma categoria. */
export function convertUnit(value, categoryId, fromId, toId) {
  if (!Number.isFinite(value)) return NaN;
  const cat = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return NaN;
  if (categoryId === 'temp') {
    return tempFromCelsius(tempToCelsius(value, fromId), toId);
  }
  const from = cat.units.find((u) => u.id === fromId);
  const to = cat.units.find((u) => u.id === toId);
  if (!from || !to) return NaN;
  return (value * from.factor) / to.factor;
}
