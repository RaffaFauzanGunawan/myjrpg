using UnityEngine;
using Chronicles.Core;

namespace Chronicles.Characters
{
    [CreateAssetMenu(fileName = "NewSkill", menuName = "Chronicles/Skill Data")]
    public class SkillData : ScriptableObject
    {
        public string skillId;
        public string skillName;
        public string description;
        public Sprite icon;
        public DamageType damageType;
        public ElementType element = ElementType.None;
        public int mpCost;
        public float power = 1.0f;
        public SkillTarget target = SkillTarget.SingleEnemy;
        public StatusEffect inflictsStatus;
        public int statusDuration;
        public string branch; // Which skill tree branch this belongs to
        public int requiredLevel = 1; // Minimum level to unlock

        // Trinity Arts (combo skills) reference
        public bool isTrinityArt;
        public string[] trinityPartners; // Character IDs that can combo
    }

    public enum SkillTarget
    {
        SingleEnemy,
        AllEnemies,
        SingleAlly,
        AllAllies,
        Self,
        DeadAlly,   // Resurrection
        Party       // Over-time heal
    }

    [CreateAssetMenu(fileName = "NewSkillTree", menuName = "Chronicles/Skill Tree")]
    public class SkillTreeData : ScriptableObject
    {
        public string treeId;
        public string treeName;
        public string description;
        public Color treeColor;
        public SkillData[] skillsInBranch;
    }

    [CreateAssetMenu(fileName = "NewEquipment", menuName = "Chronicles/Equipment Data")]
    public class EquipmentData : ScriptableObject
    {
        public string itemId;
        public string itemName;
        public string description;
        public Sprite icon;
        public EquipmentSlot slot;
        public ElementType element;

        [Header("Stat Bonuses")]
        public int atkBonus;
        public int defBonus;
        public int magBonus;
        public int resBonus;
        public int spdBonus;
        public int hpBonus;
        public int mpBonus;

        public enum EquipmentSlot { Weapon, Armor, Accessory }
    }
}
