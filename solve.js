// solve.js: a faster drop-in for make.fun's csv-reader 1.0.0 (MIT).
// run(input) returns the same {columns, rows, errors} csv-reader returns for the same {text, header}.
// Same policy, same error order; the scan is over code units with slice-built fields instead of one
// character at a time with string concatenation.

const COMMA = 44;
const QUOTE = 34;
const CR = 13;
const LF = 10;

const COMMA_END = 0;
const BREAK_END = 1;
const TEXT_END = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let line = 1;
  let recordLine = 1;
  let recordRow = null;

  let value = '';
  let ended = TEXT_END;

  // A field read as unquoted text from `pos`; `start` is the value it already holds ('' or '"', or the
  // quoted part a closing quote left). Returns the number of characters kept, which is what tells a
  // quoted field that junk followed its closing quote.
  function readUnquoted(start) {
    let parts = start === '' ? null : [start];
    let segStart = pos;
    let kept = 0;
    let i = pos;
    while (i < len) {
      const c = text.charCodeAt(i);
      if (c === COMMA || c === LF) {
        if (parts !== null) {
          if (i > segStart) parts.push(text.slice(segStart, i));
          value = parts.join('');
        } else {
          value = text.slice(segStart, i);
        }
        kept += i - segStart;
        if (c === COMMA) {
          pos = i + 1;
          ended = COMMA_END;
        } else {
          pos = i + 1;
          line += 1;
          ended = BREAK_END;
        }
        return kept;
      }
      if (c === CR) {
        if (text.charCodeAt(i + 1) === LF) {
          if (parts !== null) {
            if (i > segStart) parts.push(text.slice(segStart, i));
            value = parts.join('');
          } else {
            value = text.slice(segStart, i);
          }
          kept += i - segStart;
          pos = i + 2;
          line += 1;
          ended = BREAK_END;
          return kept;
        }
        if (parts === null) parts = [];
        if (i > segStart) parts.push(text.slice(segStart, i));
        kept += i - segStart;
        errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
        i += 1;
        segStart = i;
        continue;
      }
      i += 1;
    }
    if (parts !== null) {
      if (len > segStart) parts.push(text.slice(segStart, len));
      value = parts.join('');
    } else {
      value = start + text.slice(segStart, len);
    }
    kept += len - segStart;
    pos = len;
    ended = TEXT_END;
    return kept;
  }

  // The quoted content [s, e): CRLF and a lone CR become LF, and every LF and lone CR adds a line.
  function takeSegment(s, e) {
    let i = s;
    let last = s;
    let buf = null;
    while (i < e) {
      const c = text.charCodeAt(i);
      if (c === CR) {
        line += 1;
        if (buf === null) buf = [];
        if (i > last) buf.push(text.slice(last, i));
        buf.push('\n');
        i += text.charCodeAt(i + 1) === LF ? 2 : 1;
        last = i;
        continue;
      }
      if (c === LF) line += 1;
      i += 1;
    }
    if (buf === null) return text.slice(s, e);
    if (e > last) buf.push(text.slice(last, e));
    return buf.join('');
  }

  while (true) {
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === LF) {
        pos += 1;
        line += 1;
      } else if (c === CR && text.charCodeAt(pos + 1) === LF) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === QUOTE;
      if (quoted) {
        const open = pos;
        const openLine = line;
        let i = pos + 1;
        let segStart = i;
        let out = '';
        let closed = false;
        while (true) {
          const q = text.indexOf('"', i);
          if (q < 0) break;
          out += takeSegment(segStart, q);
          if (text.charCodeAt(q + 1) === QUOTE) {
            out += '"';
            i = q + 2;
            segStart = i;
            continue;
          }
          pos = q + 1;
          closed = true;
          break;
        }
        if (!closed) {
          pos = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          readUnquoted('"');
        } else {
          value = out;
          if (pos >= len) {
            ended = TEXT_END;
          } else {
            const c = text.charCodeAt(pos);
            if (c === COMMA) {
              pos += 1;
              ended = COMMA_END;
            } else if (c === LF) {
              pos += 1;
              line += 1;
              ended = BREAK_END;
            } else if (c === CR && text.charCodeAt(pos + 1) === LF) {
              pos += 2;
              line += 1;
              ended = BREAK_END;
            } else {
              const kept = readUnquoted(value);
              if (kept > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
            }
          }
        }
      } else {
        readUnquoted('');
      }
      fields.push(value);
    } while (ended === COMMA_END);

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
