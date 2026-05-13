const KEY = "calc_history_v7";
const LIMIT = 50;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function save(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)));
  } catch {
    // localStorage cheio ou bloqueado (modo privado) — silencia sem corromper estado
  }
}

export const historyService = {
  add(item) {
    const items = load();
    items.unshift(item);
    save(items);
  },
  getAll() { return load(); },
  clear() { localStorage.removeItem(KEY); }
};
