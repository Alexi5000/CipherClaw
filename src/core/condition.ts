type Token = { kind: 'name' | 'literal' | 'operator'; text: string; value?: unknown };
type Expression =
  | { kind: 'literal'; value: unknown }
  | { kind: 'path'; root: 'span' | 'session'; keys: string[] }
  | { kind: 'not'; child: Expression }
  | { kind: 'binary'; operator: string; left: Expression; right: Expression };

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const precedence: Record<string, number> = {
  '??': 1, '||': 2, '&&': 3,
  '==': 4, '!=': 4, '===': 4, '!==': 4,
  '<': 5, '<=': 5, '>': 5, '>=': 5,
};

function tokenize(source: string): Token[] {
  if (source.length > 4096) throw new Error('Condition too long');
  const tokens: Token[] = [];
  let position = 0;
  while (position < source.length) {
    const rest = source.slice(position);
    const whitespace = /^\s+/.exec(rest);
    if (whitespace) { position += whitespace[0].length; continue; }
    const word = /^[A-Za-z_$][\w$]*/.exec(rest);
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest);
    if (word) {
      tokens.push({ kind: 'name', text: word[0] });
      position += word[0].length;
    } else if (number) {
      const value = Number(number[0]);
      if (!Number.isFinite(value)) throw new Error('Non-finite number');
      tokens.push({ kind: 'literal', text: number[0], value });
      position += number[0].length;
    } else if (rest[0] === '"' || rest[0] === "'") {
      const quote = rest[0];
      let value = '';
      position++;
      let closed = false;
      while (position < source.length) {
        let character = source[position++];
        if (character === quote) { closed = true; break; }
        if (character === '\\') {
          character = source[position++];
          const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
          if (!Object.hasOwn(escapes, character)) throw new Error('Unsupported string escape');
          character = escapes[character];
        } else if (character.charCodeAt(0) < 32) {
          throw new Error('Control character in string');
        }
        value += character;
      }
      if (!closed) throw new Error('Unterminated string');
      tokens.push({ kind: 'literal', text: value, value });
    } else {
      const operator = /^(?:===|!==|==|!=|<=|>=|&&|\|\||\?\?|[!<>().\[\]])/.exec(rest);
      if (!operator) throw new Error('Unsupported condition syntax');
      tokens.push({ kind: 'operator', text: operator[0] });
      position += operator[0].length;
    }
    if (tokens.length > 256) throw new Error('Too many condition tokens');
  }
  return tokens;
}

function parse(tokens: Token[]): Expression {
  let position = 0;
  const take = (text: string): boolean => {
    if (tokens[position]?.text !== text || tokens[position]?.kind !== 'operator') return false;
    position++;
    return true;
  };
  const required = (text: string): void => {
    if (!take(text)) throw new Error('Incomplete condition');
  };
  const expression = (minimum = 1, depth = 0): Expression => {
    if (depth > 32) throw new Error('Condition nesting limit');
    let left: Expression;
    const token = tokens[position++];
    if (!token) throw new Error('Missing operand');
    if (token.kind === 'literal') {
      left = { kind: 'literal', value: token.value };
    } else if (token.kind === 'operator' && token.text === '!') {
      left = { kind: 'not', child: expression(6, depth + 1) };
    } else if (token.kind === 'operator' && token.text === '(') {
      left = expression(1, depth + 1);
      required(')');
    } else if (token.kind === 'name' && ['true', 'false', 'null', 'undefined'].includes(token.text)) {
      const values: Record<string, unknown> = { true: true, false: false, null: null, undefined: undefined };
      left = { kind: 'literal', value: values[token.text] };
    } else if (token.kind === 'name' && (token.text === 'span' || token.text === 'session')) {
      const keys: string[] = [];
      while (true) {
        let key: string;
        if (take('.')) {
          const property = tokens[position++];
          if (property?.kind !== 'name') throw new Error('Expected property name');
          key = property.text;
        } else if (take('[')) {
          const property = tokens[position++];
          if (property?.kind !== 'literal' || !['string', 'number'].includes(typeof property.value)) {
            throw new Error('Expected literal property');
          }
          key = String(property.value);
          required(']');
        } else break;
        if (forbidden.has(key)) throw new Error('Forbidden property');
        keys.push(key);
        if (keys.length > 32) throw new Error('Property depth limit');
      }
      left = { kind: 'path', root: token.text, keys };
    } else throw new Error('Unknown condition operand');
    while (tokens[position]?.kind === 'operator') {
      const operator = tokens[position].text;
      const priority = Object.hasOwn(precedence, operator) ? precedence[operator] : 0;
      if (priority < minimum) break;
      position++;
      left = { kind: 'binary', operator, left, right: expression(priority + 1, depth + 1) };
    }
    return left;
  };
  const result = expression();
  if (position !== tokens.length) throw new Error('Trailing condition input');
  return result;
}

function primitive(value: unknown): string | number | boolean | null | undefined {
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) {
    return value as string | number | boolean | null | undefined;
  }
  throw new Error('Only primitive comparisons are supported');
}

function evaluate(node: Expression, roots: { span: unknown; session: unknown }): unknown {
  if (node.kind === 'literal') return node.value;
  if (node.kind === 'not') return !evaluate(node.child, roots);
  if (node.kind === 'path') {
    let value = roots[node.root];
    for (const key of node.keys) {
      if (value === null || value === undefined) throw new Error('Missing property parent');
      if (typeof value === 'function') throw new Error('Functions are not condition data');
      const descriptor = Object.getOwnPropertyDescriptor(Object(value), key);
      if (descriptor && !Object.hasOwn(descriptor, 'value')) throw new Error('Accessors are not condition data');
      value = descriptor?.value;
    }
    return value;
  }
  const left = evaluate(node.left, roots);
  if (node.operator === '&&') return left && evaluate(node.right, roots);
  if (node.operator === '||') return left || evaluate(node.right, roots);
  if (node.operator === '??') return left ?? evaluate(node.right, roots);
  const a = primitive(left);
  const b = primitive(evaluate(node.right, roots));
  switch (node.operator) {
    case '===': return a === b;
    case '!==': return a !== b;
    case '==': return a == b;
    case '!=': return a != b;
    default: {
      const x = typeof a === 'string' && typeof b === 'string' ? a : Number(a);
      const y = typeof a === 'string' && typeof b === 'string' ? b : Number(b);
      switch (node.operator) {
        case '<': return x < y;
        case '<=': return x <= y;
        case '>': return x > y;
        case '>=': return x >= y;
        default: throw new Error('Unknown operator');
      }
    }
  }
}

export function evaluateCondition(source: string, span: unknown, session: unknown): boolean {
  try {
    return Boolean(evaluate(parse(tokenize(source)), { span, session }));
  } catch {
    return false;
  }
}
