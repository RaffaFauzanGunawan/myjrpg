using UnityEngine;
using System.Collections.Generic;

namespace Chronicles3D.World
{
    /// <summary>
    /// Builds the Valdria overworld out of Unity primitives at runtime so no
    /// hand-authored scene is needed. Add this component to a root GameObject.
    /// </summary>
    public class EnvironmentBuilder : MonoBehaviour
    {
        public Material grassMaterial;
        public Material waterMaterial;
        public Material pathMaterial;
        public Material treeTrunkMaterial;
        public Material treeLeafMaterial;
        public Material rockMaterial;
        public Material wallMaterial;

        [Header("World Size")]
        public int width = 60;   // tiles along X
        public int depth = 60;   // tiles along Z
        public float tileSize = 2.0f;
        public float groundHeight = 0.05f;

        // Keep track of everything we spawn
        readonly List<GameObject> spawned = new List<GameObject>();

        /// <summary>Return the walking surface Y for a tile position.</summary>
        public float GroundY => 0f;

        // NOTE: Build() is invoked by GameManager3D so ordering is deterministic.
        void Start() { }

        /// <summary>
        /// Build the overworld: ground plane, grass tiles, trees, rocks,
        /// a river, buildings, and a village cluster.
        /// </summary>
        public void Build()
        {
            var root = new GameObject("ValdriaWorld");
            root.transform.SetParent(transform, false);

            EnsureMaterials();
            CreateGround(root);
            ScatterVegetation(root);
            CreateRiver(root);
            CreateVillage(root);
            CreateEncounterZones(root);
        }

        void EnsureMaterials()
        {
            if (!grassMaterial) grassMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.30f, 0.55f, 0.24f) };
            if (!waterMaterial) waterMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.16f, 0.42f, 0.72f) };
            if (!pathMaterial) pathMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.55f, 0.48f, 0.36f) };
            if (!treeTrunkMaterial) treeTrunkMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.42f, 0.28f, 0.16f) };
            if (!treeLeafMaterial) treeLeafMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.22f, 0.52f, 0.22f) };
            if (!rockMaterial) rockMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.5f, 0.5f, 0.55f) };
            if (!wallMaterial) wallMaterial = new Material(Shader.Find("Standard")) { color = new Color(0.45f, 0.42f, 0.38f) };
        }

        void CreateGround(GameObject root)
        {
            // Large flat ground
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Ground";
            ground.transform.SetParent(root.transform, false);
            ground.transform.localScale = new Vector3(width * tileSize, groundHeight, depth * tileSize);
            ground.transform.position = new Vector3(width * tileSize * 0.5f, -groundHeight * 0.5f, depth * tileSize * 0.5f);
            ground.GetComponent<Renderer>().material = grassMaterial;
            ground.GetComponent<Collider>().isTrigger = false;

            // Scattered dirt/grass variation patches
            var rng = new System.Random(42);
            for (int i = 0; i < 120; i++)
            {
                var patch = GameObject.CreatePrimitive(PrimitiveType.Quad);
                patch.name = "GrassPatch";
                patch.transform.SetParent(root.transform, false);
                patch.transform.localScale = Vector3.one * (1.4f + (float)rng.NextDouble());
                patch.transform.position = new Vector3((float)rng.NextDouble() * width * tileSize, 0.02f,
                    (float)rng.NextDouble() * depth * tileSize);
                patch.transform.rotation = Quaternion.Euler(90, 0, 0);
                var m = new Material(Shader.Find("Standard")) { color = new Color(0.24f, 0.5f, 0.2f) };
                patch.GetComponent<Renderer>().material = m;
                Destroy(patch.GetComponent<Collider>());
            }
        }

        void ScatterVegetation(GameObject root)
        {
            var rng = new System.Random(7);
            var taken = new HashSet<Vector2Int>();

            for (int i = 0; i < 55; i++)
            {
                int tx = rng.Next(2, width - 2);
                int tz = rng.Next(2, depth - 2);
                var key = new Vector2Int(tx, tz);
                if (taken.Contains(key)) continue;
                taken.Add(key);

                // Avoid village center area
                if (tx > width / 2 - 8 && tx < width / 2 + 8 && tz > depth / 2 - 6 && tz < depth / 2 + 6) continue;

                Vector3 pos = TileToWorld(tx, tz);
                if (rng.NextDouble() < 0.75)
                    CreateTree(root, pos, 1f + (float)rng.NextDouble() * 0.7f);
                else
                    CreateRock(root, pos, 0.8f + (float)rng.NextDouble() * 0.8f);
            }
        }

        void CreateTree(GameObject root, Vector3 pos, float scale)
        {
            var tree = new GameObject("Tree");
            tree.transform.SetParent(root.transform, false);
            tree.transform.position = pos;

            var trunk = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            trunk.name = "Trunk";
            trunk.transform.SetParent(tree.transform, false);
            trunk.transform.localScale = new Vector3(0.45f, 1.0f, 0.45f) * scale;
            trunk.transform.localPosition = new Vector3(0, 1.0f * scale, 0);
            trunk.GetComponent<Renderer>().material = treeTrunkMaterial;

            var foliage = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            foliage.name = "Foliage";
            foliage.transform.SetParent(tree.transform, false);
            foliage.transform.localScale = Vector3.one * (2.0f * scale);
            foliage.transform.localPosition = new Vector3(0, 2.2f * scale, 0);
            foliage.GetComponent<Renderer>().material = treeLeafMaterial;

            // Light blocker so player collides with tree
            var collider = foliage.GetComponent<Collider>();
            if (collider) collider.isTrigger = true;
        }

        void CreateRock(GameObject root, Vector3 pos, float scale)
        {
            var rock = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            rock.name = "Rock";
            rock.transform.SetParent(root.transform, false);
            rock.transform.position = pos + Vector3.up * (0.4f * scale);
            rock.transform.localScale = new Vector3(1f, 0.7f, 0.9f) * scale;
            rock.GetComponent<Renderer>().material = rockMaterial;
        }

        void CreateRiver(GameObject root)
        {
            // A snaking river across the map, made of flat blue boxes
            var river = new GameObject("River");
            river.transform.SetParent(root.transform, false);

            int segments = 14;
            for (int i = 0; i < segments; i++)
            {
                var seg = GameObject.CreatePrimitive(PrimitiveType.Cube);
                seg.name = "WaterSeg";
                seg.transform.SetParent(river.transform, false);
                float z = (i + 0.5f) * (depth * tileSize / segments);
                float x = 6f * tileSize + Mathf.Sin(i * 1.2f) * 4f * tileSize;
                seg.transform.position = new Vector3(x, 0.05f, z);
                seg.transform.localScale = new Vector3(2.6f * tileSize, 0.08f, depth * tileSize / segments + 1);
                seg.GetComponent<Renderer>().material = waterMaterial;
                var c = seg.GetComponent<Collider>();
                if (c) c.isTrigger = true; // player cannot walk it in prototype
            }
        }

        void CreateVillage(GameObject root)
        {
            var village = new GameObject("Village");
            village.transform.SetParent(root.transform, false);

            // Central plaza
            var plaza = GameObject.CreatePrimitive(PrimitiveType.Cube);
            plaza.name = "Plaza";
            plaza.transform.SetParent(village.transform, false);
            float cx = width * tileSize / 2, cz = depth * tileSize / 2;
            plaza.transform.position = new Vector3(cx, 0.03f, cz);
            plaza.transform.localScale = new Vector3(16, 0.04f, 14);
            plaza.GetComponent<Renderer>().material = pathMaterial;
            Destroy(plaza.GetComponent<Collider>());

            // Buildings in a ring
            var offsets = new[]
            {
                new Vector3(-7, 0, 0), new Vector3(7, 0, 0),
                new Vector3(0, 0, -6), new Vector3(0, 0, 6),
                new Vector3(-5, 0, -5), new Vector3(5, 0, 5)
            };
            for (int i = 0; i < offsets.Length; i++)
            {
                CreateHouse(village, new Vector3(cx, 0, cz) + offsets[i],
                    i == 1 ? new Color(0.75f, 0.65f, 0.45f) : new Color(0.55f, 0.5f, 0.6f), i);
            }

            // Fire pit
            var fire = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            fire.name = "Bonfire";
            fire.transform.SetParent(village.transform, false);
            fire.transform.position = new Vector3(cx, 0.4f, cz);
            fire.transform.localScale = Vector3.one * 0.9f;
            fire.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(1f, 0.6f, 0.1f) };
            Destroy(fire.GetComponent<Collider>());
        }

        void CreateHouse(GameObject root, Vector3 pos, Color wallColor, int index)
        {
            var house = new GameObject("House_" + index);
            house.transform.SetParent(root.transform, false);
            house.transform.position = pos;

            var box = GameObject.CreatePrimitive(PrimitiveType.Cube);
            box.name = "Walls";
            box.transform.SetParent(house.transform, false);
            box.transform.localScale = new Vector3(4.4f, 3f, 3.6f);
            box.transform.localPosition = new Vector3(0, 1.5f, 0);
            box.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = wallColor };

            var roof = GameObject.CreatePrimitive(PrimitiveType.Cube);
            roof.name = "Roof";
            roof.transform.SetParent(house.transform, false);
            roof.transform.localScale = new Vector3(5.2f, 0.5f, 4.4f);
            roof.transform.localPosition = new Vector3(0, 3.2f, 0);
            roof.transform.rotation = Quaternion.Euler(0, 0, 0);
            roof.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.45f, 0.22f, 0.16f) };
        }

        void CreateEncounterZone(GameObject root)
        {
            // Signal that any tile flagged by GameManager can trigger encounters.
            var zone = new GameObject("EncounterZone");
            zone.transform.SetParent(root.transform, false);
        }

        void CreateEncounterZones(GameObject root)
        {
            // Wild zones around the map edge host random battles.
            // Player enters them by walking; GameManager checks position each frame.
            // (Visual indicator only — logic lives in PlayerController)
            for (int i = 0; i < 6; i++)
            {
                var zone = new GameObject("EncounterField_" + i);
                zone.transform.SetParent(root.transform, false);
                // Transparent marker cube (very low alpha via material override)
                var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
                cube.name = "ZoneMarker";
                cube.transform.SetParent(zone.transform, false);
                var mat = new Material(Shader.Find("Standard"));
                mat.color = new Color(1f, 0.3f, 0.2f, 0.05f);
                cube.GetComponent<Renderer>().material = mat;
                // Position in a random wild area
                float x = (2 + i * 9f) * tileSize;
                float z = 4 * tileSize;
                cube.transform.position = new Vector3(x, 0.05f, z);
                cube.transform.localScale = new Vector3(8, 0.05f, 8);
                cube.name = cube.name + "_marker";
            }
        }

        /// <summary>Convert tile coords to world position (center of tile).</summary>
        public Vector3 TileToWorld(int tx, int tz)
        {
            return new Vector3((tx + 0.5f) * tileSize, 0, (tz + 0.5f) * tileSize);
        }

        public Vector2Int WorldToTile(Vector3 world)
        {
            return new Vector2Int(Mathf.FloorToInt(world.x / tileSize), Mathf.FloorToInt(world.z / tileSize));
        }

        public void DestroyWorld()
        {
            foreach (var go in spawned) if (go) Destroy(go);
            spawned.Clear();
        }
    }
}
