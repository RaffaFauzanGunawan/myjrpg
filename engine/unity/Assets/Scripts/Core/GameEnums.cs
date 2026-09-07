namespace Chronicles.Core
{
    public enum ElementType { None, Fire, Ice, Lightning, Holy, Dark }

    public enum DamageType { Physical, Magic, Heal, Buff, Debuff, Summon }

    public enum GameScreen { Title, Prologue, Exploring, Battle, Dialog, Menu, Crafting, Shop, GameOver, Victory }

    public enum PlayerDirection { Up, Down, Left, Right }

    public enum TimingResult { Perfect, Great, Good, Miss }

    public enum StatusEffect { None, Poison, Regen, DefUp, DefDown, AtkUp, AtkDown, Slow, Stagger }

    public enum QuestStatus { NotStarted, Active, Completed }

    public enum EndingType { Honor, Sacrifice, Darkness }

    /// <summary>
    /// Maps elemental weaknesses: key = attacker element, value = list of elements it's strong against.
    /// e.g., Fire is strong against Ice.
    /// </summary>
    public static class ElementalChart
    {
        public static bool IsWeakAgainst(ElementType attack, ElementType defense)
        {
            return (attack, defense) switch
            {
                (ElementType.Fire, ElementType.Ice) => true,
                (ElementType.Ice, ElementType.Fire) => true,
                (ElementType.Lightning, ElementType.Ice) => true,
                (ElementType.Holy, ElementType.Dark) => true,
                (ElementType.Dark, ElementType.Holy) => true,
                _ => false
            };
        }

        public static float GetMultiplier(ElementType attack, ElementType defense)
        {
            if (attack == ElementType.None || defense == ElementType.None) return 1.0f;
            return IsWeakAgainst(attack, defense) ? 1.5f : 1.0f;
        }
    }
}
