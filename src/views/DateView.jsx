import { useState } from 'react';
import {
  addDays,
  calendarBreakdown,
  daysBetween,
  toBR,
  todayISO,
  weekdayBR,
} from '../lib/dates.js';

const MODES = [
  { id: 'between', label: 'Entre datas' },
  { id: 'add', label: 'Somar dias' },
  { id: 'age', label: 'Idade' },
];

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function DateView() {
  const [mode, setMode] = useState('between');
  const today = todayISO();

  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [base, setBase] = useState(today);
  const [daysStr, setDaysStr] = useState('30');
  const [birth, setBirth] = useState('');

  let answer = null;

  if (mode === 'between' && start && end) {
    const days = daysBetween(start, end);
    const abs = Math.abs(days);
    const [a, b] = days >= 0 ? [start, end] : [end, start];
    const bd = calendarBreakdown(a, b);
    const parts = [];
    if (bd.years) parts.push(plural(bd.years, 'ano', 'anos'));
    if (bd.months) parts.push(plural(bd.months, 'mês', 'meses'));
    parts.push(plural(bd.days, 'dia', 'dias'));
    answer = {
      n: plural(abs, 'dia', 'dias'),
      l: `≈ ${parts.join(' e ')} · ${Math.floor(abs / 7)} semanas`,
    };
  }

  if (mode === 'add' && base) {
    const d = parseInt(daysStr, 10);
    if (Number.isFinite(d)) {
      const res = addDays(base, d);
      answer = { n: toBR(res), l: weekdayBR(res) };
    }
  }

  if (mode === 'age' && birth) {
    const bd = calendarBreakdown(birth, today);
    if (bd.years >= 0) {
      answer = {
        n: plural(bd.years, 'ano', 'anos'),
        l: `${plural(bd.months, 'mês', 'meses')} e ${plural(bd.days, 'dia', 'dias')} · ${daysBetween(birth, today)} dias vividos`,
      };
    }
  }

  return (
    <section className="panel">
      <h2>Datas</h2>
      <p className="sub">Dias entre datas, prazos e idade</p>

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

      {mode === 'between' && (
        <div className="date-row">
          <div className="card">
            <div className="field-label">Início</div>
            <input
              className="field-input"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="card">
            <div className="field-label">Fim</div>
            <input
              className="field-input"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
      )}

      {mode === 'add' && (
        <div className="date-row">
          <div className="card">
            <div className="field-label">Data base</div>
            <input
              className="field-input"
              type="date"
              value={base}
              onChange={(e) => setBase(e.target.value)}
            />
          </div>
          <div className="card">
            <div className="field-label">Dias (±)</div>
            <input
              className="field-input"
              inputMode="numeric"
              placeholder="30"
              value={daysStr}
              onChange={(e) => setDaysStr(e.target.value)}
            />
          </div>
        </div>
      )}

      {mode === 'age' && (
        <div className="card">
          <div className="field-label">Data de nascimento</div>
          <input
            className="field-input"
            type="date"
            max={today}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </div>
      )}

      {answer && (
        <div className="big-answer">
          <div className="n">{answer.n}</div>
          <div className="l">{answer.l}</div>
        </div>
      )}
    </section>
  );
}
