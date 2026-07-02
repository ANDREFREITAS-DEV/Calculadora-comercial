import { useEffect, useState } from 'react';
import {
  CURRENCIES,
  convertCurrency,
  getCachedRates,
  getRates,
  relativeTime,
} from '../lib/currency.js';
import { formatNumber, parseLocaleNumber } from '../lib/format.js';

const QUICK = ['USD', 'EUR', 'GBP', 'ARS', 'BTC'];

export default function CurrencyView() {
  const [valueStr, setValueStr] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BRL');
  const [fx, setFx] = useState(getCachedRates());
  const [status, setStatus] = useState(fx ? 'ok' : 'loading');

  useEffect(() => {
    let alive = true;
    getRates()
      .then((data) => {
        if (!alive) return;
        setFx(data);
        setStatus('ok');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const v = parseLocaleNumber(valueStr);
  const rates = fx?.rates;
  const result =
    rates && Number.isFinite(v) ? convertCurrency(v, from, to, rates) : NaN;
  const unitRate = rates ? convertCurrency(1, from, to, rates) : NaN;

  const fromCur = CURRENCIES.find((c) => c.id === from);
  const toCur = CURRENCIES.find((c) => c.id === to);

  return (
    <section className="panel">
      <h2>Moedas</h2>
      <p className="sub">Cotações da AwesomeAPI com cache offline</p>

      <div className="card">
        <div className="field-label">De</div>
        <input
          className="field-input"
          inputMode="decimal"
          placeholder="0,00"
          value={valueStr}
          onChange={(e) => setValueStr(e.target.value)}
        />
        <select
          className="unit-select"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Moeda de origem"
        >
          {CURRENCIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button className="swap" onClick={swap} aria-label="Inverter moedas">⇅</button>

      <div className="card">
        <div className="field-label">Para</div>
        <div className="field-input" style={{ color: 'var(--ink)' }}>
          {Number.isFinite(result)
            ? `${toCur.symbol} ${formatNumber(Math.round(result * 10000) / 10000)}`
            : '—'}
        </div>
        <select
          className="unit-select"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Moeda de destino"
        >
          {CURRENCIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="chips">
        {QUICK.map((id) => (
          <button
            key={id}
            className={`chip${from === id ? ' on' : ''}`}
            onClick={() => {
              setFrom(id);
              if (to === id) setTo('BRL');
            }}
          >
            {id}
          </button>
        ))}
      </div>

      {status === 'loading' && <div className="rate-note">carregando cotações…</div>}
      {status === 'error' && !rates && (
        <div className="rate-note err">sem conexão e sem cotações em cache</div>
      )}
      {rates && (
        <div className="rate-note">
          1 {fromCur.id} = {formatNumber(Math.round(unitRate * 10000) / 10000)} {toCur.id} ·{' '}
          {relativeTime(fx.ts)}
          {fx.stale ? ' (offline)' : ''}
        </div>
      )}
    </section>
  );
}
