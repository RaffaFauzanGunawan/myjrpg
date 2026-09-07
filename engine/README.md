# Chronicles of the Fallen Crown — Engine Starter Files

## Overview

These are starter code files generated from the playable HTML5 prototype (`game/`).
They implement the **core game systems** from the PRD in two popular game engines:

- **Unity (C#)** — `engine/unity/`
- **Godot 4.x (GDScript)** — `engine/godot/`

---

## File Structure

### Unity (`engine/unity/Assets/Scripts/`)

```
Core/
  GameEnums.cs          — Enums (ElementType, DamageType, GameScreen, etc.) + elemental weakness chart
  GameManager.cs        — Singleton game state manager (party, inventory, save/load, screen transitions)

Characters/
  CharacterData.cs      — ScriptableObject for character definitions + growth rates + CharacterInstance
  SkillData.cs          — ScriptableObject for skills, skill trees, and equipment

Battle/
  BattleManager.cs      — Full turn-based battle system (turn order, enemy AI, status effects)
  TimingRingSystem.cs   — Timing Ring mechanic (spinning pointer, Perfect/Great/Good/Miss) + DamageCalculator

World/
  TileMapGenerator.cs   — Procedural map generation for all 8 areas (forest, desert, snow, town, dungeon, ruins, castle, cave)

Dialog/
  DialogSystem.cs       — Dialog manager with branching choices, typewriter, triggers

Quest/
  QuestSystem.cs        — Quest tracker with objectives, rewards, prerequisites

Crafting/
  CraftingManager.cs    — Crafting system with Dorin's blacksmith bonus
```

### Godot (`engine/godot/`)

```
core/
  game_enums.gd         — Enums + elemental weakness chart
  game_manager.gd       — Autoload singleton game state manager

characters/
  character_data.gd     — Resource-based character definitions + CharacterInstance
  skill_data.gd         — Resources for skills, skill trees, equipment

battle/
  timing_ring.gd        — Timing Ring control with signals
  battle_manager.gd     — Turn-based battle with stagger system
  enemy_data.gd         — Enemy resource + EnemyInstance

world/
  tile_map_generator.gd — Procedural map generation

dialog/
  dialog_manager.gd     — Dialog UI with typewriter + branching choices

quest/
  quest_data.gd         — Quest resources + QuestTracker node
```

---

## PRD Feature Coverage

| PRD Feature | Unity | Godot | Notes |
|---|---|---|---|
| 7 Playable Characters | ✅ CharacterData SO | ✅ Resource | Create 7 assets in editor |
| Skill Trees (3 branches) | ✅ SkillTreeData SO | ✅ SkillTreeData | Branch-based unlock system |
| Turn-Based Combat | ✅ BattleManager | ✅ BattleManager | Speed-based turn order |
| **Timing Ring** | ✅ TimingRingSystem | ✅ TimingRing | Perfect/Great/Good/Miss zones |
| **Stagger Break System** | ✅ In BattleManager | ✅ In BattleManager | Elemental weakness fills gauge |
| **Trinity Arts** | ✅ In SkillData | ✅ In SkillData | 2-3 character combo attacks |
| Semi-Open World (8 areas) | ✅ TileMapGenerator | ✅ TileMapGenerator | Procedural with biome rules |
| NPC Dialog | ✅ DialogManager | ✅ DialogManager | Branching choices |
| Quest System (40+) | ✅ QuestTracker | ✅ QuestTracker | Kill/Collect/Talk/Explore/Craft |
| Crafting + Dorin Bonus | ✅ CraftingManager | ✅ CraftingManager | 20% bonus with Dorin in party |
| Relationship System | ✅ In DialogChoice | ✅ In DialogChoice | Delta values on choices |
| 3 Endings | ✅ EndingType enum | ✅ EndingType enum | Branch based on flags |
| Save/Load | ✅ GameManager | ✅ GameManager | CreateSaveData/LoadSaveData |

---

## Getting Started

### Unity
1. Create a new Unity 2D/3D project (2022.3+ recommended)
2. Copy `engine/unity/Assets/` into your project's `Assets/` folder
3. Create ScriptableObject assets: Right-click > Create > Chronicles > [type]
4. Create 7 CharacterData assets for Cedric, Lyra, Aldous, Rowan, Mira, Dorin, Seraphina
5. Set up GameManager as a DontDestroyOnLoad singleton
6. Design your Timing Ring UI (ring graphic + pointer + zone indicators)

### Godot
1. Open Godot 4.x and create a new project
2. Copy `engine/godot/` files into your project
3. Set `game_manager.gd` as an Autoload singleton (Project > Project Settings > Autoload)
4. Create Resource files (.tres) for each character, skill, and enemy
5. Build scenes for Battle, Dialog, and World views
6. Connect TimingRing signals to BattleManager

---

## Next Steps for Production

1. **Art Assets**: Commission character portraits, battle sprites, tile maps, and UI elements
2. **Audio**: Hire composer for orchestral score + implement FMOD/Wwise
3. **Voice Acting**: Record EN & JP voice lines for main story (8 chapters)
4. **Level Design**: Design each of the 15+ dungeons with puzzle mechanics
5. **Balancing**: Spreadsheet for all stat curves, damage formulas, and encounter tables
6. **Testing**: Playtest timing ring feel, combat difficulty, story pacing

---

*Generated from the Chronicles of the Fallen Crown HTML5 prototype.*
*PRD Date: September 1, 2026*
