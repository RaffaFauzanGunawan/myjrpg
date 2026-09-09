using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Chronicles3D.Data;
using Chronicles3D.World;
using Chronicles3D.Player;
using Chronicles3D.Battle;

namespace Chronicles3D.Core
{
    /// <summary>
    /// Central controller for the 3D game. Owns the party, spawns the player
    /// and environment, and manages transitions between exploration and battle
    /// (switching camera rigs and enabling the battle arena).
    /// </summary>
    public class GameManager3D : MonoBehaviour
    {
        [Header("References (auto-found or spawned)")]
        public EnvironmentBuilder environment;
        public PlayerController3D player;
        public CameraRig3D exploreCamera;
        public Camera exploreCam;

        public BattleManager3D battle;
        public Camera battleCam;

        // Party (active heroes, in order)
        public List<CharacterInstance3D> Party { get; private set; } = new List<CharacterInstance3D>();

        // Game phase
        public bool InBattle { get; private set; }
        public int Gold { get; private set; }

        public QuestSystem3D quests;

        public event System.Action<bool> OnBattleChanged;
        public event System.Action OnGameLoaded;

        // Encounter tables per wild zone
        readonly string[][] encounterTables =
        {
            new[] { "forest_bug", "goblin" },
            new[] { "wolf", "slime" },
            new[] { "slime", "forest_bug", "goblin" },
            new[] { "wolf", "goblin" },
        };

        void Awake()
        {
            // Party: Cedric leads; add Lyra + Aldous to start
            Party.Add(new CharacterInstance3D(CharacterLibrary.Get("cedric")));
            Party.Add(new CharacterInstance3D(CharacterLibrary.Get("lyra")));
            Party.Add(new CharacterInstance3D(CharacterLibrary.Get("aldous")));

            // Quest journal lives on its own GameObject
            var questGo = new GameObject("QuestSystem");
            quests = questGo.AddComponent<QuestSystem3D>();
            quests.game = this;
        }

        void Start()
        {
            BuildWorldAndPlayer();
            Subscribe();
        }

        void BuildWorldAndPlayer()
        {
            // --- Environment (built now, deterministic order) ---
            if (!environment)
            {
                var envGo = new GameObject("Environment");
                environment = envGo.AddComponent<EnvironmentBuilder>();
            }
            environment.Build();

            // --- Player ---
            if (!player)
            {
                var playerGo = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                playerGo.name = "Player";
                player = playerGo.AddComponent<PlayerController3D>();
                playerGo.GetComponent<Renderer>().material.color = new Color(0.3f, 0.5f, 0.85f);
            }
            float cx = environment.width * environment.tileSize * 0.5f;
            float cz = environment.depth * environment.tileSize * 0.5f;
            player.transform.position = new Vector3(cx, 1f, cz + 4f);

            // --- Main camera + rig ---
            if (exploreCam == null)
            {
                exploreCam = Camera.main;
                if (exploreCam == null)
                {
                    // No camera exists yet: create one
                    var camGo = new GameObject("MainCamera");
                    camGo.tag = "MainCamera";
                    camGo.transform.position = new Vector3(cx, 14f, cz - 14f);
                    camGo.transform.rotation = Quaternion.Euler(45f, 0, 0);
                    exploreCam = camGo.AddComponent<Camera>();
                    camGo.AddComponent<AudioListener>();
                }
            }
            exploreCamera = exploreCam.GetComponent<CameraRig3D>();
            if (!exploreCamera) exploreCamera = exploreCam.gameObject.AddComponent<CameraRig3D>();
            exploreCamera.target = player.transform;

            // --- Battle manager + battle camera (hidden until battle) ---
            if (!battle)
            {
                var battleGo = new GameObject("BattleManager");
                battle = battleGo.AddComponent<BattleManager3D>();
            }
            if (!battleCam)
            {
                var bcGo = new GameObject("BattleCamera");
                battleCam = bcGo.AddComponent<Camera>();
                bcGo.tag = "Untagged";
                battleCam.transform.position = new Vector3(0, 6f, -9f);
                battleCam.transform.rotation = Quaternion.Euler(18f, 0, 0);
                bcGo.SetActive(false);
            }
        }

        void Subscribe()
        {
            player.OnEncounter += pos => TriggerRandomBattle();
            battle.OnVictory += HandleVictory;
            battle.OnDefeat += HandleDefeat;
            battle.OnLog += msg => Debug.Log("[Battle] " + msg);
            battle.OnEnemyDefeated += enemyId => { if (quests) quests.RegisterEnemyDefeat(enemyId); };
        }

        // ---------- Battle Transitions ----------
        public void TriggerRandomBattle()
        {
            var table = encounterTables[Random.Range(0, encounterTables.Length)];
            int count = Random.Range(1, 3);
            var ids = new List<string>();
            for (int i = 0; i < count; i++) ids.Add(table[Random.Range(0, table.Length)]);
            EnterBattle(ids);
        }

        public void EnterBattle(List<string> enemyIds)
        {
            InBattle = true;
            if (player) player.enabled = false;
            battle.StartBattle(Party, enemyIds);

            // Switch cameras
            exploreCam.enabled = false;
            exploreCamera.enabled = false;
            battleCam.gameObject.SetActive(true);

            OnBattleChanged?.Invoke(true);
        }

        void HandleVictory(int exp, int gold)
        {
            AddGold(gold);
            GrantSp(2);   // +2 skill points to every hero per victory

            var leveled = GrantExp(exp);
            string msg = $"Victory! +{exp} EXP, +{gold} gold, +2 SP per hero.";
            if (leveled.Count > 0) msg += "\n" + string.Join(", ", leveled) + " leveled up!";
            LastResultMessage = msg;
            Debug.Log(msg);

            if (quests) quests.RegisterBattleWin();
            // UI overlay offers a Continue button (no auto-return needed)
        }

        /// <summary>Add gold (used by quest rewards too); keeps gold objectives fresh.</summary>
        public void AddGold(int amount)
        {
            Gold += amount;
            if (quests) quests.RegisterGold(Gold);
        }

        /// <summary>Distribute EXP and trigger level ups. Returns names of heroes that leveled.</summary>
        public List<string> GrantExp(int exp)
        {
            var leveled = new List<string>();
            if (exp <= 0) return leveled;
            foreach (var hero in Party)
            {
                hero.exp += exp;
                while (hero.exp >= hero.expToNext)
                {
                    hero.LevelUp();
                    leveled.Add(hero.definition.displayName);
                }
            }
            if (leveled.Count > 0 && Party.Count > 0 && quests)
                quests.RegisterPartyLevel(Party[0].level);
            return leveled;
        }

        /// <summary>Add skill points to every party member (battle + quest rewards).</summary>
        public void GrantSp(int amount)
        {
            foreach (var hero in Party) hero.sp += amount;
        }

        public string LastResultMessage { get; private set; } = "";

        void HandleDefeat()
        {
            Debug.Log("Defeat... party wiped out.");
            // Heal to 50% and send back to village center
            foreach (var hero in Party)
            {
                hero.stats.currentHP = Mathf.Max(1, hero.stats.maxHP / 2);
                hero.stats.currentMP = hero.stats.maxMP;
            }
            LastResultMessage = "Defeat... the party has fallen.\nReturning to the village...";
        }

        IEnumerator ReturnToWorldAfter(float delay)
        {
            yield return new WaitForSeconds(delay);
            ForceEndBattle();
        }

        /// <summary>Public entry point to leave battle (victory, defeat, or flee).</summary>
        public void ForceEndBattle()
        {
            battle.EndBattle();
            InBattle = false;
            if (player) player.enabled = true;

            battleCam.gameObject.SetActive(false);
            exploreCamera.enabled = true;
            exploreCam.enabled = true;

            // Send player near village
            if (environment && player)
            {
                float cx = environment.width * environment.tileSize * 0.5f;
                float cz = environment.depth * environment.tileSize * 0.5f;
                player.TeleportTo(new Vector3(cx + 2f, 1f, cz + 6f));
            }
            OnBattleChanged?.Invoke(false);
        }

        // ---------- Save / Load ----------
        public void SaveToDisk()
        {
            if (InBattle)
            {
                Debug.Log("[Save] Can't save during battle.");
                return;
            }
            var data = new SaveData3D { gold = Gold };
            if (player)
            {
                var p = player.transform.position;
                data.playerX = p.x; data.playerY = p.y; data.playerZ = p.z;
            }

            foreach (var hero in Party)
            {
                data.party.Add(new PartyMemberSaveData
                {
                    id = hero.definition.id,
                    level = hero.level,
                    exp = hero.exp,
                    expToNext = hero.expToNext,
                    sp = hero.sp,
                    unlockedNodes = new List<string>(hero.unlockedNodes),
                    maxHP = hero.stats.maxHP, currentHP = hero.stats.currentHP,
                    maxMP = hero.stats.maxMP, currentMP = hero.stats.currentMP,
                    atk = hero.stats.atk, def = hero.stats.def,
                    mag = hero.stats.mag, res = hero.stats.res,
                    spd = hero.stats.spd, luk = hero.stats.luk
                });
            }

            if (quests)
            {
                data.activeQuests = quests.SnapshotActive();
                data.completedQuests = new List<string>(quests.Completed);
            }

            SaveSystem3D.SaveGame(data);
        }

        public void LoadFromDisk()
        {
            if (InBattle)
            {
                Debug.Log("[Load] Can't load during battle.");
                return;
            }
            var data = SaveSystem3D.LoadGame();
            if (data == null)
            {
                Debug.Log("[Load] No save file found.");
                return;
            }

            // Rebuild party from the snapshot
            Party.Clear();
            foreach (var m in data.party)
            {
                var def = CharacterLibrary.Get(m.id);
                if (def == null) continue;
                var hero = new CharacterInstance3D(def);
                hero.level = Mathf.Max(1, m.level);
                hero.exp = Mathf.Max(0, m.exp);
                hero.expToNext = Mathf.Max(1, m.expToNext);
                hero.sp = Mathf.Max(0, m.sp);
                hero.unlockedNodes.Clear();
                if (m.unlockedNodes != null) hero.unlockedNodes.AddRange(m.unlockedNodes);
                // Guarantee the free first skill stays unlocked
                string root = def.skillIds.Count > 0 ? SkillTreeLibrary.SkillNodeId(def.skillIds[0]) : null;
                if (root != null && !hero.unlockedNodes.Contains(root)) hero.unlockedNodes.Add(root);

                hero.stats.maxHP = Mathf.Max(1, m.maxHP);
                hero.stats.currentHP = Mathf.Clamp(m.currentHP, 1, Mathf.Max(1, m.maxHP));
                hero.stats.maxMP = Mathf.Max(0, m.maxMP);
                hero.stats.currentMP = Mathf.Clamp(m.currentMP, 0, Mathf.Max(0, m.maxMP));
                hero.stats.atk = m.atk; hero.stats.def = m.def;
                hero.stats.mag = m.mag; hero.stats.res = m.res;
                hero.stats.spd = m.spd; hero.stats.luk = m.luk;
                Party.Add(hero);
            }

            Gold = Mathf.Max(0, data.gold);

            if (quests)
            {
                quests.RestoreActive(data.activeQuests);
                quests.RestoreCompleted(data.completedQuests);
                quests.RefreshLiveObjectives();
            }

            if (player)
                player.TeleportTo(new Vector3(data.playerX, data.playerY, data.playerZ));

            OnGameLoaded?.Invoke();
            Debug.Log("[Load] Save restored.");
        }
    }
}
