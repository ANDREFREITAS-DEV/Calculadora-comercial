import { useMemo, useRef, useState } from 'react';
import { evaluate, evaluateLive } from '../lib/engine.js';
import { formatNumber, numberToExpr, prettyPrint } from '../lib/format.js';
import { vibrate } from '../lib/haptics.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import Tape from '../components/Tape.jsx';
import HistorySheet from '../components/HistorySheet.jsx';

const MAX_HISTORY = 200;
const LONG_PRESS_MS = 600;
const TOAST_MS = 1600;

function toSource(tokens) {
  return tokens.join('');
}

const OPERATORS = ['+', '-', '*', '/', '^'];

// Tokens após os quais um operador pós-fixo (% ou x²) é válido:
// dígito, fecha-parêntese, %, ou constantes.
function acceptsPostfix(t) {
  return t !== null && (/^[0-9]$/.test(t) || t === ')' || t === '%' || t === 'pi' || t === 'e');
}

export default function CalcView() {
  const [tokens, setTokens] = useState([]);
  const [committed, setCommitted] = useState(null); // último "=" (número)
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage('calcplus.history', []);
  const [memory, setMemory] = useLocalStorage('calcplus.memory', null);
  const [sciOpen, setSciOpen] = useLocalStorage('calcplus.scidrawer', false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Long press: ⌫ (limpar tudo) e resultado (copiar)
  const bsTimer = useRef(null);
  const bsLongFired = useRef(false);
  const copyTimer = useRef(null);
  const toastTimer = useRef(null);

  const source = toSource(tokens);
  const live = useMemo(() => evaluateLive(source), [source]);

  const lastToken = tokens[tokens.length - 1] ?? null;
  const isOp = (t) => OPERATORS.includes(t);

  function push(...ts) {
    setError(null);
    setCommitted(null);
    setTokens((prev) => [...prev, ...ts]);
  }

  function currentNumberHasDot(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      const t = list[i];
      if (t === '.') return true;
      if (!/^[0-9]$/.test(t)) return false;
    }
    return false;
  }

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  const handlers = {
    digit(d) {
      // Após "=", digitar número inicia expressão nova
      if (committed !== null) {
        setCommitted(null);
        setError(null);
        setTokens([d]);
        return;
      }
      push(d);
    },
    comma() {
      if (committed !== null) {
        setCommitted(null);
        setTokens(['0', '.']);
        return;
      }
      if (currentNumberHasDot(tokens)) return;
      if (lastToken === null || isOp(lastToken) || lastToken === '(') {
        push('0', '.');
      } else if (/^[0-9]$/.test(lastToken)) {
        push('.');
      }
    },
    operator(op) {
      // Após "=", operador continua a partir do resultado
      if (committed !== null) {
        setError(null);
        setCommitted(null);
        setTokens([numberToExpr(committed), op]);
        return;
      }
      if (tokens.length === 0) {
        if (op === '-') push(op); // menos unário no início
        return;
      }
      if (isOp(lastToken)) {
        // substitui operador pendente
        setTokens((prev) => [...prev.slice(0, -1), op]);
        return;
      }
      push(op);
    },
    percent() {
      vibrate();
      if (committed !== null) {
        setError(null);
        setCommitted(null);
        setTokens([numberToExpr(committed), '%']);
        return;
      }
      if (acceptsPostfix(lastToken)) push('%');
    },
    square() {
      // x²: eleva ao quadrado o operando atual (append ^2)
      if (committed !== null) {
        setError(null);
        setCommitted(null);
        setTokens([numberToExpr(committed), '^', '2']);
        return;
      }
      if (acceptsPostfix(lastToken)) push('^', '2');
    },
    paren(p) {
      if (committed !== null && p === '(') {
        setCommitted(null);
        setTokens(['(']);
        return;
      }
      push(p);
    },
    fn(name) {
      if (committed !== null) {
        setCommitted(null);
        setTokens([`${name}(`]);
        return;
      }
      push(`${name}(`);
    },
    constant(c) {
      if (committed !== null) {
        setCommitted(null);
        setTokens([c]);
        return;
      }
      push(c);
    },
    clear() {
      setTokens([]);
      setCommitted(null);
      setError(null);
    },
    backspace() {
      setError(null);
      setCommitted(null);
      setTokens((prev) => prev.slice(0, -1));
    },
    equals() {
      vibrate();
      if (tokens.length === 0) return;
      let src = source;
      // fecha parênteses pendentes
      const open = (src.match(/\(/g) || []).length;
      const close = (src.match(/\)/g) || []).length;
      const fixTokens = [...tokens, ...Array(Math.max(0, open - close)).fill(')')];
      src = toSource(fixTokens);
      try {
        const result = evaluate(src);
        const entry = {
          id: crypto.randomUUID(),
          expr: prettyPrint(fixTokens),
          result,
          note: '',
          ts: Date.now(),
        };
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
        setCommitted(result);
        setTokens([numberToExpr(result)]);
        setError(null);
      } catch (err) {
        setError(err.message || 'Erro');
      }
    },
    memClear() {
      setMemory(null);
    },
    memRecall() {
      if (memory === null) return;
      if (committed !== null || tokens.length === 0 || isOp(lastToken) || lastToken === '(') {
        setCommitted(null);
        setError(null);
        setTokens((prev) =>
          committed !== null ? [numberToExpr(memory)] : [...prev, numberToExpr(memory)]
        );
      }
    },
    memAdd(sign) {
      const value = committed ?? live;
      if (value === null || !Number.isFinite(value)) return;
      setMemory((prev) => (prev ?? 0) + sign * value);
    },
  };

  // ----- Long press no ⌫: toque curto apaga 1, segurar 600 ms limpa tudo -----
  function backspaceDown() {
    bsLongFired.current = false;
    bsTimer.current = setTimeout(() => {
      bsLongFired.current = true;
      vibrate(30); // confirmação tátil do limpar tudo
      handlers.clear();
    }, LONG_PRESS_MS);
  }

  function backspaceUp() {
    clearTimeout(bsTimer.current);
    if (!bsLongFired.current) {
      vibrate();
      handlers.backspace();
    }
  }

  function backspaceCancel() {
    // dedo saiu do botão / gesto cancelado: não apaga nada
    clearTimeout(bsTimer.current);
    bsLongFired.current = true;
  }

  // ----- Long press no resultado: copiar valor formatado -----
  const copyableValue =
    error === null && committed !== null
      ? formatNumber(committed)
      : error === null && live !== null
        ? formatNumber(live)
        : null;

  function copyDown() {
    if (copyableValue === null) return;
    copyTimer.current = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(copyableValue);
        showToast('✓ Copiado');
      } catch {
        showToast('Não foi possível copiar');
      }
    }, LONG_PRESS_MS);
  }

  function copyCancel() {
    clearTimeout(copyTimer.current);
  }

  function reuseFromHistory(entry) {
    setSheetOpen(false);
    setCommitted(null);
    setError(null);
    setTokens([numberToExpr(entry.result)]);
  }

  // Valor grande do display
  const displayValue =
    error !== null
      ? error
      : committed !== null
        ? formatNumber(committed)
        : tokens.length === 0
          ? '0'
          : live !== null
            ? formatNumber(live)
            : '…';

  const sizeClass =
    displayValue.length > 18 ? 'size-s' : displayValue.length > 11 ? 'size-m' : '';

  return (
    <section className="calc-view">
      <Tape history={history} onOpen={() => setSheetOpen(true)} />

      <div className="display" aria-live="polite">
        <div className="expr">{prettyPrint(tokens) || '\u00A0'}</div>
        <div
          className={`result ${sizeClass}${error ? ' error' : ''}`}
          onPointerDown={copyDown}
          onPointerUp={copyCancel}
          onPointerLeave={copyCancel}
          onPointerCancel={copyCancel}
          onContextMenu={(e) => e.preventDefault()}
          title="Segure para copiar"
        >
          {displayValue}
        </div>
        <div className="display-badges">
          <span className="badge deg">DEG</span>
          {memory !== null && <span className="badge mem">M {formatNumber(memory)}</span>}
        </div>
      </div>

      <button
        className={`sci-handle${sciOpen ? ' open' : ''}`}
        onClick={() => setSciOpen((v) => !v)}
        aria-expanded={sciOpen}
        aria-controls="sci-drawer"
      >
        <span className="arrow">⌃</span>científica
      </button>

      <div id="sci-drawer" className={`sci-drawer${sciOpen ? ' open' : ''}`}>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('sin')}>sin</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('cos')}>cos</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('tan')}>tan</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('ln')}>ln</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('log')}>log</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.fn('sqrt')}>√</button>

        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.paren('(')}>(</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.paren(')')}>)</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.operator('^')}>xʸ</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={handlers.square}>x²</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.constant('pi')}>π</button>
        <button tabIndex={sciOpen ? 0 : -1} onClick={() => handlers.constant('e')}>e</button>
      </div>

      <div className="mem-row">
        <button onClick={handlers.memClear}>MC</button>
        <button onClick={handlers.memRecall}>MR</button>
        <button onClick={() => handlers.memAdd(1)}>M+</button>
        <button onClick={() => handlers.memAdd(-1)}>M−</button>
      </div>

      <div className="keys">
        <button className="key fn" onClick={handlers.clear}>C</button>
        <button className="key fn" onClick={handlers.percent}>%</button>
        <button
          className="key fn"
          onPointerDown={backspaceDown}
          onPointerUp={backspaceUp}
          onPointerLeave={backspaceCancel}
          onPointerCancel={backspaceCancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              vibrate();
              handlers.backspace();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Apagar (segure para limpar tudo)"
        >
          ⌫
        </button>
        <button className="key op" onClick={() => handlers.operator('/')}>÷</button>

        <button className="key" onClick={() => handlers.digit('7')}>7</button>
        <button className="key" onClick={() => handlers.digit('8')}>8</button>
        <button className="key" onClick={() => handlers.digit('9')}>9</button>
        <button className="key op" onClick={() => handlers.operator('*')}>×</button>

        <button className="key" onClick={() => handlers.digit('4')}>4</button>
        <button className="key" onClick={() => handlers.digit('5')}>5</button>
        <button className="key" onClick={() => handlers.digit('6')}>6</button>
        <button className="key op" onClick={() => handlers.operator('-')}>−</button>

        <button className="key" onClick={() => handlers.digit('1')}>1</button>
        <button className="key" onClick={() => handlers.digit('2')}>2</button>
        <button className="key" onClick={() => handlers.digit('3')}>3</button>
        <button className="key op" onClick={() => handlers.operator('+')}>+</button>

        <button className="key zero" onClick={() => handlers.digit('0')}>0</button>
        <button className="key" onClick={handlers.comma}>,</button>
        <button className="key eq" onClick={handlers.equals}>=</button>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {sheetOpen && (
        <HistorySheet
          history={history}
          onClose={() => setSheetOpen(false)}
          onClear={() => setHistory([])}
          onReuse={reuseFromHistory}
          onNote={(id, note) =>
            setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, note } : h)))
          }
        />
      )}
    </section>
  );
}
