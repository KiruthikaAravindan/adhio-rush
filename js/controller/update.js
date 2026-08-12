import { WORLD_W, GRAVITY, CANVAS_W } from '../constants.js';
import { gameState, player, particles, burst } from '../model/state.js';
import { coins, enemies, prizeBoxes, pigeons, QUIZ_QUESTIONS } from '../model/level.js';
import { SFX } from '../audio.js';
import { keys, isJump, isLeft, isRight, isRestart } from './input.js';
import { overlap, resolveVsWorld, resetPlayer, resetGame } from './physics.js';

const SPEED = 5.5;
const JUMP  = -11;

export function update() {
  // ── Restart ──────────────────────────────────────────────────────────────────
  if (isRestart()) {
    if (!gameState.restartHeld && (gameState.gameOver || gameState.gameWon)) resetGame();
    gameState.restartHeld = true;
  } else {
    gameState.restartHeld = false;
  }

  if (gameState.gameOver || gameState.gameWon) return;

  // ── Quiz overlay (pauses everything else) ────────────────────────────────────
  if (gameState.quizActive) {
    if (!gameState.quizAnswered) {
      const navL  = isLeft();
      const navR  = isRight();
      const navOk = isJump() || keys['Enter'];
      if (navL  && !gameState.quizNavL)  gameState.quizSelected = (gameState.quizSelected + 2) % 3;
      if (navR  && !gameState.quizNavR)  gameState.quizSelected = (gameState.quizSelected + 1) % 3;
      if (navOk && !gameState.quizNavOk) {
        gameState.quizAnswered     = true;
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
  if (isLeft())       { player.vx = -SPEED; player.facing = -1; }
  else if (isRight()) { player.vx =  SPEED; player.facing =  1; }
  else player.vx *= 0.72;

  const jumpNow = isJump();
  if (jumpNow && !gameState.jumpDown && player.onGround) {
    player.vy = JUMP; player.onGround = false; SFX.jump();
  }
  gameState.jumpDown = jumpNow;

  player.vy = Math.min(player.vy + GRAVITY, 16);
  player.x  = Math.max(0, Math.min(player.x + player.vx, WORLD_W - player.w));
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
    if (player.vy < 0 &&
        player.x + player.w > b.x && player.x < b.x + b.w &&
        player.y <= b.y + b.h && player.y + 4 >= b.y + b.h) {
      b.hit = true;
      SFX.prize();
      burst(b.x + b.w / 2, b.y, '#FFD700');
      gameState.quizActive        = true;
      gameState.quizData          = QUIZ_QUESTIONS[b.qi];
      gameState.quizSelected      = 0;
      gameState.quizAnswered      = false;
      gameState.quizAnswerCorrect = false;
    }
  }

  // ── Pigeon spawning (second half of world only) ───────────────────────────────
  if (player.x > WORLD_W * 0.45) {
    gameState.pigeonTimer++;
    if (gameState.pigeonTimer >= gameState.pigeonTarget) {
      gameState.pigeonTimer  = 0;
      gameState.pigeonTarget = 280 + Math.floor(Math.random() * 200);
      const fromLeft = Math.random() < 0.5;
      pigeons.push({
        x: fromLeft ? gameState.cameraX - 60 : gameState.cameraX + CANVAS_W + 20,
        y: 200 + Math.floor(Math.random() * 140),
        w: 36, h: 28,
        vx: fromLeft ? 2.8 : -2.8,
        wingFrame: 0, wingTimer: 0,
      });
      SFX.pigeon();
    }
  }

  // ── Pigeon movement + collision ───────────────────────────────────────────────
  for (let i = pigeons.length - 1; i >= 0; i--) {
    const pg = pigeons[i];
    pg.x += pg.vx;
    pg.wingTimer++;
    if (pg.wingTimer > 14) { pg.wingFrame = (pg.wingFrame + 1) % 2; pg.wingTimer = 0; }
    if (pg.x < -100 || pg.x > WORLD_W + 100) { pigeons.splice(i, 1); continue; }

    if (!overlap(player, pg)) continue;
    if (player.vy > 0 && player.y + player.h < pg.y + pg.h * 0.6) {
      pigeons.splice(i, 1);
      player.vy = -9;
      gameState.score += 300;
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

  // ── Camera + win ──────────────────────────────────────────────────────────────
  gameState.cameraX = Math.max(0, Math.min(player.x - CANVAS_W / 3, WORLD_W - CANVAS_W));

  if (player.x > WORLD_W - 130 && !gameState.gameWon) {
    gameState.gameWon = true; SFX.win();
  }
}
