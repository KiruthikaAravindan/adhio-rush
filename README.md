# 🎵 Mario Rush

A music-themed Mario-style platformer built with vanilla HTML5 Canvas and Web Audio API. Collect musical notes, stomp enemies, hit prize boxes to answer music trivia quizzes, befriend a cat companion, and battle through 5 levels of escalating difficulty.

**[▶ Play Now](https://kiruthikaaravindan.github.io/mario-rush/)**

---

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | Arrow keys / A D | Drag joystick |
| Jump | Space / Up / W | ▲ button |
| Pet Caesar | E key | 🐾 button |
| Give treat | F key | 🐟 button |
| Inventory | 🎒 (HUD) | 🎒 (HUD) |
| Settings | ⚙ (HUD) | ⚙ (HUD) |
| Restart | R key | ↺ (settings panel) |
| Fullscreen | — | ⛶ (settings panel) |

---

## Objectives

- Collect **musical notes** (♪ ♩ ♫ ♬) for 100 pts each
- **Stomp enemies** from above for 200 pts
- **Stomp pigeons** for 500 pts (Levels 2–5)
- Hit **? boxes** to trigger a Music Quiz — answer correctly for 500 bonus pts
- Reach the **girl at the flag** at the end of each level

### Scoring

| Action | Points |
|---|---|
| Collect a note | 100 |
| Stomp enemy | 200 |
| Stomp pigeon | 500 |
| Correct quiz answer | 500 |
| Kill streak bonus | scales with streak |

---

## Levels

| Level | World width | New feature |
|---|---|---|
| 1 | 3200 px | Intro — enemies, notes, quiz boxes |
| 2 | 4700 px | Pigeons arrive. Caesar appears (curled up, asleep) |
| 3 | 5200 px | More enemies and pigeons. Caesar can be petted |
| 4 | 5700 px | Caesar roams with you. Treat system unlocks |
| 5 | 6200 px | Maximum difficulty — fastest enemies and pigeons |

---

## Caesar the Cat

Caesar is a companion cat who appears from Level 2 onward, curled on a floating platform in the middle of the level.

### Meeting Caesar (Levels 2–3)

Walk close to him and press **E** (or the 🐾 touch button) when the prompt appears. He wakes up, follows you briefly, and grants a **100 pt petting bonus**.

### Roaming mode (Levels 4–5)

Caesar is already bonded from the start and follows you across the level. Before Level 4 begins, a full-screen intro explains the treat system.

### Treats

Treats can be bought from the **🎒 Inventory** panel (available from Level 4, costs 5000 pts each). Press **F** or the 🐟 touch button to give Caesar a treat:

- He enters a **20-second frenzy**, chasing and catching nearby pigeons
- The treat button has a **20-second cooldown** after each use — a circular progress ring on the touch button (and a small arc in the desktop canvas HUD) shows time remaining

---

## Level-Save System

You have **3 lives per level**. Losing all lives shows the **LEVEL FAILED** screen:

| Situation | Retry cost | Score on retry |
|---|---|---|
| Level 1 fail | Free | Resets to 0 |
| Level 2+ fail, bank ≥ 2000 pts | 2000 pts | Bank minus 2000 |
| Level 2+ fail, bank < 2000 pts | N/A — button disabled | Use RESTART FROM L1 |

**"Bank"** = score accumulated before the current level started. Points earned during a failed level don't count — retrying always restores the cleaner pre-level baseline.

The **RESTART FROM L1** secondary button is always available and resets the full game.

---

## HUD

```
🎮 1   ⭐ 2500   🏆 4100   ❤️ 3   ♪ 12/20   🎒  ⚙
```

- **Level** — current level number
- **Score** — live score
- **Best** — personal best (persisted in `localStorage`)
- **Lives** — lives remaining this level
- **♪ collected/total** — notes picked up vs total in level
- **🎒** — Inventory panel (treats, buy button)
- **⚙** — Settings panel (music, SFX, dev level-jump)

---

## Features

- **Responsive full-screen scaling** — fixed 800×450 canvas scaled via CSS transform to fill any screen
- **Mobile-first touch controls** — virtual joystick + jump button, landscape lock, fullscreen
- **Web Audio API** — synthesised background music + distinct SFX for every action
- **Level-save / retry system** — retry the current level (costs points) without losing progress
- **Caesar companion AI** — follows player, jumps over pits and onto platforms, catches pigeons during treat frenzy
- **Sprite support** — game reads `resources/caesar.png` / `resources/pigeon.png` if present; falls back to canvas drawing if absent
- **Music quiz system** — 20 questions covering dynamics, tempo, instruments and notation
- **Persistent best score** — stored in `localStorage`
- **Kill-streak bar** — earn an extra life by chaining enemy stomps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rendering | HTML5 Canvas 2D API |
| Audio | Web Audio API (synthesised, no audio files) |
| Architecture | ES Modules — MVC (model / view / controller) |
| Hosting | GitHub Pages |

No build tools. No frameworks. No dependencies.

---

## Project Structure

```
mario-rush/
├── index.html
├── css/
│   └── style.css
├── resources/            # optional sprites (boy.png, girl.png, caesar.png, pigeon.png)
└── js/
    ├── main.js           # game loop, scaling, fullscreen, UI wiring
    ├── audio.js          # Web Audio SFX + background music
    ├── canvas.js
    ├── constants.js
    ├── model/
    │   ├── level.js      # level data, initLevel(n)
    │   ├── settings.js   # music/SFX toggle, localStorage
    │   └── state.js      # gameState, player, caesar, particles, media
    ├── controller/
    │   ├── input.js      # keyboard + virtual joystick
    │   ├── physics.js    # collision, resetGame, nextLevel, retryLevel
    │   └── update.js     # per-frame game logic
    └── view/
        ├── draw.js       # canvas rendering (player, enemies, caesar, pigeons…)
        └── hud.js        # overlays, quiz, level-complete, caesar HUD, intro screen
```

---

## Running Locally

ES Modules require HTTP — open via a local server, not `file://`:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080/mario-rush/`.

---

## License

MIT
