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
    │   └── CharacterData3D.cs        # 7 heroes + enemy library (per PRD stats)
    ├── World/
    │   └── EnvironmentBuilder.cs     # 3D Valdria: terrain, trees, rocks, river, village
    ├── Player/
    │   ├── PlayerController3D.cs     # Third-person WASD movement + random encounters
    │   └── CameraRig3D.cs            # Orbit camera (right-drag), scroll zoom
    ├── Battle/
    │   ├── BattleManager3D.cs        # Turn-based 3D combat timeline + rewards
    │   └── CharacterBuilder3D.cs     # Heroes/enemies built from primitives
    ├── UI/
    │   └── GameUI3D.cs               # Runtime uGUI: HUD, battle menu, logs, results
    ├── Core/
    │   └── GameManager3D.cs          # Party, camera switching, battle flow
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

### Battle Controls (mouse)

1. Battle starts → command panel appears bottom-right.
2. **Attack / Skill / Defend / Flee**.
3. For Attack/Skill, click an enemy to target it.
4. Win → earn EXP & gold → heroes level up → **Continue** returns to the world.

## 🧩 What You Can Extend

- **More areas**: modify `EnvironmentBuilder` to build desert / snow / dungeon zones.
- **Real models**: swap `CharacterBuilder3D.BuildHero/BuildEnemy` to load FBX/glTF
  prefabs and character controllers.
- **Animations**: attach an Animator to the built figures.
- **Timing Ring**: port the browser prototype's timing ring as a radial on-screen dial
  that multiplies damage by Perfect/Good/Miss.
- **Story & quests**: hook a quest graph into `GameManager3D.Party` and UI log.

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
- ✅ EXP / gold / level-ups
- ⏳ Next: elemental weaknesses, skill trees, quests, story, audio
