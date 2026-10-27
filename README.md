# Armada's Revenge

A 2D top-down horror-survival game built in vanilla HTML5 Canvas + JavaScript, with a Spring Boot WebSocket backend that connects every player into one shared world.

You are a journalist trapped on the fourth floor of Greenvale Asylum with something in the building that cannot be killed. Four floors, fifteen rooms, five boss encounters, three companions, six weapons — and a full story that resolves. Nothing is a placeholder and nothing is stubbed out.

> University  project showcase — CSE 2118 Advanced Object Oriented Programming, United International University. **2nd Runners-Up.**

---

## Table of contents

- [What makes it different](#what-makes-it-different)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [1. Run the game (single player)](#1-run-the-game-single-player)
  - [2. Run the backend (multiplayer)](#2-run-the-backend-multiplayer)
  - [3. Play across two laptops](#3-play-across-two-laptops)
- [Controls](#controls)
- [Game flow](#game-flow)
- [Architecture](#architecture)
- [Weapons](#weapons)
- [Companions](#companions)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

---

## What makes it different

Most student games are built on an engine. This one is not — there is no Unity, no Godot, no Phaser. Every sprite, collision box, state machine and animation frame is hand-written on a raw 2D canvas context.

The multiplayer half is not cosmetic either. A Spring Boot WebSocket server keeps every connected player in one shared world:

- When a player dies anywhere, **everyone** sees it in a feed, their bloodstain appears in the room where it happened, and their inventory drops to the floor for anyone to claim.
- The server owns the loot and hands it out atomically, so two players can never take the same item.
- Completion times are posted to a shared leaderboard.

---

## Features

**Gameplay**
- Four floors, fifteen hand-built rooms, 100% reachable (verified by flood-fill testing)
- Five boss encounters, each with its own mechanic — no reskins
- Scarcity-driven survival: you start with nothing, weapons break, ammo is finite, health does not regenerate
- Crafting from scrap found in drawers, lockers and cabinets
- Pitch-black kitchen navigable only with a flashlight whose cone follows the mouse
- Gore system: blood stains, pools, limb drops, death gibs, severed heads

**Story**
- Opening interview cutscene — 53 lines, typewriter effect, skippable with confirmation
- A full narrative that turns on itself, including a companion betrayal and a lockdown wave
- Eight-line epilogue, completion time, and a leaderboard on the end screen

**Multiplayer**
- Global chat (`T`)
- Real-time death feed with room names
- Bloodstains with readable last words at the exact spot a player fell
- Shared, server-arbitrated loot drops
- Fastest-escape leaderboard

**Technical**
- Save slots with autosave at doorways, pickups and quest steps
- Per-weapon cooldowns (so a slow weapon never locks a fast one)
- Scene-object architecture with clean `onEnter` / `update` / `draw` contracts

---

## Tech stack

| Layer | Technology |
|---|---|
| Rendering | HTML5 Canvas 2D API |
| Game logic | Vanilla JavaScript (no framework, no build step) |
| Backend | Spring Boot |
| Realtime transport | WebSocket (`TextWebSocketHandler`) |
| JSON | Hand-rolled parser — no Jackson dependency |
| Persistence | `localStorage` (saves, player name, personal best) |
| Frontend dev server | VS Code Live Server |
| Backend IDE | IntelliJ IDEA Community Edition |

**Requirements:** a modern browser, and Java JDK 17+ with Maven for the backend.

---

## Project structure

```
armadas-revenge/
├── index.html                  # entry point — loads every script in order
├── css/
│   └── style.css
├── js/
│   ├── main.js                 # game loop, scene switching, canvas setup
│   ├── input.js                # keyboard + mouse state, per-frame flags
│   ├── netchat.js              # WebSocket client: chat, death feed, loot, leaderboard
│   ├── inventory.js            # items, crafting, weapon durability
│   └── scenes/
│       ├── menu.js             # main menu
│       ├── cutscene.js         # opening interview (black screen + dialogue box)
│       ├── gameplay.js         # all rooms, enemies, bosses, companions (~9000 lines)
│       └── leaderboard.js      # fastest-escapes board
├── assets/
│   ├── sprites/
│   └── audio/
└── backend/
    └── src/main/java/com/armada/
        ├── ArmadaApplication.java
        ├── WebSocketConfig.java    # registers the handler at /chat
        └── ChatHandler.java        # broadcast, death feed, loot, leaderboard
```

> If your folder names differ, adjust the `<script src="...">` tags in `index.html` to match. Script order matters — see the game loop section.

---

## Getting started

### 1. Run the game (single player)

The game is plain HTML and JavaScript, so it needs a static server (opening `index.html` by double-clicking will break asset loading in some browsers).

**With VS Code:**
1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**
3. The game opens at `http://127.0.0.1:5500`

**With Python, if you prefer:**
```bash
python -m http.server 5500
```
Then open `http://localhost:5500`.

The game is fully playable at this point. Chat, the death feed and the leaderboard will show "offline" until the backend is running.

### 2. Run the backend (multiplayer)

```bash
cd backend
./mvnw spring-boot:run
```

Or open the `backend` folder in IntelliJ IDEA and run `ArmadaApplication`.

The server starts on port **8080** and exposes the WebSocket endpoint at:

```
ws://localhost:8080/chat
```

Reload the game. The chat indicator should switch to **connected**.

### 3. Play across two laptops

Both machines must be on the **same Wi-Fi network**.

**On the host laptop (the one running the backend):**

Find your IPv4 address:
```bash
ipconfig          # Windows — look for "IPv4 Address" under your Wi-Fi adapter
ifconfig          # macOS / Linux
```

You'll get something like `10.15.21.25`.

Allow port 8080 through the firewall:
```bash
# Windows, run as Administrator
netsh advfirewall firewall add rule name="Armada 8080" dir=in action=allow protocol=TCP localport=8080
```

**On the second laptop:**

Open the game and point it at the host:

```js
netChat.setServer("10.15.21.25");
```

Run that once in the browser console, or hard-code the host IP in `netchat.js`.

That's it — both players are now in the same world. Deaths, chat, loot and leaderboard times are shared live.

> `netChat.serverUrl()` follows `location.hostname` by default, so if the second laptop loads the **game itself** from the host machine (not just the backend), it connects automatically with no extra step.

---

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| `Shift` | Dash — costs stamina, grants a short invulnerability window |
| **Left click** | Attack / fire |
| **Right click** (hold) | Aim line |
| `1` – `5` | Select weapon |
| Hold `3` | Cycle sidearms |
| **Scroll wheel** | Cycle owned weapons |
| `R` | Reload |
| `E` | Interact — doors, drawers, NPCs, letters, bloodstains |
| `F` | Flashlight (kitchen) |
| `T` | Open chat |
| `Esc` | Pause / back |

**Debug keys** — remove these before submitting or demoing:

| Key | Effect |
|---|---|
| `U` | Unlock all doors |
| `P` | Toggle invincibility |
| `J` | Instantly kill the current boss |
| `G` `H` `K` `L` | Misc. test triggers |

They're gated behind `const DEBUG_UNLOCK_ALL = false;` near the top of `gameplay.js`. Strip the key handlers entirely for a release build — a grader who presses `P` will walk through the final fight untouched.

---

## Game flow

```
Name entry  →  Opening interview cutscene  →  Floor 4
```

**Floor 4 — the ward**
Corridors, cells and a kitchen. First enemies: chargers, knife throwers, and pale creatures that flee from light until struck. You find the shiv, scissors and the flashlight here. The tragic convict's letter sets up the backstory.

**Jordan — mini-boss**
Charge attack with a directional telegraph. Wall-slam stuns him, and only during that stun window can he be hurt. Three health bars, each requiring exactly three hits inside one stun — progress resets if the stun expires. That reset is deliberate design, not a bug.

**The roof — Raymond, scripted defeat**
You are meant to lose this. The guard dies, Shreya's electricity drives Raymond off, and the story continues from the loss.

**Floor 3 — via the lobby**
Two corridors, four cells, a dining hall and an indoor games room. Firearms appear here: pistol, burst pistol, shotgun.

- **The Cold Man** (dining hall) — wields the freeze gun; killing him is how you get it
- **Raymond rematch** (games room) — freeze him, then damage him; each freeze blast and each weapon hit takes 5% of his bar

**Shreya's betrayal**
Her ID card reveals who she is. She flees, Floor 4 goes into lockdown and swarms, and you confront her before she rejoins.

**The finale — Armada**
Raymond joins you after his rematch. Three rounds in the Floor 3 lobby: deal 15 hit-points of damage to neutralise Armada, he drops eight items (four ammo), Raymond clashes with him, both are thrown apart, repeat. Third cycle triggers the ending — Raymond plants a grenade and survives.

**Epilogue → completion time → leaderboard → menu**

Weapon hit values in the Armada fight:

| Weapon | Hit value |
|---|---|
| Blades | 1 |
| Pistol / burst | 2 |
| Shotgun | 3 |
| Freeze gun | 0 — it holds him, nothing more |

---

## Architecture

### Scene system

Every screen is an object with the same three methods:

```js
const someScene = {
    onEnter() { /* reset state */ },
    update(dt) { /* logic, input, physics */ },
    draw(ctx) { /* render */ }
};
```

`changeScene(nextScene)` swaps the active one and calls its `onEnter`. Menu, cutscene, gameplay and leaderboard are all the same shape, which is why adding a screen costs almost nothing.

The same discipline runs through the game objects: every enemy, weapon, companion and room is its own object with its own state and behaviour. Shared behaviour is written once and reused — all enemies move through one collision routine, all weapons fire through one attack routine, all companions follow through one tracking routine.

### The game loop

`main.js` drives everything:

```js
function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    netChat.update();        // network first — chat can swallow keystrokes
    currentScene.update(dt);
    currentScene.draw(ctx);
    clearFrameInputs();      // reset per-frame flags last

    requestAnimationFrame(loop);
}
```

Order matters. `netChat.update()` runs **before** the scene so that when the chat box has focus, typing `W` types a letter instead of walking. `clearFrameInputs()` runs **last** so single-press actions fire exactly once.

All movement is multiplied by `dt`, so the game runs at the same speed on a 60 Hz and a 144 Hz display.

### Collision

Axis-aligned bounding boxes. Each room declares:

- `baseWalls` — an array of solid rectangles (furniture, counters, desks)
- `floorBounds` — the walkable outer rectangle

Movement is resolved on each axis separately, so sliding along a wall works instead of sticking.

> **Lesson learned:** collision boxes should cover the *solid* part of an object, not its whole visual footprint. The dining hall was initially impassable because the table boxes were 112px tall — covering the benches too — leaving gaps smaller than the player. Trimming them to 62px slabs fixed it.

### Save system

`localStorage`, with autosave triggered at:
- Doorways (room transitions)
- Item pickups
- Quest step completions

Player name and personal best completion time persist separately so they survive a new game.

### WebSocket protocol

Messages are newline-free JSON strings over a single `/chat` endpoint. The server parses them by hand — no Jackson, no dependencies beyond `spring-boot-starter-websocket`.

**Client → server**

| Type | Payload | Meaning |
|---|---|---|
| `chat` | `name`, `text` | Broadcast a chat message |
| `death` | `name`, `room`, `x`, `y`, `lastWords`, `items[]` | Player died here with this inventory |
| `claim` | `pileId`, `itemIndex` | Request an item from a dropped pile |
| `finish` | `name`, `time` | Completed the game in this many seconds |
| `leaderboardRequest` | — | Send me the current board |

**Server → client**

| Type | Payload | Meaning |
|---|---|---|
| `chat` | `name`, `text` | Relayed to everyone |
| `death` | full death packet | Spawn a bloodstain in that room for everyone |
| `claimResult` | `pileId`, `itemIndex`, `granted` | You got it, or someone beat you to it |
| `leaderboard` | `rows[]` of `{name, time}` | Top ten, sorted |

**Server-side concurrency**

```java
private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
private final Map<String, String> lootPiles  = new ConcurrentHashMap<>();
private final Map<String, Long>   bestTimes  = new ConcurrentHashMap<>();
private final AtomicLong pileIdCounter       = new AtomicLong();
```

The loot claim is the interesting one. `ConcurrentHashMap.remove(key)` is atomic and returns the removed value, so it doubles as the lock:

```java
String item = lootPiles.remove(pileKey);
if (item != null) {
    // this session won the race — grant it
} else {
    // someone else already took it
}
```

Two players clicking the same item in the same millisecond cannot both receive it. No `synchronized` block needed.

---

## Weapons

| Weapon | Range | Damage | Uses | Cooldown | Notes |
|---|---|---|---|---|---|
| Shiv | 205 | 1 | 20 | — | Throwable, craftable |
| Scissors | 250 | 1 | 15 | — | Throwable |
| Charged blade | 205 | 1 + shock | 20 | — | Shreya electrifies it; holding attack drains full stamina |
| Pistol | 780 | 2 | 7 rounds | 0.34s | `R` to reload |
| Burst pistol | 760 | 2 | 12 | 0.26s | Semi-auto burst |
| Shotgun | 330 | 99 | 6 | 0.9s | Spread |
| Freeze gun | 430 | — | ∞ | 8.0s | Freezes for 5s; from the Cold Man |

Every weapon tracks its **own** cooldown:

```js
weaponCooldowns: {},   // each weapon cools down on its own clock
```

This was a real bug worth calling out: with a single shared cooldown, the freeze gun's 8-second timer locked every other weapon — and since the freeze only lasts 5 seconds, the target thawed before you could shoot it. Per-weapon cooldowns fixed it.

---

## Companions

| Companion | Ability | Joins |
|---|---|---|
| The Doctor | Heals a full bar every 8 seconds while you're hurt; cures poison | Lobby |
| The Guard | Covering fire that pulls enemies off you; unlocks doors; three-blade volley | Floor 4 |
| Shreya | Tases an enemy every 15 seconds; charges your blade with electricity | Floor 4 → betrays → rejoins |
| Raymond | Clashes with Armada in the final fight | After his rematch |

Companions follow between rooms, survive the player's death, and can be lost permanently to the story.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Chat shows "offline" | Backend isn't running, or the game is pointed at the wrong host. Check `netChat.serverUrl()` in the console |
| Second laptop can't connect | Firewall is blocking port 8080, or the machines are on different networks (one on Wi-Fi, one on Ethernet) |
| Sprites don't load | Check for the double-extension bug — `.png.png`. Windows File Explorer hides extensions by default; turn them on under View → File name extensions |
| An image loads sometimes but not always | `src` was set before the `onload` handler. Cache-loaded images fire `load` immediately and the handler misses it. Always assign `onload` first |
| Game opens but nothing renders | Opened via `file://`. Use Live Server or `python -m http.server` |
| Typing in chat moves the character | `netChat.update()` must run before `currentScene.update()` in the loop |

---

## Known limitations

- **Floors 1 and 2 were cut.** No time. The building's geography implies them; they were never built.
- **The backend runs on localhost only.** Multiplayer works across a LAN but has not been deployed to a public host.
- **Sadid's character sprites are incomplete** — the back-facing walk frames are missing.
- **Debug keys ship in the source.** Strip `G`, `H`, `J`, `K`, `L`, `P` and `U` before any release or demo build.
- **No audio layer.** The hooks are in place; the sound files are not.
---

## Testing

Headless test harness built on Node's `vm` module with a Proxy-based fake canvas context, so game code runs without a browser. Around fifteen suites cover room reachability (flood-fill from every spawn point), boss state machines, weapon cooldowns and the full run-to-ending path.

```bash
node tests/run.js
```

Flood-fill testing caught a real bug: a drawer placed in the games room sealed off a corner, dropping reachability to 94%.

---

*Built with no engine, no framework and no build step. Just a canvas and a socket.*
