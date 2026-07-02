import { useState } from 'react';
import { formatMoney, parseLocaleNumber } from '../lib/format.js';

const MODES = [
  { id: 'discount', label: 'Desconto' },
  { id: 'increase', label: 'Acréscimo' },
  { id: 'tip', label: 'Gorjeta' },
  { id: 'margin', label: 'Margem' },
];

const PCT_LABEL = {
  discount: 'Desconto',
  increase: 'Acréscimo',
  tip: 'Gorjeta',
  margin: 'Margem',
};

const VALUE_LABEL = {
  discount: 'Valor',
  increase: 'Valor',
  tip: 'Conta',
  margin: 'Custo',
};

function compute(mode, v, p) {
  switch (mode) {
    case 'discount': {
      const delta = (v * p) / 100;
      return { main: v - delta, sub: `você economiza R$ ${formatMoney(delta)}` };
    }
    case 'increase': {
      const delta = (v * p) / 100;
      return { main: v + delta, sub: `acréscimo de R$ ${formatMoney(delta)}` };
    }
    case 'tip': {
      const tip = (v * p) / 100;
      return { main: v + tip, sub: `gorjeta de R$ ${formatMoney(tip)}` };
    }
    case 'margin': {
      if (p >= 100) return { main: NaN, sub: 'margem deve ser menor que 100%' };
      const price = v / (1 - p / 100);
      return { main: price, sub: `lucro de R$ ${formatMoney(price - v)}` };
    }
    default:
      return { main: NaN, sub: '' };
  }
}

export default function PercentView() {
  const [mode, setMode] = useState('discount');
  const [valueStr, setValueStr] = useState('');
  const [pctStr, setPctStr] = useState('');

  const v = parseLocaleNumber(valueStr);
  const p = parseLocaleNumber(pctStr);
  const ready = Number.isFinite(v) && Number.isFinite(p);
  const out = ready ? compute(mode, v, p) : null;

  return (
    <section className="panel">
      <h2>Porcentagem</h2>
      <p className="sub">Desconto, acréscimo, gorjeta e margem</p>

      <div className="chips" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`chip${mode === m.id ? ' on' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="pct-grid">
        <div className="card">
          <div className="field-label">{VALUE_LABEL[mode]} (R$)</div>
          <input
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
          />
        </div>
        <div className="card">
          <div className="field-label">{PCT_LABEL[mode]} (%)</div>
          <input
            className="field-input"
            inputMode="decimal"
            placeholder="0"
            value={pctStr}
            onChange={(e) => setPctStr(e.target.value)}
          />
        </div>
      </div>

      {out && Number.isFinite(out.main) && (
        <div className="big-answer">
          <div className="n">R$ {formatMoney(out.main)}</div>
          <div className="l">{out.sub}</div>
        </div>
      )}
      {out && !Number.isFinite(out.main) && (
        <div className="big-answer">
          <div className="l">{out.sub}</div>
        </div>
      )}
    </section>
  );
}
