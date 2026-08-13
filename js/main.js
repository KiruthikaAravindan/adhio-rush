import { canvas, ctx } from './canvas.js';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { resumeAudio, startBgMusic, setBgMusicMuted, SFX } from './audio.js';
import { settings, saveSettings } from './model/settings.js';
import { gameState, media } from './model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons, boxItems } from './model/level.js';
import './controller/input.js';
import { resetGame, nextLevel } from './controller/physics.js';
import { update } from './controller/update.js';
import {
  drawBg, drawPlatform, drawNote, drawEnemy, drawPigeon,
  drawPrizeBox, drawBoxItem, drawPlayer, drawGirl, drawParticles,
} from './view/draw.js';
import { syncUI, drawOverlay, drawLevelComplete, drawQuiz, drawKillBar } from './view/hud.js';

// ── Touch-device detection ─────────────────────────────────────────────────────
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');

gameState.speedScale = IS_TOUCH ? 0.62 : 1;
gameState.jumpScale  = IS_TOUCH ? 1.1 : 1;

// ── Responsive scaling ─────────────────────────────────────────────────────────
const gameWrap = document.getElementById('game-wrap');

function resizeGame() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  gameWrap.style.transform = `scale(${scale})`;
  gameWrap.style.left = `${(window.innerWidth  - CANVAS_W * scale) / 2}px`;
  gameWrap.style.top  = `${(window.innerHeight - CANVAS_H * scale) / 2}px`;
}
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', () => setTimeout(resizeGame, 120));
document.addEventListener('fullscreenchange',       () => setTimeout(resizeGame, 120));
document.addEventListener('webkitfullscreenchange', () => setTimeout(resizeGame, 120));
resizeGame();

// ── Fullscreen ─────────────────────────────────────────────────────────────────
function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
function lockLandscape() {
  if (screen.orientation && screen.orientation.lock)
    screen.orientation.lock('landscape').catch(() => {});
}
function enterFullscreen() {
  const el  = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el);
    if (p && p.then) p.then(lockLandscape).catch(() => {});
    else lockLandscape();
  } catch (_) {}
  setTimeout(resizeGame, 200);
}
function exitFullscreen() {
  const ex = document.exitFullscreen || document.webkitExitFullscreen;
  if (ex) try { ex.call(document); } catch (_) {}
}
function toggleFullscreen() { fsElement() ? exitFullscreen() : enterFullscreen(); }

// ── Background music ───────────────────────────────────────────────────────────
let bgStarted = false;
function maybeStartBgMusic() {
  if (bgStarted) return;
  bgStarted = true;
  startBgMusic();
}

// ── Welcome modal — shown on all devices ──────────────────────────────────────
const welcomeModal = document.getElementById('welcome-modal');

if (!IS_TOUCH) {
  document.getElementById('btn-start').textContent = '▶  CLICK TO PLAY';
  const hintRow = document.querySelector('.hint-row');
  if (hintRow) {
    hintRow.innerHTML =
      '<span>← →  Move</span>' +
      '<span>Space  Jump</span>' +
      '<span>R  Restart</span>';
  }
}

document.getElementById('btn-start').addEventListener('click', () => {
  resumeAudio();
  maybeStartBgMusic();
  if (IS_TOUCH) enterFullscreen();
  welcomeModal.classList.add('hidden');
  canvas.focus();
});

if (!IS_TOUCH) {
  document.addEventListener('keydown', maybeStartBgMusic, { once: true });
}

// ── Settings button ────────────────────────────────────────────────────────────
const btnSettings    = document.getElementById('btn-settings');
const settingsPanel  = document.getElementById('settings-panel');
const togMusic       = document.getElementById('tog-music');
const togSfx         = document.getElementById('tog-sfx');

function syncSettingsUI() {
  togMusic.textContent = settings.music ? 'ON' : 'OFF';
  togMusic.classList.toggle('off', !settings.music);
  togSfx.textContent = settings.sfx ? 'ON' : 'OFF';
  togSfx.classList.toggle('off', !settings.sfx);
}
syncSettingsUI();

btnSettings.addEventListener('click', () => {
  syncSettingsUI();
  settingsPanel.classList.toggle('hidden');
});
document.getElementById('btn-settings-close').addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});
// Close panel when clicking the canvas
canvas.addEventListener('click', () => settingsPanel.classList.add('hidden'));

togMusic.addEventListener('click', () => {
  settings.music = !settings.music;
  saveSettings();
  syncSettingsUI();
  setBgMusicMuted(gameState.quizActive || gameState.gameOver ||
                  gameState.gameWon    || gameState.levelComplete);
});
togSfx.addEventListener('click', () => {
  settings.sfx = !settings.sfx;
  saveSettings();
  syncSettingsUI();
});

// ── Mobile-only panel actions ──────────────────────────────────────────────────
if (IS_TOUCH) {
  document.getElementById('btn-panel-fs').addEventListener('pointerdown', e => {
    e.preventDefault();
    settingsPanel.classList.add('hidden');
    toggleFullscreen();
  });
  document.getElementById('btn-panel-restart').addEventListener('pointerdown', e => {
    e.preventDefault();
    settingsPanel.classList.add('hidden');
    resumeAudio();
    maybeStartBgMusic();
    if (gameState.levelComplete) nextLevel();
    else resetGame();
    syncUI();
  });
}

// ── Action button (game-over / level-complete) ─────────────────────────────────
const btnAction = document.getElementById('btn-action');

function syncActionBtn() {
  if (gameState.levelComplete) {
    btnAction.textContent = 'NEXT LEVEL  ▶';
    btnAction.classList.remove('hidden');
  } else if (gameState.gameOver || gameState.gameWon) {
    btnAction.textContent = 'PLAY AGAIN  ▶';
    btnAction.classList.remove('hidden');
  } else {
    btnAction.classList.add('hidden');
  }
}

btnAction.addEventListener('pointerdown', e => {
  e.preventDefault();
  resumeAudio();
  maybeStartBgMusic();
  if (gameState.levelComplete) nextLevel();
  else if (gameState.gameOver || gameState.gameWon) resetGame();
  btnAction.classList.add('hidden');
  syncUI();
});

// ── Quiz: canvas click/tap to select answers ───────────────────────────────────
canvas.addEventListener('pointerdown', e => {
  if (!gameState.quizActive) return;
  // Don't propagate to the settings-panel close handler
  e.stopPropagation();

  const rect   = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top)  * scaleY;

  if (gameState.quizAnswered) {
    // Tap anywhere to dismiss the result early
    gameState.quizActive = false;
    gameState.quizData   = null;
    return;
  }

  // Check which answer box was tapped/clicked
  const choices = gameState.quizData.choices;
  for (let i = 0; i < choices.length; i++) {
    const bx = 60 + i * 240, by = 180, bw = 220, bh = 52;
    if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
      gameState.quizSelected      = i;
      gameState.quizAnswered      = true;
      gameState.quizAnswerCorrect = i === gameState.quizData.answer;
      if (gameState.quizAnswerCorrect) { gameState.score += 500; SFX.quizOk(); }
      else SFX.quizBad();
      gameState.quizTimer = 90;  // fallback auto-dismiss after ~1.5 s
      break;
    }
  }
});

// ── Game loop ──────────────────────────────────────────────────────────────────
function loop() {
  update();

  const muteMusic = gameState.quizActive || gameState.gameOver ||
                    gameState.gameWon    || gameState.levelComplete;
  setBgMusicMuted(muteMusic);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBg();
  platforms.forEach(drawPlatform);
  drawGirl();
  coins.forEach(drawNote);
  prizeBoxes.forEach(drawPrizeBox);
  boxItems.forEach(drawBoxItem);
  enemies.forEach(e => { if (e.alive) drawEnemy(e); });
  pigeons.forEach(drawPigeon);
  drawPlayer();
  drawParticles();
  drawKillBar();
  syncUI();
  if (gameState.quizActive)                    drawQuiz();
  if (gameState.levelComplete)                 drawLevelComplete();
  if (gameState.gameOver || gameState.gameWon) drawOverlay();
  syncActionBtn();
  requestAnimationFrame(loop);
}

// ── Sprite preload — start loop only after both images are ready ───────────────
const _boyImg  = new Image();
const _girlImg = new Image();
Promise.all([
  new Promise(res => { _boyImg.onload  = res; _boyImg.onerror  = res; _boyImg.src  = 'resources/boy.png'; }),
  new Promise(res => { _girlImg.onload = res; _girlImg.onerror = res; _girlImg.src = 'resources/girl.png'; }),
]).then(() => {
  media.playerImage = _boyImg;
  media.girlImage   = _girlImg;
  canvas.focus();
  canvas.addEventListener('click', () => canvas.focus());
  loop();
});
