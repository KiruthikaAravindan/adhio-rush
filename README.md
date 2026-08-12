# 🎵 Mario Rush

A music-themed Mario-style platformer built with vanilla HTML5 Canvas and Web Audio API. Collect musical notes, stomp enemies, hit prize boxes to answer music trivia quizzes, and battle through 2 levels of increasing difficulty.

**[▶ Play Now](https://kiruthikaaravindan.github.io/mario-rush/)**

---

## Gameplay

| Action | Desktop | Mobile |
|---|---|---|
| Move | Arrow keys / A D | Drag joystick |
| Jump | Space / Up / W | ▲ button |
| Restart | R key | ↺ button |
| Fullscreen | — | ⛶ button |

### Objectives
- Collect **musical notes** (♪ ♩ ♫ ♬) for 100 pts each
- **Stomp enemies** from above for 200 pts
- Hit **? boxes** to trigger a Music Quiz — answer correctly for 500 bonus pts
- Reach the **flag** at the end of each level

### Scoring
| Action | Points |
|---|---|
| Collect a note | 100 |
| Stomp basic enemy | 200 |
| Stomp pigeon (Level 2 only) | 500 |
| Correct quiz answer | 500 |

---

## Levels

### Level 1
- Ground and floating piano-key platforms
- Basic enemies patrolling at normal speed
- 5 music quiz boxes (questions 1–5)
- Notes on platforms and ground

### Level 2
- Wider world with harder platform gaps (stepping-stone bridges)
- Basic enemies move **~1.5× faster**
- **Pigeons** appear — fly across the screen and score 500 pts when stomped
- 5 more quiz boxes (questions 6–10)
- 20 total quiz questions across both levels

---

## Features

- **Responsive full-screen scaling** — fixed 800×450 canvas scaled via CSS transform to fill any screen
- **Mobile-first touch controls** — virtual joystick + jump/restart buttons, landscape lock
- **Web Audio API music** — synthesised C-major pentatonic background loop + distinct SFX for every action
- **Persistent best score** — stored in `localStorage`, shown live in HUD and on game-over screen
- **Music quiz system** — 20 questions covering dynamics, tempo, instruments, notation and more

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rendering | HTML5 Canvas 2D API |
| Audio | Web Audio API (synthesised, no audio files) |
| Architecture | ES Modules — MVC (model / view / controller) |
| Hosting | GitHub Pages |

No build tools, no frameworks, no dependencies.

---

## Project Structure

```
mario-rush/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── main.js           # game loop, scaling, fullscreen
    ├── audio.js          # Web Audio SFX + background music
    ├── canvas.js
    ├── constants.js
    ├── model/
    │   ├── level.js      # level data, initLevel(n)
    │   └── state.js      # gameState, player, best score
    ├── controller/
    │   ├── input.js      # keyboard + virtual joystick
    │   ├── physics.js    # collision, resetGame, nextLevel
    │   └── update.js     # game logic, per-frame update
    └── view/
        ├── draw.js       # canvas rendering
        └── hud.js        # HTML HUD + overlays
```

---

## Running Locally

Because the game uses ES Modules it needs to be served over HTTP (not opened as a `file://`):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080/mario-rush/` (or whatever path you serve from).

---

## Planned Improvements

- [ ] Custom background music (composer upload)
- [ ] More levels
- [ ] Enemy variety
- [ ] Difficulty scaling
- [ ] Sound settings / volume control

---

## License

MIT
