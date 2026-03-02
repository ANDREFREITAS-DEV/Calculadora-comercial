const KEY = "calc_memory_v7";

function readMemory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeMemory(value) {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(value));
  } catch {
    // Se localStorage falhar (modo privado/limite), apenas não persiste.
  }
}

export const memoryService = {
  _value: readMemory(),

  has() {
    return this._value !== null;
  },

  get() {
    return this._value;
  },

  set(value) {
    const v = value === null ? null : Number(value);
    this._value = (v === null || Number.isFinite(v)) ? v : null;
    writeMemory(this._value);
    return this._value;
  },

  clear() {
    return this.set(null);
  },

  add(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return this._value;
    if (this._value === null) return this.set(n);
    return this.set(this._value + n);
  },

  sub(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return this._value;
    if (this._value === null) return this.set(-n);
    return this.set(this._value - n);
  }
};
