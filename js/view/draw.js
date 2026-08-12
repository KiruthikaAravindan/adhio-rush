import { ctx } from '../canvas.js';
import { WORLD_W, CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState, player, particles, media } from '../model/state.js';
import { platforms, coins, enemies, prizeBoxes, pigeons } from '../model/level.js';

const NOTE_SYMBOLS = ['♪', '♩', '♫', '♬'];

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
  ctx.shadowColor = '#dd88ff'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#ee66ff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(NOTE_SYMBOLS[c.noteType], cx, cy);
  ctx.restore();
}

export function drawEnemy(e) {
  const ex = e.x - gameState.cameraX;
  if (ex + e.w < 0 || ex > CANVAS_W) return;
  const lo = e.walkFrame === 0 ? 2 : -2;
  ctx.fillStyle = '#8B4513'; ctx.fillRect(ex, e.y, e.w, e.h);
  ctx.fillStyle = '#5a2800'; ctx.fillRect(ex+2, e.y, e.w-4, 10);
  ctx.fillStyle = '#fcc09a'; ctx.fillRect(ex+4, e.y+10, e.w-8, 12);
  ctx.fillStyle = '#000';
  ctx.fillRect(ex+6,      e.y+13, 5, 5);
  ctx.fillRect(ex+e.w-11, e.y+13, 5, 5);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(ex+lo,         e.y+e.h-9, 10, 9);
  ctx.fillRect(ex+e.w-10-lo, e.y+e.h-9, 10, 9);
}

export function drawPrizeBox(b) {
  const bx = b.x - gameState.cameraX;
  if (bx + b.w < 0 || bx > CANVAS_W) return;
  ctx.save();
  if (b.hit) {
    ctx.fillStyle = '#888'; ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(bx, b.y, b.w, b.h);
  } else {
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#e6a000'; ctx.fillRect(bx, b.y, b.w, b.h);
    ctx.fillStyle = '#FFD700'; ctx.fillRect(bx+2, b.y+2, b.w-4, b.h-4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#7a4a00';
    ctx.font = `bold ${b.h - 4}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', bx + b.w/2, b.y + b.h/2 + 1);
    ctx.strokeStyle = '#c88000'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, b.y, b.w, b.h);
  }
  ctx.restore();
}

export function drawPigeon(pg) {
  const px = pg.x - gameState.cameraX;
  if (px + pg.w < -10 || px > CANVAS_W + 10) return;
  const w = pg.w, h = pg.h;
  const wingUp = pg.wingFrame === 0;
  ctx.save(); ctx.translate(px, pg.y);
  ctx.fillStyle = '#a0a0b8';
  ctx.beginPath();
  if (wingUp) ctx.ellipse(w*0.35, -h*0.15, w*0.38, h*0.22, -0.4, 0, Math.PI*2);
  else        ctx.ellipse(w*0.35,  h*0.55, w*0.38, h*0.22,  0.4, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#c0c0d0';
  ctx.beginPath(); ctx.ellipse(w*0.42, h*0.52, w*0.36, h*0.3, 0.15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#8899cc';
  ctx.beginPath(); ctx.ellipse(w*0.68, h*0.38, w*0.14, h*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#b0b0c0';
  ctx.beginPath(); ctx.arc(w*0.8, h*0.28, w*0.18, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff6600';
  ctx.beginPath(); ctx.arc(w*0.88, h*0.24, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(w*0.88, h*0.24, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(w*0.96, h*0.3); ctx.lineTo(w*1.08, h*0.34); ctx.lineTo(w*0.96, h*0.38);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w*0.35, h*0.82); ctx.lineTo(w*0.28, h*1.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.5,  h*0.82); ctx.lineTo(w*0.55, h*1.0); ctx.stroke();
  ctx.restore();
}

export function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) return;
  const px = player.x - gameState.cameraX, py = player.y;
  ctx.save();
  if (player.facing === -1) { ctx.translate(px + player.w, py); ctx.scale(-1, 1); }
  else ctx.translate(px, py);

  if (media.playerImage) {
    ctx.drawImage(media.playerImage, 0, 0, player.w, player.h);
  } else {
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
  }
  ctx.restore();
}

export function drawFlag() {
  const fx = WORLD_W - 96 - gameState.cameraX;
  if (fx < -60 || fx > CANVAS_W + 10) return;
  ctx.fillStyle = '#aaa'; ctx.fillRect(fx, 200, 6, 200);
  ctx.fillStyle = '#e63c00';
  ctx.beginPath(); ctx.moveTo(fx+6,202); ctx.lineTo(fx+50,222); ctx.lineTo(fx+6,242); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#888'; ctx.fillRect(fx-10, 396, 26, 8);
}

export function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x - gameState.cameraX, p.y, 4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}
