import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState, player, particles, media } from '../model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons } from '../model/level.js';
const NOTE_SYMBOLS  = ['♪', '♩', '♫', '♬'];
const NOTE_COLORS   = ['#ee66ff', '#44ddff', '#ffdd44', '#66ff99'];
const NOTE_SHADOWS  = ['#dd44dd', '#1199bb', '#cc9900', '#22cc66'];

export function drawBg() {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, '#4fa8ff');
  sky.addColorStop(1, '#a8d8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.shadowColor = '#FFE44D'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#FFE44D';
  ctx.beginPath(); ctx.arc(70, 55, 28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#7a9e8a';
  for (const mx of [80,340,620,920,1240,1560,1880,2200,2520,2840]) {
    const x = mx - gameState.cameraX * 0.5;
    if (x < -220 || x > CANVAS_W + 10) continue;
    ctx.beginPath(); ctx.moveTo(x,405); ctx.lineTo(x+110,235); ctx.lineTo(x+220,405); ctx.fill();
    ctx.fillStyle = '#688c7a';
    ctx.beginPath(); ctx.moveTo(x+60,405); ctx.lineTo(x+170,260); ctx.lineTo(x+280,405); ctx.fill();
    ctx.fillStyle = '#7a9e8a';
  }

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  for (const cx of [50,280,570,870,1200,1540,1880,2220,2560,2900]) {
    const x = cx - gameState.cameraX * 0.3;
    if (x < -240 || x > CANVAS_W + 10) continue;
    ctx.beginPath();
    ctx.arc(x+30, 82, 28, 0, Math.PI*2);
    ctx.arc(x+62, 66, 38, 0, Math.PI*2);
    ctx.arc(x+98, 82, 28, 0, Math.PI*2);
    ctx.fill();
  }
}

export function drawPlatform(p) {
  const px = p.x - gameState.cameraX;
  if (px + p.w < 0 || px > CANVAS_W) return;
  if (p.h > 25) {
    // Ground — grass top + dirt
    ctx.fillStyle = '#4caf50'; ctx.fillRect(px, p.y, p.w, 13);
    ctx.fillStyle = '#8B6340'; ctx.fillRect(px, p.y + 13, p.w, p.h - 13);
    ctx.strokeStyle = '#5a3d1a'; ctx.lineWidth = 1;
    for (let bx = p.x - (p.x % 48); bx < p.x + p.w; bx += 48) {
      const rx = bx - gameState.cameraX;
      ctx.beginPath(); ctx.moveTo(rx, p.y+13); ctx.lineTo(rx, p.y+p.h); ctx.stroke();
    }
  } else {
    // Floating — piano keys
    const kw = 13, bkw = 8, bkh = Math.ceil(p.h * 0.58);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(px, p.y, p.w, p.h);
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 0.5;
    for (let k = kw; k < p.w; k += kw) {
      ctx.beginPath(); ctx.moveTo(px+k, p.y); ctx.lineTo(px+k, p.y+p.h); ctx.stroke();
    }
    ctx.fillStyle = '#222';
    for (let k = 0; k < p.w; k += kw) {
      const bx = px + k + kw * 0.55;
      // Skip black keys that would spill past the platform's right edge.
      if (bx + bkw > px + p.w) continue;
      if ((Math.floor(k / kw) % 7) !== 2 && (Math.floor(k / kw) % 7) !== 6)
        ctx.fillRect(bx, p.y, bkw, bkh);
    }
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(px, p.y, p.w, p.h);
  }
}

export function drawNote(c) {
  if (c.collected) return;
  const bobY = Math.sin(Date.now() / 400 + c.bob) * 4;
  const cx = c.x + 8 - gameState.cameraX;
  const cy = c.y + 8 + bobY;
  ctx.save();
  ctx.shadowColor = NOTE_SHADOWS[c.noteType]; ctx.shadowBlur = 14;
  ctx.fillStyle = NOTE_COLORS[c.noteType];
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(NOTE_SYMBOLS[c.noteType], cx, cy);
  ctx.restore();
}

export function drawEnemy(e) {
  const ex = e.x - gameState.cameraX;
  if (ex + e.w < 0 || ex > CANVAS_W) return;
  const w = e.w, h = e.h;
  const goingLeft = e.vx < 0;
  const legSwing  = e.walkFrame === 0 ? 3 : -3;

  ctx.save();
  ctx.translate(ex + (goingLeft ? w : 0), e.y);
  if (goingLeft) ctx.scale(-1, 1);

  // Tail
  ctx.fillStyle = '#9090a8';
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.42);
  ctx.lineTo(w * -0.10, h * 0.56);
  ctx.lineTo(w * 0.14, h * 0.68);
  ctx.closePath(); ctx.fill();

  // Body
  ctx.fillStyle = '#b8b8cc';
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.52, w * 0.33, h * 0.25, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Folded wing
  ctx.fillStyle = '#8a8aaa';
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.46, w * 0.28, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iridescent neck patch
  ctx.fillStyle = '#8899cc';
  ctx.beginPath();
  ctx.ellipse(w * 0.66, h * 0.44, w * 0.11, h * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#c0c0d0';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.28, w * 0.15, 0, Math.PI * 2); ctx.fill();

  // Eye
  ctx.fillStyle = '#ff7700';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 1.4, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = '#cc8800';
  ctx.beginPath();
  ctx.moveTo(w * 0.92, h * 0.25); ctx.lineTo(w * 1.08, h * 0.29); ctx.lineTo(w * 0.92, h * 0.33);
  ctx.closePath(); ctx.fill();

  // Walking legs
  ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.76); ctx.lineTo(w * 0.30 + legSwing, h * 1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.52, h * 0.76); ctx.lineTo(w * 0.60 - legSwing, h * 1.0); ctx.stroke();

  ctx.restore();
}

export function drawPrizeBox(b) {
  const bx = b.x - gameState.cameraX;
  if (bx + b.w < 0 || bx > CANVAS_W) return;
  ctx.save();
  if (b.hit) {
    ctx.fillStyle = '#888'; ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(bx, b.y, b.w, b.h);
  } else {
    const styles = {
      quiz:    { glow: '#FFD700', outer: '#e6a000', inner: '#FFD700', text: '#7a4a00' },
      powerup: { glow: '#aaaaff', outer: '#6666cc', inner: '#ccccff', text: '#223' },
      danger:  { glow: '#ff4444', outer: '#cc2200', inner: '#ff6644', text: '#200' },
    };
    const s = styles[b.type] || styles.quiz;
    ctx.shadowColor = s.glow; ctx.shadowBlur = 12;
    ctx.fillStyle = s.outer; ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.fillStyle = s.inner; ctx.fillRect(bx+2, b.y+2, b.w-4, b.h-4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = s.text;
    ctx.font = `bold ${Math.min(b.w, b.h) - 4}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', bx + b.w/2, b.y + b.h/2 + 1);
    ctx.strokeStyle = s.outer; ctx.lineWidth = 1.5; ctx.strokeRect(bx, b.y, b.w, b.h);
  }
  ctx.restore();
}

// Item that pops out of a hit box and waits to be collected by the player
export function drawBoxItem(item) {
  if (item.collected) return;
  const bobY = item.settled ? Math.sin(Date.now() / 380 + item.bob) * 3 : 0;
  const ix = item.x + 12 - gameState.cameraX;
  const iy = item.y + 12 + bobY;
  ctx.save();
  // Outer glow ring
  ctx.shadowColor = item.color; ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = item.color;
  ctx.beginPath(); ctx.arc(ix, iy, 12, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Symbol
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(item.symbol, ix, iy + 1);
  ctx.restore();
}

export function drawPigeon(pg) {
  const px = pg.x - gameState.cameraX;
  if (px + pg.w < -10 || px > CANVAS_W + 10) return;
  const w = pg.w, h = pg.h;
  const wingUp    = pg.wingFrame === 0;
  const goingLeft = pg.vx < 0;

  ctx.save();
  ctx.translate(px + (goingLeft ? w : 0), pg.y);
  if (goingLeft) ctx.scale(-1, 1);

  // Tail
  ctx.fillStyle = '#a07848';
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.42);
  ctx.lineTo(w * -0.1, h * 0.56);
  ctx.lineTo(w * 0.14, h * 0.68);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = '#c8a87c';
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.52, w * 0.33, h * 0.25, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  ctx.save();
  ctx.translate(w * 0.44, h * 0.32);
  ctx.rotate(wingUp ? -0.65 : 0.45);
  ctx.fillStyle = '#a07840';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.14, w * 0.35, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Iridescent neck patch
  ctx.fillStyle = '#dd7744';
  ctx.beginPath();
  ctx.ellipse(w * 0.66, h * 0.44, w * 0.11, h * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#d4b888';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.28, w * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#ff9900';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 1.4, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = '#cc7700';
  ctx.beginPath();
  ctx.moveTo(w * 0.92, h * 0.25);
  ctx.lineTo(w * 1.08, h * 0.29);
  ctx.lineTo(w * 0.92, h * 0.33);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#cc7700'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.76); ctx.lineTo(w * 0.30, h * 1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.52, h * 0.76); ctx.lineTo(w * 0.60, h * 1.0); ctx.stroke();

  ctx.restore();
}

export function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) return;

  const DW = 96, DH = 64;
  const isAirborne = !player.onGround && !gameState.celebrating;
  // Jump sprite appears slightly smaller in the sheet; compensate by rendering it larger
  const dw = isAirborne ? 108 : DW;
  const dh = isAirborne ? 72  : DH;
  const bounceY = gameState.celebrating ? -Math.abs(Math.sin(Date.now() / 200)) * 18 : 0;
  const px = player.x - gameState.cameraX + (player.w - dw) / 2;
  const py = player.y + player.h - dh + bounceY + 3;

  if (media.playerImage) {
    let col, row;
    if (gameState.celebrating) {
      col = 0; row = 1; // idle frame — col=2 doesn't exist in the 2-column sheet
    } else if (!player.onGround) {
      col = 1; row = 1; // airborne / jump frame
    } else if (player.vx < -0.5) {
      col = 0; row = 0; // walk left
    } else if (player.vx > 0.5) {
      col = 1; row = 0; // walk right
    } else {
      col = 0; row = 1; // idle
    }
    ctx.drawImage(media.playerImage, col * 768, row * 512, 768, 512, px, py, dw, dh);
    return;
  }

  // Fallback hand-drawn character
  const bpx = player.x - gameState.cameraX;
  ctx.save();
  if (player.facing === -1) { ctx.translate(bpx + player.w, player.y + bounceY); ctx.scale(-1, 1); }
  else ctx.translate(bpx, player.y + bounceY);
  const lo = player.onGround ? (player.walkFrame === 0 ? 2 : -2) : 0;
  ctx.fillStyle = '#3a1800';
  ctx.fillRect(0+lo, 34, 13, 8); ctx.fillRect(19-lo, 34, 13, 8);
  ctx.fillStyle = '#1a5fe0'; ctx.fillRect(4, 20, 24, 20);
  ctx.fillStyle = '#e63c00'; ctx.fillRect(4, 20, 24, 12);
  ctx.fillStyle = '#fcc09a'; ctx.fillRect(8, 6, 18, 14);
  ctx.fillStyle = '#e63c00'; ctx.fillRect(2, 7, 28, 4); ctx.fillRect(6, 0, 22, 9);
  ctx.fillStyle = '#000';    ctx.fillRect(11, 9, 3, 4); ctx.fillRect(20, 9, 3, 4);
  ctx.fillStyle = '#5a3000'; ctx.fillRect(9, 15, 16, 3);
  ctx.fillStyle = '#FFD700'; ctx.fillRect(13, 22, 4, 4);
  ctx.restore();
}

export function drawGirl() {
  const gxWorld = gameState.worldW - 96;
  const gx = gxWorld - gameState.cameraX;
  if (gx < -80 || gx > CANVAS_W + 10) return;

  const DW = 43, DH = 64;
  const bounceY = gameState.celebrating ? -Math.abs(Math.sin(Date.now() / 200)) * 18 : 0;
  const py = 400 - DH + bounceY;

  if (!media.girlImage) {
    ctx.fillStyle = '#aaa'; ctx.fillRect(gx, 200, 6, 200);
    ctx.fillStyle = '#e63c00';
    ctx.beginPath(); ctx.moveTo(gx+6,202); ctx.lineTo(gx+50,222); ctx.lineTo(gx+6,242); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#888'; ctx.fillRect(gx-10, 396, 26, 8);
    return;
  }

  const FW = 418, FH = 627;
  let col, row;
  const s = gameState.girlState;
  if (gameState.celebrating) {
    // Alternate cheer-left / cheer-right while jumping together
    col = Math.floor(Date.now() / 200) % 2; row = 1;
  } else if (s === 'hearts') {
    col = 2; row = 1;
  } else if (s === 'cheer') {
    col = Math.floor(Date.now() / 220) % 2; row = 1;
  } else {
    col = 0; row = 0;
  }
  ctx.drawImage(media.girlImage, col * FW, row * FH, FW, FH, gx - DW / 2, py, DW, DH);
}

export function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.symbol) {
      ctx.fillStyle = p.color;
      ctx.font = `bold ${p.fontSize || 18}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, p.x - gameState.cameraX, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x - gameState.cameraX, p.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
