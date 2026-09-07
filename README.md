# 👑 Chronicles of the Fallen Crown

A **JRPG Medieval Fantasy** game with deep narrative, turn-based tactical combat, and the signature **Timing Ring** system.

## 🎮 Play Now

Open `index.html` in any modern browser (Chrome, Firefox, Edge) — no server needed!

### Controls
| Key | Action |
|---|---|
| WASD / Arrow Keys | Move |
| E | Interact with NPCs, chests, shops |
| M | Open menu |
| Escape | Close menus / skip dialog |
| Enter / Space | Advance dialog |

## 📁 Project Structure

```
├── index.html              # Playable HTML5 prototype (self-contained)
├── game/
│   ├── index.html          # Entry point
│   ├── bundle.js           # All game logic (~5000 lines)
│   ├── css/styles.css      # UI styles
│   └── js/                 # Modular source files
│       ├── data/           # Characters, enemies, items, areas, dialogs
│       ├── game.js         # Main game controller
│       ├── battle.js       # Combat system with Timing Ring
│       ├── world.js        # Tile map generation
│       ├── state.js        # Game state management
│       └── main.js         # Entry point
├── engine/
│   ├── README.md           # Engine migration guide
│   ├── unity/              # Unity C# starter files
│   └── godot/              # Godot 4.x GDScript starter files
└── .gitignore
```

## 🏰 Features

- **7 Playable Characters** with unique skill trees
- **Timing Ring** combat mechanic (Perfect / Great / Good / Miss)
- **Stagger Break** system with elemental weaknesses
- **Trinity Arts** combo attacks
- **8 Explorable Areas** with procedural generation
- **40+ Quests** (main story + side quests)
- **Crafting & Enchanting** with Dorin's blacksmith bonus
- **Shop System** across multiple towns
- **3 Different Endings** based on player choices

## ⚙️ Engine Starter Files

Ready-to-use starter code for production development:
- **Unity (C#)**: `engine/unity/Assets/Scripts/`
- **Godot 4.x (GDScript)**: `engine/godot/`

See `engine/README.md` for setup instructions.

## 📋 PRD

Full product requirements document available in conversation history.

---

*Built with 🤖 Codebuff*
