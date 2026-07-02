import { useState } from 'react';
import { UNIT_CATEGORIES, convertUnit } from '../lib/units.js';
import { formatNumber, parseLocaleNumber } from '../lib/format.js';

export default function UnitsView() {
  const [catId, setCatId] = useState('length');
  const cat = UNIT_CATEGORIES.find((c) => c.id === catId);

  const [valueStr, setValueStr] = useState('1');
  const [fromId, setFromId] = useState(cat.defaults[0]);
  const [toId, setToId] = useState(cat.defaults[1]);

  function changeCategory(id) {
    const next = UNIT_CATEGORIES.find((c) => c.id === id);
    setCatId(id);
    setFromId(next.defaults[0]);
    setToId(next.defaults[1]);
  }

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  const v = parseLocaleNumber(valueStr);
  const result = Number.isFinite(v) ? convertUnit(v, catId, fromId, toId) : NaN;

  return (
    <section className="panel">
      <h2>Unidades</h2>
      <p className="sub">Comprimento · peso · temperatura · volume · área</p>

      <div className="chips" role="tablist">
        {UNIT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={catId === c.id}
            className={`chip${catId === c.id ? ' on' : ''}`}
            onClick={() => changeCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="field-label">De</div>
        <input
          className="field-input"
          inputMode="decimal"
          placeholder="0"
          value={valueStr}
          onChange={(e) => setValueStr(e.target.value)}
        />
        <select
          className="unit-select"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          aria-label="Unidade de origem"
        >
          {cat.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <button className="swap" onClick={swap} aria-label="Inverter unidades">⇅</button>

      <div className="card">
        <div className="field-label">Para</div>
        <div className="field-input" style={{ color: 'var(--ink)' }}>
          {Number.isFinite(result) ? formatNumber(result) : '—'}
        </div>
        <select
          className="unit-select"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          aria-label="Unidade de destino"
        >
          {cat.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
