import { canvas, ctx } from './canvas.js';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { resumeAudio } from './audio.js';
import { gameState } from './model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons } from './model/level.js';
import './controller/input.js';
import { resetGame } from './controller/physics.js';
import { update } from './controller/update.js';
import {
  drawBg, drawPlatform, drawNote, drawEnemy, drawPigeon,
  drawPrizeBox, drawPlayer, drawFlag, drawParticles,
} from './view/draw.js';
import { syncUI, drawOverlay, drawQuiz } from './view/hud.js';

// ── Touch-device detection — mobile UI only shows on touch-primary devices ──────
// (pointer: coarse) reflects the PRIMARY pointer, so touchscreen laptops with a
// mouse/trackpad stay on the desktop (keyboard) experience — no joystick shown.
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) document.body.classList.add('is-touch');

// ── Responsive scaling ─────────────────────────────────────────────────────────
const gameWrap = document.getElementById('game-wrap');

function resizeGame() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  gameWrap.style.transform = `scale(${scale})`;
  gameWrap.style.left = `${(window.innerWidth  - CANVAS_W * scale) / 2}px`;
  gameWrap.style.top  = `${(window.innerHeight - CANVAS_H * scale) / 2}px`;
}
window.addEventListener('resize', resizeGame);
resizeGame();

// ── Welcome modal (touch only; desktop plays immediately) ───────────────────────
const welcomeModal = document.getElementById('welcome-modal');
if (IS_TOUCH) {
  document.getElementById('btn-start').addEventListener('pointerdown', e => {
    e.preventDefault();
    resumeAudio();
    welcomeModal.classList.add('hidden');
    canvas.focus();
  });
} else {
  welcomeModal.classList.add('hidden');
}

// ── Restart button ─────────────────────────────────────────────────────────────
document.getElementById('btn-restart').addEventListener('pointerdown', e => {
  e.preventDefault(); resumeAudio(); resetGame(); syncUI();
});

// ── Game loop ──────────────────────────────────────────────────────────────────
function loop() {
  update();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBg();
  platforms.forEach(drawPlatform);
  drawFlag();
  coins.forEach(drawNote);
  prizeBoxes.forEach(drawPrizeBox);
  enemies.forEach(e => { if (e.alive) drawEnemy(e); });
  pigeons.forEach(drawPigeon);
  drawPlayer();
  drawParticles();
  syncUI();
  if (gameState.quizActive)                    drawQuiz();
  if (gameState.gameOver || gameState.gameWon) drawOverlay();
  requestAnimationFrame(loop);
}

canvas.focus();
canvas.addEventListener('click', () => canvas.focus());
loop();
