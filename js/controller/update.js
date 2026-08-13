import { GRAVITY, CANVAS_W } from '../constants.js';
import { gameState, player, particles, burst, burstHearts, floatText, commitBestScore, caesar } from '../model/state.js';
import { coins, enemies, prizeBoxes, pigeons, boxItems, QUIZ_QUESTIONS } from '../model/level.js';
import { SFX } from '../audio.js';
import { isJump, isLeft, isRight, isRestart } from './input.js';
import { overlap, playerHit, resolveVsWorld, resetPlayer, resetGame, nextLevel } from './physics.js';

const SPEED = 5.5;
const JUMP  = -11;

// ── Reward helpers ─────────────────────────────────────────────────────────────

function checkKillScore(x, y) {
  if (gameState.killScore >= gameState.killThreshold) {
    gameState.killScore -= gameState.killThreshold;
    gameState.lives = Math.min(gameState.lives + 1, 9);
    gameState.killBarFlash = 50;
    floatText(x, y - 10, '+1 UP! ♥', '#ff4466');
    burst(x, y, '#ff4466', 12);
    burst(x, y, '#FFD700', 6);
    SFX.prize();
  }
}

function spawnDangerPigeon() {
  const fromLeft = Math.random() < 0.5;
  pigeons.push({
    x: fromLeft ? gameState.cameraX - 40 : gameState.cameraX + CANVAS_W + 10,
    y: 170 + Math.floor(Math.random() * 40),
    w: 36, h: 28,
    vx: (fromLeft ? 3.8 : -3.8),
    wingFrame: 0, wingTimer: 0,
    isDanger: true,
  });
}

function applyReward(item) {
  burst(item.x + 12, item.y + 12, item.color, 10);
  SFX.note(0);

  switch (item.reward) {
    case 'life':
      gameState.lives = Math.min(gameState.lives + 1, 9);
      floatText(item.x + 12, item.y - 10, '+1 ♥ LIFE', '#ff66aa');
      SFX.prize();
      break;

    case 'noteburst': {
      let picked = 0;
      for (const c of coins) {
        if (c.collected) continue;
        if (Math.abs(c.x - player.x) < 280) {
          c.collected = true;
          gameState.coinCount++;
          gameState.score += 100;
          SFX.note(c.noteType);
          burst(c.x + 8, c.y + 8, '#FFD700');
          picked++;
        }
      }
      floatText(item.x + 12, item.y - 10, `+${picked} ♪ BURST`, '#FFD700');
      break;
    }

    case 'speed':
      if (gameState.powerupActive === 'speed') {
        gameState.powerupTimer = 300;
      } else {
        gameState.speedMult    = 1.5;
        gameState.powerupActive = 'speed';
        gameState.powerupTimer  = 300;
      }
      floatText(item.x + 12, item.y - 10, 'ALLEGRO! ♪', '#44ddff');
      break;

    case 'quiz':
      gameState.quizActive        = true;
      gameState.quizData          = QUIZ_QUESTIONS[item.qi];
      gameState.quizSelected      = 0;
      gameState.quizAnswered      = false;
      gameState.quizAnswerCorrect = false;
      break;

    case 'danger': {
      // Penalty: lose 1000 pts OR reset kill progress (random)
      if (Math.random() < 0.5) {
        gameState.score = Math.max(0, gameState.score - 1000);
        floatText(item.x + 12, item.y - 10, '⚠ -1000 PTS!', '#ff4444');
      } else {
        gameState.killScore = 0;
        floatText(item.x + 12, item.y - 10, '⚠ KILL BAR RESET!', '#ff4444');
      }
      spawnDangerPigeon();
      break;
    }
  }
}

// Spawn the pop-up item above a hit box
function hitBox(b) {
  b.hit = true;
  SFX.prize();
  burst(b.x + b.w / 2, b.y, '#FFD700');

  let reward, symbol, color;
  if (b.type === 'quiz') {
    reward = 'quiz'; symbol = '?'; color = '#FFD700';
  } else if (b.type === 'danger') {
    reward = 'danger'; symbol = '☠'; color = '#ff4444';
  } else {
    const roll = Math.random();
    if      (roll < 0.34) { reward = 'life';      symbol = '♥'; color = '#ff66aa'; }
    else if (roll < 0.67) { reward = 'noteburst'; symbol = '♪'; color = '#FFD700'; }
    else                  { reward = 'speed';     symbol = '♫'; color = '#44ddff'; }
  }

  boxItems.push({
    x: b.x + Math.round(b.w / 2) - 12,
    y: b.y - 28,
    w: 24, h: 24,
    reward, symbol, color,
    qi: b.qi,
    collected: false,
    vy: -3.5,
    settled: false,
    restY: b.y - 30,
    bob: Math.random() * Math.PI * 2,
  });
}

// ── Main update ────────────────────────────────────────────────────────────────

export function update(dt) {
  // ── Restart / level-advance ─────────────────────────────────────────────────
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

  // ── Celebration ─────────────────────────────────────────────────────────────
  if (gameState.celebrating) {
    player.vx = 0;
    player.vy = Math.min(player.vy + GRAVITY * dt, 16);
    player.y += player.vy * dt;
    resolveVsWorld();
    const prevCelebTimer = gameState.celebrationTimer;
    gameState.celebrationTimer -= dt;
    if (Math.floor(prevCelebTimer / 18) > Math.floor(gameState.celebrationTimer / 18)) {
      const midX = gameState.worldW - 155;
      burstHearts(midX, 355);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.3 * dt;
      p.life -= (p.decay || 0.045) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (gameState.celebrationTimer <= 0) {
      gameState.celebrating = false;
      if (gameState.currentLevel < 5) { gameState.levelComplete = true; SFX.levelComplete(); }
      else                            { gameState.gameWon = true; SFX.win(); }
    }
    return;
  }

  // ── Quiz overlay ────────────────────────────────────────────────────────────
  if (gameState.quizActive) {
    if (gameState.quizAnswered) {
      gameState.quizTimer -= dt;
      if (gameState.quizTimer <= 0) { gameState.quizActive = false; gameState.quizData = null; }
    }
    return;
  }

  // ── Powerup timer ───────────────────────────────────────────────────────────
  if (gameState.powerupTimer > 0) {
    gameState.powerupTimer -= dt;
    if (gameState.powerupTimer <= 0) {
      gameState.speedMult    = 1;
      gameState.powerupActive = null;
    }
  }

  // ── Player movement ─────────────────────────────────────────────────────────
  const speed = SPEED * (gameState.speedScale ?? 1) * gameState.speedMult;
  if (isLeft())       { player.vx = -speed; player.facing = -1; }
  else if (isRight()) { player.vx =  speed; player.facing =  1; }
  else player.vx *= Math.pow(0.72, dt);

  const jumpNow = isJump();
  if (jumpNow && !gameState.jumpDown && player.onGround) {
    player.vy = JUMP * (gameState.jumpScale ?? 1); player.onGround = false; SFX.jump();
  }
  gameState.jumpDown = jumpNow;

  player.vy = Math.min(player.vy + GRAVITY * dt, 16);
  player.x  = Math.max(0, Math.min(player.x + player.vx * dt, gameState.worldW - player.w));
  player.y += player.vy * dt;

  // ── Prize box hit detection — must run BEFORE resolveVsWorld ─────────────────
  for (const b of prizeBoxes) {
    if (b.hit) continue;
    if (player.vy < 0 && overlap(player, b)) {
      hitBox(b);
    }
  }

  resolveVsWorld();

  if (player.y > 570) {
    gameState.lives--;
    SFX.hit();
    if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); return; }
    resetPlayer();
  }

  const ph = playerHit(); // tight hitbox for interactive collisions

  // ── Note collection ─────────────────────────────────────────────────────────
  const t = Date.now();
  for (const c of coins) {
    if (c.collected) continue;
    const cy = c.y + Math.sin(t / 400 + c.bob) * 4;
    if (overlap(ph, { x: c.x, y: cy, w: c.w, h: c.h })) {
      c.collected = true;
      gameState.coinCount++;
      gameState.score += 100;
      SFX.note(c.noteType);
      burst(c.x + 8, c.y + 8, '#FFD700');
    }
  }

  // ── Box item pop-up animation + collection ───────────────────────────────────
  for (let i = boxItems.length - 1; i >= 0; i--) {
    const item = boxItems[i];
    if (item.collected) { boxItems.splice(i, 1); continue; }

    if (!item.settled) {
      item.vy += 0.25 * dt;
      item.y  += item.vy * dt;
      if (item.y >= item.restY) { item.y = item.restY; item.vy = 0; item.settled = true; }
    }

    if (overlap(player, item)) {
      item.collected = true;
      applyReward(item);
    }
  }

  // ── Pigeon spawning — Level 2+ ───────────────────────────────────────────────
  if (gameState.currentLevel >= 2) {
    gameState.pigeonTimer += dt;
    if (gameState.pigeonTimer >= gameState.pigeonTarget) {
      gameState.pigeonTimer = 0;
      // Per-level base interval (reduces with higher level)
      const base = [0, 0, 480, 400, 320, 260][gameState.currentLevel] || 300;
      gameState.pigeonTarget = base + Math.floor(Math.random() * 120);

      const maxPigeons = [0, 0, 1, 2, 2, 3][gameState.currentLevel] || 1;
      if (pigeons.filter(p => !p.isDanger).length < maxPigeons) {
        const fromLeft = Math.random() < 0.5;
        const baseVx   = [0, 0, 3.0, 3.5, 4.5, 5.5][gameState.currentLevel] || 3.0;
        pigeons.push({
          x: fromLeft ? gameState.cameraX - 60 : gameState.cameraX + CANVAS_W + 20,
          y: 200 + Math.floor(Math.random() * 50),
          w: 36, h: 28,
          vx: fromLeft ? baseVx : -baseVx,
          wingFrame: 0, wingTimer: 0,
        });
        SFX.pigeon();
      }
    }
  }

  // ── Pigeon movement + collision ─────────────────────────────────────────────
  for (let i = pigeons.length - 1; i >= 0; i--) {
    const pg = pigeons[i];
    pg.x += pg.vx * dt;
    pg.wingTimer += dt;
    if (pg.wingTimer > 14) { pg.wingFrame = (pg.wingFrame + 1) % 2; pg.wingTimer = 0; }
    if (pg.x < -100 || pg.x > gameState.worldW + 100) { pigeons.splice(i, 1); continue; }

    if (!overlap(ph, pg)) continue;
    if (player.vy > 0 && player.y + player.h < pg.y + pg.h * 0.6) {
      // Stomped
      const killScore = pg.isDanger ? 1000 : 500;
      pigeons.splice(i, 1);
      player.vy = -9;
      gameState.score += 500;
      gameState.killScore += killScore;
      checkKillScore(pg.x + pg.w / 2, pg.y);
      SFX.stomp();
      burst(pg.x + pg.w / 2, pg.y + pg.h / 2, pg.isDanger ? '#ff5533' : '#aaaacc');
      floatText(pg.x + pg.w / 2, pg.y, '+500', '#FFD700');
    } else if (player.invincible <= 0) {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // ── Enemy movement + collision ──────────────────────────────────────────────
  for (const e of enemies) {
    if (!e.alive) continue;

    // Spawned danger enemies fall to ground level before becoming active
    if (e.spawned) {
      e.vy = (e.vy || 0) + GRAVITY * dt;
      e.y += e.vy * dt;
      if (e.y >= 368) { e.y = 368; e.vy = 0; e.spawned = false; }
      continue; // not active while falling
    }

    e.x += e.vx * dt;
    if (e.x <= e.left || e.x + e.w >= e.right) e.vx *= -1;
    e.walkTimer += dt;
    if (e.walkTimer > 10) { e.walkFrame = (e.walkFrame + 1) % 2; e.walkTimer = 0; }

    if (player.invincible > 0 || !overlap(ph, e)) continue;
    if (player.vy > 0 && player.y + player.h < e.y + e.h * 0.6) {
      e.alive = false;
      player.vy = -9;
      gameState.score += 200;
      gameState.killScore += 200;
      checkKillScore(e.x + e.w / 2, e.y);
      SFX.stomp();
      burst(e.x + e.w / 2, e.y + e.h / 2, '#8B4513');
    } else {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; SFX.gameOver(); }
    }
  }

  // Prevent enemies visually overlapping each other
  for (let i = 0; i < enemies.length; i++) {
    if (!enemies[i].alive) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      if (!enemies[j].alive) continue;
      if (overlap(enemies[i], enemies[j])) {
        enemies[i].vx *= -1;
        enemies[j].vx *= -1;
      }
    }
  }

  // ── Caesar the cat ──────────────────────────────────────────────────────────
  if (caesar.active) {
    // Follow the player, staying slightly behind
    const targetX = player.x - 55;
    const dx = targetX - caesar.x;
    caesar.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.12, 3.5);
    caesar.x += caesar.vx * dt;
    if (Math.abs(caesar.vx) > 0.1) caesar.facing = caesar.vx > 0 ? 1 : -1;
    caesar.x = Math.max(0, Math.min(caesar.x, gameState.worldW - caesar.w));

    // Walk animation
    if (Math.abs(caesar.vx) > 0.3) {
      caesar.walkTimer += dt;
      if (caesar.walkTimer > 10) { caesar.walkFrame = (caesar.walkFrame + 1) % 2; caesar.walkTimer = 0; }
    } else {
      caesar.walkFrame = 0;
    }
    if (caesar.petTimer > 0) caesar.petTimer -= dt;

    // First meeting — player touches Caesar → petting interaction
    if (!caesar.met && overlap(ph, caesar)) {
      caesar.met = true;
      caesar.petTimer = 90;
      caesar.catchTimer = 600; // 10 seconds active
      caesar.sleeping = false;
      SFX.prize();
      floatText(caesar.x + caesar.w / 2, caesar.y - 12, 'PAT PAT! ♥', '#FFD700');
      burst(caesar.x + caesar.w / 2, caesar.y, '#FFD700', 8);
      burst(caesar.x + caesar.w / 2, caesar.y, '#ff9900', 6);
    }

    // Active catch window
    if (caesar.catchTimer > 0) {
      caesar.catchTimer -= dt;
      const RANGE = 140;

      // Catch nearby pigeons
      for (let i = pigeons.length - 1; i >= 0; i--) {
        const pg = pigeons[i];
        const dist = Math.hypot(
          pg.x + pg.w / 2 - caesar.x - caesar.w / 2,
          pg.y + pg.h / 2 - caesar.y - caesar.h / 2
        );
        if (dist < RANGE) {
          burst(pg.x + pg.w / 2, pg.y + pg.h / 2, '#ff9900', 8);
          floatText(pg.x + pg.w / 2, pg.y - 10, 'CAUGHT! +300', '#ff9900');
          gameState.score += 300;
          pigeons.splice(i, 1);
          SFX.stomp();
        }
      }

      // Kill nearby enemies
      for (const e of enemies) {
        if (!e.alive || e.spawned) continue;
        const dist = Math.hypot(
          e.x + e.w / 2 - caesar.x - caesar.w / 2,
          e.y + e.h / 2 - caesar.y - caesar.h / 2
        );
        if (dist < RANGE * 0.7) {
          e.alive = false;
          burst(e.x + e.w / 2, e.y + e.h / 2, '#ff9900', 8);
          gameState.score += 200;
          SFX.stomp();
        }
      }

      if (caesar.catchTimer <= 0) {
        caesar.sleeping = true;
        floatText(caesar.x + caesar.w / 2, caesar.y - 10, 'zzz...', '#aaeeff');
      }
    }
  }

  // ── Player animation ─────────────────────────────────────────────────────────
  if (Math.abs(player.vx) > 0.5) {
    player.walkTimer += dt;
    if (player.walkTimer > 9) { player.walkFrame = (player.walkFrame + 1) % 2; player.walkTimer = 0; }
  } else {
    player.walkFrame = 0;
  }
  if (player.invincible > 0) player.invincible -= dt;

  // ── Particles ────────────────────────────────────────────────────────────────
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.3 * dt;
    p.life -= (p.decay || 0.045) * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Camera ───────────────────────────────────────────────────────────────────
  gameState.cameraX = Math.max(0, Math.min(player.x - CANVAS_W / 3, gameState.worldW - CANVAS_W));

  // ── Girl proximity transitions ────────────────────────────────────────────────
  if (gameState.girlState === 'idle' && player.x > gameState.worldW - 380) {
    gameState.girlState = 'cheer';
  }

  // ── Win trigger ───────────────────────────────────────────────────────────────
  if (!gameState.celebrating && player.x + player.w > gameState.worldW - 195) {
    gameState.girlState        = 'hearts';
    gameState.celebrating      = true;
    gameState.celebrationTimer = 180;
    player.vx    = 0;
    player.facing = 1;
    burst(gameState.worldW - 155, 360, '#ff66cc', 16);
    burst(gameState.worldW - 155, 360, '#FFD700', 12);
  }
}
