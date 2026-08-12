import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState } from '../model/state.js';
import { coins } from '../model/level.js';

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

export function syncUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('best').textContent  = Math.max(gameState.bestScore, gameState.score);
  document.getElementById('lives').textContent = gameState.lives;
  document.getElementById('coins').textContent = gameState.coinCount;
  document.getElementById('level').textContent = gameState.currentLevel;
}

export function drawLevelComplete() {
  ctx.fillStyle = 'rgba(0,0,20,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  const cy = CANVAS_H / 2;

  ctx.fillStyle = '#ee66ff'; ctx.font = 'bold 66px Courier New';
  ctx.fillText('LEVEL 1 CLEAR!', CANVAS_W / 2, cy - 52);

  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 26px Courier New';
  ctx.fillText('★  Level 2 awaits...  ★', CANVAS_W / 2, cy + 4);

  ctx.fillStyle = '#fff'; ctx.font = '24px Courier New';
  ctx.fillText(`Score so far: ${gameState.score}`, CANVAS_W / 2, cy + 44);

  drawRestartHint(IS_TOUCH ? 'Tap  ↺  to Continue' : 'Press  R  to Continue', cy + 106);
}

export function drawOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';

  const restartHint = IS_TOUCH ? 'Tap  ↺  to Restart' : 'Press  R  or tap  ↺';
  const cy = CANVAS_H / 2;

  if (gameState.gameOver) {
    ctx.fillStyle = '#e63c00'; ctx.font = 'bold 66px Courier New';
    ctx.fillText('GAME OVER', CANVAS_W / 2, cy - 52);
    ctx.fillStyle = '#fff'; ctx.font = '28px Courier New';
    ctx.fillText(`Score: ${gameState.score}`, CANVAS_W / 2, cy + 10);
    drawBestLine(cy + 56);
    drawRestartHint(restartHint, cy + 108);
  } else if (gameState.gameWon) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 68px Courier New';
    ctx.fillText('YOU WIN!', CANVAS_W / 2, cy - 64);
    ctx.fillStyle = '#fff'; ctx.font = '28px Courier New';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_W / 2, cy - 12);
    ctx.fillText(`Notes: ${gameState.coinCount} / ${coins.length}`, CANVAS_W / 2, cy + 24);
    drawBestLine(cy + 66);
    drawRestartHint(restartHint, cy + 114);
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

function drawRestartHint(text, y) {
  const btnW = IS_TOUCH ? 260 : 340, btnH = 46;
  const bx = CANVAS_W / 2 - btnW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(bx, y - btnH + 10, btnW, btnH);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ddd'; ctx.font = `${IS_TOUCH ? 22 : 20}px Courier New`;
  ctx.fillText(text, CANVAS_W / 2, y + 5);
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
    ctx.fillText('◀ ▶ to choose   Space / Enter to confirm', CANVAS_W / 2, 268);
  } else {
    ctx.fillStyle = gameState.quizAnswerCorrect ? '#44ff77' : '#ff5555';
    ctx.font = 'bold 26px Courier New';
    ctx.fillText(
      gameState.quizAnswerCorrect ? '✓  Correct! +500 bonus points!' : '✗  Wrong answer!',
      CANVAS_W / 2, 270
    );
  }
}
