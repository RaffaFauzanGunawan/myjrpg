using UnityEngine;
using System.Collections.Generic;
using Chronicles.Characters;
using Chronicles.World;
using Chronicles.Quest;
using Chronicles.Dialog;

namespace Chronicles.Core
{
    /// <summary>
    /// Central game state manager. Controls screen transitions, party management,
    /// save/load, and game flow. Singleton pattern for persistence across scenes.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private CharacterData[] allCharacterData;
        [SerializeField] private AreaDefinition[] allAreas;

        [Header("Party Settings")]
        public const int MaxPartySize = 4;
        public const int MaxInventorySlots = 36;

        // Game State
        public GameScreen CurrentScreen { get; private set; } = GameScreen.Title;
        public string CurrentAreaId { get; set; } = "verdant_woods";
        public Vector2Int PlayerPosition { get; set; } = new(8, 8);
        public PlayerDirection PlayerDirection { get; set; } = PlayerDirection.Down;
        public float PlayTime { get; private set; }
        public EndingType Ending { get; set; } = EndingType.Honor;

        // Party
        public List<CharacterInstance> FullParty { get; private set; } = new();
        public List<int> ActivePartyIndices { get; private set; } = new(); // Indices into FullParty (max 4 active)

        // Inventory
        public Dictionary<string, int> Inventory { get; private set; } = new();

        // Quests
        public List<QuestData> ActiveQuests { get; private set; } = new();
        public List<string> CompletedQuestIds { get; private set; } = new();

        // World Flags
        public Dictionary<string, bool> WorldFlags { get; private set; } = new();

        // Notifications
        private Queue<string> notifications = new();

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        void Update()
        {
            PlayTime += Time.deltaTime;
        }

        // ========== Party Management ==========

        /// <summary>
        /// Add a character to the full party roster.
        /// </summary>
        public void RecruitCharacter(CharacterData data, int level = 1)
        {
            var instance = new CharacterInstance { data = data, level = level };
            instance.Initialize();
            FullParty.Add(instance);

            if (ActivePartyIndices.Count < MaxPartySize)
            {
                ActivePartyIndices.Add(FullParty.Count - 1);
            }

            ShowNotification($"{data.characterName} joined the party!");
        }

        public List<CharacterInstance> GetActiveParty()
        {
            var active = new List<CharacterInstance>();
            foreach (int idx in ActivePartyIndices)
            {
                if (idx < FullParty.Count)
                    active.Add(FullParty[idx]);
            }
            return active;
        }

        /// <summary>
        /// Handle level up when enough EXP is gained.
        /// </summary>
        public void AwardEXP(int exp)
        {
            foreach (var member in GetActiveParty())
            {
                member.exp += exp;
                int required = GetRequiredEXP(member.level);
                while (member.exp >= required)
                {
                    member.exp -= required;
                    member.LevelUp();
                    ShowNotification($"{member.data.characterName} reached Level {member.level}!");
                    required = GetRequiredEXP(member.level);
                }
            }
        }

        private int GetRequiredEXP(int level)
        {
            // JRPG-style exponential curve
            return Mathf.RoundToInt(50 * Mathf.Pow(level, 1.5f));
        }

        // ========== Inventory ==========

        public void AddItem(string itemId, int count = 1)
        {
            if (Inventory.ContainsKey(itemId))
                Inventory[itemId] += count;
            else
                Inventory[itemId] = count;
        }

        public bool RemoveItem(string itemId, int count = 1)
        {
            if (!Inventory.ContainsKey(itemId) || Inventory[itemId] < count)
                return false;
            Inventory[itemId] -= count;
            if (Inventory[itemId] <= 0) Inventory.Remove(itemId);
            return true;
        }

        public bool HasItem(string itemId, int count = 1)
        {
            return Inventory.ContainsKey(itemId) && Inventory[itemId] >= count;
        }

        // ========== World Flags ==========

        public void SetFlag(string flag, bool value = true)
        {
            WorldFlags[flag] = value;
        }

        public bool GetFlag(string flag)
        {
            return WorldFlags.ContainsKey(flag) && WorldFlags[flag];
        }

        // ========== Screen Transitions ==========

        public void ChangeScreen(GameScreen newScreen)
        {
            CurrentScreen = newScreen;
            // SceneManager would handle scene transitions in a real project
            Debug.Log($"Screen changed to: {newScreen}");
        }

        // ========== Notifications ==========

        public void ShowNotification(string text)
        {
            notifications.Enqueue(text);
            Debug.Log($"[NOTIFICATION] {text}");
        }

        public string DequeueNotification()
        {
            return notifications.Count > 0 ? notifications.Dequeue() : null;
        }

        // ========== Save/Load ==========

        public GameSaveData CreateSaveData()
        {
            return new GameSaveData
            {
                areaId = CurrentAreaId,
                playerX = PlayerPosition.x,
                playerY = PlayerPosition.y,
                playTime = PlayTime,
                partyCount = FullParty.Count,
                activePartyCount = ActivePartyIndices.Count,
                questCount = CompletedQuestIds.Count
            };
        }

        public void LoadSaveData(GameSaveData data)
        {
            CurrentAreaId = data.areaId;
            PlayerPosition = new Vector2Int(data.playerX, data.playerY);
            PlayTime = data.playTime;
            ChangeScreen(GameScreen.Exploring);
        }
    }

    [System.Serializable]
    public class GameSaveData
    {
        public string areaId;
        public int playerX, playerY;
        public float playTime;
        public int partyCount;
        public int activePartyCount;
        public int questCount;
    }
}
