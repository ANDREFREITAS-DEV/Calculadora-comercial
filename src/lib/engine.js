// ============================================================
// engine.js — Motor de expressões da Calc+
// Parser recursivo (Pratt) seguro, sem eval().
// Suporta: + − × ÷, ^, parênteses, %, sin/cos/tan (graus),
// ln, log, sqrt, constantes pi e e, menos unário.
//
// Semântica de % (convenção de calculadoras comerciais):
//   a + b%  →  a + (a × b/100)
//   a − b%  →  a − (a × b/100)
//   a × b%  →  a × (b/100)
//   a ÷ b%  →  a ÷ (b/100)
//   b% isolado → b/100
// ============================================================

const FUNCTIONS = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'];
const DEG = Math.PI / 180;

// ---------- Tokenizador ----------
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < src.length && /[0-9.]/.test(src[i])) {
        num += src[i++];
      }
      if (num === '.' || (num.match(/\./g) || []).length > 1) {
        throw new Error('Número inválido');
      }
      tokens.push({ t: 'num', v: parseFloat(num) });
      continue;
    }
    if ('+-*/^%()'.includes(c)) {
      tokens.push({ t: c });
      i++;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      let word = '';
      while (i < src.length && /[a-z]/i.test(src[i])) {
        word += src[i++];
      }
      if (word === 'pi') {
        tokens.push({ t: 'num', v: Math.PI });
      } else if (word === 'e') {
        tokens.push({ t: 'num', v: Math.E });
      } else if (FUNCTIONS.includes(word)) {
        tokens.push({ t: 'fn', name: word });
      } else {
        throw new Error(`Símbolo desconhecido: ${word}`);
      }
      continue;
    }
    throw new Error(`Caractere inválido: ${c}`);
  }
  return tokens;
}

// ---------- Parser (precedência crescente) ----------
// expr    := term (('+' | '-') term)*
// term    := factor (('*' | '/') factor)*
// factor  := unary ('^' factor)?          (potência: assoc. à direita)
// unary   := '-' unary | postfix
// postfix := primary ('%')*
// primary := num | fn '(' expr ')' | '(' expr ')'

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (t) => {
    if (!peek() || peek().t !== t) throw new Error(`Esperado "${t}"`);
    return next();
  };

  function parsePrimary() {
    const tk = peek();
    if (!tk) throw new Error('Expressão incompleta');
    if (tk.t === 'num') {
      next();
      return { type: 'num', v: tk.v };
    }
    if (tk.t === 'fn') {
      next();
      expect('(');
      const arg = parseExpr();
      expect(')');
      return { type: 'fn', name: tk.name, arg };
    }
    if (tk.t === '(') {
      next();
      const inner = parseExpr();
      expect(')');
      return inner;
    }
    throw new Error('Expressão inválida');
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (peek() && peek().t === '%') {
      next();
      node = { type: 'pct', v: node };
    }
    return node;
  }

  function parseUnary() {
    if (peek() && (peek().t === '-' || peek().t === '+')) {
      const op = next().t;
      const v = parseUnary();
      return op === '-' ? { type: 'neg', v } : v;
    }
    return parsePostfix();
  }

  function parseFactor() {
    const base = parseUnary();
    if (peek() && peek().t === '^') {
      next();
      const exp = parseFactor(); // associatividade à direita
      return { type: 'bin', op: '^', l: base, r: exp };
    }
    return base;
  }

  function parseTerm() {
    let node = parseFactor();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const op = next().t;
      node = { type: 'bin', op, l: node, r: parseFactor() };
    }
    return node;
  }

  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = next().t;
      node = { type: 'bin', op, l: node, r: parseTerm() };
    }
    return node;
  }

  const ast = parseExpr();
  if (pos < tokens.length) throw new Error('Expressão inválida');
  return ast;
}

// ---------- Avaliador ----------
function evalNode(node) {
  switch (node.type) {
    case 'num':
      return node.v;
    case 'neg':
      return -evalNode(node.v);
    case 'pct':
      // % isolado (fora de contexto de + − × ÷): b/100
      return evalNode(node.v) / 100;
    case 'fn': {
      const x = evalNode(node.arg);
      switch (node.name) {
        case 'sin':
          return Math.sin(x * DEG);
        case 'cos':
          return Math.cos(x * DEG);
        case 'tan':
          return Math.tan(x * DEG);
        case 'ln':
          if (x <= 0) throw new Error('ln: domínio inválido');
          return Math.log(x);
        case 'log':
          if (x <= 0) throw new Error('log: domínio inválido');
          return Math.log10(x);
        case 'sqrt':
          if (x < 0) throw new Error('√ de número negativo');
          return Math.sqrt(x);
        default:
          throw new Error('Função desconhecida');
      }
    }
    case 'bin': {
      const l = evalNode(node.l);
      let r;
      // Semântica contextual de porcentagem
      if (node.r.type === 'pct') {
        const p = evalNode(node.r.v);
        if (node.op === '+' || node.op === '-') {
          r = (l * p) / 100;
        } else {
          r = p / 100;
        }
      } else {
        r = evalNode(node.r);
      }
      switch (node.op) {
        case '+':
          return l + r;
        case '-':
          return l - r;
        case '*':
          return l * r;
        case '/':
          if (r === 0) throw new Error('Divisão por zero');
          return l / r;
        case '^':
          return Math.pow(l, r);
        default:
          throw new Error('Operador desconhecido');
      }
    }
    default:
      throw new Error('Nó desconhecido');
  }
}

/**
 * Avalia uma expressão em notação interna (ponto decimal, * e /).
 * Retorna número finito ou lança Error com mensagem em pt-BR.
 */
export function evaluate(src) {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new Error('Vazio');
  const result = evalNode(parse(tokens));
  if (!Number.isFinite(result)) throw new Error('Resultado indefinido');
  // Corrige ruído de ponto flutuante (ex.: 0.1+0.2)
  return parseFloat(result.toPrecision(13));
}

/**
 * Avaliação tolerante para preview ao vivo: fecha parênteses
 * pendentes e ignora operador solto no final. Retorna null se
 * ainda não há o que mostrar.
 */
export function evaluateLive(src) {
  let s = src.trim();
  if (!s) return null;
  s = s.replace(/[+\-*/^(]+$/, '');
  if (!s) return null;
  const open = (s.match(/\(/g) || []).length;
  const close = (s.match(/\)/g) || []).length;
  s += ')'.repeat(Math.max(0, open - close));
  try {
    return evaluate(s);
  } catch {
    return null;
  }
}
