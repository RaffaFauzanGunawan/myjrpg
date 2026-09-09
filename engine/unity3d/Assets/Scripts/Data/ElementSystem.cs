using System.Collections.Generic;

namespace Chronicles3D.Data
{
    /// <summary>
    /// The eight spell elements of the Chronicles world, plus Poison.
    /// Every damage skill and every enemy carries one of these so the
    /// weakness chart (below) can drive super-effective / resisted hits.
    /// </summary>
    public enum ElementType
    {
        None = 0,     // plain physical damage
        Fire,
        Ice,
        Lightning,
        Earth,
        Wind,
        Water,
        Light,
        Dark,
        Poison
    }

    /// <summary>
    /// Elemental weakness chart used by both battle damage calculation and
    /// the UI hints shown on enemy target buttons.
    ///
    /// Ring:  Fire > Ice > Wind > Earth > Lightning > Water > Fire
    /// Extra: Light > Dark > Light,  Poison > Wind
    ///
    /// Attacking with an element an enemy is weak to deals 2x damage;
    /// attacking with the enemy's own element (or one it beats) is resisted.
    /// </summary>
    public static class ElementSystem
    {
        // attacker element -> defender element it beats (2x)
        static readonly Dictionary<ElementType, ElementType> Beats = new Dictionary<ElementType, ElementType>();

        static ElementSystem()
        {
            Beats[ElementType.Fire] = ElementType.Ice;
            Beats[ElementType.Ice] = ElementType.Wind;
            Beats[ElementType.Wind] = ElementType.Earth;
            Beats[ElementType.Earth] = ElementType.Lightning;
            Beats[ElementType.Lightning] = ElementType.Water;
            Beats[ElementType.Water] = ElementType.Fire;
            Beats[ElementType.Light] = ElementType.Dark;
            Beats[ElementType.Dark] = ElementType.Light;
            Beats[ElementType.Poison] = ElementType.Wind;
        }

        /// <summary>Damage multiplier for an attack of element <paramref name="atk"/> against a defender of element <paramref name="def"/>.</summary>
        public static float GetMultiplier(ElementType atk, ElementType def)
        {
            if (atk == ElementType.None || def == ElementType.None) return 1f;
            if (atk == def) return 0.5f;
            if (Beats.TryGetValue(atk, out var beaten) && beaten == def) return 2f;   // super effective
            if (Beats.TryGetValue(def, out var defBeats) && defBeats == atk) return 0.5f; // resisted
            return 1f;
        }

        /// <summary>True when <paramref name="atk"/> exploits a weakness of <paramref name="def"/>.</summary>
        public static bool IsWeakTo(ElementType atk, ElementType def)
        {
            return GetMultiplier(atk, def) > 1f;
        }

        /// <summary>The single element that beats <paramref name="def"/> (first match), or None.</summary>
        public static ElementType WeaknessOf(ElementType def)
        {
            foreach (var kv in Beats)
                if (kv.Value == def) return kv.Key;
            return ElementType.None;
        }

        /// <summary>Human readable name ('' for None).</summary>
        public static string DisplayName(ElementType e)
        {
            return e == ElementType.None ? "" : e.ToString();
        }

        /// <summary>Short suffix used in the skill list, e.g. "[Fire]".</summary>
        public static string Tag(ElementType e)
        {
            return e == ElementType.None ? "" : "[" + e + "]";
        }
    }
}
