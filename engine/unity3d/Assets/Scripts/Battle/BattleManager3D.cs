using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Chronicles3D.Data;

namespace Chronicles3D.Battle
{
    /// <summary>
    /// Turn-based battle orchestrator rendered in 3D space.
    /// Builds a battle arena, spawns hero + enemy figures, and drives the
    /// turn timeline. UI decisions are forwarded through a delegate so the
    /// Unity UI layer stays separate.
    /// </summary>
    public class BattleManager3D : MonoBehaviour
    {
        public enum Phase { Start, PlayerTurn, EnemyTurn, Action, Victory, Defeat }

        public Phase CurrentPhase { get; private set; } = Phase.Start;

        public List<CharacterInstance3D> Heroes { get; private set; } = new List<CharacterInstance3D>();
        public List<EnemyDefinition3D> Enemies { get; private set; } = new List<EnemyDefinition3D>();
        public List<int> EnemyHP { get; private set; } = new List<int>();

        // Battle visuals
        GameObject arenaRoot;
        readonly List<GameObject> heroFigures = new List<GameObject>();
        readonly List<GameObject> enemyFigures = new List<GameObject>();

        // Actor timeline (0=hero index,1=enemy index)
        struct TurnSlot { public bool isEnemy; public int index; public int speed; }
        readonly List<TurnSlot> timeline = new List<TurnSlot>();
        int turnPos;

        // Callbacks wired to UI
        public System.Action<string> OnLog;
        public System.Action<int> OnActorActivated;      // index into current actor list (hero idx or enemy idx)
        public System.Action<Phase> OnPhaseChanged;
        public System.Action<int, int> OnVictory;        // exp, gold
        public System.Action OnDefeat;

        public int CurrentHeroIndex { get; private set; }
        public int CurrentEnemyIndex { get; private set; }
        public bool IsWaitingForPlayer { get; private set; }

        const float BattleTop = 0f;
        const float Spacing = 2.4f;
        Coroutine driveRoutine;

        // ---------- Setup ----------
        public void StartBattle(List<CharacterInstance3D> heroes, List<string> enemyIds)
        {
            Heroes = heroes;
            Enemies = new List<EnemyDefinition3D>();
            EnemyHP = new List<int>();

            foreach (var id in enemyIds)
            {
                var def = EnemyLibrary.Get(id);
                if (def == null) continue;
                Enemies.Add(def);
                EnemyHP.Add(def.hp);
            }

            foreach (var h in Heroes) h.Restore();

            BuildArena();
            BuildFigures();
            BuildTimeline();

            turnPos = 0;
            CurrentPhase = Phase.Start;
            IsWaitingForPlayer = false;
            OnPhaseChanged?.Invoke(CurrentPhase);
            driveRoutine = StartCoroutine(DriveBattle());
        }

        void BuildArena()
        {
            arenaRoot = new GameObject("BattleArena");
            var floor = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            floor.name = "ArenaFloor";
            floor.transform.SetParent(arenaRoot.transform, false);
            floor.transform.localScale = new Vector3(14f, 0.3f, 14f);
            floor.transform.position = Vector3.zero;
            floor.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.42f, 0.38f, 0.5f) };

            var ring = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            ring.name = "ArenaRing";
            ring.transform.SetParent(arenaRoot.transform, false);
            ring.transform.localScale = new Vector3(1f, 0.02f, 1f);
            ring.transform.position = new Vector3(0, 0.02f, 0);
            ring.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.8f, 0.7f, 0.3f) };
        }

        void BuildFigures()
        {
            // Heroes on the near (camera) side, facing enemies
            int hCount = Heroes.Count;
            for (int i = 0; i < hCount; i++)
            {
                var fig = CharacterBuilder3D.BuildHero(Heroes[i].definition);
                fig.transform.SetParent(arenaRoot.transform, false);
                float x = (i - (hCount - 1) * 0.5f) * Spacing;
                fig.transform.position = new Vector3(x, 0, 4.5f);
                fig.transform.rotation = Quaternion.Euler(0, 180, 0); // face enemies
                heroFigures.Add(fig);
            }

            int eCount = Enemies.Count;
            for (int i = 0; i < eCount; i++)
            {
                var fig = CharacterBuilder3D.BuildEnemy(Enemies[i]);
                fig.transform.SetParent(arenaRoot.transform, false);
                float x = (i - (eCount - 1) * 0.5f) * Spacing;
                fig.transform.position = new Vector3(x, 0, -4.5f);
                fig.transform.rotation = Quaternion.Euler(0, 0, 0);
                enemyFigures.Add(fig);
            }
        }

        void BuildTimeline()
        {
            timeline.Clear();
            for (int i = 0; i < Heroes.Count; i++)
                timeline.Add(new TurnSlot { isEnemy = false, index = i, speed = Heroes[i].stats.spd });
            for (int i = 0; i < Enemies.Count; i++)
                timeline.Add(new TurnSlot { isEnemy = true, index = i, speed = Enemies[i].spd });
            timeline.Sort((a, b) => b.speed.CompareTo(a.speed));
        }

        IEnumerator DriveBattle()
        {
            yield return new WaitForSeconds(1f);

            while (CurrentPhase == Phase.Start || CurrentPhase == Phase.PlayerTurn || CurrentPhase == Phase.EnemyTurn)
            {
                // Skip finished actors
                if (turnPos >= timeline.Count)
                {
                    turnPos = 0;
                    BuildTimeline();
                }

                var slot = timeline[turnPos];

                if (!slot.isEnemy)
                {
                    if (Heroes[slot.index].stats.currentHP <= 0) { turnPos++; continue; }
                    CurrentHeroIndex = slot.index;
                    CurrentPhase = Phase.PlayerTurn;
                    IsWaitingForPlayer = true;
                    OnPhaseChanged?.Invoke(CurrentPhase);
                    OnActorActivated?.Invoke(slot.index);
                    yield return new WaitWhile(() => IsWaitingForPlayer);
                }
                else
                {
                    if (EnemyHP[slot.index] <= 0) { turnPos++; continue; }
                    CurrentEnemyIndex = slot.index;
                    CurrentPhase = Phase.EnemyTurn;
                    OnPhaseChanged?.Invoke(CurrentPhase);
                    OnActorActivated?.Invoke(slot.index);
                    yield return new WaitForSeconds(0.7f);
                    yield return RunEnemyAction(slot.index);
                }

                turnPos++;
                yield return new WaitForSeconds(0.35f);

                if (CheckVictory()) yield break;
                if (CheckDefeat()) yield break;
            }
        }

        // ---------- Player Actions ----------
        public void PerformHeroAction(string action, int targetIndex)
        {
            if (!IsWaitingForPlayer) return;
            IsWaitingForPlayer = false;

            var hero = Heroes[CurrentHeroIndex];
            if (action == "attack")
            {
                int dmg = ComputeDamage(hero.stats.atk, Enemies[targetIndex].def);
                DealEnemyDamage(targetIndex, dmg);
                OnLog?.Invoke($"{hero.definition.displayName} attacks {Enemies[targetIndex].displayName} for {dmg}!");
            }
            else if (action == "defend")
            {
                OnLog?.Invoke($"{hero.definition.displayName} defends.");
            }
        }

        public void PerformHeroSkill(int skillIndex, int targetIndex)
        {
            if (!IsWaitingForPlayer) return;
            IsWaitingForPlayer = false;

            var hero = Heroes[CurrentHeroIndex];
            string skill = hero.definition.skillIds.Count > skillIndex ? hero.definition.skillIds[skillIndex] : "Skill";

            // Basic: skill deals magic damage to one enemy (heal self if skill is Heal)
            if (skill == "Heal")
            {
                hero.stats.currentHP = Mathf.Min(hero.stats.maxHP, hero.stats.currentHP + 60);
                OnLog?.Invoke($"{hero.definition.displayName} casts Heal! +60 HP");
            }
            else
            {
                int dmg = ComputeDamage(hero.stats.mag, Enemies[targetIndex].res) + 10;
                DealEnemyDamage(targetIndex, dmg);
                OnLog?.Invoke($"{hero.definition.displayName} uses {skill} for {dmg}!");
            }
        }

        int ComputeDamage(int atk, int def)
        {
            return Mathf.Max(1, Mathf.RoundToInt((atk * 1.2f - def * 0.6f) * Random.Range(0.85f, 1.2f)));
        }

        void DealEnemyDamage(int enemyIndex, int dmg)
        {
            EnemyHP[enemyIndex] = Mathf.Max(0, EnemyHP[enemyIndex] - dmg);
            if (EnemyHP[enemyIndex] <= 0)
            {
                OnLog?.Invoke($"{Enemies[enemyIndex].displayName} is defeated!");
                // Simple death animation
                if (enemyFigures[enemyIndex])
                {
                    var go = enemyFigures[enemyIndex];
                    go.transform.Rotate(0, 0, 70);
                    go.transform.position -= Vector3.up * 0.8f;
                }
            }
        }

        IEnumerator RunEnemyAction(int enemyIndex)
        {
            var heroCandidates = new List<int>();
            for (int i = 0; i < Heroes.Count; i++)
                if (Heroes[i].stats.currentHP > 0) heroCandidates.Add(i);

            if (heroCandidates.Count == 0) yield break;

            int target = heroCandidates[Random.Range(0, heroCandidates.Count)];
            int dmg = ComputeDamage(Enemies[enemyIndex].atk, Heroes[target].stats.def);
            Heroes[target].stats.currentHP = Mathf.Max(0, Heroes[target].stats.currentHP - dmg);
            OnLog?.Invoke($"{Enemies[enemyIndex].displayName} hits {Heroes[target].definition.displayName} for {dmg}!");
            yield return new WaitForSeconds(0.6f);
        }

        bool CheckVictory()
        {
            for (int i = 0; i < EnemyHP.Count; i++)
                if (EnemyHP[i] > 0) return false;

            int exp = 0, gold = 0;
            foreach (var e in Enemies) { exp += e.exp; gold += e.gold; }
            OnVictory?.Invoke(exp, gold);   // set result message first
            CurrentPhase = Phase.Victory;
            OnPhaseChanged?.Invoke(CurrentPhase);
            return true;
        }

        bool CheckDefeat()
        {
            foreach (var h in Heroes)
                if (h.stats.currentHP > 0) return false;

            OnDefeat?.Invoke();             // set result message first
            CurrentPhase = Phase.Defeat;
            OnPhaseChanged?.Invoke(CurrentPhase);
            return true;
        }

        /// <summary>Reward and cleanup after battle resolves.</summary>
        public void EndBattle()
        {
            if (driveRoutine != null)
            {
                StopCoroutine(driveRoutine);
                driveRoutine = null;
            }
            IsWaitingForPlayer = false;
            if (arenaRoot) Destroy(arenaRoot);
            arenaRoot = null;
            heroFigures.Clear();
            enemyFigures.Clear();
        }
    }
}
