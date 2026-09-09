using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using Chronicles3D.Data;

namespace Chronicles3D.Core
{
    /// <summary>Serializable snapshot of one party member (plain data, JsonUtility friendly).</summary>
    [Serializable]
    public class PartyMemberSaveData
    {
        public string id;
        public int level;
        public int exp;
        public int expToNext;
        public int sp;
        public List<string> unlockedNodes = new List<string>();
        // Stats snapshot (current values included so HP/MP survive the round trip)
        public int maxHP, currentHP, maxMP, currentMP;
        public int atk, def, mag, res, spd, luk;
    }

    /// <summary>Top-level save file.</summary>
    [Serializable]
    public class SaveData3D
    {
        public int version = 1;
        public int gold;
        public float playerX, playerY, playerZ;
        public List<PartyMemberSaveData> party = new List<PartyMemberSaveData>();
        public List<QuestSaveEntry> activeQuests = new List<QuestSaveEntry>();
        public List<string> completedQuests = new List<string>();
    }

    /// <summary>
    /// JSON persistence via JsonUtility. Writes to Application.persistentDataPath
    /// so the save survives between sessions. Exposed statically so both the
    /// GameManager (save/load) and the editor wizard can reach it.
    /// </summary>
    public static class SaveSystem3D
    {
        const string FileName = "chronicles_save.json";

        public static string SavePath
        {
            get { return Path.Combine(Application.persistentDataPath, FileName); }
        }

        public static bool HasSave { get { return File.Exists(SavePath); } }

        public static void SaveGame(SaveData3D data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SavePath, json);
                Debug.Log("[Save] Written to " + SavePath);
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Failed to write save file: " + e.Message);
            }
        }

        public static SaveData3D LoadGame()
        {
            try
            {
                if (!HasSave) return null;
                string json = File.ReadAllText(SavePath);
                var data = JsonUtility.FromJson<SaveData3D>(json);
                if (data == null) return null;
                // No full-party rescue yet: drop members whose ids no longer exist
                data.party.RemoveAll(p => CharacterLibrary.Get(p.id) == null);
                return data;
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Failed to read save file: " + e.Message);
                return null;
            }
        }

        public static void DeleteSave()
        {
            try { if (HasSave) File.Delete(SavePath); }
            catch (Exception e) { Debug.LogError("[Save] Failed to delete save: " + e.Message); }
        }
    }
}
