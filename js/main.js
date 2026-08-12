import { canvas, ctx } from './canvas.js';
import { CANVAS_W, CANVAS_H } from './constants.js';
import { resumeAudio } from './audio.js';
import { media, gameState } from './model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons } from './model/level.js';
import './controller/input.js';                          // registers key listeners + button bindings
import { resetGame } from './controller/physics.js';
import { update } from './controller/update.js';
import {
  drawBg, drawPlatform, drawNote, drawEnemy, drawPigeon,
  drawPrizeBox, drawPlayer, drawFlag, drawParticles,
} from './view/draw.js';
import { syncUI, drawOverlay, drawQuiz } from './view/hud.js';

// ── Restart button ────────────────────────────────────────────────────────────
document.getElementById('btn-restart').addEventListener('pointerdown', e => {
  e.preventDefault(); resumeAudio(); resetGame(); syncUI();
});

// ── Custom sprite ─────────────────────────────────────────────────────────────
document.getElementById('img-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => { media.playerImage = img; };
  img.src = URL.createObjectURL(file);
  document.getElementById('img-label').textContent = '✓ ' + file.name;
});

// ── Game loop ─────────────────────────────────────────────────────────────────
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
  if (gameState.quizActive)                      drawQuiz();
  if (gameState.gameOver || gameState.gameWon)   drawOverlay();

  requestAnimationFrame(loop);
}

canvas.focus();
canvas.addEventListener('click', () => canvas.focus());
loop();
