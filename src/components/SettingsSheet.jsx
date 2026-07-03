const THEME_OPTIONS = [
  { id: 'light', label: '☀ Claro' },
  { id: 'dark', label: '☾ Escuro' },
  { id: 'auto', label: '◐ Automático' },
];

/** Folha de ajustes: seletor de tema (lar de futuras configurações). */
export default function SettingsSheet({ theme, onTheme, onClose }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet settings-sheet" role="dialog" aria-label="Ajustes">
        <div className="sheet-head">
          <h3>Ajustes</h3>
          <button className="sheet-close" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="settings-body">
          <div className="seg-label">Tema</div>
          <div className="segmented" role="radiogroup" aria-label="Tema">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                role="radio"
                aria-checked={theme === opt.id}
                className={theme === opt.id ? 'on' : ''}
                onClick={() => onTheme(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="settings-hint">
            No modo automático, o app acompanha o tema do seu celular.
          </p>
        </div>
      </div>
    </>
  );
}
