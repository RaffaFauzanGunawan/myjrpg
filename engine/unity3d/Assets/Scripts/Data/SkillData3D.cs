using System;
using System.Collections.Generic;
using UnityEngine;

namespace Chronicles3D.Data
{
    /// <summary>How a skill resolves when executed.</summary>
    public enum SkillKind { Damage, Heal, HealAll, Guard }

    /// <summary>Which stat pair a damage skill scales from / against.</summary>
    public enum SkillScaling { Physical, Magical }

    /// <summary>
    /// Static metadata for one skill. Heroes reference skills by name
    /// (see CharacterLibrary); this table gives each name its element,
    /// cost, power and behaviour so the battle manager stays data-driven.
    /// </summary>
    [Serializable]
    public class SkillDefinition3D
    {
        public string name;
        public ElementType element = ElementType.None;
        public SkillKind kind = SkillKind.Damage;
        public SkillScaling scaling = SkillScaling.Physical;
        public int power = 100;    // percentage of the base physical/magical formula
        public int mpCost;
        public bool area;          // hits all enemies (Damage) / all allies (HealAll)
        public string description;
    }

    /// <summary>A node in a character's skill tree.</summary>
    [Serializable]
    public class SkillTreeNode3D
    {
        public string id;                 // stable id persisted in save files
        public string label;
        public bool isSkill;              // false => passive stat node
        public string skillId;            // for isSkill nodes: name to look up in SkillLibrary
        public int spCost;
        public string prerequisiteId;     // node that must be unlocked first (null = free root)
        public string description;

        // Passive bonuses applied when an !isSkill node is unlocked
        public int bonusHP, bonusMP, bonusAtk, bonusDef, bonusMag, bonusRes;
    }

    /// <summary>
    /// Central registry of every skill the seven heroes can learn, with the
    /// elemental / healing behaviour used by BattleManager3D.
    /// </summary>
    public static class SkillLibrary
    {
        static bool _initialized;
        static readonly Dictionary<string, SkillDefinition3D> Defs = new Dictionary<string, SkillDefinition3D>();

        static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            // --- Sir Cedric (knight) ---
            Add("Shield Bash", ElementType.None, SkillKind.Damage, SkillScaling.Physical, 160, 6, false, "Slam your shield into a foe.");
            Add("Holy Strike", ElementType.Light, SkillKind.Damage, SkillScaling.Physical, 180, 10, false, "A radiant sword blow; sears the undead.");
            Add("Shield Wall", ElementType.None, SkillKind.Guard, SkillScaling.Physical, 0, 8, false, "Raise your guard: next hit halves damage.");

            // --- Lyra (sorceress) ---
            Add("Fireball", ElementType.Fire, SkillKind.Damage, SkillScaling.Magical, 190, 12, false, "Hurl a blazing sphere of fire.");
            Add("Blizzard", ElementType.Ice, SkillKind.Damage, SkillScaling.Magical, 150, 18, true, "Freezing storm that strikes all enemies.");
            Add("Thunder", ElementType.Lightning, SkillKind.Damage, SkillScaling.Magical, 230, 24, false, "Call a devastating bolt from the sky.");

            // --- Brother Aldous (cleric) ---
            Add("Heal", ElementType.Light, SkillKind.Heal, SkillScaling.Magical, 70, 10, false, "Restore HP of the most wounded ally.");
            Add("Holy Smite", ElementType.Light, SkillKind.Damage, SkillScaling.Magical, 200, 16, false, "Channel holy light to smite a foe.");
            Add("Regeneration", ElementType.Light, SkillKind.HealAll, SkillScaling.Magical, 26, 18, false, "Soothing light restores the whole party.");

            // --- Rowan (ranger) ---
            Add("Aimed Shot", ElementType.Wind, SkillKind.Damage, SkillScaling.Physical, 210, 8, false, "A precise shot that pierces armor.");
            Add("Multi-Shot", ElementType.Wind, SkillKind.Damage, SkillScaling.Physical, 130, 14, true, "Loose a fan of arrows at every foe.");
            Add("Poison Arrow", ElementType.Poison, SkillKind.Damage, SkillScaling.Physical, 200, 12, false, "A tainted bolt that bites deep.");

            // --- Mira (phantom blade) ---
            Add("Backstab", ElementType.Dark, SkillKind.Damage, SkillScaling.Physical, 270, 8, false, "Strike from the shadows for huge damage.");
            Add("Viper Strike", ElementType.Poison, SkillKind.Damage, SkillScaling.Physical, 210, 10, false, "A venomous slash.");
            Add("Shadow Shroud", ElementType.Dark, SkillKind.Guard, SkillScaling.Physical, 0, 8, false, "Vanish into shadow: next hit halves damage.");

            // --- Dorin (blacksmith) ---
            Add("Hammer Smash", ElementType.Earth, SkillKind.Damage, SkillScaling.Physical, 200, 8, false, "Shatter the ground under a foe.");
            Add("Fortify", ElementType.Earth, SkillKind.Guard, SkillScaling.Physical, 0, 6, false, "Brace yourself: next hit halves damage.");
            Add("Earthquake", ElementType.Earth, SkillKind.Damage, SkillScaling.Physical, 140, 16, true, "Tremors that batter all enemies.");

            // --- Seraphina (spellblade) ---
            Add("Arcane Edge", ElementType.None, SkillKind.Damage, SkillScaling.Physical, 170, 6, false, "Blade wrapped in raw arcane force.");
            Add("Flame Slash", ElementType.Fire, SkillKind.Damage, SkillScaling.Magical, 210, 12, false, "A sword stroke wreathed in flame.");
            Add("Divine Blade", ElementType.Light, SkillKind.Damage, SkillScaling.Magical, 240, 20, false, "A radiant arc that banishes darkness.");
        }

        static void Add(string name, ElementType element, SkillKind kind, SkillScaling scaling,
            int power, int mp, bool area, string description)
        {
            Defs[name] = new SkillDefinition3D
            {
                name = name, element = element, kind = kind, scaling = scaling,
                power = power, mpCost = mp, area = area, description = description
            };
        }

        public static SkillDefinition3D Get(string name)
        {
            EnsureInitialized();
            return Defs.TryGetValue(name, out var def) ? def : null;
        }
    }

    /// <summary>
    /// Builds the generic skill tree used by every hero. Given a character's
    /// three signature skills it produces a chain:
    ///
    ///     [Skill 1 · free] → [Skill 2 · 1 SP] → [Skill 3 · 2 SP]
    ///                                               ├→ [Vanguard Body · 3 SP] (passive)
    ///                                               └→ [Focused Mind · 3 SP]  (passive)
    ///
    /// Unlock state is persisted per instance as unlocked node ids, so the
    /// tree can be re-derived from a CharacterDefinition at any time.
    /// </summary>
    public static class SkillTreeLibrary
    {
        public static string SkillNodeId(string skillId) { return "skill:" + skillId; }

        public static List<SkillTreeNode3D> Build(CharacterDefinition def)
        {
            var nodes = new List<SkillTreeNode3D>();
            string prev = null;

            for (int i = 0; i < def.skillIds.Count; i++)
            {
                string sid = def.skillIds[i];
                var meta = SkillLibrary.Get(sid);
                int cost = i == 0 ? 0 : i; // first skill free, then 1 / 2 SP
                string id = SkillNodeId(sid);
                nodes.Add(new SkillTreeNode3D
                {
                    id = id,
                    label = sid,
                    isSkill = true,
                    skillId = sid,
                    spCost = cost,
                    prerequisiteId = prev,
                    description = meta != null ? meta.description : ""
                });
                prev = id;
            }

            // Two passive capstones, gated behind the last skill
            string lastSkill = prev;
            nodes.Add(new SkillTreeNode3D
            {
                id = def.id + ":body",
                label = "Vanguard Body",
                isSkill = false,
                spCost = 3,
                prerequisiteId = lastSkill,
                bonusHP = 25, bonusAtk = 2, bonusDef = 2,
                description = "Passive: +25 max HP, +2 ATK, +2 DEF."
            });
            nodes.Add(new SkillTreeNode3D
            {
                id = def.id + ":mind",
                label = "Focused Mind",
                isSkill = false,
                spCost = 3,
                prerequisiteId = lastSkill,
                bonusMP = 15, bonusMag = 3, bonusRes = 3,
                description = "Passive: +15 max MP, +3 MAG, +3 RES."
            });

            return nodes;
        }
    }
}
