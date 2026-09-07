using UnityEngine;
using UnityEngine.UI;
using Chronicles.Core;
using Chronicles.Characters;
using System.Collections;

namespace Chronicles.Battle
{
    /// <summary>
    /// Timing Ring system inspired by Legend of Dragoon / Shadow Hearts.
    /// Player presses a button when the rotating pointer lands in the "Perfect" zone
    /// to maximize damage/effect power.
    ///
    /// Usage: Call ActivateRing() when player selects an attack.
    /// The pointer spins, player presses action button, and timing is evaluated.
    /// </summary>
    public class TimingRingSystem : MonoBehaviour
    {
        [Header("Ring Settings")]
        [SerializeField] private float spinSpeed = 360f; // degrees per second
        [SerializeField] private float perfectZoneAngle = 30f; // ±15° from center
        [SerializeField] private float greatZoneAngle = 60f;
        [SerializeField] private float goodZoneAngle = 100f;

        [Header("UI References")]
        [SerializeField] private RectTransform ringOuter;
        [SerializeField] private RectTransform pointer;
        [SerializeField] private Image perfectZoneImage;
        [SerializeField] private Image greatZoneImage;
        [SerializeField] private Text resultText;

        [Header("Damage Multipliers")]
        [SerializeField] private float perfectMultiplier = 1.5f;
        [SerializeField] private float greatMultiplier = 1.25f;
        [SerializeField] private float goodMultiplier = 1.0f;
        [SerializeField] private float missMultiplier = 0.0f;

        // State
        public enum RingState { Idle, Spinning, Done }
        private RingState currentState = RingState.Idle;
        private float currentAngle;
        private float targetAngle; // Random target angle for the perfect zone
        private float damageMultiplier;
        private System.Action<TimingResult> onComplete;

        // Combo tracking for Trinity Arts
        private int comboHits;
        private const int MAX_COMBO = 3;

        /// <summary>
        /// Activate the timing ring. Player attacks will be multiplied based on timing.
        /// </summary>
        public void ActivateRing(System.Action<TimingResult> callback)
        {
            onComplete = callback;
            currentState = RingState.Spinning;
            currentAngle = 0f;

            // Randomize perfect zone position
            targetAngle = Random.Range(0f, 360f);
            gameObject.SetActive(true);

            // Position the perfect zone visual
            UpdateZoneVisuals();

            StartCoroutine(SpinCoroutine());
        }

        private IEnumerator SpinCoroutine()
        {
            while (currentState == RingState.Spinning)
            {
                currentAngle += spinSpeed * Time.deltaTime;
                if (currentAngle >= 360f) currentAngle -= 360f;

                // Rotate pointer
                pointer.localRotation = Quaternion.Euler(0, 0, -currentAngle);

                yield return null;
            }
        }

        /// <summary>
        /// Called when player presses the action button during ring spin.
        /// </summary>
        public void OnPlayerAction()
        {
            if (currentState != RingState.Spinning) return;
            currentState = RingState.Done;
            StopAllCoroutines();

            float angleDiff = Mathf.Abs(Mathf.DeltaAngle(currentAngle, targetAngle));
            TimingResult result;

            if (angleDiff <= perfectZoneAngle / 2f)
            {
                result = TimingResult.Perfect;
                damageMultiplier = perfectMultiplier;
                comboHits++;
            }
            else if (angleDiff <= greatZoneAngle / 2f)
            {
                result = TimingResult.Great;
                damageMultiplier = greatMultiplier;
                comboHits++;
            }
            else if (angleDiff <= goodZoneAngle / 2f)
            {
                result = TimingResult.Good;
                damageMultiplier = goodMultiplier;
                comboHits = 0; // Break combo
            }
            else
            {
                result = TimingResult.Miss;
                damageMultiplier = missMultiplier;
                comboHits = 0;
            }

            ShowResult(result);
            onComplete?.Invoke(result);
        }

        public float GetDamageMultiplier() => damageMultiplier;
        public bool IsComboActive() => comboHits >= 2;
        public int GetComboCount() => comboHits;

        private void ShowResult(TimingResult result)
        {
            string text = result switch
            {
                TimingResult.Perfect => "PERFECT!",
                TimingResult.Great => "GREAT!",
                TimingResult.Good => "GOOD",
                TimingResult.Miss => "MISS",
                _ => ""
            };
            Color color = result switch
            {
                TimingResult.Perfect => new Color(0.95f, 0.77f, 0.06f), // Gold
                TimingResult.Great => new Color(0.18f, 0.8f, 0.44f),    // Green
                TimingResult.Good => new Color(0.2f, 0.6f, 0.86f),      // Blue
                TimingResult.Miss => new Color(0.91f, 0.3f, 0.24f),     // Red
                _ => Color.white
            };

            resultText.text = text;
            resultText.color = color;
            StartCoroutine(FadeResult());
        }

        private IEnumerator FadeResult()
        {
            float elapsed = 0f;
            float duration = 0.5f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                resultText.alpha = 1f - (elapsed / duration);
                yield return null;
            }
            gameObject.SetActive(false);
        }

        private void UpdateZoneVisuals()
        {
            // Perfect zone: innermost ring, colored gold
            // Great zone: middle ring, green
            // Good zone: outer ring, blue
            // Positions would be set via RectTransform rotation
        }
    }

    /// <summary>
    /// Calculates final damage after timing ring, elemental weakness, and stats.
    /// </summary>
    public static class DamageCalculator
    {
        public static int CalculateDamage(
            CharacterInstance attacker,
            CharacterInstance defender,
            SkillData skill,
            TimingResult timing,
            float timingMultiplier)
        {
            // Base power
            float basePower = skill.damageType == DamageType.Physical
                ? attacker.stats.atk
                : attacker.stats.mag;

            // Skill multiplier
            float damage = basePower * skill.power;

            // Timing ring multiplier
            damage *= timingMultiplier;

            // Defense
            float defense = skill.damageType == DamageType.Physical
                ? defender.stats.def
                : defender.stats.res;
            damage = Mathf.Max(1, damage - defense * 0.5f);

            // Elemental weakness (Break System)
            ElementType attackElement = skill.element;
            if (skill.damageType == DamageType.Physical)
            {
                // Use weapon element if physical
                var weapon = attacker.equipment[0];
                if (weapon != null) attackElement = weapon.element;
            }
            float elementalMultiplier = ElementalChart.GetMultiplier(attackElement, ElementType.None);
            damage *= elementalMultiplier;

            // Critical hit chance
            float critChance = attacker.stats.luk / 100f;
            if (Random.value < critChance)
            {
                damage *= 1.5f;
            }

            // Trinity Arts bonus (combo attacks)
            if (timing == TimingResult.Perfect && attacker.data.isProtagonist)
            {
                damage *= 1.2f; // Slight bonus for protagonist perfect timing
            }

            return Mathf.Max(1, Mathf.RoundToInt(damage));
        }
    }
}
