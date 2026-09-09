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
    ///
    /// Damage is elemental: each skill and enemy has an ElementType and the
    /// ElementSystem weakness chart decides super-effective / resisted hits.
    /// Skills are gated by the skill tree (unlocked node ids) and cost MP.
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

        // Heroes with the guard flag raised (next hit they take is halved)
        readonly Dictionary<int, bool> guardUp = new Dictionary<int, bool>();

        // Callbacks wired to UI / GameManager
        public System.Action<string> OnLog;
        public System.Action<int> OnActorActivated;      // index into current actor list (hero idx or enemy idx)
        public System.Action<Phase> OnPhaseChanged;
        public System.Action<int, int> OnVictory;        // exp, gold
        public System.Action OnDefeat;
        public System.Action<string> OnEnemyDefeated;    // enemy id (quest hook)

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

            guardUp.Clear();
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
                    guardUp.Remove(slot.index);   // guard expires when you take your next action
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

        // ---------- Info helpers for the UI ----------
        public string ActiveHeroName()
        {
            if (CurrentHeroIndex < 0 || CurrentHeroIndex >= Heroes.Count) return "?";
            return Heroes[CurrentHeroIndex].definition.displayName;
        }

        /// <summary>Skill ids the active hero currently has unlocked (definition order).</summary>
        public List<string> UsableSkillIdsForCurrentHero()
        {
            var hero = CurrentHeroIndex >= 0 && CurrentHeroIndex < Heroes.Count ? Heroes[CurrentHeroIndex] : null;
            var list = new List<string>();
            if (hero == null) return list;
            foreach (var sid in hero.definition.skillIds)
                if (hero.HasSkill(sid)) list.Add(sid);
            return list;
        }

        /// <summary>True when the given (definition-order) skill needs an enemy target chosen.</summary>
        public bool SkillNeedsTarget(int definitionSkillIndex)
        {
            var hero = CurrentHeroIndex >= 0 && CurrentHeroIndex < Heroes.Count ? Heroes[CurrentHeroIndex] : null;
            if (hero == null || definitionSkillIndex < 0 || definitionSkillIndex >= hero.definition.skillIds.Count) return false;
            var skill = SkillLibrary.Get(hero.definition.skillIds[definitionSkillIndex]);
            return skill != null && skill.kind == SkillKind.Damage && !skill.area;
        }

        public string SkillLabel(int definitionSkillIndex)
        {
            var hero = CurrentHeroIndex >= 0 && CurrentHeroIndex < Heroes.Count ? Heroes[CurrentHeroIndex] : null;
            if (hero == null || definitionSkillIndex < 0 || definitionSkillIndex >= hero.definition.skillIds.Count) return "Skill";
            string sid = hero.definition.skillIds[definitionSkillIndex];
            var skill = SkillLibrary.Get(sid);
            if (skill == null) return sid;
            string elem = ElementSystem.Tag(skill.element);
            string note = skill.kind == SkillKind.Heal || skill.kind == SkillKind.HealAll || skill.kind == SkillKind.Guard
                ? "" : (skill.area ? " (all)" : "");
            return sid + " " + elem + note + "  " + skill.mpCost + "MP";
        }

        // ---------- Player Actions ----------
        public void PerformHeroAction(string action, int targetIndex)
        {
            if (!IsWaitingForPlayer) return;
            IsWaitingForPlayer = false;

            var hero = Heroes[CurrentHeroIndex];
            if (action == "defend")
            {
                guardUp[CurrentHeroIndex] = true;
                OnLog?.Invoke($"{hero.definition.displayName} raises their guard! (next hit halved)");
            }
            else if (action == "attack")
            {
                int t = ResolveEnemyTarget(targetIndex);
                if (t < 0)
                {
                    OnLog?.Invoke("No target left!");
                    IsWaitingForPlayer = true; // let the player pick again
                    return;
                }
                int dmg = ComputeDamage(hero.stats.atk, Enemies[t].def);
                DealEnemyDamage(t, dmg);
                OnLog?.Invoke($"{hero.definition.displayName} attacks {Enemies[t].displayName} for {dmg}!");
            }
        }

        /// <summary>
        /// Execute skill at <paramref name="definitionSkillIndex"/> (index into the
        /// active hero's definition.skillIds). Pass targetIndex = -1 for skills that
        /// need no enemy target (heals, guards, area damage).
        /// </summary>
        public void PerformHeroSkill(int definitionSkillIndex, int targetIndex)
        {
            if (!IsWaitingForPlayer) return;
            var hero = Heroes[CurrentHeroIndex];
            if (definitionSkillIndex < 0 || definitionSkillIndex >= hero.definition.skillIds.Count) return;

            string sid = hero.definition.skillIds[definitionSkillIndex];
            if (!hero.HasSkill(sid))
            {
                OnLog?.Invoke($"{sid} is not learned yet! (use the Skill Tree)");
                return;
            }
            var skill = SkillLibrary.Get(sid) ?? new SkillDefinition3D { name = sid, power = 100 };
            if (hero.stats.currentMP < skill.mpCost)
            {
                OnLog?.Invoke($"{hero.definition.displayName} lacks {skill.mpCost} MP for {sid}!");
                return;
            }

            IsWaitingForPlayer = false;
            hero.stats.currentMP -= skill.mpCost;
            OnLog?.Invoke($"{hero.definition.displayName} uses {sid}!");

            switch (skill.kind)
            {
                case SkillKind.Damage:
                    ResolveDamageSkill(hero, skill, targetIndex);
                    break;
                case SkillKind.Heal:
                case SkillKind.HealAll:
                    ResolveHealSkill(hero, skill);
                    break;
                case SkillKind.Guard:
                    guardUp[CurrentHeroIndex] = true;
                    OnLog?.Invoke($"{hero.definition.displayName} braces! (next hit halved)");
                    break;
            }
        }

        void ResolveDamageSkill(CharacterInstance3D hero, SkillDefinition3D skill, int targetIndex)
        {
            if (skill.area)
            {
                for (int i = 0; i < Enemies.Count; i++)
                {
                    if (EnemyHP[i] <= 0) continue;
                    int dmg = ComputeSkillDamage(hero, skill, Enemies[i]);
                    DealEnemyDamage(i, dmg);
                    LogElementalHit(hero, Enemies[i], skill, dmg);
                }
                return;
            }

            int t = ResolveEnemyTarget(targetIndex);
            if (t < 0)
            {
                OnLog?.Invoke("No target left!");
                IsWaitingForPlayer = true;
                return;
            }
            int single = ComputeSkillDamage(hero, skill, Enemies[t]);
            DealEnemyDamage(t, single);
            LogElementalHit(hero, Enemies[t], skill, single);
        }

        void ResolveHealSkill(CharacterInstance3D hero, SkillDefinition3D skill)
        {
            if (skill.kind == SkillKind.HealAll)
            {
                int healed = 0;
                foreach (var h in Heroes)
                {
                    int before = h.stats.currentHP;
                    int amount = skill.power + hero.stats.mag / 2;
                    h.stats.currentHP = Mathf.Min(h.stats.maxHP, h.stats.currentHP + amount);
                    healed += h.stats.currentHP - before;
                }
                OnLog?.Invoke($"Party restored for {healed} HP total!");
            }
            else
            {
                // Heal the most wounded living ally
                CharacterInstance3D best = null;
                int bestHp = int.MaxValue;
                foreach (var h in Heroes)
                {
                    if (h.stats.currentHP <= 0) continue;
                    if (h.stats.currentHP < bestHp) { bestHp = h.stats.currentHP; best = h; }
                }
                if (best == null) return;
                int amount = skill.power + hero.stats.mag / 2;
                best.stats.currentHP = Mathf.Min(best.stats.maxHP, best.stats.currentHP + amount);
                OnLog?.Invoke($"{best.definition.displayName} recovers {amount} HP!");
            }
        }

        int ComputeSkillDamage(CharacterInstance3D hero, SkillDefinition3D skill, EnemyDefinition3D enemy)
        {
            bool magical = skill.scaling == SkillScaling.Magical;
            int baseStat = magical ? hero.stats.mag : hero.stats.atk;
            int guardStat = magical ? enemy.res : enemy.def;
            float variance = Random.Range(0.85f, 1.2f);
            float raw = (baseStat * 1.2f - guardStat * 0.6f) * variance * (skill.power / 100f);
            int dmg = Mathf.Max(1, Mathf.RoundToInt(raw));
            float mult = ElementSystem.GetMultiplier(skill.element, enemy.element);
            return Mathf.Max(1, Mathf.RoundToInt(dmg * mult));
        }

        void LogElementalHit(CharacterInstance3D hero, EnemyDefinition3D enemy, SkillDefinition3D skill, int dmg)
        {
            float mult = ElementSystem.GetMultiplier(skill.element, enemy.element);
            string flavor = "";
            if (mult > 1f && skill.element != ElementType.None)
                flavor = " It's super effective! (" + ElementSystem.DisplayName(enemy.element) + " is weak to " + ElementSystem.DisplayName(skill.element) + ")";
            else if (mult < 1f && skill.element != ElementType.None)
                flavor = " The attack was resisted...";
            OnLog?.Invoke($"{hero.definition.displayName} hits {enemy.displayName} for {dmg}!{flavor}");
        }

        int ResolveEnemyTarget(int targetIndex)
        {
            if (targetIndex >= 0 && targetIndex < EnemyHP.Count && EnemyHP[targetIndex] > 0) return targetIndex;
            for (int i = 0; i < EnemyHP.Count; i++)
                if (EnemyHP[i] > 0) return i;
            return -1;
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
                OnEnemyDefeated?.Invoke(Enemies[enemyIndex].id);
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

            if (guardUp.ContainsKey(target))
            {
                guardUp.Remove(target);
                dmg = Mathf.Max(1, dmg / 2);
                OnLog?.Invoke($"{Enemies[enemyIndex].displayName} hits {Heroes[target].definition.displayName} for {dmg} (guarded)!  ");
            }
            else
            {
                OnLog?.Invoke($"{Enemies[enemyIndex].displayName} hits {Heroes[target].definition.displayName} for {dmg}!");
            }
            Heroes[target].stats.currentHP = Mathf.Max(0, Heroes[target].stats.currentHP - dmg);
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
            guardUp.Clear();
            if (arenaRoot) Destroy(arenaRoot);
            arenaRoot = null;
            heroFigures.Clear();
            enemyFigures.Clear();
        }
    }
}
