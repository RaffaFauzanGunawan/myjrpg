using UnityEngine;
using System.Collections.Generic;
using Chronicles.Core;
using Chronicles.Characters;

namespace Chronicles.Crafting
{
    /// <summary>
    /// Crafting & Enchanting system.
    /// Players collect materials from dungeons and enemies, then combine them
    /// at anvils/forge stations to create equipment and consumables.
    /// </summary>
    [CreateAssetMenu(fileName = "NewRecipe", menuName = "Chronicles/Crafting Recipe")]
    public class CraftingRecipe : ScriptableObject
    {
        public string recipeId;
        public string recipeName;
        public string description;

        [Header("Ingredients")]
        public Ingredient[] materials;

        [Header("Result")]
        public string resultItemId;
        public int resultQuantity = 1;

        [Header("Requirements")]
        public string requiredStation; // "anvil", "enchant_table", "cauldron"
        public int requiredLevel = 1;
        public string requiredFlag; // Some recipes unlocked by quests

        [Header("Bonuses")]
        public float qualityBonus = 1.0f; // Dorin's blacksmith bonus: 1.2x
    }

    [System.Serializable]
    public class Ingredient
    {
        public string itemId;
        public string itemName;
        public int quantity;
        public Sprite icon;
    }

    /// <summary>
    /// Runtime crafting manager. Checks materials, applies bonuses, creates items.
    /// </summary>
    public class CraftingManager : MonoBehaviour
    {
        [SerializeField] private CraftingRecipe[] allRecipes;

        /// <summary>
        /// Get all recipes available at the given station for the current party.
        /// </summary>
        public CraftingRecipe[] GetAvailableRecipes(string station, int characterLevel)
        {
            var available = new List<CraftingRecipe>();
            foreach (var recipe in allRecipes)
            {
                if (!string.IsNullOrEmpty(recipe.requiredStation) && recipe.requiredStation != station)
                    continue;
                if (recipe.requiredLevel > characterLevel)
                    continue;
                if (!string.IsNullOrEmpty(recipe.requiredFlag) && !GameManager.Instance.GetFlag(recipe.requiredFlag))
                    continue;
                available.Add(recipe);
            }
            return available.ToArray();
        }

        /// <summary>
        /// Check if the player has all materials for a recipe.
        /// </summary>
        public bool CanCraft(CraftingRecipe recipe)
        {
            var gm = GameManager.Instance;
            foreach (var mat in recipe.materials)
            {
                if (!gm.HasItem(mat.itemId, mat.quantity))
                    return false;
            }
            return true;
        }

        /// <summary>
        /// Craft an item. Consumes materials and adds result to inventory.
        /// </summary>
        public bool Craft(CraftingRecipe recipe)
        {
            if (!CanCraft(recipe)) return false;

            var gm = GameManager.Instance;

            // Consume materials
            foreach (var mat in recipe.materials)
                gm.RemoveItem(mat.itemId, mat.quantity);

            // Check for Dorin in party (blacksmith bonus)
            bool hasDorin = false;
            foreach (var member in gm.FullParty)
            {
                if (member.data.characterId == "dorin")
                {
                    hasDorin = true;
                    break;
                }
            }

            int quantity = recipe.resultQuantity;
            if (hasDorin)
            {
                // 20% chance of bonus item with Dorin in party
                if (Random.value < 0.2f)
                    quantity += 1;
            }

            // Add result to inventory
            gm.AddItem(recipe.resultItemId, quantity);

            // Quest tracking
            var tracker = FindObjectOfType<Quest.QuestTracker>();
            tracker?.ReportProgress(ObjectiveType.Craft, recipe.resultItemId, quantity);

            Debug.Log($"Crafted {recipe.recipeName} x{quantity}" + (hasDorin ? " (Dorin bonus!)" : ""));
            return true;
        }
    }
}
