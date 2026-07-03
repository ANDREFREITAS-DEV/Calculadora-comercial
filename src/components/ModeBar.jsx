const MODES = [
  { id: 'calc', label: 'Calc' },
  { id: 'pct', label: '%' },
  { id: 'units', label: 'Unidades' },
  { id: 'fx', label: 'Moedas' },
  { id: 'date', label: 'Datas' },
];

export default function ModeBar({ mode, onChange, onSettings }) {
  return (
    <nav className="modes" aria-label="Modos da calculadora">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode${mode === m.id ? ' active' : ''}`}
          aria-current={mode === m.id ? 'page' : undefined}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
      <button className="theme-btn" onClick={onSettings} aria-label="Ajustes">
        ⚙
      </button>
    </nav>
  );
}
