using UnityEngine;
using System;
using System.Collections.Generic;

namespace Chronicles3D.Data
{
    [Serializable]
    public class CharacterStats
    {
        public int maxHP, maxMP;
        public int atk, def, mag, res, spd, luk;
        [NonSerialized] public int currentHP;
        [NonSerialized] public int currentMP;
    }

    [Serializable]
    public class CharacterDefinition
    {
        public string id;
        public string displayName;
        public string title;

        [Header("3D Look (primitives are tinted these colors)")]
        public Color bodyColor = Color.blue;
        public Color accentColor = Color.yellow;
        public Color skinColor = new Color(0.95f, 0.78f, 0.6f);
        public float height = 1.8f;

        [Header("Stats")]
        public int baseHP = 100;
        public int baseMP = 30;
        public int baseAtk = 15;
        public int baseDef = 15;
        public int baseMag = 10;
        public int baseRes = 10;
        public int baseSpd = 10;

        public bool isProtagonist;

        public List<string> skillIds = new List<string>();
    }

    /// <summary>
    /// Runtime character instance used by both exploration and battle.
    /// Holds levelling data plus skill-tree progress (skill points and the
    /// set of unlocked node ids) so a full save/restore round-trip works.
    /// </summary>
    public class CharacterInstance3D
    {
        public CharacterDefinition definition;
        public CharacterStats stats;
        public int level = 1;
        public int exp;
        public int expToNext = 100;

        [Header("Skill tree progress")]
        public int sp;                                        // unspent skill points
        public readonly List<string> unlockedNodes = new List<string>(); // node ids (persisted)

        public CharacterInstance3D(CharacterDefinition def)
        {
            definition = def;
            stats = new CharacterStats
            {
                maxHP = def.baseHP, currentHP = def.baseHP,
                maxMP = def.baseMP, currentMP = def.baseMP,
                atk = def.baseAtk, def = def.baseDef,
                mag = def.baseMag, res = def.baseRes,
                spd = def.baseSpd, luk = 10
            };
            // The first signature skill is known from the start
            if (def.skillIds.Count > 0)
                unlockedNodes.Add(SkillTreeLibrary.SkillNodeId(def.skillIds[0]));
        }

        public void Restore()
        {
            stats.currentHP = stats.maxHP;
            stats.currentMP = stats.maxMP;
        }

        public bool HasNode(string id) { return unlockedNodes.Contains(id); }

        public bool HasSkill(string skillId) { return HasNode(SkillTreeLibrary.SkillNodeId(skillId)); }

        /// <summary>
        /// Try to spend SP on a skill-tree node. Validates cost and the
        /// prerequisite chain, applies passive bonuses, returns an error
        /// string on failure (null on success).
        /// </summary>
        public string TryUnlockNode(SkillTreeNode3D node)
        {
            if (HasNode(node.id)) return "Already learned.";
            if (node.prerequisiteId != null && !HasNode(node.prerequisiteId))
                return "Unlock the previous tier first.";
            if (sp < node.spCost) return "Not enough SP (need " + node.spCost + ").";

            sp -= node.spCost;
            unlockedNodes.Add(node.id);

            if (!node.isSkill) // passive stat node
            {
                stats.maxHP += node.bonusHP;
                stats.currentHP += node.bonusHP;
                stats.maxMP += node.bonusMP;
                stats.currentMP += node.bonusMP;
                stats.atk += node.bonusAtk;
                stats.def += node.bonusDef;
                stats.mag += node.bonusMag;
                stats.res += node.bonusRes;
            }
            return null;
        }

        public void LevelUp()
        {
            level++;
            exp -= expToNext;
            expToNext = Mathf.RoundToInt(expToNext * 1.25f);
            sp += 1; // +1 skill point per level
            // Simple growth
            stats.maxHP += 10;
            stats.maxMP += 3;
            stats.atk += 2;
            stats.def += 2;
            stats.mag += 2;
            stats.res += 2;
            Restore();
        }
    }

    /// <summary>
    /// Central registry of the seven recruitable heroes (per PRD).
    /// </summary>
    public static class CharacterLibrary
    {
        static bool _initialized;
        static readonly Dictionary<string, CharacterDefinition> Defs = new Dictionary<string, CharacterDefinition>();

        public static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            Add("cedric", "Sir Cedric", "Knight of the Fallen Crown", new Color(0.25f, 0.5f, 0.9f),
                new Color(0.8f, 0.75f, 0.3f), 120, 30, 18, 22, 8, 12, 10, true);
            Add("lyra", "Lyra", "Elemental Sorceress", new Color(0.6f, 0.3f, 0.85f),
                new Color(0.3f, 0.7f, 0.95f), 70, 80, 6, 8, 24, 20, 14, false);
            Add("aldous", "Brother Aldous", "Cleric of the Silver Faith", new Color(0.92f, 0.85f, 0.6f),
                new Color(0.85f, 0.7f, 0.2f), 90, 60, 10, 14, 18, 22, 8, false);
            Add("rowan", "Rowan", "Shadow Ranger", new Color(0.25f, 0.7f, 0.35f),
                new Color(0.45f, 0.75f, 0.3f), 85, 35, 20, 12, 10, 10, 18, false);
            Add("mira", "Mira", "Phantom Blade", new Color(0.6f, 0.15f, 0.25f),
                new Color(0.3f, 0.3f, 0.35f), 75, 40, 22, 10, 12, 8, 24, false);
            Add("dorin", "Dorin", "Ironhand Blacksmith", new Color(0.75f, 0.45f, 0.2f),
                new Color(0.9f, 0.7f, 0.3f), 140, 20, 24, 20, 6, 8, 6, false);
            Add("seraphina", "Seraphina", "Noble Spellblade", new Color(0.2f, 0.75f, 0.7f),
                new Color(0.9f, 0.95f, 0.8f), 95, 55, 16, 14, 20, 16, 14, false);
        }

        static void Add(string id, string name, string title, Color body, Color accent,
            int hp, int mp, int atk, int def, int mag, int res, int spd, bool protag)
        {
            var defn = new CharacterDefinition
            {
                id = id, displayName = name, title = title,
                bodyColor = body, accentColor = accent,
                baseHP = hp, baseMP = mp, baseAtk = atk, baseDef = def,
                baseMag = mag, baseRes = res, baseSpd = spd,
                isProtagonist = protag
            };
            // Skills derived from archetype
            if (id == "cedric") defn.skillIds.AddRange(new[] { "Shield Bash", "Holy Strike", "Shield Wall" });
            else if (id == "lyra") defn.skillIds.AddRange(new[] { "Fireball", "Blizzard", "Thunder" });
            else if (id == "aldous") defn.skillIds.AddRange(new[] { "Heal", "Holy Smite", "Regeneration" });
            else if (id == "rowan") defn.skillIds.AddRange(new[] { "Aimed Shot", "Multi-Shot", "Poison Arrow" });
            else if (id == "mira") defn.skillIds.AddRange(new[] { "Backstab", "Viper Strike", "Shadow Shroud" });
            else if (id == "dorin") defn.skillIds.AddRange(new[] { "Hammer Smash", "Fortify", "Earthquake" });
            else if (id == "seraphina") defn.skillIds.AddRange(new[] { "Arcane Edge", "Flame Slash", "Divine Blade" });
            Defs[id] = defn;
        }

        public static CharacterDefinition Get(string id)
        {
            EnsureInitialized();
            return Defs.TryGetValue(id, out var d) ? d : null;
        }

        public static IEnumerable<CharacterDefinition> All()
        {
            EnsureInitialized();
            return Defs.Values;
        }
    }

    /// <summary>
    /// Enemy blueprint for 3D encounters.
    /// </summary>
    [Serializable]
    public class EnemyDefinition3D
    {
        public string id;
        public string displayName;
        public Color bodyColor;
        public Color accentColor;
        public float height = 1.4f;
        public int hp = 60, atk = 12, def = 6, mag = 6, res = 5, spd = 8, exp = 15, gold = 10;
        public bool isBoss;
        public ElementType element = ElementType.None;   // drives elemental weakness/resistance
        public EnemyShape shape = EnemyShape.Humanoid;
    }

    public enum EnemyShape { Humanoid, Slime, Wolf, Golem, Wyvern, Bug }

    public static class EnemyLibrary
    {
        static bool _initialized;
        static readonly Dictionary<string, EnemyDefinition3D> Defs = new Dictionary<string, EnemyDefinition3D>();

        public static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            Defs["forest_bug"] = new EnemyDefinition3D { id = "forest_bug", displayName = "Carapace Crawler", bodyColor = new Color(0.85f, 0.5f, 0.17f), accentColor = new Color(0.55f, 0.3f, 0.08f), height = 1.1f, hp = 45, atk = 9, def = 5, spd = 7, element = ElementType.Earth, shape = EnemyShape.Bug };
            Defs["wolf"] = new EnemyDefinition3D { id = "wolf", displayName = "Dire Wolf", bodyColor = new Color(0.45f, 0.48f, 0.52f), accentColor = new Color(0.3f, 0.32f, 0.35f), height = 1.2f, hp = 55, atk = 14, def = 5, spd = 14, shape = EnemyShape.Wolf };
            Defs["goblin"] = new EnemyDefinition3D { id = "goblin", displayName = "Goblin Scout", bodyColor = new Color(0.35f, 0.7f, 0.3f), accentColor = new Color(0.6f, 0.35f, 0.2f), height = 1.1f, hp = 45, atk = 10, def = 6, spd = 8, shape = EnemyShape.Humanoid };
            Defs["slime"] = new EnemyDefinition3D { id = "slime", displayName = "Forest Slime", bodyColor = new Color(0.25f, 0.75f, 0.4f), accentColor = new Color(0.5f, 0.9f, 0.6f), height = 0.9f, hp = 30, atk = 6, def = 3, spd = 4, element = ElementType.Water, shape = EnemyShape.Slime };
            Defs["skeleton"] = new EnemyDefinition3D { id = "skeleton", displayName = "Skeleton Warrior", bodyColor = new Color(0.85f, 0.83f, 0.75f), accentColor = new Color(0.45f, 0.45f, 0.5f), height = 1.7f, hp = 50, atk = 12, def = 10, spd = 6, element = ElementType.Dark, shape = EnemyShape.Humanoid };
            Defs["fire_imp"] = new EnemyDefinition3D { id = "fire_imp", displayName = "Fire Imp", bodyColor = new Color(0.8f, 0.25f, 0.15f), accentColor = new Color(1f, 0.6f, 0.1f), height = 1.0f, hp = 40, atk = 12, def = 4, spd = 10, element = ElementType.Fire, shape = EnemyShape.Humanoid };
            Defs["golem"] = new EnemyDefinition3D { id = "golem", displayName = "Stone Golem", bodyColor = new Color(0.5f, 0.5f, 0.55f), accentColor = new Color(0.3f, 0.6f, 0.45f), height = 2.4f, hp = 90, atk = 15, def = 18, spd = 3, element = ElementType.Earth, shape = EnemyShape.Golem };
            Defs["wyvern"] = new EnemyDefinition3D { id = "wyvern", displayName = "Wyvern", bodyColor = new Color(0.2f, 0.45f, 0.7f), accentColor = new Color(0.6f, 0.8f, 1f), height = 1.9f, hp = 75, atk = 16, def = 8, spd = 12, element = ElementType.Wind, shape = EnemyShape.Wyvern };

            Defs["boss_shadow"] = new EnemyDefinition3D { id = "boss_shadow", displayName = "Shadow Knight", bodyColor = new Color(0.12f, 0.1f, 0.2f), accentColor = new Color(0.6f, 0.1f, 0.25f), height = 2.2f, hp = 260, atk = 22, def = 14, spd = 9, isBoss = true, element = ElementType.Dark, shape = EnemyShape.Humanoid };
            Defs["boss_dragon"] = new EnemyDefinition3D { id = "boss_dragon", displayName = "Dragon Lord Vexar", bodyColor = new Color(0.55f, 0.1f, 0.1f), accentColor = new Color(0.95f, 0.6f, 0.15f), height = 3.4f, hp = 400, atk = 26, def = 16, spd = 8, isBoss = true, element = ElementType.Fire, shape = EnemyShape.Wyvern };
        }

        public static EnemyDefinition3D Get(string id)
        {
            EnsureInitialized();
            return Defs.TryGetValue(id, out var d) ? d : null;
        }
    }
}
