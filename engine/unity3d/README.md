# Chronicles of the Fallen Crown — Unity 3D (C#)

The full JRPG reimagined in **real 3D** with Unity + C#. The overworld of Valdria is
generated procedurally from primitives at runtime — **no art assets or hand-authored
scenes required**. Every hero, enemy, tree, and building is built from Unity primitives
at runtime, tinted with each character's colors.

## ✨ What's Included

```
engine/unity3d/
└── Assets/Scripts/
    ├── Data/
    │   ├── CharacterData3D.cs        # 7 heroes + enemy library (per PRD stats)
    │   ├── ElementSystem.cs          # 9 elements + weakness chart (2x / 0.5x)
    │   └── SkillData3D.cs            # Skill metadata (element/MP/power) + skill trees
    ├── World/
    │   └── EnvironmentBuilder.cs     # 3D Valdria: terrain, trees, rocks, river, village
    ├── Player/
    │   ├── PlayerController3D.cs     # Third-person WASD movement + random encounters
    │   └── CameraRig3D.cs            # Orbit camera (right-drag), scroll zoom
    ├── Battle/
    │   ├── BattleManager3D.cs        # Turn-based 3D combat (elemental damage, MP, guard)
    │   └── CharacterBuilder3D.cs     # Heroes/enemies built from primitives
    ├── UI/
    │   └── GameUI3D.cs               # HUD, quest journal, skill tree, save/load, battle UI
    ├── Core/
    │   ├── GameManager3D.cs          # Party, camera switching, battle flow, save/load
    │   ├── QuestSystem3D.cs          # 6 quests w/ kill/win/gold/level objectives + chain
    │   └── SaveSystem3D.cs           # JSON save file (persistentDataPath)
    └── Editor/
        └── ChroniclesSceneWizard.cs  # One-click scene generator (menu)
```

## 🚀 Setup (5 minutes)

1. **Install Unity Hub + Unity 2022.3 LTS** (or newer) from unity.com.
2. Create a new **3D (Built-in Render Pipeline)** project — any name/location.
3. Copy the `Assets/Scripts` folder from `engine/unity3d/` into your project's `Assets/` folder.
4. Wait for Unity to compile (watch the bottom-right spinner).
5. From the top menu click **Chronicles → Build & Open 3D Scene**.
6. Click the **Play** button. Explore the world!

### Playing

| Input | Action |
|---|---|
| **WASD** | Move around Valdria |
| **Right mouse drag** | Orbit camera |
| **Mouse wheel** | Zoom |
| Walk into wild grass | Triggers a **random battle** |

### Exploration buttons (top-right HUD)

| Button | What it does |
|---|---|
| **Skill Tree** | Spend SP to unlock skills (tier chain + 2 passives per hero) |
| **Quests** | Quest journal with live objective progress |
| **Save** | Writes `chronicles_save.json` (party, gold, quests, position) |
| **Load** | Restores the last save (rebuilds party + journal) |

### Battle Controls (mouse)

1. Battle starts → command panel appears bottom-right.
2. **Attack / Skill / Defend / Flee**. `Defend` raises a guard: the next hit on that
   hero is halved.
3. **Skills** lists only what the acting hero has unlocked in the skill tree — each
   button shows element, area tag and MP cost. Heals/guards/area spells act instantly;
   single-target spells ask you to pick an enemy.
4. Enemy target buttons show HP **and their element + weakness** (from the chart below).
5. Win → earn EXP, gold **and +2 SP per hero** → heroes level up → **Continue** returns
   to the world.

### Elemental weakness chart

Ring: `Fire > Ice > Wind > Earth > Lightning > Water > Fire`; extras: `Light > Dark`,
`Poison > Wind`. Hitting a weakness doubles damage (log says “super effective!”);
attacking with the enemy's own element (or one it beats) is resisted to 0.5×.

## 🧩 What You Can Extend

- **More areas**: modify `EnvironmentBuilder` to build desert / snow / dungeon zones.
- **Real models**: swap `CharacterBuilder3D.BuildHero/BuildEnemy` to load FBX/glTF
  prefabs and character controllers.
- **Animations**: attach an Animator to the built figures.
- **Timing Ring**: port the browser prototype's timing ring as a radial on-screen dial
  that multiplies damage by Perfect/Good/Miss.
- **More quests**: append entries to `QuestSystem3D.Definitions` (objectives already
  support kill / win / gold / level / skill-unlock types; `unlocksOnComplete` chains).
- **New skills**: add rows to `SkillLibrary` and names to a hero's `skillIds`.
- **Elemental balance**: tweak `ElementSystem`'s `Beats` table for a different
  rock-paper-scissors feel.

## 🏗️ Architecture Notes

- `GameManager3D` builds the world in `Start()` (deterministic ordering; it calls
  `EnvironmentBuilder.Build()` explicitly).
- Exploration camera and a second battle camera swap `enabled` state during battles.
- All UI is built in code (CanvasScaler 1920×1080). An EventSystem is auto-created.
- Battle timeline sorts actors by SPD; enemies act automatically; heroes wait on input.

## 📋 PRD Coverage (in this 3D vertical slice)

- ✅ 3D semi-open overworld with village + wilderness
- ✅ Third-person exploration with random encounters
- ✅ 7 recruitable heroes (Cedric, Lyra, Aldous, Rowan, Mira, Dorin, Seraphina)
- ✅ Turn-based battle with Attack / Skills / Defend / Flee
- ✅ 8+ enemy types incl. 2 bosses (Shadow Knight, Dragon Lord Vexar)
- ✅ Elemental weaknesses & resistances (super-effective / resisted hits)
- ✅ Skill trees: 3 skills + 2 passive capstones per hero, gated by SP
- ✅ MP costs & guard (defend) mechanic in battle
- ✅ Quest system: 6 quests, objective tracking, chain unlocks, rewards
- ✅ JSON save / load (party stats, SP, skill unlocks, gold, quests, position)
- ✅ EXP / gold / level-ups
- ⏳ Next: story beats, more zones, real 3D models/animation, timing ring
