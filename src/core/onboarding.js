const KEY = "calc_onboarding_seen_v7";

export function shouldShowOnboarding() {
  try {
    return !localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(KEY, "true");
  } catch {}
}

export function renderOnboarding(panelContent, closePanel) {
  panelContent.innerHTML = `
    <div class="onboarding-premium">

      <div style="margin-bottom:22px;">
        <h2 style="margin:0 0 8px 0; font-weight:600;">
          Bem-vindo 👋
        </h2>
        <div style="font-size:14px; opacity:.7;">
          Uma calculadora rápida, elegante e comercial.
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:14px; font-size:14px; opacity:.85;">

        <div>
          <strong>Operações básicas</strong><br>
          Use +, −, ×, ÷ normalmente.
        </div>

        <div>
          <strong>Modo Comercial 💼</strong><br>
          Calcule Markup e Margem Real com precisão.
        </div>

        <div>
          <strong>Histórico 🕘</strong><br>
          Seus cálculos ficam salvos automaticamente.
        </div>

        <div>
          <strong>Tema ⚙️</strong><br>
          Alterne entre modo claro e escuro.
        </div>

      </div>

      <div style="margin-top:28px;">
        <button id="start-btn" class="btn-small primary" style="width:100%;">
          Começar
        </button>
      </div>

    </div>
  `;

  const btn = document.getElementById("start-btn");

  btn.addEventListener("click", () => {
    markOnboardingSeen();
    closePanel();
  });
}