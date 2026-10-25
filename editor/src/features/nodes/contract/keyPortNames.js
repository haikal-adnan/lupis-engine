// Keyboard key name mapping to visual script port identifiers.

const KEY_NAME_MAP = {
  ',': 'Comma',
  '+': 'Plus',
  '-': 'Minus',
  '.': 'Period',
  '/': 'Slash',
  ';': 'Semicolon',
  ':': 'Colon',
  '\'': 'Quote',
  '"': 'DoubleQuote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  '=': 'Equal',
  '`': 'Backquote',
  '~': 'Tilde',
  '!': 'Exclamation',
  '@': 'At',
  '#': 'Hash',
  '$': 'Dollar',
  '%': 'Percent',
  '^': 'Caret',
  '&': 'Ampersand',
  '*': 'Asterisk',
  '(': 'ParenLeft',
  ')': 'ParenRight',
  '_': 'Underscore',
  '?': 'Question',
  '<': 'Less',
  '>': 'Greater',
  ' ': 'Space',
  'space': 'Space',
  'enter': 'Enter',
  'return': 'Enter',
  'escape': 'Escape',
  'esc': 'Escape',
  'tab': 'Tab',
  'backspace': 'Backspace',
  'delete': 'Delete',
  'del': 'Delete',
  'insert': 'Insert',
  'home': 'Home',
  'end': 'End',
  'pageup': 'PageUp',
  'pagedown': 'PageDown',
  'arrowup': 'ArrowUp',
  'up': 'ArrowUp',
  'arrowdown': 'ArrowDown',
  'down': 'ArrowDown',
  'arrowleft': 'ArrowLeft',
  'left': 'ArrowLeft',
  'arrowright': 'ArrowRight',
  'right': 'ArrowRight',
  'shift': 'Shift',
  'control': 'Control',
  'ctrl': 'Control',
  'alt': 'Alt',
  'capslock': 'CapsLock',
  'meta': 'Meta',
  'win': 'Win',
  'cmd': 'Command'
};

// Maps hardware key strings to port identifiers prefixed with 'on'
export function keyToPortId(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return 'onKey';
  const cleanKey = rawKey.trim().toLowerCase();

  if (KEY_NAME_MAP[cleanKey]) {
    return `on${KEY_NAME_MAP[cleanKey]}`;
  }

  if (/^[0-9]$/.test(cleanKey)) {
    return `onKey${cleanKey}`;
  }

  if (/^[a-z]$/.test(cleanKey)) {
    return `on${cleanKey.toUpperCase()}`;
  }

  if (/^[a-z0-9]+$/.test(cleanKey)) {
    const capitalized = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
    return `on${capitalized}`;
  }

  const safeStr = cleanKey.replace(/[^a-z0-9]/gi, '');
  return safeStr ? `on${safeStr.charAt(0).toUpperCase() + safeStr.slice(1)}` : 'onKey';
}
