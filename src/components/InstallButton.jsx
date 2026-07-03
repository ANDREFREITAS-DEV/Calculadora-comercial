import { useEffect, useState } from 'react';

/**
 * Botão "Instalar app" (PWA).
 * Aparece somente quando o navegador dispara `beforeinstallprompt`
 * (Chrome/Android). Some após a instalação, se o usuário recusar o
 * prompt, ou se o app já estiver rodando instalado (standalone).
 * Em iOS o evento não existe, então o botão nunca aparece lá.
 */
export default function InstallButton() {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    // Já instalado / rodando como app: nunca mostrar
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    const onPrompt = (e) => {
      e.preventDefault(); // adia o prompt nativo para o nosso botão
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  async function install() {
    const evt = installEvent;
    // O evento só pode ser usado uma vez: esconde o botão em qualquer
    // desfecho. Se o navegador disparar beforeinstallprompt de novo
    // no futuro, o botão reaparece sozinho.
    setInstallEvent(null);
    try {
      evt.prompt();
      await evt.userChoice;
    } catch {
      // prompt indisponível: nada a fazer, botão já foi ocultado
    }
  }

  return (
    <button className="install" onClick={install}>
      ⬇&nbsp;&nbsp;Instalar app
    </button>
  );
}
