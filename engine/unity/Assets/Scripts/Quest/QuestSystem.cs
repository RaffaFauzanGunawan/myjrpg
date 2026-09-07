using UnityEngine;
using System.Collections.Generic;
using Chronicles.Core;

namespace Chronicles.Quest
{
    /// <summary>
    /// Quest system supporting main story, side quests, and bounty hunts.
    /// Each quest has objectives, rewards, and prerequisite flags.
    /// </summary>
    [CreateAssetMenu(fileName = "NewQuest", menuName = "Chronicles/Quest Data")]
    public class QuestData : ScriptableObject
    {
        public string questId;
        public string questName;
        public string description;
        public QuestType type;
        public QuestStatus status;

        [Header("Prerequisites")]
        public string[] requiredCompletedQuests;
        public string[] requiredFlags;

        [Header("Objectives")]
        public QuestObjective[] objectives;

        [Header("Rewards")]
        public int expReward;
        public int goldReward;
        public string[] itemRewards;
        public string[] unlockFlags; // Flags set on completion

        [Header("Dialog")]
        public string startDialogId;
        public string completeDialogId;
    }

    public enum QuestType { MainStory, SideQuest, BountyHunt, Exploration, Relationship }

    [System.Serializable]
    public class QuestObjective
    {
        public string description;
        public ObjectiveType type;
        public string targetId;
        public int requiredCount = 1;
        public int currentCount;

        public bool IsComplete => currentCount >= requiredCount;
    }

    public enum ObjectiveType
    {
        Kill,        // Defeat specific enemies
        Collect,     // Gather items
        Talk,        // Speak to NPC
        Explore,     // Visit a location
        Craft,       // Craft a specific item
        Escort       // Protect an NPC
    }

    /// <summary>
    /// Runtime quest tracker that monitors objectives and triggers completions.
    /// </summary>
    public class QuestTracker : MonoBehaviour
    {
        [SerializeField] private QuestData[] allQuests;

        private Dictionary<string, QuestData> questLookup = new();

        void Awake()
        {
            foreach (var q in allQuests)
                questLookup[q.questId] = q;
        }

        public void StartQuest(string questId)
        {
            if (!questLookup.TryGetValue(questId, out var quest)) return;
            if (quest.status == QuestStatus.Completed) return;

            // Check prerequisites
            if (!PrerequisitesMet(quest)) return;

            quest.status = QuestStatus.Active;
            Debug.Log($"Quest started: {quest.questName}");
        }

        /// <summary>
        /// Call this whenever an objective-relevant event occurs.
        /// </summary>
        public void ReportProgress(ObjectiveType type, string targetId, int count = 1)
        {
            foreach (var quest in questLookup.Values)
            {
                if (quest.status != QuestStatus.Active) continue;

                foreach (var obj in quest.objectives)
                {
                    if (obj.type == type && obj.targetId == targetId && !obj.IsComplete)
                    {
                        obj.currentCount = Mathf.Min(obj.currentCount + count, obj.requiredCount);
                        Debug.Log($"Quest [{quest.questName}] objective: {obj.description} ({obj.currentCount}/{obj.requiredCount})");

                        if (AllObjectivesComplete(quest))
                            CompleteQuest(quest);
                    }
                }
            }
        }

        private bool AllObjectivesComplete(QuestData quest)
        {
            foreach (var obj in quest.objectives)
                if (!obj.IsComplete) return false;
            return true;
        }

        private void CompleteQuest(QuestData quest)
        {
            quest.status = QuestStatus.Completed;
            Debug.Log($"Quest completed: {quest.questName}! Rewards: {quest.expReward} EXP, {quest.goldReward} Gold");

            // Grant rewards via GameManager
            var gm = GameManager.Instance;
            if (gm != null)
            {
                gm.AwardEXP(quest.expReward);
                foreach (var itemId in quest.itemRewards)
                    gm.AddItem(itemId);
                foreach (var flag in quest.unlockFlags)
                    gm.SetFlag(flag);
            }
        }

        private bool PrerequisitesMet(QuestData quest)
        {
            var gm = GameManager.Instance;
            if (gm == null) return true;

            foreach (var reqFlag in quest.requiredFlags)
                if (!gm.GetFlag(reqFlag)) return false;

            return true;
        }
    }
}
