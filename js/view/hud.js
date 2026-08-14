import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState, caesar } from '../model/state.js';
import { coins } from '../model/level.js';

export function syncUI() {
  const score = gameState.score;
  const best  = Math.max(gameState.bestScore, score);
  document.getElementById('score').textContent       = score;
  document.getElementById('best').textContent        = best;
  document.getElementById('lives').textContent       = gameState.lives;
  document.getElementById('coins').textContent       = gameState.coinCount;
  document.getElementById('coins-total').textContent = coins.length;
  document.getElementById('level').textContent       = gameState.currentLevel;
}

export function drawPowerupHud() {
  if (!gameState.powerupActive) return;
  const pct  = Math.max(0, gameState.powerupTimer / 300);
  const barW = 130;
  const cx   = CANVAS_W / 2;
  const cy   = 52;

  ctx.save();
  ctx.fillStyle = 'rgba(8,28,72,0.84)';
  ctx.fillRect(cx - barW / 2 - 10, cy - 15, barW + 20, 28);
  ctx.strokeStyle = '#44ddff';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - barW / 2 - 10, cy - 15, barW + 20, 28);

  ctx.fillStyle = '#44ddff';
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♫  ALLEGRO  ♫', cx, cy - 4);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - barW / 2, cy + 7, barW, 3);
  ctx.fillStyle = '#44ddff';
  ctx.fillRect(cx - barW / 2, cy + 7, barW * pct, 3);
  ctx.restore();
}

export function drawKillBar() {
  if (gameState.killScore === 0 && gameState.killBarFlash === 0) return;
  const pct  = Math.min(1, gameState.killScore / gameState.killThreshold);
  const barY = 38;
  ctx.fillStyle = 'rgba(255,50,80,0.18)';
  ctx.fillRect(0, barY, CANVAS_W, 3);
  if (pct > 0 || gameState.killBarFlash > 0) {
    ctx.fillStyle = gameState.killBarFlash > 0 ? '#FFD700' : '#ff4466';
    ctx.fillRect(0, barY, gameState.killBarFlash > 0 ? CANVAS_W : CANVAS_W * pct, 3);
  }
  if (gameState.killBarFlash > 0) gameState.killBarFlash--;
}

export function drawCaesarHud() {
  if (!caesar.active || gameState.quizActive || gameState.levelComplete ||
      gameState.gameOver || gameState.gameWon || gameState.celebrating) return;

  // Mutually exclusive: pet requires !met, treat requires met/roaming
  const showPet   = gameState.caesarNear && !caesar.met && !caesar.roaming;
  const showTreat = (caesar.met || caesar.roaming) && gameState.currentLevel >= 3;
  if (!showPet && !showTreat) return;

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_W / 2;
  const y  = CANVAS_H - 24;

  if (showPet) {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle   = 'rgba(0,0,0,0.62)';
    ctx.fillRect(cx - 78, y - 12, 156, 24);
    ctx.fillStyle = '#FFD700';
    ctx.font      = 'bold 12px Courier New';
    ctx.fillText('[E]  Pet Caesar  🐾', cx, y);
  }

  if (showTreat) {
    const canUse    = gameState.treats > 0 && caesar.catchTimer <= 0;
    ctx.globalAlpha = canUse ? 0.90 : 0.40;
    ctx.fillStyle   = 'rgba(0,0,0,0.62)';
    ctx.fillRect(cx - 88, y - 12, 176, 24);
    ctx.fillStyle = canUse ? '#ff9900' : '#888';
    ctx.font      = 'bold 12px Courier New';
    ctx.fillText(`[F]  Treat 🐟 (${gameState.treats})`, cx, y);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawLevelComplete() {
  ctx.fillStyle = 'rgba(0,0,20,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  const cy = CANVAS_H / 2;

  const n = gameState.currentLevel;
  ctx.fillStyle = '#ee66ff'; ctx.font = 'bold 66px Courier New';
  ctx.fillText(`LEVEL ${n} CLEAR!`, CANVAS_W / 2, cy - 52);

  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 26px Courier New';
  ctx.fillText(`★  Level ${n + 1} awaits...  ★`, CANVAS_W / 2, cy + 4);

  ctx.fillStyle = '#fff'; ctx.font = '24px Courier New';
  ctx.fillText(`Score so far: ${gameState.score}`, CANVAS_W / 2, cy + 44);
}

export function drawOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  const cy = CANVAS_H / 2;

  if (gameState.gameOver) {
    ctx.fillStyle = '#e63c00'; ctx.font = 'bold 66px Courier New';
    ctx.fillText('GAME OVER', CANVAS_W / 2, cy - 52);
    ctx.fillStyle = '#fff'; ctx.font = '28px Courier New';
    ctx.fillText(`Score: ${gameState.score}`, CANVAS_W / 2, cy + 10);
    drawBestLine(cy + 56);
  } else if (gameState.gameWon) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 68px Courier New';
    ctx.fillText('YOU WIN!', CANVAS_W / 2, cy - 64);
    ctx.fillStyle = '#fff'; ctx.font = '28px Courier New';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_W / 2, cy - 12);
    ctx.fillText(`Notes: ${gameState.coinCount} / ${coins.length}`, CANVAS_W / 2, cy + 24);
    drawBestLine(cy + 66);
  }
}

function drawBestLine(y) {
  ctx.textAlign = 'center';
  if (gameState.newBest) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 24px Courier New';
    ctx.fillText(`★ NEW BEST: ${gameState.bestScore} ★`, CANVAS_W / 2, y);
  } else {
    ctx.fillStyle = '#aef'; ctx.font = '22px Courier New';
    ctx.fillText(`Best: ${gameState.bestScore}`, CANVAS_W / 2, y);
  }
}

export function drawQuiz() {
  ctx.fillStyle = 'rgba(10,0,30,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ee66ff';
  ctx.font = 'bold 28px Courier New';
  ctx.fillText('♪  MUSIC QUIZ  ♪', CANVAS_W / 2, 68);

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(60, 88, 680, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '18px Courier New';
  ctx.fillText(gameState.quizData.q, CANVAS_W / 2, 122);

  gameState.quizData.choices.forEach((ch, i) => {
    const bx = 60 + i * 240, by = 180, bw = 220, bh = 52;
    let bg = '#2a1a4a';
    if (gameState.quizAnswered)
      bg = i === gameState.quizData.answer ? '#1a6630' : (i === gameState.quizSelected ? '#661a1a' : '#2a1a4a');
    else if (i === gameState.quizSelected)
      bg = '#4433aa';
    ctx.fillStyle = bg; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = i === gameState.quizSelected ? '#ee66ff' : '#554488';
    ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = '15px Courier New';
    ctx.fillText(ch, bx + bw / 2, by + bh / 2 + 6);
  });

  if (!gameState.quizAnswered) {
    ctx.fillStyle = '#aaa'; ctx.font = '13px Courier New';
    ctx.fillText('Tap or click an answer', CANVAS_W / 2, 268);
  } else {
    ctx.fillStyle = gameState.quizAnswerCorrect ? '#44ff77' : '#ff5555';
    ctx.font = 'bold 26px Courier New';
    ctx.fillText(
      gameState.quizAnswerCorrect ? '✓  Correct! +500 bonus points!' : '✗  Wrong answer!',
      CANVAS_W / 2, 265
    );
    ctx.fillStyle = '#888'; ctx.font = '14px Courier New';
    ctx.fillText('Tap anywhere to continue', CANVAS_W / 2, 305);
  }
}
