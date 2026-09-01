import { settings } from './model/settings.js';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function tone(freq, endFreq, type, dur, vol) {
  if (!settings.sfx) return;
  resumeAudio();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type || 'square';
  const t = audioCtx.currentTime;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq && endFreq !== freq)
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  gain.gain.setValueAtTime(vol || 0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

export function schedule(notes) {
  notes.forEach(n =>
    setTimeout(() => tone(n.f, n.f2 || n.f, n.type || 'square', n.dur, n.vol || 0.25), n.delay || 0)
  );
}

// 4 distinct piano-note sounds
const NOTE_SOUNDS = [
  [{ f: 523,  dur: 0.14, type: 'sine', vol: 0.30 }],
  [{ f: 659,  dur: 0.14, type: 'sine', vol: 0.30 }],
  [{ f: 784,  dur: 0.10, type: 'sine', vol: 0.28 },
   { f: 1047, dur: 0.10, type: 'sine', vol: 0.28, delay: 110 }],
  [{ f: 523,  dur: 0.07, type: 'sine', vol: 0.25 },
   { f: 659,  dur: 0.07, type: 'sine', vol: 0.25, delay: 80  },
   { f: 784,  dur: 0.07, type: 'sine', vol: 0.25, delay: 160 },
   { f: 1047, dur: 0.12, type: 'sine', vol: 0.30, delay: 240 }],
];

export const SFX = {
  jump:          () => tone(300, 700, 'square', 0.12, 0.2),
  note:          (t = 0) => schedule(NOTE_SOUNDS[t % 4]),
  stomp:         () => tone(350, 80, 'sawtooth', 0.13, 0.35),
  hit:           () => schedule([
    { f: 500, f2: 120, dur: 0.18, type: 'sawtooth', vol: 0.35 },
    { f: 200, f2: 80,  dur: 0.12, type: 'sawtooth', vol: 0.20, delay: 100 },
  ]),
  prize:         () => schedule([
    { f: 523,  dur: 0.08, type: 'sine', vol: 0.30 },
    { f: 659,  dur: 0.08, type: 'sine', vol: 0.30, delay: 90  },
    { f: 784,  dur: 0.08, type: 'sine', vol: 0.30, delay: 180 },
    { f: 1047, dur: 0.18, type: 'sine', vol: 0.35, delay: 270 },
  ]),
  quizOk:        () => schedule([
    { f: 784,  dur: 0.10, type: 'sine', vol: 0.30 },
    { f: 1047, dur: 0.20, type: 'sine', vol: 0.35, delay: 120 },
  ]),
  quizBad:       () => schedule([
    { f: 300, f2: 180, dur: 0.20, type: 'sawtooth', vol: 0.30 },
    { f: 200, f2: 120, dur: 0.18, type: 'sawtooth', vol: 0.25, delay: 180 },
  ]),
  pigeon:        () => schedule([
    { f: 380, f2: 340, dur: 0.14, type: 'sine', vol: 0.18 },
    { f: 380, f2: 310, dur: 0.18, type: 'sine', vol: 0.14, delay: 210 },
    { f: 355, f2: 290, dur: 0.18, type: 'sine', vol: 0.12, delay: 460 },
  ]),
  gameOver:      () => schedule([
    { f: 494, dur: 0.18 },
    { f: 440, dur: 0.18, delay: 200 },
    { f: 392, dur: 0.18, delay: 400 },
    { f: 330, dur: 0.35, delay: 600 },
  ]),
  win:           () => schedule([
    { f: 523,  dur: 0.10, type: 'sine' },
    { f: 659,  dur: 0.10, type: 'sine', delay: 110 },
    { f: 784,  dur: 0.10, type: 'sine', delay: 220 },
    { f: 1047, dur: 0.10, type: 'sine', delay: 330 },
    { f: 1319, dur: 0.25, type: 'sine', delay: 440 },
  ]),
  levelComplete: () => schedule([
    { f: 523,  dur: 0.10, type: 'sine', vol: 0.32 },
    { f: 659,  dur: 0.10, type: 'sine', vol: 0.30, delay: 110 },
    { f: 784,  dur: 0.10, type: 'sine', vol: 0.30, delay: 220 },
    { f: 1047, dur: 0.15, type: 'sine', vol: 0.35, delay: 330 },
    { f: 1319, dur: 0.15, type: 'sine', vol: 0.35, delay: 490 },
    { f: 1047, dur: 0.30, type: 'sine', vol: 0.40, delay: 660 },
  ]),
};

// ── Background music — gentle C-major pentatonic arpeggio, looping ────────────
// Master gain: muting/unmuting fades this node, so all music notes route through it.
const bgGain = audioCtx.createGain();
bgGain.connect(audioCtx.destination);
bgGain.gain.value = 0;  // silent until startBgMusic() is called

const BG_TEMPO = 0.26;                 // seconds per eighth note (≈115 BPM)
const BG_LOOP  = 16 * BG_TEMPO;       // full loop length (~4.16 s)

// Each entry: { t: offset_s, f: hz, d: duration_s, bass: bool }
const BG_NOTES = [
  // Melody — triangle wave, ascending & descending arpeggio
  { t: BG_TEMPO *  0, f: 523,  d: BG_TEMPO * 0.82 },   // C5
  { t: BG_TEMPO *  1, f: 659,  d: BG_TEMPO * 0.82 },   // E5
  { t: BG_TEMPO *  2, f: 784,  d: BG_TEMPO * 0.82 },   // G5
  { t: BG_TEMPO *  3, f: 1047, d: BG_TEMPO * 0.82 },   // C6
  { t: BG_TEMPO *  4, f: 880,  d: BG_TEMPO * 0.82 },   // A5
  { t: BG_TEMPO *  5, f: 784,  d: BG_TEMPO * 0.82 },   // G5
  { t: BG_TEMPO *  6, f: 659,  d: BG_TEMPO * 0.82 },   // E5
  { t: BG_TEMPO *  7, f: 523,  d: BG_TEMPO * 1.40 },   // C5 (held)
  // Second phrase — slight ascent variation
  { t: BG_TEMPO *  8, f: 659,  d: BG_TEMPO * 0.82 },   // E5
  { t: BG_TEMPO *  9, f: 784,  d: BG_TEMPO * 0.82 },   // G5
  { t: BG_TEMPO * 10, f: 1047, d: BG_TEMPO * 0.82 },   // C6
  { t: BG_TEMPO * 11, f: 1319, d: BG_TEMPO * 0.82 },   // E6
  { t: BG_TEMPO * 12, f: 1047, d: BG_TEMPO * 0.82 },   // C6
  { t: BG_TEMPO * 13, f: 784,  d: BG_TEMPO * 0.82 },   // G5
  { t: BG_TEMPO * 14, f: 659,  d: BG_TEMPO * 0.82 },   // E5
  { t: BG_TEMPO * 15, f: 523,  d: BG_TEMPO * 1.40 },   // C5 (held)
  // Bass — sine wave, half-speed chord roots
  { t: BG_TEMPO *  0, f: 131,  d: BG_TEMPO * 3.6, bass: true },  // C3
  { t: BG_TEMPO *  4, f: 196,  d: BG_TEMPO * 3.6, bass: true },  // G3
  { t: BG_TEMPO *  8, f: 165,  d: BG_TEMPO * 3.6, bass: true },  // E3
  { t: BG_TEMPO * 12, f: 196,  d: BG_TEMPO * 3.6, bass: true },  // G3
];

function bgScheduleLoop(startTime) {
  for (const n of BG_NOTES) {
    const t = startTime + n.t;
    if (t < audioCtx.currentTime - 0.05) continue;
    const osc = audioCtx.createOscillator();
    const gn  = audioCtx.createGain();
    osc.connect(gn);
    gn.connect(bgGain);
    osc.type = n.bass ? 'sine' : 'triangle';
    osc.frequency.value = n.f;
    const vol = n.bass ? 0.044 : 0.074;
    gn.gain.setValueAtTime(0.001, t);
    gn.gain.linearRampToValueAtTime(vol, t + 0.018);
    gn.gain.exponentialRampToValueAtTime(0.001, t + n.d);
    osc.start(t);
    osc.stop(t + n.d + 0.05);
  }
}

let bgLoopBase      = 0;
let bgBarsScheduled = 0;
let bgTimerId       = null;

export function startBgMusic() {
  if (bgTimerId !== null) return;   // already running
  resumeAudio();
  bgLoopBase      = audioCtx.currentTime + 0.1;
  bgBarsScheduled = 0;
  if (settings.music) {
    // Fade in over 1s
    bgGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    bgGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.0);
  }
  // Schedule the first bar immediately
  bgScheduleLoop(bgLoopBase);
  bgBarsScheduled = 1;
  // Lookahead scheduler — keeps 1.2s of notes queued
  bgTimerId = setInterval(() => {
    const horizon = audioCtx.currentTime + 1.2;
    while (bgLoopBase + bgBarsScheduled * BG_LOOP < horizon) {
      bgScheduleLoop(bgLoopBase + bgBarsScheduled * BG_LOOP);
      bgBarsScheduled++;
    }
  }, 400);
}

export function stopBgMusic() {
  if (bgTimerId !== null) { clearInterval(bgTimerId); bgTimerId = null; }
  bgGain.gain.cancelScheduledValues(audioCtx.currentTime);
  bgGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
}

// Smooth mute/unmute via the master gain — already-queued notes fade out
export function setBgMusicMuted(muted) {
  const shouldSilence = muted || !settings.music;
  bgGain.gain.cancelScheduledValues(audioCtx.currentTime);
  bgGain.gain.setTargetAtTime(shouldSilence ? 0 : 1, audioCtx.currentTime, 0.15);
}

// Suspend audio when window loses focus; resume when it regains it
let _suspendedByBlur = false;

function onBlur() {
  if (audioCtx.state === 'running') {
    _suspendedByBlur = true;
    audioCtx.suspend();
  }
}

export function resumeAfterPause() {
  if (_suspendedByBlur) {
    _suspendedByBlur = false;
    audioCtx.resume();
  }
}

window.addEventListener('blur', onBlur);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) onBlur();
});
