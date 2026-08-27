import { GRAVITY, CANVAS_W } from '../constants.js';
import { gameState, player, particles, burst, burstHearts, floatText, commitBestScore, caesar } from '../model/state.js';
import { coins, enemies, prizeBoxes, pigeons, boxItems, platforms, QUIZ_QUESTIONS } from '../model/level.js';
import { SFX } from '../audio.js';
import { isJump, isLeft, isRight, isRestart, consumePet, consumeTreat } from './input.js';
import { overlap, playerHit, resolveVsWorld, resetPlayer, resetGame, nextLevel, retryLevel } from './physics.js';

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
    // First quiz box hit in L2 or L3 drops a treat
    if ((gameState.currentLevel === 2 || gameState.currentLevel === 3) &&
        !gameState.treatDropped && gameState.treats < 5) {
      gameState.treatDropped = true;
      gameState.treats++;
      floatText(b.x + b.w / 2, b.y - 36, '🐟 +1 TREAT!', '#ff9900');
    }
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
      if (gameState.levelComplete)                          nextLevel();
      else if (gameState.showCaesarIntro)                   { gameState.showCaesarIntro = false; }
      else if (gameState.gameOver && gameState.levelFailed) retryLevel();
      else if (gameState.gameWon)                           resetGame();
    }
    gameState.restartHeld = true;
  } else {
    gameState.restartHeld = false;
  }

  if (gameState.gameOver || gameState.gameWon || gameState.levelComplete) {
    commitBestScore();
    return;
  }

  if (gameState.showCaesarIntro) return;

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
    // Caesar hops toward player during celebration
    if (caesar.active && (caesar.met || caesar.roaming)) {
      const targetX = player.x - 44;
      const dx = targetX - caesar.x;
      if (Math.abs(dx) > 6) {
        caesar.x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.09, 2.5) * dt;
        caesar.facing = dx > 0 ? 1 : -1;
      }
      caesar.x = Math.max(0, Math.min(caesar.x, gameState.worldW - caesar.w));
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
    if (gameState.lives <= 0) { gameState.gameOver = true; gameState.levelFailed = true; SFX.gameOver(); return; }
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
        const baseVx   = [0, 0, 3.0, 3.2, 3.6, 4.0][gameState.currentLevel] || 3.0;
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
    const wingSpeed = 14;
    if (pg.wingTimer > wingSpeed) { pg.wingFrame = (pg.wingFrame + 1) % 4; pg.wingTimer = 0; }
    if (pg.x < -100 || pg.x > gameState.worldW + 100) { pigeons.splice(i, 1); continue; }

    if (!overlap(player, pg)) continue;
    if (player.vy > 0 && player.y + player.h < pg.y + pg.h * 0.6) {
      // Stomped — uses full pigeon rect so landing from above always registers
      const killScore = pg.isDanger ? 1000 : 500;
      pigeons.splice(i, 1);
      player.vy = -9;
      gameState.score += 500;
      gameState.killScore += killScore;
      checkKillScore(pg.x + pg.w / 2, pg.y);
      SFX.stomp();
      burst(pg.x + pg.w / 2, pg.y + pg.h / 2, pg.isDanger ? '#ff5533' : '#aaaacc');
      floatText(pg.x + pg.w / 2, pg.y, '+500', '#FFD700');
    } else if (player.invincible <= 0 && player.shieldTimer <= 0) {
      // Only hurt player when inside the tighter inner hitbox (avoids edge grazes)
      const pgHit = { x: pg.x + pg.w * 0.2, y: pg.y + pg.h * 0.2, w: pg.w * 0.6, h: pg.h * 0.6 };
      if (!overlap(ph, pgHit)) continue;
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; gameState.levelFailed = true; SFX.gameOver(); }
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
    if (e.x <= e.left) {
      e.x = e.left + 1; e.vx = Math.abs(e.vx); e.facing = 1;
    } else if (e.x + e.w >= e.right) {
      e.x = e.right - e.w - 1; e.vx = -Math.abs(e.vx); e.facing = -1;
    }
    e.walkTimer += dt;
    if (e.walkTimer > 10) { e.walkFrame = (e.walkFrame + 1) % 4; e.walkTimer = 0; }

    if (!overlap(player, e)) continue;
    if (player.vy > 0 && player.y + player.h < e.y + e.h * 0.6) {
      e.alive = false;
      player.vy = -9;
      gameState.score += 200;
      gameState.killScore += 200;
      checkKillScore(e.x + e.w / 2, e.y);
      SFX.stomp();
      burst(e.x + e.w / 2, e.y + e.h / 2, '#8B4513');
    } else if (player.invincible <= 0 && player.shieldTimer <= 0 && overlap(ph, e)) {
      player.invincible = 100;
      gameState.lives--;
      SFX.hit();
      if (gameState.lives <= 0) { gameState.gameOver = true; gameState.levelFailed = true; SFX.gameOver(); }
    }
  }

  // Prevent enemies visually overlapping each other
  for (let i = 0; i < enemies.length; i++) {
    if (!enemies[i].alive) continue;
    for (let j = i + 1; j < enemies.length; j++) {
      if (!enemies[j].alive) continue;
      if (overlap(enemies[i], enemies[j])) {
        enemies[i].vx *= -1; enemies[i].facing = enemies[i].vx > 0 ? 1 : -1;
        enemies[j].vx *= -1; enemies[j].facing = enemies[j].vx > 0 ? 1 : -1;
      }
    }
  }

  // ── Caesar the cat ──────────────────────────────────────────────────────────
  if (caesar.active) {
    if (caesar.debugPoseIndex !== undefined) {
      delete caesar.debugPoseIndex;
      delete caesar.debugPoseTimer;
    } else {

    // Paw-print cue when Caesar first scrolls into view (L2-3, before found)
    if (!caesar.scrollSeen && caesar.curled) {
      const cxScreen = caesar.x - gameState.cameraX;
      if (cxScreen >= -10 && cxScreen < CANVAS_W) {
        caesar.scrollSeen = true;
        if (!gameState.caesarEverMet) floatText(caesar.x, caesar.y - 24, '🐾', '#ffcc00');
      }
    }

    // Proximity flag (drives pet button state + proximity glow in draw)
    if (!caesar.roaming && !caesar.met) {
      gameState.caesarNear = Math.hypot(
        player.x + player.w / 2 - caesar.x - caesar.w / 2,
        player.y + player.h / 2 - caesar.y - caesar.h / 2
      ) < 65;
    } else {
      gameState.caesarNear = false;
    }

    // Pet (L2-3: once per level — grants player immunity)
    if (gameState.caesarNear && consumePet()) {
      caesar.curled     = false;
      caesar.met        = true;
      caesar.roaming    = true;
      caesar.enhanced   = false;
      caesar.sleeping   = false;
      caesar.petTimer   = 90;
      player.shieldTimer = 360; // ~6 seconds of pigeon/enemy immunity
      gameState.caesarEverMet = true;
      SFX.prize();
      floatText(caesar.x + caesar.w / 2, caesar.y - 12, '🛡 SHIELDED!', '#FFD700');
      burst(caesar.x + caesar.w / 2, caesar.y, '#FFD700', 8);
      burst(caesar.x + caesar.w / 2, caesar.y, '#ff9900', 5);
    }

    // Treat (L4+: enhanced mode — also catches flying pigeons + jumps)
    if ((caesar.met || caesar.roaming) && gameState.currentLevel >= 4 &&
        gameState.treats > 0 && caesar.catchTimer <= 0 &&
        gameState.treatButtonCooldown <= 0 && consumeTreat()) {
      gameState.treats--;
      gameState.treatButtonCooldown = 1200; // 20-second cooldown at 60fps
      caesar.catchTimer = 600;
      caesar.enhanced   = true;
      caesar.sleeping   = false;
      caesar.petTimer   = 60;
      SFX.prize();
      floatText(caesar.x + caesar.w / 2, caesar.y - 14, '🐟 NOM NOM!', '#ff9900');
      burst(caesar.x + caesar.w / 2, caesar.y, '#ff9900', 10);
    }

    // Gravity
    if (!caesar.onGround) caesar.vy = Math.min(caesar.vy + GRAVITY * dt, 16);
    caesar.y += caesar.vy * dt;

    // Platform resolution
    caesar.onGround = false;
    caesar.onElevated = false;
    for (const p of platforms) {
      if (caesar.x + caesar.w <= p.x || caesar.x >= p.x + p.w) continue;
      if (caesar.vy >= 0 && caesar.y + caesar.h >= p.y && caesar.y + caesar.h < p.y + p.h + 15) {
        caesar.y = p.y - caesar.h;
        caesar.vy = 0;
        caesar.onGround = true;
        if (p.h <= 25) caesar.onElevated = true;
      }
    }
    if (caesar.y >= 368) { caesar.y = 368; caesar.vy = 0; caesar.onGround = true; }

    // Roaming follow (L4+)
    if (caesar.roaming) {
      if (Math.abs(caesar.vx) < 0.5 && caesar.onGround) {
        caesar.idleTimer = Math.min(caesar.idleTimer + dt, 720);
      } else {
        caesar.idleTimer = 0;
        caesar.lyingPose = false;
        caesar.sitPose   = false;
        caesar.sleeping  = false;
      }
      if (caesar.idleTimer >= 600 && !caesar.lyingPose) caesar.lyingPose = true;
      if (caesar.idleTimer < 480 &&  caesar.lyingPose)  caesar.lyingPose = false;
      if (caesar.idleTimer >= 300 && !caesar.sitPose)   caesar.sitPose = true;
      if (caesar.idleTimer < 200 &&  caesar.sitPose)    caesar.sitPose = false;
      // Jump up to player's platform — only re-evaluate if player has moved since last decision
      if (caesar.jumpCooldown > 0) caesar.jumpCooldown -= dt;
      if (caesar.onGround && player.y < caesar.y - 25 && caesar.jumpCooldown <= 0) {
        const playerMoved = caesar.jumpDecisionX === null ||
          Math.abs(player.x - caesar.jumpDecisionX) > 80 ||
          Math.abs(player.y - caesar.jumpDecisionY) > 40;
        if (!playerMoved && caesar.onElevated) {
          // Already on a tile, player hasn't moved — hold position
          caesar.jumpCooldown = 60;
        } else if (playerMoved) {
          caesar.jumpDecisionX = player.x;
          caesar.jumpDecisionY = player.y;
          const pNear = platforms.find(p =>
            p.h <= 25 &&
            p.w >= caesar.w * 0.7 &&  // wide enough to land on
            Math.abs(p.y - caesar.h - player.y) < 22 &&
            p.x < caesar.x + 90 && p.x + p.w > caesar.x - 50
          );
          if (pNear) {
            caesar.vy = -9; caesar.onGround = false; caesar.jumpCooldown = 150;
          } else {
            caesar.jumpCooldown = 90;
          }
        } else {
          caesar.jumpCooldown = 45;
        }
      }
      // Protection mode: lead ahead of player; otherwise follow behind
      const targetX = (caesar.enhanced && caesar.catchTimer > 0)
        ? player.facing === 1
          ? player.x + player.w + 20
          : player.x - caesar.w - 20
        : player.x - 55;
      const dx = targetX - caesar.x;
      const absDx = Math.abs(dx);
      caesar.vx = absDx > 12
        ? Math.sign(dx) * Math.min(absDx * 0.12, 3.5)
        : caesar.vx * Math.pow(0.85, dt);
      // Pit detection — runs after vx is set so stopping/jumping overrides follow logic
      if (caesar.onGround && !caesar.onElevated && Math.abs(caesar.vx) > 0.3) {
        const dir = caesar.vx > 0 ? 1 : -1;
        const checkX = dir > 0 ? caesar.x + caesar.w + 8 : caesar.x - 8;
        const feetY = caesar.y + caesar.h;
        const hasPlatformAhead = platforms.some(p =>
          checkX >= p.x && checkX <= p.x + p.w &&
          p.y >= feetY - 8 && p.y <= feetY + 30
        );
        if (!hasPlatformAhead && checkX > 0 && checkX < gameState.worldW) {
          const playerOnOtherSide = dir > 0
            ? player.x > caesar.x + caesar.w
            : player.x + player.w < caesar.x;
          if (playerOnOtherSide) {
            const landing = platforms
              .filter(p => dir > 0 ? p.x > checkX : p.x + p.w < checkX)
              .sort((a, b) => dir > 0 ? a.x - b.x : (b.x + b.w) - (a.x + a.w))[0];
            const jumpVy  = -13;
            const airtime = (2 * 13) / GRAVITY;
            let jumpVx = dir * 4;
            if (landing) {
              const landX = dir > 0
                ? landing.x + landing.w * 0.4
                : landing.x + landing.w * 0.6;
              const dist = Math.abs(landX - (caesar.x + caesar.w / 2));
              jumpVx = dir * Math.max(3.5, Math.min(dist / airtime * 1.2, 7));
            }
            caesar.vy = jumpVy; caesar.onGround = false; caesar.vx = jumpVx;
          } else {
            caesar.vx = 0;
          }
        }
      }
      caesar.x += caesar.vx * dt;
      if (Math.abs(caesar.vx) > 0.1) caesar.facing = caesar.vx > 0 ? 1 : -1;
      caesar.x = Math.max(0, Math.min(caesar.x, gameState.worldW - caesar.w));
    }

    if (caesar.petTimer > 0) caesar.petTimer -= dt;

    // Active catch window
    if (caesar.catchTimer > 0) {
      caesar.catchTimer -= dt;
    }
    if (gameState.treatButtonCooldown > 0) {
      gameState.treatButtonCooldown -= dt;
      if (gameState.treatButtonCooldown < 0) gameState.treatButtonCooldown = 0;
    }
    if (caesar.catchTimer > 0) {
      const RANGE = 200;

      // Enhanced: jump toward nearby flying pigeons
      if (caesar.enhanced && caesar.onGround) {
        for (const pg of pigeons) {
          if (pg.y < 310 && Math.abs(pg.x + pg.w / 2 - caesar.x - caesar.w / 2) < 110) {
            caesar.vy = -10; caesar.onGround = false;
            caesar.facing = pg.x > caesar.x ? 1 : -1;
            break;
          }
        }
      }

      // Pigeon catch
      for (let i = pigeons.length - 1; i >= 0; i--) {
        const pg = pigeons[i];
        if (pg.y < 310 && !caesar.enhanced) continue; // flying pigeons only in enhanced mode
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

      // Enemy kill
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
        caesar.enhanced = false;
        floatText(caesar.x + caesar.w / 2, caesar.y - 10, 'zzz...', '#aaeeff');
      }
    }

    // Walk animation
    if (Math.abs(caesar.vx) > 0.3) {
      caesar.walkTimer += dt;
      if (caesar.walkTimer > 10) { caesar.walkFrame = (caesar.walkFrame + 1) % 2; caesar.walkTimer = 0; }
    } else {
      caesar.walkFrame = 0;
    }
    } // end non-debug
  }

  // ── Player animation ─────────────────────────────────────────────────────────
  if (Math.abs(player.vx) > 0.5) {
    player.walkTimer += dt;
    if (player.walkTimer > 9) { player.walkFrame = (player.walkFrame + 1) % 2; player.walkTimer = 0; }
  } else {
    player.walkFrame = 0;
  }
  if (player.invincible > 0) player.invincible -= dt;
  if (player.shieldTimer > 0) player.shieldTimer -= dt;

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
