// haptics.js — vibração tátil com guarda de compatibilidade
// Android/Chrome: funciona. iOS: API inexistente, falha silenciosa por design.

/** Vibração curta (padrão 15 ms). Nunca lança erro. */
export function vibrate(ms = 15) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // dispositivo/navegador sem suporte: ignora
  }
}
