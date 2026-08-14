import { resumeAudio } from '../audio.js';

export const keys = {};

const KC = {
  32: 'Space',      13: 'Enter',
  37: 'ArrowLeft',  38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
  65: 'KeyA', 68: 'KeyD', 83: 'KeyS', 87: 'KeyW', 82: 'KeyR',
  69: 'KeyE', 70: 'KeyF',
};

export function clearKeys() { for (const k in keys) keys[k] = false; }

function handleKeyDown(e) {
  resumeAudio();
  const code = e.code || KC[e.keyCode] || '';
  if (!code) return;
  e.preventDefault();
  e.stopPropagation();
  if (!e.repeat) keys[code] = true;
}
function handleKeyUp(e) {
  const code = e.code || KC[e.keyCode] || '';
  if (code) keys[code] = false;
}

window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
window.addEventListener('keyup',   handleKeyUp,   { capture: true });
window.addEventListener('blur', clearKeys);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeys(); });

// ── IME bypass (desktop Windows only) ──────────────────────────────────────────
// Windows IME intercepts character keys (e.code='', e.keyCode=229). A hidden
// <input> captures the IME 'input' event and maps e.data → game key.
// This must NOT run on touch devices: focusing an <input> opens the soft keyboard.
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

if (!IS_TOUCH) {
  const imeEl = document.createElement('input');
  Object.assign(imeEl.style, {
    position: 'fixed', top: '0', left: '0',
    width: '1px', height: '1px',
    opacity: '0', pointerEvents: 'none',
  });
  ['autocomplete', 'autocorrect', 'autocapitalize', 'spellcheck']
    .forEach(a => imeEl.setAttribute(a, 'off'));
  document.body.appendChild(imeEl);

  const IME_MAP = { ' ': 'Space', 'a': 'KeyA', 'd': 'KeyD', 'w': 'KeyW', 's': 'KeyS', 'r': 'KeyR', 'e': 'KeyE', 'f': 'KeyF' };
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
    if (code) { keys[code] = true; }
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

  const refocus = () => imeEl.focus();
  refocus();
  document.addEventListener('pointerdown', () => setTimeout(refocus, 0));
}

// ── On-screen jump button ──────────────────────────────────────────────────────
function bindBtn(id, code) {
  const el = document.getElementById(id);
  if (!el) return;
  const press   = e => { e.preventDefault(); resumeAudio(); keys[code] = true;  el.classList.add('pressed'); };
  const release = () => { keys[code] = false; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown',   press);
  el.addEventListener('pointerup',     release);
  el.addEventListener('pointerleave',  release);
  el.addEventListener('pointercancel', release);
}
bindBtn('btn-jump',  'Space');
bindBtn('btn-pet',   'KeyE');
bindBtn('btn-treat', 'KeyF');

// ── Virtual joystick (Option C) — drag left/right to move ───────────────────────
const joy  = document.getElementById('joystick');
const knob = document.getElementById('joy-knob');
if (joy && knob) {
  const RADIUS   = 44;   // max knob travel from center (px)
  const DEADZONE = 12;   // ignore tiny drags
  let joyId = null;      // active pointer id

  function setDir(dx) {
    keys['ArrowLeft']  = dx < -DEADZONE;
    keys['ArrowRight'] = dx >  DEADZONE;
  }
  function moveKnob(dx, dy) {
    const dist = Math.hypot(dx, dy);
    const clamp = dist > RADIUS ? RADIUS / dist : 1;
    knob.style.transform = `translate(${dx * clamp}px, ${dy * clamp}px)`;
  }
  function resetJoy() {
    joyId = null;
    keys['ArrowLeft'] = keys['ArrowRight'] = false;
    knob.style.transform = '';
    joy.classList.remove('active');
  }

  joy.addEventListener('pointerdown', e => {
    e.preventDefault();
    resumeAudio();
    joyId = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    joy.classList.add('active');
    const r = joy.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    setDir(dx); moveKnob(dx, dy);
  });
  joy.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    const r = joy.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    setDir(dx); moveKnob(dx, dy);
  });
  joy.addEventListener('pointerup',     e => { if (e.pointerId === joyId) resetJoy(); });
  joy.addEventListener('pointercancel', e => { if (e.pointerId === joyId) resetJoy(); });
}

export const isJump    = () => keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || keys['Enter'];
export const isLeft    = () => keys['ArrowLeft']  || keys['KeyA'];
export const isRight   = () => keys['ArrowRight'] || keys['KeyD'];
export const isRestart = () => keys['KeyR'] || keys['Space'] || keys['Enter'];

// One-shot consumers — read true once, then reset to false
export function consumePet()   { const v = !!keys['KeyE']; keys['KeyE'] = false; return v; }
export function consumeTreat() { const v = !!keys['KeyF']; keys['KeyF'] = false; return v; }
