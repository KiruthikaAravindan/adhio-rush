import { resumeAudio } from '../audio.js';

export const keys = {};

const KC = {
  32: 'Space',      13: 'Enter',
  37: 'ArrowLeft',  38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
  65: 'KeyA', 68: 'KeyD', 83: 'KeyS', 87: 'KeyW', 82: 'KeyR',
};

const dbgEl = document.getElementById('keydbg');

export function clearKeys() { for (const k in keys) keys[k] = false; }

function handleKeyDown(e) {
  resumeAudio();
  const code = e.code || KC[e.keyCode] || '';
  if (!code) return;
  e.preventDefault();
  e.stopPropagation();
  if (!e.repeat) keys[code] = true;
  dbgEl.textContent = `key: ${code}`;
}
function handleKeyUp(e) {
  const code = e.code || KC[e.keyCode] || '';
  if (code) keys[code] = false;
}

window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
window.addEventListener('keyup',   handleKeyUp,   { capture: true });
window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeys(); });

// ── IME bypass ────────────────────────────────────────────────────────────────
// Windows IME intercepts character keys (e.code='', e.keyCode=229).
// A hidden <input> captures the IME 'input' event and maps e.data → game key.
const imeEl = document.createElement('input');
Object.assign(imeEl.style, {
  position: 'fixed', top: '0', left: '0',
  width: '1px', height: '1px',
  opacity: '0', pointerEvents: 'none',
});
['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']
  .forEach(a => imeEl.setAttribute(a, 'off'));
document.body.appendChild(imeEl);

const IME_MAP = { ' ': 'Space', 'a': 'KeyA', 'd': 'KeyD', 'w': 'KeyW', 's': 'KeyS', 'r': 'KeyR' };
const imeQueue = [];

window.addEventListener('keydown', e => {
  if (e.key === 'Process' || (!e.code && e.keyCode >= 220 && !e.ctrlKey)) {
    if (!e.repeat) imeQueue.push(null);
    imeEl.focus();
    resumeAudio();
  }
}, { capture: true, passive: false });

imeEl.addEventListener('input', e => {
  const ch   = (e.data || '').toLowerCase();
  const code = IME_MAP[ch] || null;
  const i    = imeQueue.indexOf(null);
  if (i >= 0) imeQueue[i] = code;
  if (code) { keys[code] = true; dbgEl.textContent = `IME: "${ch}" → ${code}`; }
  imeEl.value = '';
});

window.addEventListener('keyup', e => {
  if (e.key === 'Process' || (!e.code && e.keyCode >= 220 && !e.ctrlKey)) {
    const code = imeQueue.shift();
    // Defer 1 frame — keyup fires before requestAnimationFrame, so deferring
    // prevents the key release from clearing the flag before the game loop sees it.
    if (code) requestAnimationFrame(() => { keys[code] = false; });
  }
}, { capture: true });

function refocus() { imeEl.focus(); }
refocus();
document.addEventListener('pointerdown', () => setTimeout(refocus, 0));

// ── On-screen movement buttons ────────────────────────────────────────────────
function bindBtn(id, code) {
  const el = document.getElementById(id);
  const press   = e => { e.preventDefault(); resumeAudio(); keys[code] = true;  el.classList.add('pressed'); };
  const release = e => { keys[code] = false; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown',   press);
  el.addEventListener('pointerup',     release);
  el.addEventListener('pointerleave',  release);
  el.addEventListener('pointercancel', release);
}
bindBtn('btn-left',  'ArrowLeft');
bindBtn('btn-right', 'ArrowRight');
bindBtn('btn-jump',  'Space');

export const isJump    = () => keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || keys['Enter'];
export const isLeft    = () => keys['ArrowLeft']  || keys['KeyA'];
export const isRight   = () => keys['ArrowRight'] || keys['KeyD'];
export const isRestart = () => keys['KeyR'];
