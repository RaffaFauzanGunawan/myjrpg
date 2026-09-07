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

        public event System.Action<bool> OnBattleChanged;

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
            Gold += gold;
            // Level up heroes that gained exp
            var leveled = new List<string>();
            foreach (var hero in Party)
            {
                hero.exp += exp;
                while (hero.exp >= hero.expToNext)
                {
                    hero.LevelUp();
                    leveled.Add(hero.definition.displayName);
                }
            }
            string msg = $"Victory! +{exp} EXP, +{gold} gold.";
            if (leveled.Count > 0) msg += "\n" + string.Join(", ", leveled) + " leveled up!";
            LastResultMessage = msg;
            Debug.Log(msg);
            // UI overlay offers a Continue button (no auto-return needed)
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
    }
}
