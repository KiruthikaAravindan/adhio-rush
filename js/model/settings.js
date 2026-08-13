const KEY = 'marioRushSettings';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { music: s.music !== false, sfx: s.sfx !== false };
  } catch (_) { return { music: true, sfx: true }; }
}

export const settings = load();

export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify({ music: settings.music, sfx: settings.sfx })); } catch (_) {}
}
