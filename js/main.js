import { canvas, ctx } from './canvas.js';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { resumeAudio, startBgMusic, setBgMusicMuted } from './audio.js';
import { settings, saveSettings } from './model/settings.js';
import { gameState, media } from './model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons } from './model/level.js';
import './controller/input.js';
import { resetGame, nextLevel } from './controller/physics.js';
import { update } from './controller/update.js';
import {
  drawBg, drawPlatform, drawNote, drawEnemy, drawPigeon,
  drawPrizeBox, drawPlayer, drawGirl, drawParticles,
} from './view/draw.js';
import { syncUI, drawOverlay, drawLevelComplete, drawQuiz } from './view/hud.js';

// ── Touch-device detection ─────────────────────────────────────────────────────
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');

gameState.speedScale = IS_TOUCH ? 0.62 : 1;
gameState.jumpScale  = IS_TOUCH ? 1.2  : 1;

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

// ── Sprite loading — deferred below via Promise.all ────────────────────────────

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

// ── Background music — start once on first user interaction ───────────────────
let bgStarted = false;
function maybeStartBgMusic() {
  if (bgStarted) return;
  bgStarted = true;
  startBgMusic();
}

// ── Welcome modal ──────────────────────────────────────────────────────────────
const welcomeModal = document.getElementById('welcome-modal');
if (IS_TOUCH) {
  document.getElementById('btn-start').addEventListener('click', () => {
    resumeAudio();
    maybeStartBgMusic();
    enterFullscreen();
    welcomeModal.classList.add('hidden');
    canvas.focus();
  });
  document.getElementById('btn-fs').addEventListener('pointerdown', e => {
    e.preventDefault();
    toggleFullscreen();
  });
} else {
  welcomeModal.classList.add('hidden');
  // Start music on first key or click
  document.addEventListener('keydown',   maybeStartBgMusic, { once: true });
  document.addEventListener('pointerdown', maybeStartBgMusic, { once: true });
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

// ── Restart / next-level button ────────────────────────────────────────────────
document.getElementById('btn-restart').addEventListener('pointerdown', e => {
  e.preventDefault();
  resumeAudio();
  maybeStartBgMusic();
  if (gameState.levelComplete) nextLevel();
  else resetGame();
  syncUI();
});

// ── Settings panel ─────────────────────────────────────────────────────────────
const panelSettings = document.getElementById('settings-panel');
const togMusic      = document.getElementById('tog-music');
const togSfx        = document.getElementById('tog-sfx');

function syncSettingsUI() {
  togMusic.textContent = settings.music ? 'ON' : 'OFF';
  togMusic.classList.toggle('off', !settings.music);
  togSfx.textContent = settings.sfx ? 'ON' : 'OFF';
  togSfx.classList.toggle('off', !settings.sfx);
}
syncSettingsUI();

document.getElementById('btn-settings').addEventListener('click', () => {
  syncSettingsUI();
  panelSettings.classList.toggle('hidden');
});
document.getElementById('btn-settings-close').addEventListener('click', () => {
  panelSettings.classList.add('hidden');
});
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

// ── Game loop ──────────────────────────────────────────────────────────────────
function loop() {
  update();

  // Mute bg music during quiz / pause states; unmute during active play
  const muteMusic = gameState.quizActive || gameState.gameOver ||
                    gameState.gameWon    || gameState.levelComplete;
  setBgMusicMuted(muteMusic);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBg();
  platforms.forEach(drawPlatform);
  drawGirl();
  coins.forEach(drawNote);
  prizeBoxes.forEach(drawPrizeBox);
  enemies.forEach(e => { if (e.alive) drawEnemy(e); });
  pigeons.forEach(drawPigeon);
  drawPlayer();
  drawParticles();
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
