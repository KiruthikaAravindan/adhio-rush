import { GRAVITY, CANVAS_W } from '../constants.js';
import { gameState, player, particles, burst, commitBestScore } from '../model/state.js';
import { coins, enemies, prizeBoxes, pigeons, QUIZ_QUESTIONS } from '../model/level.js';
import { SFX } from '../audio.js';
import { keys, isJump, isLeft, isRight, isRestart } from './input.js';
import { overlap, resolveVsWorld, resetPlayer, resetGame, nextLevel } from './physics.js';

const SPEED = 5.5;
const JUMP  = -11;

export function update() {
  // ── Restart / level-advance ───────────────────────────────────────────────────
  if (isRestart()) {
    if (!gameState.restartHeld) {
      if (gameState.levelComplete)              nextLevel();
      else if (gameState.gameOver || gameState.gameWon) resetGame();
    }
    gameState.restartHeld = true;
  } else {
    gameState.restartHeld = false;
  }

  if (gameState.gameOver || gameState.gameWon || gameState.levelComplete) {
    commitBestScore();
    return;
  }

  // ── Celebration — both characters jump together for ~3 s then show overlay ────
  if (gameState.celebrating) {
    player.vx = 0;
    player.vy = Math.min(player.vy + GRAVITY, 16);
    player.y += player.vy;
    resolveVsWorld();
    gameState.celebrationTimer--;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.045;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (gameState.celebrationTimer <= 0) {
      gameState.celebrating = false;
      if (gameState.currentLevel === 1) {
        gameState.levelComplete = true;
        SFX.levelComplete();
      } else {
        gameState.gameWon = true;
        SFX.win();
      }
    }
    return;
  }

  // ── Quiz overlay (pauses everything else) ────────────────────────────────────
  if (gameState.quizActive) {
    if (!gameState.quizAnswered) {
      const navL  = isLeft();
      const navR  = isRight();
      const navOk = isJump() || keys['Enter'];
      if (navL  && !gameState.quizNavL)  gameState.quizSelected = (gameState.quizSelected + 2) % 3;
      if (navR  && !gameState.quizNavR)  gameState.quizSelected = (gameState.quizSelected + 1) % 3;
      if (navOk && !gameState.quizNavOk) {
        gameState.quizAnswered      = true;
        gameState.quizAnswerCorrect = gameState.quizSelected === gameState.quizData.answer;
        if (gameState.quizAnswerCorrect) { gameState.score += 500; SFX.quizOk(); }
        else SFX.quizBad();
        gameState.quizTimer = 140;
      }
      gameState.quizNavL  = navL;
      gameState.quizNavR  = navR;
      gameState.quizNavOk = navOk;
    } else {
      gameState.quizTimer--;
      if (gameState.quizTimer <= 0) { gameState.quizActive = false; gameState.quizData = null; }
    }
    return;
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  const speed = SPEED * (gameState.speedScale ?? 1);
  if (isLeft())       { player.vx = -speed; player.facing = -1; }
  else if (isRight()) { player.vx =  speed; player.facing =  1; }
  else player.vx *= 0.72;

  const jumpNow = isJump();
  if (jumpNow && !gameState.jumpDown && player.onGround) {
    player.vy = JUMP * (gameState.jumpScale ?? 1); player.onGround = false; SFX.jump();
  }
  gameState.jumpDown = jumpNow;

  player.vy = Math.min(player.vy + GRAVITY, 16);
  player.x  = Math.max(0, Math.min(player.x + player.vx, gameState.worldW - player.w));
  player.y += player.vy;

  resolveVsWorld();

  if (player.y > 570) {
    gameState.lives--;
    SFX.hit();
    if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); return; }
    resetPlayer();
  }

  // ── Note collection ───────────────────────────────────────────────────────────
  const t = Date.now();
  for (const c of coins) {
    if (c.collected) continue;
    const cy = c.y + Math.sin(t / 400 + c.bob) * 4;
    if (overlap(player, { x: c.x, y: cy, w: c.w, h: c.h })) {
      c.collected = true;
      gameState.coinCount++;
      gameState.score += 100;
      SFX.note(c.noteType);
      burst(c.x + 8, c.y + 8, '#FFD700');
    }
  }

  // ── Prize box — hit from below ────────────────────────────────────────────────
  for (const b of prizeBoxes) {
    if (b.hit) continue;
    if (player.vy < 0 && overlap(player, b)) {
      b.hit = true;
      SFX.prize();
      burst(b.x + b.w / 2, b.y, '#FFD700');
      player.y  = b.y + b.h;
      player.vy = 1.5;
      gameState.quizActive        = true;
      gameState.quizData          = QUIZ_QUESTIONS[b.qi];
      gameState.quizSelected      = 0;
      gameState.quizAnswered      = false;
      gameState.quizAnswerCorrect = false;
    }
  }

  // ── Pigeon spawning — Level 2 only ────────────────────────────────────────────
  if (gameState.currentLevel === 2) {
    gameState.pigeonTimer++;
    if (gameState.pigeonTimer >= gameState.pigeonTarget) {
      gameState.pigeonTimer  = 0;
      gameState.pigeonTarget = 200 + Math.floor(Math.random() * 180);
    if (pigeons.length < 2) {
      const fromLeft = Math.random() < 0.5;
      pigeons.push({
        x: fromLeft ? gameState.cameraX - 60 : gameState.cameraX + CANVAS_W + 20,
        y: 180 + Math.floor(Math.random() * 160),
        w: 36, h: 28,
        vx: fromLeft ? 3.0 : -3.0,
        wingFrame: 0, wingTimer: 0,
      });
      SFX.pigeon();
    }
    }
  }

  // ── Pigeon movement + collision ───────────────────────────────────────────────
  for (let i = pigeons.length - 1; i >= 0; i--) {
    const pg = pigeons[i];
    pg.x += pg.vx;
    pg.wingTimer++;
    if (pg.wingTimer > 14) { pg.wingFrame = (pg.wingFrame + 1) % 2; pg.wingTimer = 0; }
    if (pg.x < -100 || pg.x > gameState.worldW + 100) { pigeons.splice(i, 1); continue; }

    if (!overlap(player, pg)) continue;
    if (player.vy > 0 && player.y + player.h < pg.y + pg.h * 0.6) {
      pigeons.splice(i, 1);
      player.vy = -9;
      gameState.score += 500;   // pigeons worth more than basic enemies
      SFX.stomp();
      burst(pg.x + pg.w / 2, pg.y + pg.h / 2, '#aaaacc');
    } else if (player.invincible <= 0) {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // ── Enemy movement + collision ────────────────────────────────────────────────
  for (const e of enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    if (e.x <= e.left || e.x + e.w >= e.right) e.vx *= -1;
    e.walkTimer++;
    if (e.walkTimer > 10) { e.walkFrame = (e.walkFrame + 1) % 2; e.walkTimer = 0; }

    if (player.invincible > 0 || !overlap(player, e)) continue;
    if (player.vy > 0 && player.y + player.h < e.y + e.h * 0.6) {
      e.alive = false;
      player.vy = -9;
      gameState.score += 200;
      SFX.stomp();
      burst(e.x + e.w / 2, e.y + e.h / 2, '#8B4513');
    } else {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // ── Player animation ──────────────────────────────────────────────────────────
  if (Math.abs(player.vx) > 0.5) {
    player.walkTimer++;
    if (player.walkTimer > 9) { player.walkFrame = (player.walkFrame + 1) % 2; player.walkTimer = 0; }
  } else {
    player.walkFrame = 0;
  }
  if (player.invincible > 0) player.invincible--;

  // ── Particles ─────────────────────────────────────────────────────────────────
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.045;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Camera ────────────────────────────────────────────────────────────────────
  gameState.cameraX = Math.max(0, Math.min(player.x - CANVAS_W / 3, gameState.worldW - CANVAS_W));

  // ── Girl proximity transitions ────────────────────────────────────────────────
  if (gameState.girlState === 'idle' && player.x > gameState.worldW - 380) {
    gameState.girlState = 'cheer';
  }

  // ── Win trigger — start celebration when player touches girl ──────────────────
  if (!gameState.celebrating && player.x > gameState.worldW - 130) {
    gameState.girlState        = 'hearts';
    gameState.celebrating      = true;
    gameState.celebrationTimer = 180;   // ~3 s at 60 fps
    player.vx    = 0;
    player.facing = 1;
    burst(gameState.worldW - 96, 360, '#ff66cc', 16);
    burst(gameState.worldW - 96, 360, '#FFD700', 12);
  }
}
