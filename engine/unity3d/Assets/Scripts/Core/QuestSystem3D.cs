using System;
using System.Collections.Generic;
using UnityEngine;
using Chronicles3D.Data;

namespace Chronicles3D.Core
{
    /// <summary>What a single quest objective tracks.</summary>
    public enum QuestObjectiveType
    {
        DefeatEnemy,     // enemyId + kill count
        WinBattles,      // number of victorious battles
        AccumulateGold,  // reach a gold total
        ReachLevel,      // party leader reaches a level
        UnlockSkills     // unlock N skill-tree nodes across the party
    }

    [Serializable]
    public class QuestObjectiveDefinition
    {
        public QuestObjectiveType type;
        public string enemyId = "";   // DefeatEnemy
        public int target = 1;
        public string text = "";
    }

    [Serializable]
    public class QuestDefinition
    {
        public string id;
        public string title;
        public string giver;
        public string description;
        public int rewardGold, rewardExp, rewardSp;
        public List<QuestObjectiveDefinition> objectives = new List<QuestObjectiveDefinition>();
        public string unlocksOnComplete;   // quest id auto-accepted when this one finishes
    }

    /// <summary>Runtime progress of an accepted quest.</summary>
    [Serializable]
    public class QuestState
    {
        public QuestDefinition def;
        public int[] progress;
        public bool Complete { get { return def != null && progress != null && IsComplete(); } }

        bool IsComplete()
        {
            for (int i = 0; i < def.objectives.Count; i++)
                if (progress[i] < def.objectives[i].target) return false;
            return true;
        }

        /// <summary>Human-readable objective lines, e.g. "Defeat Dire Wolves (2/3)".</summary>
        public string[] ObjectiveLines()
        {
            var lines = new string[def.objectives.Count];
            for (int i = 0; i < def.objectives.Count; i++)
            {
                var o = def.objectives[i];
                string name = o.text;
                if (string.IsNullOrEmpty(name))
                {
                    if (o.type == QuestObjectiveType.DefeatEnemy)
                    {
                        var ed = EnemyLibrary.Get(o.enemyId);
                        name = "Defeat " + (ed != null ? ed.displayName : o.enemyId);
                    }
                    else if (o.type == QuestObjectiveType.WinBattles) name = "Win battles";
                    else if (o.type == QuestObjectiveType.AccumulateGold) name = "Amass gold";
                    else if (o.type == QuestObjectiveType.ReachLevel) name = "Reach level " + o.target;
                    else if (o.type == QuestObjectiveType.UnlockSkills) name = "Unlock skills";
                }
                int c = Mathf.Min(progress[i], o.target);
                lines[i] = "• " + name + " (" + c + "/" + o.target + ")";
            }
            return lines;
        }
    }

    /// <summary>
    /// Owns the quest journal: definitions, active/completed lists, event
    /// hooks driven by battles, gold, levels and skill unlocks, plus rewards.
    /// </summary>
    public class QuestSystem3D : MonoBehaviour
    {
        public GameManager3D game;
        public List<QuestState> Active = new List<QuestState>();
        public List<string> Completed = new List<string>();

        public event System.Action OnQuestsChanged;

        // ---------- Definitions ----------
        public static readonly List<QuestDefinition> Definitions = new List<QuestDefinition>
        {
            new QuestDefinition
            {
                id = "q_intro", title = "The Road to Valdria", giver = "Elder Thornwood",
                description = "Wolves prowl the eastern road and bar the way to Castle Valdria. Thin their numbers.",
                rewardExp = 150, rewardGold = 80, rewardSp = 2,
                unlocksOnComplete = "q_bugs",
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.DefeatEnemy, enemyId = "wolf", target = 3, text = "Defeat Dire Wolves" }
                }
            },
            new QuestDefinition
            {
                id = "q_bugs", title = "Root of the Blight", giver = "Elder Thornwood",
                description = "The forest's corruption crawls on many legs. Destroy the carapace broods in Verdant Woods.",
                rewardExp = 220, rewardGold = 120, rewardSp = 3,
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.DefeatEnemy, enemyId = "forest_bug", target = 5, text = "Defeat Carapace Crawlers" }
                }
            },
            new QuestDefinition
            {
                id = "q_battles", title = "Trial by Combat", giver = "Captain Rhea",
                description = "The captain wants to see the party earn their spurs in open battle.",
                rewardExp = 300, rewardGold = 150, rewardSp = 3,
                unlocksOnComplete = "q_level",
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.WinBattles, target = 4, text = "Win battles" }
                }
            },
            new QuestDefinition
            {
                id = "q_gold", title = "Forge Fund", giver = "Dorin Ironhand",
                description = "Dorin needs coin to repair the village forge. Bring him a modest fortune.",
                rewardExp = 120, rewardGold = 0, rewardSp = 2,
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.AccumulateGold, target = 300, text = "Hold 300 gold" }
                }
            },
            new QuestDefinition
            {
                id = "q_level", title = "Path of Heroes", giver = "Captain Rhea",
                description = "Grow strong enough to be trusted with the frontier. Let your leader reach level four.",
                rewardExp = 400, rewardGold = 200, rewardSp = 4,
                unlocksOnComplete = "q_crown",
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.ReachLevel, target = 4, text = "Party leader reaches level 4" }
                }
            },
            new QuestDefinition
            {
                id = "q_crown", title = "The Fallen Crown", giver = "Seraphina",
                description = "The Shadow Knight who shattered Valdria's crown still haunts the frontier. End him.",
                rewardExp = 800, rewardGold = 500, rewardSp = 6,
                objectives = new List<QuestObjectiveDefinition>
                {
                    new QuestObjectiveDefinition { type = QuestObjectiveType.DefeatEnemy, enemyId = "boss_shadow", target = 1, text = "Defeat the Shadow Knight" }
                }
            }
        };

        public static QuestDefinition FindDefinition(string id)
        {
            return Definitions.Find(q => q.id == id);
        }

        // ---------- Lifecycle ----------
        void Start()
        {
            // Start the opening quests so the journal has content immediately
            AcceptQuest("q_intro");
            AcceptQuest("q_battles");
            AcceptQuest("q_gold");
            AcceptQuest("q_crown");
        }

        public void AcceptQuest(string id)
        {
            if (id == null) return;
            var def = FindDefinition(id);
            if (def == null || Completed.Contains(id)) return;
            foreach (var q in Active)
                if (q.def.id == id) return;

            var state = new QuestState { def = def, progress = new int[def.objectives.Count] };
            Active.Add(state);
            OnQuestsChanged?.Invoke();
            if (game) Debug.Log("[Quest] Accepted: " + def.title);
        }

        // ---------- Event hooks (called by GameManager / UI) ----------
        public void RegisterEnemyDefeat(string enemyId)
        {
            bool dirty = false;
            foreach (var q in Active)
            {
                if (q.Complete) continue;
                for (int i = 0; i < q.def.objectives.Count; i++)
                {
                    var o = q.def.objectives[i];
                    if (o.type == QuestObjectiveType.DefeatEnemy && o.enemyId == enemyId && q.progress[i] < o.target)
                    {
                        q.progress[i]++;
                        dirty = true;
                    }
                }
            }
            if (dirty) CheckAndReward();
        }

        public void RegisterBattleWin()
        {
            bool dirty = false;
            foreach (var q in Active)
            {
                if (q.Complete) continue;
                for (int i = 0; i < q.def.objectives.Count; i++)
                {
                    var o = q.def.objectives[i];
                    if (o.type == QuestObjectiveType.WinBattles && q.progress[i] < o.target)
                    {
                        q.progress[i]++;
                        dirty = true;
                    }
                }
            }
            if (dirty) CheckAndReward();
        }

        public void RegisterGold(int totalGold)
        {
            bool dirty = false;
            foreach (var q in Active)
            {
                if (q.Complete) continue;
                for (int i = 0; i < q.def.objectives.Count; i++)
                {
                    var o = q.def.objectives[i];
                    if (o.type == QuestObjectiveType.AccumulateGold && q.progress[i] < o.target && totalGold >= o.target)
                    {
                        q.progress[i] = o.target;
                        dirty = true;
                    }
                }
            }
            if (dirty) CheckAndReward();
        }

        public void RegisterPartyLevel(int leaderLevel)
        {
            bool dirty = false;
            foreach (var q in Active)
            {
                if (q.Complete) continue;
                for (int i = 0; i < q.def.objectives.Count; i++)
                {
                    var o = q.def.objectives[i];
                    if (o.type == QuestObjectiveType.ReachLevel && q.progress[i] < o.target && leaderLevel >= o.target)
                    {
                        q.progress[i] = o.target;
                        dirty = true;
                    }
                }
            }
            if (dirty) CheckAndReward();
        }

        public void RegisterSkillUnlock(int partyUnlockCount)
        {
            bool dirty = false;
            foreach (var q in Active)
            {
                if (q.Complete) continue;
                for (int i = 0; i < q.def.objectives.Count; i++)
                {
                    var o = q.def.objectives[i];
                    if (o.type == QuestObjectiveType.UnlockSkills && q.progress[i] < o.target && partyUnlockCount >= o.target)
                    {
                        q.progress[i] = o.target;
                        dirty = true;
                    }
                }
            }
            if (dirty) CheckAndReward();
        }

        /// <summary>Count of skill nodes unlocked across the whole party (for the UnlockSkills objective).</summary>
        public static int CountPartyUnlocks(List<CharacterInstance3D> party)
        {
            int total = 0;
            foreach (var hero in party)
                total += hero.unlockedNodes.Count;
            return total;
        }

        void CheckAndReward()
        {
            var finished = new List<QuestState>();
            foreach (var q in Active)
                if (q.Complete) finished.Add(q);

            foreach (var q in finished)
            {
                Active.Remove(q);
                Completed.Add(q.def.id);
                string msg = "Quest complete: " + q.def.title + "!";
                if (q.def.rewardGold > 0) msg += "  +" + q.def.rewardGold + " gold";
                if (q.def.rewardExp > 0) msg += "  +" + q.def.rewardExp + " EXP";
                if (q.def.rewardSp > 0) msg += "  +" + q.def.rewardSp + " SP";
                Debug.Log("[Quest] " + msg);

                if (game != null)
                {
                    if (q.def.rewardGold > 0) game.AddGold(q.def.rewardGold);
                    if (q.def.rewardExp > 0) game.GrantExp(q.def.rewardExp);
                    if (q.def.rewardSp > 0) game.GrantSp(q.def.rewardSp);
                }
                // Chain to the next quest
                if (!string.IsNullOrEmpty(q.def.unlocksOnComplete))
                    AcceptQuest(q.def.unlocksOnComplete);
            }
            if (finished.Count > 0) OnQuestsChanged?.Invoke();
        }

        // ---------- Save / restore ----------
        public List<QuestSaveEntry> SnapshotActive()
        {
            var list = new List<QuestSaveEntry>();
            foreach (var q in Active)
            {
                var e = new QuestSaveEntry { id = q.def.id, progress = new List<int>(q.progress) };
                list.Add(e);
            }
            return list;
        }

        public void RestoreActive(List<QuestSaveEntry> entries)
        {
            Active.Clear();
            Completed.Clear();
            if (entries == null) return;
            foreach (var e in entries)
            {
                var def = FindDefinition(e.id);
                if (def == null) continue;
                var state = new QuestState { def = def, progress = new int[def.objectives.Count] };
                for (int i = 0; i < state.progress.Length && i < e.progress.Count; i++)
                    state.progress[i] = Mathf.Min(e.progress[i], def.objectives[i].target);
                Active.Add(state);
            }
            OnQuestsChanged?.Invoke();
        }

        public void RestoreCompleted(List<string> completed)
        {
            Completed.Clear();
            if (completed != null) Completed.AddRange(completed);
        }

        public void RefreshLiveObjectives()
        {
            // Re-evaluate gold / level based objectives on load
            if (game == null) return;
            RegisterGold(game.Gold);
            if (game.Party.Count > 0) RegisterPartyLevel(game.Party[0].level);
            RegisterSkillUnlock(CountPartyUnlocks(game.Party));
        }
    }

    /// <summary>Serializable quest snapshot used by the save system.</summary>
    [Serializable]
    public class QuestSaveEntry
    {
        public string id;
        public List<int> progress = new List<int>();
    }
}
