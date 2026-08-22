# 🎮 Neon Strike 3D

A browser-based 3D third-person shooter designed for mobile devices, especially low-RAM Android phones. Built with Three.js — all assets are procedurally generated in code, so there are no external image/model downloads.

## 🔫 Play

1. Open `index.html` in any modern mobile or desktop browser (Chrome recommended).
2. Pick your operative.
3. Survive waves of enemies.

For hosting, see **Hosting** below.

## 📱 Mobile Controls

| Control | Action |
|---------|--------|
| Left side (drag) | Virtual joystick — move |
| Right side (drag) | Look / aim camera |
| 🔴 FIRE button | Shoot |
| 🟡 RELOAD button | Reload weapon |
| 🟢 JUMP button | Jump |
| 🟣 SKILL button | Activate character's unique skill |
| ⚪ AIM button | Toggle aim mode (slower, more precise) |
| ⏸ Top center | Pause game |

On desktop: WASD to move, mouse to aim, click to fire, R to reload, Space to jump, Q/E for skill.

## 🦸 Characters

Each character has a unique active skill, weapon, and health pool.

### ⚡ VOLT — Speed Striker
- **Weapon:** SMG (fast fire rate, 40-round mag)
- **Health:** 80 (low, but mobile)
- **Skill — PHASE DASH:** Instantly dash 8m in your movement direction, becoming briefly invulnerable. Cooldown: 6s.

### 🛡 TITAN — Heavy Guardian
- **Weapon:** Shotgun (6 pellets, high close-range damage)
- **Health:** 150 (tanky, slow)
- **Skill — BULWARK:** Deploy a 150HP energy shield that absorbs all damage for 5 seconds. Cooldown: 12s.

### 💥 NOVA — Explosive Expert
- **Weapon:** Rifle (balanced, 30-round mag)
- **Health:** 100 (balanced)
- **Skill — NOVA BLAST:** Launch an energy grenade dealing 60 AoE damage in a 5m radius. Cooldown: 8s.

### 🎯 SPECTRE — Shadow Marksman
- **Weapon:** Sniper (80 damage per shot, 5-round mag)
- **Health:** 90 (medium)
- **Skill — GHOST CLOAK:** Become invisible for 3 seconds — enemy AI loses target lock. Cooldown: 10s.

## 🌊 Gameplay

- **Wave-based survival:** Each wave spawns more enemies. Clear all enemies to advance.
- **Enemy types:** Grunts (balanced), Runners (fast, weak), Tanks (slow, heavy), Brutes (boss-tier).
- **Pickups:** Enemies drop health packs and ammo crates.
- **Score:** Earn points per kill + wave clear bonus.
- **Health regen:** Health regenerates after 5 seconds without taking damage.

## ⚙️ Performance Optimizations (for low-RAM mobile)

- **No shadows** — uses baked-look materials instead of real-time shadow maps.
- **Capped pixel ratio** at 1.5 to reduce GPU fill rate.
- **No antialiasing** — designed for mobile GPUs.
- **Shared geometries & materials** — all instances reuse cached geometry/material objects.
- **Low-poly procedural models** — all characters and objects are built from basic boxes/cylinders.
- **Fog culling** — distant objects blend into fog, reducing visual complexity.
- **Object pooling for effects** — muzzle flashes, bullet trails, and explosions are cleaned up immediately after their duration.
- **No external texture/model downloads** — everything is generated in code, keeping the game lightweight.

## 📂 Project Structure

```
neon-strike-3d/
├── index.html              # Main HTML with UI, HUD, mobile controls
├── src/
│   ├── Config.js           # Game configuration & balance constants
│   ├── AssetFactory.js     # Procedural 3D model/asset generation
│   ├── InputManager.js     # Touch + keyboard input handling
│   ├── Characters.js       # Character definitions with unique skills
│   ├── EnemyAI.js          # Enemy spawning, behavior, and AI
│   ├── WeaponSystem.js     # Player weapon logic (fire, reload, hit detection)
│   ├── Arena.js            # Map/arena with cover, walls, collisions
│   ├── Effects.js          # Visual effects (muzzle flash, trails, explosions)
│   ├── Game.js             # Core game loop, player controller, camera, HUD
│   └── Main.js             # Entry point, loading screen, character select
├── README.md
└── LICENSE
```

## 🚀 Hosting

To play, serve the folder from any static web server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000` in your browser. On mobile, use your computer's IP address.

For online hosting, push to GitHub and enable GitHub Pages, or use Netlify/Vercel.

## 🛠 Tech Stack

- **Three.js r128** — 3D rendering (WebGL)
- **Vanilla JavaScript** — No frameworks, no build step
- **HTML/CSS** — UI, HUD, mobile touch controls

## 📄 License

MIT License — free to use, modify, and distribute.