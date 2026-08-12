import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState } from '../model/state.js';
import { coins } from '../model/level.js';

export function syncUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('lives').textContent = gameState.lives;
  document.getElementById('coins').textContent = gameState.coinCount;
}

export function drawOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  if (gameState.gameOver) {
    ctx.fillStyle = '#e63c00'; ctx.font = 'bold 58px Courier New';
    ctx.fillText('GAME OVER', CANVAS_W/2, CANVAS_H/2 - 18);
    ctx.fillStyle = '#fff'; ctx.font = '24px Courier New';
    ctx.fillText(`Score: ${gameState.score}`, CANVAS_W/2, CANVAS_H/2 + 30);
    ctx.fillText('Press  R  or tap Restart', CANVAS_W/2, CANVAS_H/2 + 65);
  } else if (gameState.gameWon) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 62px Courier New';
    ctx.fillText('YOU WIN!', CANVAS_W/2, CANVAS_H/2 - 24);
    ctx.fillStyle = '#fff'; ctx.font = '24px Courier New';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_W/2, CANVAS_H/2 + 28);
    ctx.fillText(`Notes: ${gameState.coinCount} / ${coins.length}`, CANVAS_W/2, CANVAS_H/2 + 60);
    ctx.fillText('Press  R  or tap Restart', CANVAS_W/2, CANVAS_H/2 + 96);
  }
}

export function drawQuiz() {
  ctx.fillStyle = 'rgba(10,0,30,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ee66ff';
  ctx.font = 'bold 28px Courier New';
  ctx.fillText('♪  MUSIC QUIZ  ♪', CANVAS_W/2, 68);

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(60, 88, 680, 56);
  ctx.fillStyle = '#fff';
  ctx.font = '18px Courier New';
  ctx.fillText(gameState.quizData.q, CANVAS_W/2, 122);

  gameState.quizData.choices.forEach((ch, i) => {
    const bx = 60 + i*240, by = 180, bw = 220, bh = 52;
    let bg = '#2a1a4a';
    if (gameState.quizAnswered)
      bg = i === gameState.quizData.answer ? '#1a6630' : (i === gameState.quizSelected ? '#661a1a' : '#2a1a4a');
    else if (i === gameState.quizSelected)
      bg = '#4433aa';
    ctx.fillStyle = bg; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = i === gameState.quizSelected ? '#ee66ff' : '#554488';
    ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = '15px Courier New';
    ctx.fillText(ch, bx + bw/2, by + bh/2 + 6);
  });

  if (!gameState.quizAnswered) {
    ctx.fillStyle = '#aaa'; ctx.font = '13px Courier New';
    ctx.fillText('◀ ▶ to choose   Space / Enter to confirm', CANVAS_W/2, 268);
  } else {
    ctx.fillStyle = gameState.quizAnswerCorrect ? '#44ff77' : '#ff5555';
    ctx.font = 'bold 26px Courier New';
    ctx.fillText(
      gameState.quizAnswerCorrect ? '✓  Correct! +500 bonus points!' : '✗  Wrong answer!',
      CANVAS_W/2, 270
    );
  }
}
