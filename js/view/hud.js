import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState, player, caesar } from '../model/state.js';
import { coins } from '../model/level.js';
import { IS_TOUCH } from '../controller/input.js';

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

  const cx = CANVAS_W / 2;
  const y  = CANVAS_H - 24;

  // Shield immunity indicator — shown while pet protection is active
  if (player.shieldTimer > 0) {
    const pct = Math.max(0, player.shieldTimer / 360);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(cx - 82, y - 12, 164, 24);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText('🛡  SHIELDED', cx, y - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(cx - 58, y + 8, 116, 3);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx - 58, y + 8, 116 * pct, 3);
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // Keyboard prompts — desktop only (mobile has its own touch buttons)
  if (IS_TOUCH) return;

  const showPet   = gameState.caesarNear && !caesar.met && !caesar.roaming;
  const showTreat = (caesar.met || caesar.roaming) && gameState.currentLevel >= 4;
  if (!showPet && !showTreat) return;

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  if (showPet) {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle   = 'rgba(0,0,0,0.62)';
    ctx.fillRect(cx - 78, y - 12, 156, 24);
    ctx.fillStyle = '#FFD700';
    ctx.font      = 'bold 12px Courier New';
    ctx.fillText('[E]  Pet Caesar  🐾', cx, y);
  }

  if (showTreat) {
    const canUse    = gameState.treats > 0 && gameState.treatButtonCooldown <= 0;
    const boxW      = gameState.treatButtonCooldown > 0 ? 210 : 176;
    ctx.globalAlpha = canUse ? 0.90 : 0.40;
    ctx.fillStyle   = 'rgba(0,0,0,0.62)';
    ctx.fillRect(cx - boxW / 2, y - 12, boxW, 24);
    ctx.fillStyle = canUse ? '#ff9900' : '#888';
    ctx.font      = 'bold 12px Courier New';
    ctx.fillText(`[F]  Treat 🐟 (${gameState.treats})`, cx, y);

    if (gameState.treatButtonCooldown > 0) {
      const pct  = 1 - (gameState.treatButtonCooldown / 1200);
      const arcX = cx + 94;
      const arcR = 8;
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(arcX, y, arcR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.90;
      ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(arcX, y, arcR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
    }
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
    if (gameState.levelFailed) {
      ctx.fillStyle = '#e69000'; ctx.font = 'bold 60px Courier New';
      ctx.fillText('LEVEL FAILED', CANVAS_W / 2, cy - 68);

      if (gameState.currentLevel === 1) {
        ctx.fillStyle = '#fff'; ctx.font = '22px Courier New';
        ctx.fillText(`Score: ${gameState.score}`, CANVAS_W / 2, cy - 18);
        ctx.fillStyle = '#aaa'; ctx.font = '14px Courier New';
        ctx.fillText('Score resets when restarting Level 1', CANVAS_W / 2, cy + 8);
        drawBestLine(cy + 52);
      } else {
        ctx.fillStyle = '#fff'; ctx.font = '18px Courier New';
        ctx.fillText(`Score this run: ${gameState.score}`, CANVAS_W / 2, cy - 24);
        ctx.fillStyle = '#aef'; ctx.font = '14px Courier New';
        ctx.fillText(`Score from previous levels: ${gameState.levelStartScore} pts`, CANVAS_W / 2, cy + 0);
        if (gameState.levelStartScore >= 2000) {
          ctx.fillStyle = '#FFD700'; ctx.font = '14px Courier New';
          ctx.fillText(`Retry costs 2000 pts  →  you will start with ${gameState.levelStartScore - 2000} pts`, CANVAS_W / 2, cy + 22);
        } else {
          ctx.fillStyle = '#ff5555'; ctx.font = 'bold 14px Courier New';
          ctx.fillText(`Need 2000 pts to retry  (bank: ${gameState.levelStartScore} pts)`, CANVAS_W / 2, cy + 22);
        }
        drawBestLine(cy + 60);
      }
    } else {
      ctx.fillStyle = '#e63c00'; ctx.font = 'bold 66px Courier New';
      ctx.fillText('GAME OVER', CANVAS_W / 2, cy - 52);
      ctx.fillStyle = '#fff'; ctx.font = '28px Courier New';
      ctx.fillText(`Score: ${gameState.score}`, CANVAS_W / 2, cy + 10);
      drawBestLine(cy + 56);
    }
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

export function drawCaesarIntro() {
  ctx.fillStyle = 'rgba(0,0,20,0.93)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  const cx = CANVAS_W / 2;

  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 36px Courier New';
  ctx.fillText('CAESAR IS YOUR COMPANION!', cx, 90);

  ctx.fillStyle = '#e08830'; ctx.font = '56px Arial';
  ctx.fillText('🐱', cx, 168);

  ctx.fillStyle = '#ee66ff'; ctx.font = 'bold 18px Courier New';
  ctx.fillText('You have befriended Caesar the cat!', cx, 222);

  ctx.fillStyle = '#fff'; ctx.font = '16px Courier New';
  ctx.fillText('He can hunt pigeons for you — feed him a treat', cx, 260);
  ctx.fillText('and he will go into a pigeon-catching frenzy!', cx, 284);

  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 15px Courier New';
  ctx.fillText('Treats can be bought from the Inventory (🎒 icon in the top bar)', cx, 328);

  ctx.fillStyle = '#aef'; ctx.font = '14px Courier New';
  ctx.fillText('Press  SPACE / R  or click  ▶ START LEVEL 4  to begin', cx, 372);
}
