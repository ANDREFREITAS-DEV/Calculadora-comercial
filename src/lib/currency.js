// currency.js — cotações via AwesomeAPI (economia.awesomeapi.com.br)
// Estratégia: buscar todos os pares X-BRL, converter via BRL como pivô.
// Cache em localStorage para funcionamento offline.

import { loadJSON, saveJSON } from './storage.js';

export const CURRENCIES = [
  { id: 'BRL', label: 'Real brasileiro (BRL)', symbol: 'R$' },
  { id: 'USD', label: 'Dólar americano (USD)', symbol: '$' },
  { id: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { id: 'GBP', label: 'Libra esterlina (GBP)', symbol: '£' },
  { id: 'ARS', label: 'Peso argentino (ARS)', symbol: '$' },
  { id: 'BTC', label: 'Bitcoin (BTC)', symbol: '₿' },
];

const PAIRS = 'USD-BRL,EUR-BRL,GBP-BRL,ARS-BRL,BTC-BRL';
const API_URL = `https://economia.awesomeapi.com.br/json/last/${PAIRS.replace(/,/g, '%2C')}`;
const CACHE_KEY = 'calcplus.fx.cache';
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos

export function getCachedRates() {
  return loadJSON(CACHE_KEY, null);
}

/**
 * Retorna { rates: {BRL:1, USD:5.12, ...}, ts } usando cache quando fresco.
 * Lança Error apenas se não houver rede E não houver cache.
 */
export async function getRates({ force = false } = {}) {
  const cached = getCachedRates();
  const fresh = cached && Date.now() - cached.ts < MAX_AGE_MS;
  if (fresh && !force) return cached;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates = { BRL: 1 };
    for (const key of Object.keys(data)) {
      const q = data[key];
      const code = q.code; // ex.: USD
      const bid = parseFloat(q.bid);
      if (code && Number.isFinite(bid)) rates[code] = bid;
    }
    const payload = { rates, ts: Date.now() };
    saveJSON(CACHE_KEY, payload);
    return payload;
  } catch (err) {
    if (cached) return { ...cached, stale: true };
    throw new Error('Sem conexão e sem cotações em cache');
  }
}

/** Converte valor entre moedas usando BRL como pivô. */
export function convertCurrency(value, from, to, rates) {
  if (!Number.isFinite(value) || !rates?.[from] || !rates?.[to]) return NaN;
  return (value * rates[from]) / rates[to];
}

/** Texto relativo: "atualizado agora" / "há 5 min" / "há 2 h". */
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'atualizado agora';
  if (min < 60) return `atualizado há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `atualizado há ${h} h`;
  return `atualizado há ${Math.floor(h / 24)} d`;
}
