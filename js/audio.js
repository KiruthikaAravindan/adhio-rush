const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function tone(freq, endFreq, type, dur, vol) {
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

// 4 distinct piano-note sounds, one per noteType symbol (♪ ♩ ♫ ♬)
const NOTE_SOUNDS = [
  [{ f: 523,  dur: 0.14, type: 'sine', vol: 0.30 }],                            // C5
  [{ f: 659,  dur: 0.14, type: 'sine', vol: 0.30 }],                            // E5
  [{ f: 784,  dur: 0.10, type: 'sine', vol: 0.28 },
   { f: 1047, dur: 0.10, type: 'sine', vol: 0.28, delay: 110 }],               // G5 → C6
  [{ f: 523,  dur: 0.07, type: 'sine', vol: 0.25 },
   { f: 659,  dur: 0.07, type: 'sine', vol: 0.25, delay: 80  },
   { f: 784,  dur: 0.07, type: 'sine', vol: 0.25, delay: 160 },
   { f: 1047, dur: 0.12, type: 'sine', vol: 0.30, delay: 240 }],               // C–E–G–C arpeggio
];

export const SFX = {
  jump:     () => tone(300, 700, 'square', 0.12, 0.2),
  note:     (t = 0) => schedule(NOTE_SOUNDS[t % 4]),
  stomp:    () => tone(350, 80, 'sawtooth', 0.13, 0.35),
  hit:      () => schedule([
    { f: 500, f2: 120, dur: 0.18, type: 'sawtooth', vol: 0.35 },
    { f: 200, f2: 80,  dur: 0.12, type: 'sawtooth', vol: 0.20, delay: 100 },
  ]),
  prize:    () => schedule([
    { f: 523,  dur: 0.08, type: 'sine', vol: 0.30 },
    { f: 659,  dur: 0.08, type: 'sine', vol: 0.30, delay: 90  },
    { f: 784,  dur: 0.08, type: 'sine', vol: 0.30, delay: 180 },
    { f: 1047, dur: 0.18, type: 'sine', vol: 0.35, delay: 270 },
  ]),
  quizOk:   () => schedule([
    { f: 784,  dur: 0.10, type: 'sine', vol: 0.30 },
    { f: 1047, dur: 0.20, type: 'sine', vol: 0.35, delay: 120 },
  ]),
  quizBad:  () => schedule([
    { f: 300, f2: 180, dur: 0.20, type: 'sawtooth', vol: 0.30 },
    { f: 200, f2: 120, dur: 0.18, type: 'sawtooth', vol: 0.25, delay: 180 },
  ]),
  pigeon:   () => schedule([
    { f: 380, f2: 340, dur: 0.14, type: 'sine', vol: 0.18 },
    { f: 380, f2: 310, dur: 0.18, type: 'sine', vol: 0.14, delay: 210 },
    { f: 355, f2: 290, dur: 0.18, type: 'sine', vol: 0.12, delay: 460 },
  ]),
  gameOver: () => schedule([
    { f: 494, dur: 0.18 },
    { f: 440, dur: 0.18, delay: 200 },
    { f: 392, dur: 0.18, delay: 400 },
    { f: 330, dur: 0.35, delay: 600 },
  ]),
  win:      () => schedule([
    { f: 523,  dur: 0.10, type: 'sine' },
    { f: 659,  dur: 0.10, type: 'sine', delay: 110 },
    { f: 784,  dur: 0.10, type: 'sine', delay: 220 },
    { f: 1047, dur: 0.10, type: 'sine', delay: 330 },
    { f: 1319, dur: 0.25, type: 'sine', delay: 440 },
  ]),
};
