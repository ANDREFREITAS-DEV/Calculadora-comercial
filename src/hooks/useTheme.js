import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const LIGHT_BAR = '#F4F1EA';
const DARK_BAR = '#0E1116';

/**
 * Tema do app: 'light' | 'dark' | 'auto' (segue o sistema em tempo real).
 * Aplica data-theme no <html>, sincroniza a meta theme-color (barra do
 * navegador) e persiste a preferência no localStorage.
 */
export function useTheme() {
  const [pref, setPref] = useLocalStorage('calcplus.theme', 'auto');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');

    const apply = () => {
      const real = pref === 'auto' ? (mq.matches ? 'light' : 'dark') : pref;
      document.documentElement.setAttribute('data-theme', real);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', real === 'light' ? LIGHT_BAR : DARK_BAR);
    };

    apply();
    // 'auto' acompanha mudanças do sistema (ex.: modo noturno às 18h)
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);

  return [pref, setPref];
}
