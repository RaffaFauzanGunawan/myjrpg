using UnityEngine;

namespace Chronicles.Characters
{
    /// <summary>
    /// ScriptableObject base for all character definitions.
    /// Create via Assets > Create > Chronicles > Character Data
    /// </summary>
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "Chronicles/Character Data")]
    public class CharacterData : ScriptableObject
    {
        [Header("Identity")]
        public string characterId;
        public string characterName;
        public string title;
        public string className;
        public Sprite portrait;
        public Sprite battleSprite;
        public Color themeColor = Color.white;
        public bool isProtagonist;

        [Header("Base Stats")]
        public int baseHP = 100;
        public int baseMP = 30;
        public int baseAtk = 15;
        public int baseDef = 15;
        public int baseMag = 10;
        public int baseRes = 10;
        public int baseSpd = 10;
        public int baseLuk = 10;

        [Header("Growth Rates (per level)")]
        public int hpGrowth = 10;
        public int mpGrowth = 2;
        public int atkGrowth = 2;
        public int defGrowth = 2;
        public int magGrowth = 1;
        public int resGrowth = 1;
        public int spdGrowth = 1;
        public int lukGrowth = 1;

        [Header("Skills")]
        public SkillData[] skills;

        [Header("Skill Trees")]
        public SkillTreeData[] skillTrees;

        /// <summary>
        /// Calculate stat at a given level using growth rates.
        /// </summary>
        public CharacterStats GetStatsAtLevel(int level)
        {
            int lvl = Mathf.Max(1, level) - 1; // 0-indexed growth
            return new CharacterStats
            {
                maxHP = baseHP + hpGrowth * lvl,
                maxMP = baseMP + mpGrowth * lvl,
                atk = baseAtk + atkGrowth * lvl,
                def = baseDef + defGrowth * lvl,
                mag = baseMag + magGrowth * lvl,
                res = baseRes + resGrowth * lvl,
                spd = baseSpd + spdGrowth * lvl,
                luk = baseLuk + lukGrowth * lvl,
            };
        }
    }

    [System.Serializable]
    public class CharacterStats
    {
        public int maxHP, maxMP;
        public int atk, def, mag, res, spd, luk;

        public int currentHP;
        public int currentMP;

        public void InitHPMP()
        {
            currentHP = maxHP;
            currentMP = maxMP;
        }
    }

    [System.Serializable]
    public class CharacterInstance
    {
        public CharacterData data;
        public int level = 1;
        public int exp;
        public CharacterStats stats;
        public SkillData[] unlockedSkills;
        public EquipmentData[] equipment; // [weapon, armor, accessory]

        public void Initialize()
        {
            stats = data.GetStatsAtLevel(level);
            stats.InitHPMP();
            // Start with base skills (branch = first tree)
            unlockedSkills = System.Array.FindAll(data.skills, s => s.branch == data.skillTrees[0].branchId);
            equipment = new EquipmentData[3];
        }

        public void LevelUp()
        {
            level++;
            stats = data.GetStatsAtLevel(level);
            // Preserve current HP/MP proportionally
            float hpRatio = (float)stats.currentHP / (stats.maxHP - data.hpGrowth);
            float mpRatio = (float)stats.currentMP / (stats.maxMP - data.mpGrowth);
            stats.currentHP = Mathf.RoundToInt(stats.maxHP * Mathf.Clamp01(hpRatio));
            stats.currentMP = Mathf.RoundToInt(stats.maxMP * Mathf.Clamp01(mpRatio));
        }
    }
}
