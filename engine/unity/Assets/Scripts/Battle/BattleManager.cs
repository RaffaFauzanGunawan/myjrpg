using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Chronicles.Core;
using Chronicles.Characters;

namespace Chronicles.Battle
{
    /// <summary>
    /// Manages the full turn-based battle flow:
    /// 1. Battle starts (random encounters or scripted bosses)
    /// 2. Turn order determined by Speed stat
    /// 3. Player selects action → Timing Ring activates → Damage calculated
    /// 4. Stagger gauge fills on elemental weakness hits
    /// 5. When staggered, enemy takes extra turns of damage
    /// 6. Victory/defeat checks after each action
    /// </summary>
    public class BattleManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private TimingRingSystem timingRing;
        [SerializeField] private float enemyActionDelay = 1.0f;
        [SerializeField] private int maxStagger = 100;

        // Battle state
        private enum BattlePhase { PlayerTurn, EnemyTurn, Animating, Victory, Defeat }
        private BattlePhase currentPhase;

        private List<CharacterInstance> party;
        private List<EnemyInstance> enemies;
        private int currentActorIndex;
        private List<BattleAction> turnOrder;
        private Dictionary<string, int> staggerGauges = new();

        // Stagger thresholds
        private const float STAGGER_WEAKNESS_BONUS = 25f;
        private const float STAGGER_NORMAL_DAMAGE = 10f;
        private const float STAGGER_DAMAGE_MULTIPLIER = 2.0f;
        private const int STAGGER_FREE_TURNS = 2;

        /// <summary>
        /// Initialize a battle with party vs enemies.
        /// </summary>
        public void StartBattle(List<CharacterInstance> partyMembers, EnemyData[] enemyData)
        {
            party = partyMembers;
            enemies = new List<EnemyInstance>();

            foreach (var ed in enemyData)
            {
                var enemy = new EnemyInstance(ed);
                enemies.Add(enemy);
                staggerGauges[ed.enemyId] = 0;
            }

            // Calculate turn order by speed
            CalculateTurnOrder();
            currentPhase = BattlePhase.PlayerTurn;
            currentActorIndex = 0;

            StartCoroutine(BattleLoop());
        }

        private IEnumerator BattleLoop()
        {
            while (currentPhase != BattlePhase.Victory && currentPhase != BattlePhase.Defeat)
            {
                if (turnOrder.Count == 0)
                    CalculateTurnOrder();

                var current = turnOrder[0];
                turnOrder.RemoveAt(0);

                if (current.isPartyMember)
                {
                    // Wait for player input (handled via UI events)
                    currentPhase = BattlePhase.PlayerTurn;
                    yield return new WaitUntil(() => currentPhase == BattlePhase.Animating);

                    // Process player action (after timing ring completes)
                    yield return ProcessPlayerAction(current);
                }
                else
                {
                    // Enemy AI takes action after delay
                    currentPhase = BattlePhase.EnemyTurn;
                    yield return new WaitForSeconds(enemyActionDelay);
                    yield return ProcessEnemyAction(current);
                }

                // Check victory/defeat
                if (enemies.TrueForAll(e => e.stats.currentHP <= 0))
                {
                    currentPhase = BattlePhase.Victory;
                    OnBattleVictory();
                    yield break;
                }
                if (party.TrueForAll(c => c.stats.currentHP <= 0))
                {
                    currentPhase = BattlePhase.Defeat;
                    OnBattleDefeat();
                    yield break;
                }

                // Process status effects (poison, regen)
                ProcessStatusEffects();
            }
        }

        /// <summary>
        /// Player selects an action. Called from UI.
        /// </summary>
        public void OnPlayerSelectAction(BattleAction action)
        {
            if (currentPhase != BattlePhase.PlayerTurn) return;

            // Activate timing ring for attacks/skills
            if (action.type == ActionType.Attack || action.type == ActionType.Skill)
            {
                timingRing.ActivateRing(result =>
                {
                    action.timingResult = result;
                    action.timingMultiplier = timingRing.GetDamageMultiplier();
                    currentPhase = BattlePhase.Animating;
                });
            }
            else
            {
                // Items, defend, guard don't need timing ring
                action.timingResult = TimingResult.Good;
                action.timingMultiplier = 1.0f;
                currentPhase = BattlePhase.Animating;
            }
        }

        private IEnumerator ProcessPlayerAction(BattleAction action)
        {
            var attacker = party[action.actorIndex];

            if (action.type == ActionType.Attack || action.type == ActionType.Skill)
            {
                var skill = action.skill;
                var target = enemies[action.targetIndex];

                // Calculate damage
                int damage = DamageCalculator.CalculateDamage(
                    attacker, new CharacterInstance { stats = target.stats, equipment = new EquipmentData[0], data = null },
                    skill, action.timingResult, action.timingMultiplier);

                // Apply stagger if elemental weakness
                if (skill.element != ElementType.None)
                {
                    UpdateStagger(target.data.enemyId, skill.element, damage);
                }

                // Apply damage
                target.stats.currentHP = Mathf.Max(0, target.stats.currentHP - damage);

                // Show damage number, play animation
                Debug.Log($"{attacker.data.characterName} deals {damage} damage to {target.data.enemyName} " +
                          $"({action.timingResult})");

                // Check for stagger trigger
                if (staggerGauges[target.data.enemyId] >= maxStagger)
                {
                    OnEnemyStaggered(target);
                }
            }
            else if (action.type == ActionType.Defend)
            {
                // Apply defense buff for this turn
                Debug.Log($"{attacker.data.characterName} defends!");
            }

            yield return new WaitForSeconds(0.5f);
        }

        private IEnumerator ProcessEnemyAction(BattleAction action)
        {
            var enemy = enemies[action.actorIndex];
            var target = party[action.targetIndex];

            // Simple AI: attack weakest party member
            int damage = Mathf.Max(1, enemy.data.baseAtk - target.stats.def / 2);
            target.stats.currentHP = Mathf.Max(0, target.stats.currentHP - damage);

            Debug.Log($"{enemy.data.enemyName} attacks {target.data.characterName} for {damage} damage!");

            yield return new WaitForSeconds(0.5f);
        }

        /// <summary>
        /// Stagger gauge fills when hitting elemental weaknesses.
        /// When full, enemy takes extra damage for several turns.
        /// </summary>
        private void UpdateStagger(string enemyId, ElementType element, int damage)
        {
            float fillAmount = ElementalChart.IsWeakAgainst(element, ElementType.None)
                ? STAGGER_WEAKNESS_BONUS
                : STAGGER_NORMAL_DAMAGE;

            staggerGauges[enemyId] = Mathf.Min(maxStagger, staggerGauges[enemyId] + (int)fillAmount);
        }

        private void OnEnemyStaggered(EnemyInstance enemy)
        {
            Debug.Log($"{enemy.data.enemyName} is STAGGERED! All attacks deal double damage!");

            // Reset stagger gauge
            staggerGauges[enemy.data.enemyId] = 0;

            // Apply stagger status - enemy takes STAGGER_FREE_TURNS of extra damage
            // Implementation: insert extra "free" turns for all party members
            for (int i = 0; i < STAGGER_FREE_TURNS; i++)
            {
                foreach (var member in party)
                {
                    if (member.stats.currentHP > 0)
                    {
                        turnOrder.Insert(0, new BattleAction
                        {
                            isPartyMember = true,
                            actorIndex = party.IndexOf(member),
                            type = ActionType.Attack,
                            timingMultiplier = STAGGER_DAMAGE_MULTIPLIER,
                            timingResult = TimingResult.Perfect
                        });
                    }
                }
            }
        }

        /// <summary>
        /// Calculate turn order based on Speed stat. Fastest acts first.
        /// </summary>
        private void CalculateTurnOrder()
        {
            turnOrder = new List<BattleAction>();

            // Add party members
            for (int i = 0; i < party.Count; i++)
            {
                if (party[i].stats.currentHP > 0)
                {
                    turnOrder.Add(new BattleAction
                    {
                        isPartyMember = true,
                        actorIndex = i,
                        speed = party[i].stats.spd
                    });
                }
            }

            // Add enemies
            for (int i = 0; i < enemies.Count; i++)
            {
                if (enemies[i].stats.currentHP > 0)
                {
                    turnOrder.Add(new BattleAction
                    {
                        isPartyMember = false,
                        actorIndex = i,
                        speed = enemies[i].stats.spd
                    });
                }
            }

            // Sort by speed (descending)
            turnOrder.Sort((a, b) => b.speed.CompareTo(a.speed));
        }

        private void ProcessStatusEffects()
        {
            // Apply poison, regen, etc. at end of each round
        }

        private void OnBattleVictory()
        {
            Debug.Log("VICTORY! Party earns EXP and loot.");
            // Award EXP, gold, items
        }

        private void OnBattleDefeat()
        {
            Debug.Log("DEFEAT... Game Over.");
            // Show game over screen
        }
    }

    // Supporting types
    public enum ActionType { Attack, Skill, Item, Defend, Guard }

    public class BattleAction
    {
        public bool isPartyMember;
        public int actorIndex;
        public int targetIndex;
        public int speed;
        public ActionType type;
        public SkillData skill;
        public TimingResult timingResult;
        public float timingMultiplier = 1.0f;
    }

    public class EnemyInstance
    {
        public EnemyData data;
        public CharacterStats stats;

        public EnemyInstance(EnemyData ed)
        {
            data = ed;
            stats = new CharacterStats
            {
                maxHP = ed.hp,
                currentHP = ed.hp,
                maxMP = ed.mp,
                currentMP = ed.mp,
                atk = ed.atk,
                def = ed.def,
                mag = ed.mag,
                res = ed.res,
                spd = ed.spd,
                luk = ed.luk
            };
        }
    }

    [CreateAssetMenu(fileName = "NewEnemy", menuName = "Chronicles/Enemy Data")]
    public class EnemyData : ScriptableObject
    {
        public string enemyId;
        public string enemyName;
        public Sprite battleSprite;
        public ElementType weakness;
        public int hp, mp, atk, def, mag, res, spd, luk;
        public int expReward;
        public int goldReward;
        public string[] dropTable; // Item IDs
        public bool isBoss;
    }
}
