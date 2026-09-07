using UnityEngine;
using System.Collections.Generic;
using Chronicles.Core;

namespace Chronicles.World
{
    /// <summary>
    /// Generates tile-based maps for each area in the world of Valdria.
    /// Each area has a unique seed for deterministic procedural generation.
    /// Supports: outdoor (forests, deserts, snow), town (buildings, NPCs),
    /// dungeon (puzzles, stairs, chests), castle, and cave biomes.
    /// </summary>
    public class TileMapGenerator : MonoBehaviour
    {
        [Header("Tile Settings")]
        [SerializeField] private int tileSize = 32;
        [SerializeField] private Material tileMaterial;

        [Header("Area Definitions")]
        [SerializeField] private AreaDefinition[] areas;

        private Dictionary<string, int[,]> generatedMaps = new();

        /// <summary>
        /// Get or generate a tile map for the given area.
        /// </summary>
        public int[,] GetMap(string areaId)
        {
            if (generatedMaps.ContainsKey(areaId))
                return generatedMaps[areaId];

            var areaDef = System.Array.Find(areas, a => a.areaId == areaId);
            if (areaDef == null) return null;

            int[,] map = GenerateMap(areaDef);
            generatedMaps[areaId] = map;
            return map;
        }

        private int[,] GenerateMap(AreaDefinition area)
        {
            int[,] tiles = new int[area.height, area.width];
            var rng = new System.Random(area.areaId.GetHashCode());

            // Fill base terrain
            for (int y = 0; y < area.height; y++)
            {
                for (int x = 0; x < area.width; x++)
                {
                    tiles[y, x] = area.baseTile;
                }
            }

            // Add borders
            for (int x = 0; x < area.width; x++)
            {
                tiles[0, x] = (int)TileId.Wall;
                tiles[area.height - 1, x] = (int)TileId.Wall;
            }
            for (int y = 0; y < area.height; y++)
            {
                tiles[y, 0] = (int)TileId.Wall;
                tiles[y, area.width - 1] = (int)TileId.Wall;
            }

            // Scatter natural features
            ScatterFeatures(tiles, area, rng);

            // Place doors, stairs, NPCs
            PlaceSpecialTiles(tiles, area);

            return tiles;
        }

        private void ScatterFeatures(int[,] tiles, AreaDefinition area, System.Random rng)
        {
            // Use area-specific feature rules
            switch (area.biome)
            {
                case Biome.Forest:
                    // Dense grass variation + trees
                    for (int y = 2; y < area.height - 2; y++)
                    for (int x = 2; x < area.width - 2; x++)
                    {
                        if (rng.NextDouble() < 0.08)
                            tiles[y, x] = (int)TileId.Tree;
                        else if (rng.NextDouble() < 0.15)
                            tiles[y, x] = (int)TileId.GrassDark;
                    }
                    break;

                case Biome.Desert:
                    for (int y = 2; y < area.height - 2; y++)
                    for (int x = 2; x < area.width - 2; x++)
                    {
                        if (rng.NextDouble() < 0.03)
                            tiles[y, x] = (int)TileId.Cactus;
                        else if (rng.NextDouble() < 0.05)
                            tiles[y, x] = (int)TileId.Rock;
                    }
                    break;

                case Biome.Snow:
                    for (int y = 2; y < area.height - 2; y++)
                    for (int x = 2; x < area.width - 2; x++)
                    {
                        if (rng.NextDouble() < 0.06)
                            tiles[y, x] = (int)TileId.Ice;
                        else if (rng.NextDouble() < 0.05)
                            tiles[y, x] = (int)TileId.SnowTree;
                    }
                    break;

                case Biome.Dungeon:
                case Biome.Ruins:
                    // Pillars, walls for corridors
                    for (int y = 3; y < area.height - 3; y += 4)
                    for (int x = 3; x < area.width - 3; x += 6)
                    {
                        tiles[y, x] = (int)TileId.Wall;
                    }
                    break;

                case Biome.Town:
                    // Buildings (wall blocks), paths
                    for (int y = 4; y < area.height - 4; y++)
                    for (int x = 4; x < area.width - 4; x++)
                    {
                        if (rng.NextDouble() < 0.04)
                        {
                            // Place a small building (3x3)
                            PlaceBuilding(tiles, x, y, area);
                        }
                    }
                    break;
            }
        }

        private void PlaceBuilding(int[,] tiles, int startX, int startY, AreaDefinition area)
        {
            for (int dy = 0; dy < 3; dy++)
            for (int dx = 0; dx < 3; dx++)
            {
                int x = startX + dx;
                int y = startY + dy;
                if (x < area.width - 1 && y < area.height - 1)
                {
                    tiles[y, x] = (dx == 1 && dy == 2) ? (int)TileId.Door : (int)TileId.Wall;
                }
            }
        }

        private void PlaceSpecialTiles(int[,] tiles, AreaDefinition area)
        {
            // Place doors, stairs, chests, NPCs per area definition
            foreach (var special in area.specialTiles)
            {
                if (special.y >= 0 && special.y < area.height && special.x >= 0 && special.x < area.width)
                {
                    tiles[special.y, special.x] = special.tileId;
                }
            }
        }
    }

    // Tile ID enum
    public enum TileId
    {
        Grass = 0, GrassDark, Floor, Wall, Door, DoorLock, Water,
        Tree, SnowTree, Cactus, Rock, Ice, StairsDown, StairsUp,
        Chest, NPC, Sign, Campfire, Shop, Anvil, Save, Waystone, Boss
    }

    public enum Biome { Forest, Desert, Snow, Town, Dungeon, Ruins, Castle, Cave }

    [System.Serializable]
    public class AreaDefinition
    {
        public string areaId;
        public string areaName;
        public Biome biome;
        public int width = 40;
        public int height = 30;
        public int baseTile = (int)TileId.Grass;
        public SpecialTile[] specialTiles;
        public EnemyData[] encounterTable; // Random encounter pool
        public float encounterRate = 0.05f; // Steps per encounter check
    }

    [System.Serializable]
    public class SpecialTile
    {
        public int x, y;
        public int tileId;
    }
}
