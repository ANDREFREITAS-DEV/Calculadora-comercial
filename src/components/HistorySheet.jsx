import { formatNumber } from '../lib/format.js';

function formatTs(ts) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Folha com o histórico completo: reutilizar resultado, anotar e limpar. */
export default function HistorySheet({ history, onClose, onClear, onReuse, onNote }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Histórico de cálculos">
        <div className="sheet-head">
          <h3>Histórico</h3>
          <div>
            {history.length > 0 && (
              <button
                className="sheet-clear"
                onClick={() => {
                  if (confirm('Limpar todo o histórico?')) onClear();
                }}
              >
                Limpar
              </button>
            )}
            <button className="sheet-close" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className="sheet-list">
          {history.length === 0 && (
            <div className="sheet-empty">Nenhum cálculo ainda. Toque em = para registrar.</div>
          )}
          {history.map((h) => (
            <div key={h.id} className="hist-item">
              <div className="hist-top">
                <button className="hist-expr" onClick={() => onReuse(h)}>
                  {h.expr}
                </button>
                <button className="hist-res" onClick={() => onReuse(h)}>
                  {formatNumber(h.result)}
                </button>
              </div>
              <div className="hist-meta">
                <input
                  className="note-input"
                  placeholder="adicionar nota…"
                  value={h.note}
                  onChange={(e) => onNote(h.id, e.target.value)}
                  maxLength={80}
                />
                <span className="hist-ts">{formatTs(h.ts)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
