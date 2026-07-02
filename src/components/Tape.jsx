import { formatNumber } from '../lib/format.js';

/** Fita de histórico (assinatura visual): últimos 3 cálculos acima do display. */
export default function Tape({ history, onOpen }) {
  const recent = history.slice(0, 3).reverse();

  return (
    <button className="tape" onClick={onOpen} aria-label="Abrir histórico completo">
      <div className="tape-pull">⌃&nbsp;&nbsp;histórico</div>
      {recent.length === 0 ? (
        <div className="tape-empty">seus cálculos aparecem aqui</div>
      ) : (
        recent.map((h) => (
          <div key={h.id}>
            <div className="tape-row">
              <span>{h.expr}</span>
              <span className="res">{formatNumber(h.result)}</span>
            </div>
            {h.note && <div className="tape-note">✎ {h.note}</div>}
          </div>
        ))
      )}
    </button>
  );
}
