import { ctx } from '../canvas.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { gameState, player, particles, media, caesar } from '../model/state.js';
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
  const goingLeft = e.facing === -1;

  const legSwing = e.walkFrame % 2 === 0 ? 1.5 : -1.5;
  const rw = Math.round(w * 1.3);
  const rh = Math.round(h * 1.6);
  const rx = ex - (rw - w) / 2;
  const ry = e.y - (rh - h);

  ctx.save();
  ctx.translate(rx + (goingLeft ? rw : 0), ry);
  if (goingLeft) ctx.scale(-1, 1);

  // Tail
  ctx.fillStyle = '#9098a8';
  ctx.beginPath();
  ctx.moveTo(rw*0.14, rh*0.72);
  ctx.bezierCurveTo(rw*-0.04, rh*0.68, rw*-0.08, rh*0.84, rw*0.08, rh*0.90);
  ctx.bezierCurveTo(rw*0.18, rh*0.86, rw*0.20, rh*0.76, rw*0.16, rh*0.73);
  ctx.closePath(); ctx.fill();

  // Body — teardrop: round chest, sharp tail tip
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.moveTo(rw*0.14, rh*0.72);
  ctx.bezierCurveTo(rw*0.14, rh*0.58, rw*0.38, rh*0.54, rw*0.60, rh*0.56);
  ctx.bezierCurveTo(rw*0.76, rh*0.58, rw*0.82, rh*0.66, rw*0.80, rh*0.76);
  ctx.bezierCurveTo(rw*0.78, rh*0.84, rw*0.56, rh*0.90, rw*0.36, rh*0.88);
  ctx.bezierCurveTo(rw*0.24, rh*0.86, rw*0.14, rh*0.80, rw*0.14, rh*0.72);
  ctx.closePath(); ctx.fill();

  // Wing — covers body, follows teardrop
  ctx.fillStyle = '#adb5c0';
  ctx.beginPath();
  ctx.moveTo(rw*0.56, rh*0.58);
  ctx.bezierCurveTo(rw*0.40, rh*0.54, rw*0.22, rh*0.58, rw*0.16, rh*0.68);
  ctx.lineTo(rw*0.14, rh*0.72);
  ctx.bezierCurveTo(rw*0.16, rh*0.78, rw*0.26, rh*0.86, rw*0.36, rh*0.88);
  ctx.bezierCurveTo(rw*0.48, rh*0.90, rw*0.60, rh*0.88, rw*0.68, rh*0.82);
  ctx.bezierCurveTo(rw*0.74, rh*0.76, rw*0.74, rh*0.66, rw*0.68, rh*0.60);
  ctx.bezierCurveTo(rw*0.64, rh*0.58, rw*0.60, rh*0.58, rw*0.56, rh*0.58);
  ctx.closePath(); ctx.fill();

  // Belly lighter patch
  ctx.fillStyle = '#d8dce4';
  ctx.beginPath();
  ctx.ellipse(rw*0.50, rh*0.75, rw*0.14, rh*0.09, 0.1, 0, Math.PI*2);
  ctx.fill();

  // Wing wavy stripes
  ctx.strokeStyle = '#7c8898'; ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(rw*0.16, rh*0.65);
  ctx.quadraticCurveTo(rw*0.24, rh*0.61, rw*0.32, rh*0.65);
  ctx.quadraticCurveTo(rw*0.40, rh*0.69, rw*0.48, rh*0.65);
  ctx.quadraticCurveTo(rw*0.56, rh*0.61, rw*0.62, rh*0.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rw*0.16, rh*0.74);
  ctx.quadraticCurveTo(rw*0.24, rh*0.70, rw*0.32, rh*0.74);
  ctx.quadraticCurveTo(rw*0.40, rh*0.78, rw*0.48, rh*0.74);
  ctx.quadraticCurveTo(rw*0.56, rh*0.70, rw*0.62, rh*0.74);
  ctx.stroke();

  // Head + neck — one connected dark shape
  ctx.fillStyle = '#5a6270';
  ctx.beginPath();
  ctx.moveTo(rw*0.50, rh*0.52);
  ctx.bezierCurveTo(rw*0.48, rh*0.38, rw*0.56, rh*0.24, rw*0.64, rh*0.22);
  ctx.bezierCurveTo(rw*0.74, rh*0.20, rw*0.82, rh*0.30, rw*0.79, rh*0.44);
  ctx.bezierCurveTo(rw*0.76, rh*0.56, rw*0.68, rh*0.60, rw*0.61, rh*0.60);
  ctx.bezierCurveTo(rw*0.56, rh*0.60, rw*0.53, rh*0.58, rw*0.52, rh*0.55);
  ctx.closePath(); ctx.fill();

  // Neck feather marks
  ctx.strokeStyle = '#484e5c'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(rw*0.55, rh*0.54, rw*0.026, Math.PI*0.9, Math.PI*2.1, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(rw*0.60, rh*0.56, rw*0.026, Math.PI*0.9, Math.PI*2.1, false); ctx.stroke();
  ctx.beginPath(); ctx.arc(rw*0.65, rh*0.56, rw*0.026, Math.PI*0.9, Math.PI*2.1, false); ctx.stroke();

  // Beak — yellow
  ctx.fillStyle = '#d8a030';
  ctx.beginPath();
  ctx.moveTo(rw*0.77, rh*0.36); ctx.lineTo(rw*0.88, rh*0.39); ctx.lineTo(rw*0.77, rh*0.44);
  ctx.closePath(); ctx.fill();

  // Eye — white ring + dark pupil + highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(rw*0.71, rh*0.33, 2.8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.arc(rw*0.71, rh*0.33, 1.8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(rw*0.722, rh*0.314, 0.6, 0, Math.PI*2); ctx.fill();

  // Legs — dark grey, short
  ctx.strokeStyle = '#484858'; ctx.lineWidth = 2;
  const l1x = rw*0.38, l2x = rw*0.54;
  const f1x = l1x + legSwing, f2x = l2x - legSwing;
  ctx.beginPath(); ctx.moveTo(l1x, rh*0.90); ctx.lineTo(f1x, rh*0.97); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(l2x, rh*0.90); ctx.lineTo(f2x, rh*0.97); ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(f1x - rw*0.12, rh*0.97); ctx.lineTo(f1x + rw*0.09, rh*0.97); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(f2x - rw*0.09, rh*0.97); ctx.lineTo(f2x + rw*0.12, rh*0.97); ctx.stroke();
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(f1x - rw*0.04, rh*0.97); ctx.lineTo(f1x - rw*0.04, rh*1.01); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(f2x + rw*0.04, rh*0.97); ctx.lineTo(f2x + rw*0.04, rh*1.01); ctx.stroke();

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

  if (media.pigeonImage) {
    const img = media.pigeonImage;
    const CW = (img.naturalWidth  || img.width)  / 7;
    const RH = (img.naturalHeight || img.height) / 3;
    // Grid: 7 cols × 3 rows. Rows 1-2 use only cols 0-3 (faces LEFT)
    // Row 1: flying normal  Row 2: flying danger
    const rowIndex = pg.isDanger ? 2 : 1;
    const col      = pg.wingFrame % 4;
    const renderW  = pg.w * 2;
    const baseSH   = Math.floor(RH) - 4;
    const baseRH   = pg.h * 2;
    // Danger f1/f2: wing bleeds 43–60 source px above the sprite cell — expand render box upward
    const dangerTopPadSrc = pg.isDanger ? [0, 55, 70, 0][col] : 0;
    const topPadScreen    = Math.round(dangerTopPadSrc * baseRH / baseSH);
    const renderH  = baseRH + topPadScreen;
    const rx = px  - (renderW - pg.w) / 2;
    const ry = pg.y - (baseRH - pg.h) / 2 - topPadScreen;
    const goingLeft = pg.vx < 0;  // sprite faces RIGHT — flip when going left
    const sx = Math.floor(col * CW) + 2;
    const headExtra    = (!pg.isDanger && col === 0) ? 2 : 0;
    const dangerHeadEx = ( pg.isDanger && col === 0) ? 10 : 0;
    // Normal: sy = rowIndex*RH+2, sh = baseSH (trim 2px each side)
    // Danger: sy = rowIndex*RH - topPadSrc (no top trim + go above cell), sh = baseSH+2+topPadSrc
    const sy = pg.isDanger
      ? Math.floor(rowIndex * RH) - dangerTopPadSrc
      : Math.floor(rowIndex * RH) + 2;
    const sh = pg.isDanger ? baseSH + 2 + dangerTopPadSrc : baseSH;
    const sw = Math.floor(CW) - 4 + headExtra + dangerHeadEx;
    ctx.save();
    if (goingLeft) {
      ctx.translate(rx + renderW, ry);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(rx, ry);
    }
    // Clip in local (image) space — consistent regardless of flip direction
    const normalClips = [
      [6, 4, renderW - 5, renderH - 12],  // f0: +2 tail cut
      [4, 4, renderW - 3, renderH - 12],  // f1: default
      [4, 4, renderW - 3, renderH - 12],  // f2: default
      [4, 4, renderW - 6.5, renderH - 12],  // f3: +3.5 head cut
    ];
    const dangerClips = [
      [5, 0, renderW - 5, renderH - 19],      // f0: left 5, bottom 19
      [4, 4, renderW - 4, renderH - 22.5],    // f1: left 4, top 4, bottom 18.5
      [2.5, 6.5, renderW - 2.5, renderH - 24], // f2: left 2.5, top 6.5, bottom 17.5
      [2, 0, renderW - 3.5, renderH - 18],    // f3: left 2, right -0.5 expand, bottom 18
    ];
    const frameClips = pg.isDanger ? dangerClips : normalClips;
    const [cx, cy, cw, ch] = frameClips[col] || frameClips[0];
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, renderW, renderH);
    ctx.restore();
    return;
  }
  const wingUp    = pg.wingFrame === 0;
  const goingLeft = pg.vx < 0;
  const w = pg.w;
  const h = pg.h;

  // Danger pigeon: vivid red; regular: warm brown
  const d = pg.isDanger;
  const C = {
    tail:  d ? '#991100' : '#a07848',
    body:  d ? '#cc2200' : '#c8a87c',
    wing:  d ? '#881100' : '#a07840',
    neck:  d ? '#ff4422' : '#dd7744',
    head:  d ? '#cc1100' : '#d4b888',
    eye:   d ? '#ffee00' : '#ff9900',
    beak:  d ? '#aa6600' : '#cc7700',
    legs:  d ? '#cc4400' : '#cc7700',
  };

  ctx.save();
  if (d) { ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 10; }
  ctx.translate(px + (goingLeft ? w : 0), pg.y);
  if (goingLeft) ctx.scale(-1, 1);

  // Tail
  ctx.fillStyle = C.tail;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.42);
  ctx.lineTo(w * -0.1, h * 0.56);
  ctx.lineTo(w * 0.14, h * 0.68);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.body;
  ctx.beginPath();
  ctx.ellipse(w * 0.44, h * 0.52, w * 0.33, h * 0.25, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  ctx.save();
  ctx.translate(w * 0.44, h * 0.32);
  ctx.rotate(wingUp ? -0.65 : 0.45);
  ctx.fillStyle = C.wing;
  ctx.beginPath();
  ctx.ellipse(0, h * 0.14, w * 0.35, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck patch
  ctx.fillStyle = C.neck;
  ctx.beginPath();
  ctx.ellipse(w * 0.66, h * 0.44, w * 0.11, h * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = C.head;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.28, w * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = C.eye;
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(w * 0.86, h * 0.23, 1.4, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = C.beak;
  ctx.beginPath();
  ctx.moveTo(w * 0.92, h * 0.25);
  ctx.lineTo(w * 1.08, h * 0.29);
  ctx.lineTo(w * 0.92, h * 0.33);
  ctx.closePath();
  ctx.fill();

  // Legs — short & tucked (realistic flying posture)
  ctx.strokeStyle = C.legs; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.76); ctx.lineTo(w * 0.33, h * 0.88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.52, h * 0.76); ctx.lineTo(w * 0.57, h * 0.88); ctx.stroke();
  // Tiny toes
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.88); ctx.lineTo(w * 0.40, h * 0.88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.48, h * 0.88); ctx.lineTo(w * 0.65, h * 0.88); ctx.stroke();

  ctx.restore();
}

export function drawPlayer() {
  // Flicker only during damage invincibility — shield mode shows golden aura instead
  if (player.invincible > 0 && player.shieldTimer <= 0 && Math.floor(player.invincible / 5) % 2 === 0) return;

  const DW = 96, DH = 64;
  const isAirborne = !player.onGround && !gameState.celebrating;
  // Jump sprite appears slightly smaller in the sheet; compensate by rendering it larger
  const dw = isAirborne ? 108 : DW;
  const dh = isAirborne ? 72  : DH;
  const bounceY = gameState.celebrating ? -Math.abs(Math.sin(Date.now() / 200)) * 18 : 0;
  // +8 aligns sprite feet with hitbox bottom; +12 corrects jump-frame's left bias in sheet
  const px = player.x - gameState.cameraX + (player.w - dw) / 2 + (isAirborne ? 12 : 0);
  const py = player.y + player.h - dh + bounceY + 8;

  // Golden shield aura — pet-granted immunity
  if (player.shieldTimer > 0) {
    const auraX = player.x - gameState.cameraX + player.w / 2;
    const auraY = player.y + player.h / 2 + bounceY;
    const pulse  = 0.18 + 0.08 * Math.sin(Date.now() / 180);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(auraX, auraY, player.w * 0.85, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = pulse * 0.4;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(auraX, auraY, player.w * 1.1, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }

  if (media.playerImage) {
    // Speed streaks — drawn behind player when Allegro powerup is active
    if (gameState.speedMult > 1 && Math.abs(player.vx) > 0.5) {
      const movingRight = player.vx > 0;
      const dir = movingRight ? -1 : 1;
      const sx  = movingRight ? px - 4 : px + dw + 4;
      ctx.save();
      const streakColors = ['#44ddff', '#88eeff', '#aaeeff'];
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.5 - i * 0.12;
        ctx.strokeStyle = streakColors[i];
        ctx.lineWidth   = 2 - i * 0.4;
        const sy  = py + dh * 0.35 + i * (dh * 0.15);
        const len = 18 - i * 4;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dir * len, sy); ctx.stroke();
      }
      ctx.restore();
    }

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

export function drawCaesar() {
  if (!caesar.active) return;
  const cx = caesar.x - gameState.cameraX;
  if (cx + caesar.w < -10 || cx > CANVAS_W + 10) return;

  const w = caesar.w, h = caesar.h;
  const flip = caesar.facing === -1;
  const celebBounce = gameState.celebrating && (caesar.met || caesar.roaming)
    ? -Math.abs(Math.sin(Date.now() / 200)) * 12 : 0;
  const baseY = caesar.y + celebBounce;

  // ── Proximity glow ring (L2-3, before petting) ──
  if (gameState.caesarNear && !caesar.roaming) {
    const pulse = 0.15 + 0.1 * Math.sin(Date.now() / 200);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx + w / 2, baseY + h / 2, w * 0.9, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }

  // ── Enhanced aura (treat mode active) ──
  if (caesar.enhanced && caesar.catchTimer > 0) {
    const pulse = 0.12 + 0.08 * Math.sin(Date.now() / 150);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx + w / 2, baseY + h / 2, w * 1.1, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }

  if (media.caesarImage) {
    const img = media.caesarImage;
    const CW = (img.naturalWidth  || img.width)  / 7;
    const CH = (img.naturalHeight || img.height) / 2;
    // Grid: 7 cols × 2 rows
    // Row 0: sit(0) stand(1) walkA(2) walkB(3) leapA(4) leapB(5) crouch(6)
    // Row 1: loaf(0) lying(1) sleepCurl(2) bellyUp(3) playing(4) happy(5) empty(6)
    let col, row;
    if (caesar.curled) {
      col=2; row=1;
    } else if (caesar.sleeping) {
      col=1; row=1;
    } else if (caesar.petTimer > 0) {
      col=5; row=1;
    } else if (!caesar.onGround) {
      col = caesar.vy < 0 ? 4 : 5; row=0;  // leapA rising, leapB falling
    } else if (caesar.enhanced && caesar.catchTimer > 0) {
      col=6; row=0;
    } else if (Math.abs(caesar.vx) < 1.5) {
      if (caesar.lyingPose)      { col=1; row=1; }  // lying — idle 10 s
      else if (caesar.sitPose)   { col=0; row=0; }  // sit   — idle 5 s
      else                       { col=1; row=0; }  // stand
    } else {
      col=2+caesar.walkFrame; row=0;
    }
    // Per-pose clip config (lc/tc/rc/bc in debug render space: rW=64, rH=natural)
    const POSE_CLIPS = {
      '0,0': {lc:4,   tc:44, rc:0, bc:10.5, topPad:0},
      '1,0': {lc:4,   tc:46, rc:0, bc:10.5, topPad:0},
      '2,0': {lc:1,   tc:46, rc:0, bc:10.5, topPad:0},
      '3,0': {lc:0,   tc:48, rc:0, bc:10.5, topPad:0},
      '4,0': {lc:0,   tc:48, rc:1, bc:10.5, topPad:0},
      '5,0': {lc:0,   tc:48, rc:1, bc:10.5, topPad:0},
      '6,0': {lc:0,   tc:48, rc:4, bc:10.5, topPad:0},
      '2,1': {lc:1,   tc:0,  rc:0, bc:62.5, topPad:0},
      '1,1': {lc:2.5, tc:0,  rc:0, bc:65,   topPad:0},
      '5,1': {lc:0,   tc:-2, rc:4, bc:62.5, topPad:8},
    };
    const pc = POSE_CLIPS[`${col},${row}`] || {lc:0, tc:0, rc:0, bc:0, topPad:0};
    const sw = Math.floor(CW) - 10, sh = Math.floor(CH) - 10;
    const renderW = 52;
    const baseRH = Math.round(renderW * sh / sw);
    const tps = Math.round(pc.topPad * baseRH / sh);
    const renderH = baseRH + tps;
    const dy = pc.bc * renderW / 64;
    const rx = cx - (renderW - w) / 2;
    const ry = baseY - (renderH - h) + dy;
    const sx = Math.floor(col * CW) + 5;
    const adjSy = Math.floor(row * CH) + 5 - pc.topPad;
    const adjSh = sh + pc.topPad;
    const cs = renderW / 64;  // clip scale factor
    const clipTop = (pc.tc - tps) * cs;
    ctx.save();
    if (flip) {
      ctx.translate(rx + renderW, ry);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(rx, ry);
    }
    ctx.beginPath();
    ctx.rect(pc.lc * cs, clipTop, renderW - (pc.lc + pc.rc) * cs, renderH - clipTop - pc.bc * cs);
    ctx.clip();
    ctx.drawImage(img, sx, adjSy, sw, adjSh, 0, 0, renderW, renderH);
    ctx.restore();
    return;
  }

  // ── CURLED pose (sleeping ball, before found in L2-3) ──
  if (caesar.curled) {
    ctx.save();
    ctx.translate(cx + w / 2, baseY + h * 0.55);
    // Body ball
    ctx.fillStyle = '#e08830';
    ctx.beginPath(); ctx.arc(0, 0, w * 0.42, 0, Math.PI * 2); ctx.fill();
    // Belly patch
    ctx.fillStyle = '#f5c880';
    ctx.beginPath(); ctx.arc(0, h * 0.06, w * 0.25, 0, Math.PI * 2); ctx.fill();
    // Stripe
    ctx.strokeStyle = '#8b4400'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(0, 0, w * 0.28, 0.3, Math.PI * 0.8); ctx.stroke();
    ctx.globalAlpha = 1;
    // Tail curled around
    ctx.strokeStyle = '#b86010'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(w * 0.1, h * 0.04, w * 0.38, 0.2, Math.PI * 1.7); ctx.stroke();
    // Ear nubs
    ctx.fillStyle = '#e08830';
    ctx.beginPath(); ctx.moveTo(-w*0.1, -w*0.38); ctx.lineTo(-w*0.2, -w*0.52); ctx.lineTo(0, -w*0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w*0.12, -w*0.36); ctx.lineTo(w*0.24, -w*0.50); ctx.lineTo(w*0.28, -w*0.36); ctx.closePath(); ctx.fill();
    // Sleepy eye lines
    ctx.strokeStyle = '#332200'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w*0.14, -w*0.06); ctx.lineTo(-w*0.04, -w*0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w*0.04, -w*0.06); ctx.lineTo(w*0.14, -w*0.06); ctx.stroke();
    ctx.restore();
    // Zzz
    ctx.save();
    ctx.fillStyle = '#aaeeff'; ctx.font = 'bold 8px Arial';
    ctx.textAlign = flip ? 'right' : 'left';
    const zx = cx + (flip ? -2 : w + 2);
    const zy = baseY - 4 + Math.sin(Date.now() / 500) * 2;
    ctx.fillText('z', zx, zy);
    ctx.fillText('z', zx + (flip ? -4 : 4), zy - 5);
    ctx.fillText('Z', zx + (flip ? -9 : 9), zy - 11);
    ctx.restore();
    return;
  }

  // ── Normal / sit / active pose ──
  const isSitting = caesar.roaming && caesar.idleTimer > 300 && caesar.catchTimer <= 0;

  ctx.save();
  ctx.translate(cx + (flip ? w : 0), baseY);
  if (flip) ctx.scale(-1, 1);

  // Tail
  ctx.strokeStyle = '#b86010'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.55);
  ctx.bezierCurveTo(w * -0.35, h * 0.30, w * -0.55, h * -0.10, w * -0.20, h * -0.28);
  ctx.stroke();
  ctx.strokeStyle = '#e07820'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.55);
  ctx.bezierCurveTo(w * -0.35, h * 0.30, w * -0.55, h * -0.10, w * -0.20, h * -0.28);
  ctx.stroke();

  // Body
  const bodyTiltY = isSitting ? -h * 0.08 : 0;
  ctx.fillStyle = '#e08830';
  ctx.beginPath();
  ctx.ellipse(w * 0.50, h * 0.58 + bodyTiltY, w * 0.44, h * (isSitting ? 0.38 : 0.40), isSitting ? -0.2 : 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#f5c880';
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.64 + bodyTiltY, w * 0.24, h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stripes
  ctx.strokeStyle = '#8b4400'; ctx.lineWidth = 1.5;
  for (const sx of [0.26, 0.42, 0.62, 0.76]) {
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(w * sx, h * 0.20 + bodyTiltY); ctx.lineTo(w * (sx - 0.05), h * 0.80 + bodyTiltY); ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Ears
  ctx.fillStyle = '#e08830';
  ctx.beginPath(); ctx.moveTo(w*0.60,h*0.08); ctx.lineTo(w*0.52,h*-0.14); ctx.lineTo(w*0.72,h*0.04); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w*0.84,h*0.04); ctx.lineTo(w*0.94,h*-0.12); ctx.lineTo(w*0.97,h*0.08); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath(); ctx.moveTo(w*0.62,h*0.07); ctx.lineTo(w*0.55,h*-0.07); ctx.lineTo(w*0.71,h*0.05); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w*0.85,h*0.05); ctx.lineTo(w*0.92,h*-0.06); ctx.lineTo(w*0.95,h*0.07); ctx.closePath(); ctx.fill();

  // Head
  ctx.fillStyle = '#e08830';
  ctx.beginPath(); ctx.arc(w * 0.76, h * 0.28, w * 0.27, 0, Math.PI * 2); ctx.fill();

  // Forehead stripes
  ctx.strokeStyle = '#8b4400'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
  for (const ox of [-0.05, 0.05]) {
    ctx.beginPath(); ctx.moveTo(w*(0.76+ox), h*0.02); ctx.lineTo(w*(0.76+ox*0.6), h*0.16); ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Eyes
  if (caesar.petTimer > 0 || isSitting) {
    // Happy squint / sitting look
    ctx.strokeStyle = '#332200'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(w*0.68, h*0.26, 4.5, Math.PI, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w*0.86, h*0.26, 4.5, Math.PI, Math.PI*2); ctx.stroke();
  } else if (caesar.sleeping) {
    ctx.strokeStyle = '#332200'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(w*0.63,h*0.26); ctx.lineTo(w*0.73,h*0.26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w*0.81,h*0.26); ctx.lineTo(w*0.91,h*0.26); ctx.stroke();
  } else {
    ctx.fillStyle = '#c86010';
    ctx.beginPath(); ctx.arc(w*0.68, h*0.26, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.86, h*0.26, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3a1a00';
    ctx.beginPath(); ctx.arc(w*0.68, h*0.26, 2.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(w*0.86, h*0.26, 2.2, 0, Math.PI*2); ctx.fill();
  }

  // Nose
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.arc(w*0.77, h*0.33, 2.2, 0, Math.PI*2); ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.moveTo(w*0.72,h*0.33); ctx.lineTo(w*0.48,h*0.31); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.72,h*0.36); ctx.lineTo(w*0.48,h*0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.82,h*0.33); ctx.lineTo(w*1.04,h*0.31); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w*0.82,h*0.36); ctx.lineTo(w*1.04,h*0.38); ctx.stroke();
  ctx.globalAlpha = 1.0;

  // Paws
  const swing = isSitting ? 0 : (caesar.walkFrame === 0 ? 2 : -2);
  const pawY  = isSitting ? h * 1.06 : h * 0.98;
  ctx.fillStyle = '#e08830';
  ctx.beginPath(); ctx.ellipse(w*0.28+swing, pawY, 8, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w*0.58-swing, pawY, 8, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f5c880';
  ctx.beginPath(); ctx.ellipse(w*0.28+swing, pawY, 5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w*0.58-swing, pawY, 5, 3, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();

  // Sleeping zzz (post-catchTimer)
  if (caesar.sleeping) {
    const zx = cx + (flip ? -6 : w + 6);
    const zy = baseY - 8 + Math.sin(Date.now() / 500) * 2;
    ctx.save();
    ctx.fillStyle = '#aaeeff'; ctx.font = 'bold 9px Arial';
    ctx.textAlign = flip ? 'right' : 'left';
    ctx.fillText('z',  zx, zy);
    ctx.fillText('z',  zx + (flip ? -5 : 5),  zy - 6);
    ctx.fillText('Z',  zx + (flip ? -11 : 11), zy - 13);
    ctx.restore();
  }

  // Petting hearts
  if (caesar.petTimer > 0) {
    ctx.save();
    ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
    ctx.fillText('💛', cx + w / 2, baseY - 14 + Math.sin(Date.now() / 180) * 3);
    ctx.restore();
  }

  // Active catch glow ring
  if (caesar.catchTimer > 0 && !caesar.sleeping) {
    const pct = caesar.catchTimer / 600;
    ctx.save();
    ctx.globalAlpha = pct * 0.22;
    ctx.strokeStyle = caesar.enhanced ? '#ff9900' : '#ffcc44';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + w/2, baseY + h/2, 200, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }
}
