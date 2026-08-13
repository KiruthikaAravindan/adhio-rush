export const canvas = document.getElementById('gameCanvas');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width  = 800 * dpr;
canvas.height = 450 * dpr;
export const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
