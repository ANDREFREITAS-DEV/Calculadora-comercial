import { useMemo, useState } from 'react';
import { evaluate, evaluateLive } from '../lib/engine.js';
import { formatNumber, numberToExpr } from '../lib/format.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import Tape from '../components/Tape.jsx';
import HistorySheet from '../components/HistorySheet.jsx';

const MAX_HISTORY = 200;

// Mapeia token interno → texto exibido
const PRETTY = {
  '*': ' × ',
  '/': ' ÷ ',
  '+': ' + ',
  '-': ' − ',
  '^': '^',
  'sqrt(': '√(',
  pi: 'π',
  '.': ',',
};

function prettyPrint(tokens) {
  return tokens.map((t) => PRETTY[t] ?? t).join('');
}

function toSource(tokens) {
  return tokens.join('');
}

const OPERATORS = ['+', '-', '*', '/', '^'];

export default function CalcView() {
  const [tokens, setTokens] = useState([]);
  const [committed, setCommitted] = useState(null); // último "=" (número)
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage('calcplus.history', []);
  const [memory, setMemory] = useLocalStorage('calcplus.memory', null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
      if (lastToken && (/^[0-9]$/.test(lastToken) || lastToken === ')' || lastToken === '%')) {
        push('%');
      }
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
        <div className={`result ${sizeClass}${error ? ' error' : ''}`}>{displayValue}</div>
        <div className="display-badges">
          <span className="badge deg">DEG</span>
          {memory !== null && <span className="badge mem">M {formatNumber(memory)}</span>}
        </div>
      </div>

      <div className="sci">
        <button onClick={() => handlers.fn('sin')}>sin</button>
        <button onClick={() => handlers.fn('cos')}>cos</button>
        <button onClick={() => handlers.fn('tan')}>tan</button>
        <button onClick={() => handlers.fn('ln')}>ln</button>
        <button onClick={() => handlers.fn('log')}>log</button>

        <button onClick={() => handlers.paren('(')}>(</button>
        <button onClick={() => handlers.paren(')')}>)</button>
        <button onClick={() => handlers.operator('^')}>xʸ</button>
        <button onClick={() => handlers.fn('sqrt')}>√</button>
        <button onClick={() => handlers.constant('pi')}>π</button>

        <button className="mem-key" onClick={handlers.memClear}>MC</button>
        <button className="mem-key" onClick={handlers.memRecall}>MR</button>
        <button className="mem-key" onClick={() => handlers.memAdd(1)}>M+</button>
        <button className="mem-key" onClick={() => handlers.memAdd(-1)}>M−</button>
        <button onClick={() => handlers.constant('e')}>e</button>
      </div>

      <div className="keys">
        <button className="key fn" onClick={handlers.clear}>C</button>
        <button className="key fn" onClick={handlers.percent}>%</button>
        <button className="key fn" onClick={handlers.backspace} aria-label="Apagar">⌫</button>
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
