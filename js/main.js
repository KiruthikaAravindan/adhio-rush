import { canvas, ctx } from './canvas.js';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { resumeAudio, startBgMusic, setBgMusicMuted, SFX } from './audio.js';
import { settings, saveSettings } from './model/settings.js';
import { gameState, caesar, media } from './model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons, boxItems } from './model/level.js';
import './controller/input.js';
import { resetGame, nextLevel, jumpToLevel, retryLevel } from './controller/physics.js';
import { update } from './controller/update.js';
import {
  drawBg, drawPlatform, drawNote, drawEnemy, drawPigeon,
  drawPrizeBox, drawBoxItem, drawPlayer, drawGirl, drawParticles, drawCaesar,
} from './view/draw.js';
import { syncUI, drawOverlay, drawLevelComplete, drawQuiz, drawKillBar, drawPowerupHud, drawCaesarHud, drawCaesarIntro } from './view/hud.js';

// ── Touch-device detection ─────────────────────────────────────────────────────
const IS_TOUCH = ('ontouchstart' in window) || window.matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');

gameState.speedScale = IS_TOUCH ? 0.62 : 0.88;
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
const btnSettings   = document.getElementById('btn-settings');
const settingsPanel = document.getElementById('settings-panel');
const togMusic      = document.getElementById('tog-music');
const togSfx        = document.getElementById('tog-sfx');

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
  inventoryPanel.classList.add('hidden');
});
document.getElementById('btn-settings-close').addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});
// Close panels when clicking the canvas
canvas.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  inventoryPanel.classList.add('hidden');
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

// ── Inventory button + treat shop ──────────────────────────────────────────────
const inventoryPanel = document.getElementById('inventory-panel');
const btnInventory   = document.getElementById('btn-inventory');

function syncInventoryUI() {
  const treatCount  = document.getElementById('treat-count');
  const btnBuyTreat = document.getElementById('btn-buy-treat');
  if (treatCount) treatCount.textContent = gameState.treats;
  if (btnBuyTreat) {
    const canBuy = gameState.currentLevel >= 4 && gameState.treats < 5 && gameState.score >= 5000;
    btnBuyTreat.disabled = !canBuy;
    btnBuyTreat.style.opacity = canBuy ? '1' : '0.45';
  }
}

btnInventory.addEventListener('click', () => {
  syncInventoryUI();
  inventoryPanel.classList.toggle('hidden');
  settingsPanel.classList.add('hidden');
});
document.getElementById('btn-inventory-close').addEventListener('click', () => {
  inventoryPanel.classList.add('hidden');
});

const btnBuyTreat = document.getElementById('btn-buy-treat');
if (btnBuyTreat) {
  btnBuyTreat.addEventListener('click', () => {
    if (gameState.currentLevel >= 4 && gameState.score >= 5000 && gameState.treats < 5) {
      gameState.score -= 5000;
      gameState.treats++;
      syncUI();
      syncInventoryUI();
      syncCaesarBtns();
    }
  });
}

// ── Dev level-jump buttons ─────────────────────────────────────────────────────
// Add ?dev to the URL to reveal level-jump buttons (dev use only; hidden from public)
if (new URLSearchParams(window.location.search).has('dev')) {
  const devRow = document.getElementById('dev-level-row');
  if (devRow) devRow.style.display = '';
}

function syncLevelBtns() {
  [1, 2, 3, 4, 5].forEach(n => {
    const btn = document.getElementById(`btn-level-${n}`);
    if (btn) btn.classList.toggle('active', gameState.currentLevel === n);
  });
}
[1, 2, 3, 4, 5].forEach(n => {
  const btn = document.getElementById(`btn-level-${n}`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    jumpToLevel(n);
    syncLevelBtns();
    syncUI();
    settingsPanel.classList.add('hidden');
    resumeAudio();
    maybeStartBgMusic();
  });
});
syncLevelBtns();

// ── Caesar companion touch buttons ────────────────────────────────────────────
function syncCaesarBtns() {
  const btnPet   = document.getElementById('btn-pet');
  const btnTreat = document.getElementById('btn-treat');
  const n = gameState.currentLevel;

  if (btnPet) {
    const caesarOnScreen = (caesar.x - gameState.cameraX + caesar.w) >= 0 &&
                           (caesar.x - gameState.cameraX) <= CANVAS_W;
    const visible = caesar.active && n >= 2 && n <= 3 && !caesar.met && caesarOnScreen;
    btnPet.classList.toggle('hidden',   !visible);
    btnPet.classList.toggle('disabled', !gameState.caesarNear);
  }
  if (btnTreat) {
    const visible = caesar.active && n >= 4 && (caesar.met || caesar.roaming);
    btnTreat.classList.toggle('hidden',   !visible);
    btnTreat.classList.toggle('disabled', gameState.treats <= 0 || gameState.treatButtonCooldown > 0);
    const countEl = document.getElementById('treat-btn-count');
    if (countEl) countEl.textContent = gameState.treats > 0 ? ` ${gameState.treats}` : '';

    // SVG progress ring — fills as cooldown drains (shows when on cooldown)
    const ring = btnTreat.querySelector('.treat-ring');
    if (ring) {
      const CIRC = 188.5; // 2π × 30
      if (gameState.treatButtonCooldown > 0) {
        btnTreat.classList.add('on-cooldown');
        ring.style.strokeDashoffset = String(CIRC * (gameState.treatButtonCooldown / 1200));
      } else {
        btnTreat.classList.remove('on-cooldown');
        ring.style.strokeDashoffset = String(CIRC);
      }
    }
  }

  syncInventoryUI();
}

// ── Mobile-only panel actions ─────────────────────────────────────────────────
if (IS_TOUCH) {
  document.getElementById('btn-panel-fs').addEventListener('pointerdown', e => {
    e.preventDefault();
    settingsPanel.classList.add('hidden');
    toggleFullscreen();
  });
  document.getElementById('btn-panel-restart').addEventListener('pointerdown', e => {
    e.preventDefault();
    settingsPanel.classList.add('hidden');
    inventoryPanel.classList.add('hidden');
    resumeAudio();
    maybeStartBgMusic();
    if (gameState.showCaesarIntro)                   { gameState.showCaesarIntro = false; }
    else if (gameState.levelComplete)                nextLevel();
    else if (gameState.gameOver && gameState.levelFailed) retryLevel();
    else                                             resetGame();
    syncUI();
  });
}

// ── Action button (level-failed / level-complete / game-won / caesar-intro) ───
const btnAction          = document.getElementById('btn-action');
const btnActionSecondary = document.getElementById('btn-action-secondary');

function syncActionBtn() {
  if (gameState.showCaesarIntro) {
    btnAction.textContent = '▶  START LEVEL 4';
    btnAction.disabled    = false;
    btnAction.style.opacity = '1';
    btnAction.classList.remove('hidden');
    if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
  } else if (gameState.levelComplete) {
    btnAction.textContent = 'NEXT LEVEL  ▶';
    btnAction.disabled    = false;
    btnAction.style.opacity = '1';
    btnAction.classList.remove('hidden');
    if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
  } else if (gameState.gameOver && gameState.levelFailed) {
    if (gameState.currentLevel === 1) {
      // Level 1 fail — free restart, no secondary button needed
      btnAction.textContent   = 'RESTART  ▶';
      btnAction.disabled      = false;
      btnAction.style.opacity = '1';
      if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
    } else if (gameState.levelStartScore >= 2000) {
      btnAction.textContent   = 'RETRY LEVEL  ▶';
      btnAction.disabled      = false;
      btnAction.style.opacity = '1';
      if (btnActionSecondary) btnActionSecondary.classList.remove('hidden');
    } else {
      btnAction.textContent   = 'RETRY LEVEL  ▶';
      btnAction.disabled      = true;
      btnAction.style.opacity = '0.40';
      if (btnActionSecondary) btnActionSecondary.classList.remove('hidden');
    }
    btnAction.classList.remove('hidden');
  } else if (gameState.gameOver || gameState.gameWon) {
    btnAction.textContent   = 'PLAY AGAIN  ▶';
    btnAction.disabled      = false;
    btnAction.style.opacity = '1';
    btnAction.classList.remove('hidden');
    if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
  } else {
    btnAction.classList.add('hidden');
    if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
  }
}

btnAction.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (btnAction.disabled) return;
  resumeAudio();
  maybeStartBgMusic();
  if (gameState.showCaesarIntro)                   { gameState.showCaesarIntro = false; }
  else if (gameState.levelComplete)                nextLevel();
  else if (gameState.gameOver && gameState.levelFailed) {
    if (gameState.currentLevel === 1 || gameState.levelStartScore >= 2000) retryLevel();
  }
  else if (gameState.gameOver || gameState.gameWon) resetGame();
  btnAction.classList.add('hidden');
  if (btnActionSecondary) btnActionSecondary.classList.add('hidden');
  syncUI();
});

if (btnActionSecondary) {
  btnActionSecondary.addEventListener('pointerdown', e => {
    e.preventDefault();
    resumeAudio();
    maybeStartBgMusic();
    resetGame();
    btnAction.classList.add('hidden');
    btnActionSecondary.classList.add('hidden');
    syncUI();
  });
}

// ── Quiz: canvas click/tap to select answers ───────────────────────────────────
canvas.addEventListener('pointerdown', e => {
  if (!gameState.quizActive) return;
  e.stopPropagation();

  const rect   = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top)  * scaleY;

  if (gameState.quizAnswered) {
    gameState.quizActive = false;
    gameState.quizData   = null;
    return;
  }

  const choices = gameState.quizData.choices;
  for (let i = 0; i < choices.length; i++) {
    const bx = 60 + i * 240, by = 180, bw = 220, bh = 52;
    if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
      gameState.quizSelected      = i;
      gameState.quizAnswered      = true;
      gameState.quizAnswerCorrect = i === gameState.quizData.answer;
      if (gameState.quizAnswerCorrect) { gameState.score += 500; SFX.quizOk(); }
      else SFX.quizBad();
      gameState.quizTimer = 90;
      break;
    }
  }
});

// ── Game loop ──────────────────────────────────────────────────────────────────
let _lastTime = 0;

function loop() {
  const now = performance.now();
  const dt  = _lastTime ? Math.min((now - _lastTime) / (1000 / 60), 3) : 1;
  _lastTime = now;
  update(dt);

  const muteMusic = gameState.quizActive || gameState.showCaesarIntro ||
                    gameState.gameOver   || gameState.gameWon || gameState.levelComplete;
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
  drawCaesar();
  drawPlayer();
  drawParticles();
  drawKillBar();
  drawPowerupHud();
  drawCaesarHud();
  syncUI();
  syncCaesarBtns();
  if (gameState.quizActive)                    drawQuiz();
  if (gameState.showCaesarIntro)               drawCaesarIntro();
  if (gameState.levelComplete)                 drawLevelComplete();
  if (gameState.gameOver || gameState.gameWon) drawOverlay();
  syncActionBtn();
  requestAnimationFrame(loop);
}

// ── Sprite preload — start loop only after player/girl are ready ───────────────
const _boyImg  = new Image();
const _girlImg = new Image();

// Caesar and pigeon images load opportunistically — game falls back to
// canvas drawing if the files don't exist yet.
const _caesarImg = new Image();
const _pigeonImg = new Image();
_caesarImg.onload = () => { media.caesarImage = _caesarImg; };
_caesarImg.src = 'resources/caesar.png';
_pigeonImg.onload = () => { media.pigeonImage = _pigeonImg; };
_pigeonImg.src = 'resources/pigeon.png';

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
