using UnityEngine;
using Chronicles3D.Data;

namespace Chronicles3D.Battle
{
    /// <summary>
    /// Constructs stylized 3D figures from Unity primitives so the game runs
    /// without any imported models. Used for both heroes and enemies.
    /// </summary>
    public static class CharacterBuilder3D
    {
        static Material MakeMat(Color c)
        {
            var m = new Material(Shader.Find("Standard"));
            if (m.shader == null) m = new Material(Shader.Find("Diffuse"));
            m.color = c;
            return m;
        }

        static void StripCollider(GameObject go)
        {
            var c = go.GetComponent<Collider>();
            if (c) Object.Destroy(c);
        }

        static PrimitiveType ShapeFor(EnemyShape shape, out Vector3 bodyScale, out float bodyY)
        {
            switch (shape)
            {
                case EnemyShape.Slime:
                    bodyScale = new Vector3(1.1f, 0.75f, 1.1f);
                    bodyY = 0.5f;
                    return PrimitiveType.Sphere;
                case EnemyShape.Golem:
                    bodyScale = new Vector3(1.3f, 1.7f, 1.3f);
                    bodyY = 1.1f;
                    return PrimitiveType.Cube;
                case EnemyShape.Wolf:
                    bodyScale = new Vector3(1.1f, 0.75f, 2.0f);
                    bodyY = 0.6f;
                    return PrimitiveType.Capsule;
                case EnemyShape.Wyvern:
                    bodyScale = new Vector3(1.4f, 1.0f, 2.4f);
                    bodyY = 1.2f;
                    return PrimitiveType.Capsule;
                case EnemyShape.Bug:
                    bodyScale = new Vector3(1.4f, 0.6f, 0.9f);
                    bodyY = 0.4f;
                    return PrimitiveType.Sphere;
                default:
                    bodyScale = new Vector3(1f, 1.35f, 1f);
                    bodyY = 1.1f;
                    return PrimitiveType.Capsule;
            }
        }

        /// <summary>
        /// Build a hero figure from a CharacterDefinition.
        /// </summary>
        public static GameObject BuildHero(CharacterDefinition def)
        {
            var root = new GameObject("Hero_" + def.displayName.Replace(" ", ""));
            root.transform.localScale = Vector3.one * (def.height / 1.8f);

            var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.name = "Body";
            body.transform.SetParent(root.transform, false);
            body.transform.localPosition = Vector3.up * 1.05f;
            body.transform.localScale = new Vector3(1f, 1.2f, 1f);
            body.GetComponent<Renderer>().material = MakeMat(def.bodyColor);
            StripCollider(body);

            var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.transform.SetParent(root.transform, false);
            head.transform.localPosition = Vector3.up * 1.85f;
            head.transform.localScale = Vector3.one * 0.55f;
            head.GetComponent<Renderer>().material = MakeMat(def.skinColor);
            DestroyCollider(head);

            // Hair/helmet cap
            var cap = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            cap.name = "Hair";
            cap.transform.SetParent(root.transform, false);
            cap.transform.localPosition = Vector3.up * 1.95f;
            cap.transform.localScale = new Vector3(0.58f, 0.45f, 0.58f);
            cap.GetComponent<Renderer>().material = MakeMat(def.accentColor);
            DestroyCollider(cap);

            // Accent sash
            var sash = GameObject.CreatePrimitive(PrimitiveType.Cube);
            sash.name = "Sash";
            sash.transform.SetParent(root.transform, false);
            sash.transform.localPosition = Vector3.up * 1.15f;
            sash.transform.localScale = new Vector3(0.9f, 0.25f, 0.9f);
            sash.GetComponent<Renderer>().material = MakeMat(def.accentColor);
            DestroyCollider(sash);

            // Feet
            var footL = GameObject.CreatePrimitive(PrimitiveType.Cube);
            footL.name = "FootL";
            footL.transform.SetParent(root.transform, false);
            footL.transform.localPosition = new Vector3(-0.22f, 0.22f, 0);
            footL.transform.localScale = new Vector3(0.3f, 0.35f, 0.45f);
            footL.GetComponent<Renderer>().material = MakeMat(def.accentColor);
            DestroyCollider(footL);

            var footR = GameObject.CreatePrimitive(PrimitiveType.Cube);
            footR.name = "FootR";
            footR.transform.SetParent(root.transform, false);
            footR.transform.localPosition = new Vector3(0.22f, 0.22f, 0);
            footR.transform.localScale = new Vector3(0.3f, 0.35f, 0.45f);
            footR.GetComponent<Renderer>().material = MakeMat(def.accentColor);
            DestroyCollider(footR);

            // Weapon by class
            if (def.id == "cedric" || def.id == "seraphina" || def.id == "mira")
                AddWeapon(root, PrimitiveType.Cube, new Vector3(0.1f, 0.8f, 0.1f), new Vector3(0.62f, 1.4f, 0), Color.white);
            else if (def.id == "lyra" || def.id == "aldous")
                AddStaff(root, def.accentColor);
            else if (def.id == "rowan")
                AddWeapon(root, PrimitiveType.Capsule, new Vector3(0.06f, 0.9f, 0.06f), new Vector3(0.6f, 1.3f, 0), new Color(0.5f, 0.35f, 0.2f));
            else if (def.id == "dorin")
                AddWeapon(root, PrimitiveType.Cube, new Vector3(0.35f, 0.35f, 0.6f), new Vector3(0.55f, 1.45f, 0), new Color(0.7f, 0.72f, 0.78f));

            return root;
        }

        static void DestroyCollider(GameObject go)
        {
            var c = go.GetComponent<Collider>();
            if (c) Object.Destroy(c);
        }

        static void AddWeapon(GameObject root, PrimitiveType type, Vector3 scale, Vector3 pos, Color color)
        {
            var weapon = GameObject.CreatePrimitive(type);
            weapon.name = "Weapon";
            weapon.transform.SetParent(root.transform, false);
            weapon.transform.localPosition = pos;
            weapon.transform.localScale = scale;
            weapon.GetComponent<Renderer>().material = MakeMat(color);
            DestroyCollider(weapon);
        }

        static void AddStaff(GameObject root, Color orb)
        {
            var staff = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            staff.name = "Staff";
            staff.transform.SetParent(root.transform, false);
            staff.transform.localPosition = new Vector3(0.6f, 1.6f, 0);
            staff.transform.localScale = new Vector3(0.08f, 1.5f, 0.08f);
            staff.transform.rotation = Quaternion.Euler(6, 0, 10);
            staff.GetComponent<Renderer>().material = MakeMat(new Color(0.55f, 0.38f, 0.2f));
            DestroyCollider(staff);

            var orbGo = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            orbGo.name = "Orb";
            orbGo.transform.SetParent(root.transform, false);
            orbGo.transform.localPosition = new Vector3(0.66f, 2.15f, 0.08f);
            orbGo.transform.localScale = Vector3.one * 0.25f;
            orbGo.GetComponent<Renderer>().material = MakeMat(orb);
            DestroyCollider(orbGo);
        }

        /// <summary>
        /// Build an enemy figure from an EnemyDefinition3D.
        /// </summary>
        public static GameObject BuildEnemy(EnemyDefinition3D def)
        {
            var root = new GameObject("Enemy_" + def.displayName.Replace(" ", ""));
            var primitive = ShapeFor(def.shape, out var bodyScale, out float bodyY);
            float heightScale = def.height / 1.4f;
            root.transform.localScale = Vector3.one * heightScale;

            var body = GameObject.CreatePrimitive(primitive);
            body.name = "Body";
            body.transform.SetParent(root.transform, false);
            body.transform.localPosition = Vector3.up * bodyY;
            body.transform.localScale = bodyScale;
            body.GetComponent<Renderer>().material = MakeMat(def.bodyColor);

            // Eyes
            if (def.shape != EnemyShape.Slime && def.shape != EnemyShape.Golem)
            {
                float eyeY = def.shape == EnemyShape.Wolf || def.shape == EnemyShape.Bug ? 0.8f : 1.7f;
                var eyeL = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eyeL.transform.SetParent(root.transform, false);
                eyeL.transform.localPosition = new Vector3(-0.2f, eyeY, 0.5f);
                eyeL.transform.localScale = Vector3.one * 0.16f;
                eyeL.GetComponent<Renderer>().material = MakeMat(Color.red);
                DestroyCollider(eyeL);
                var eyeR = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eyeR.transform.SetParent(root.transform, false);
                eyeR.transform.localPosition = new Vector3(0.2f, eyeY, 0.5f);
                eyeR.transform.localScale = Vector3.one * 0.16f;
                eyeR.GetComponent<Renderer>().material = MakeMat(Color.red);
                DestroyCollider(eyeR);
            }
            else if (def.shape == EnemyShape.Slime)
            {
                var eyeL = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eyeL.transform.SetParent(root.transform, false);
                eyeL.transform.localPosition = new Vector3(-0.25f, 0.65f, 0.55f);
                eyeL.transform.localScale = Vector3.one * 0.18f;
                eyeL.GetComponent<Renderer>().material = MakeMat(Color.black);
                DestroyCollider(eyeL);
                var eyeR = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eyeR.transform.SetParent(root.transform, false);
                eyeR.transform.localPosition = new Vector3(0.25f, 0.65f, 0.55f);
                eyeR.transform.localScale = Vector3.one * 0.18f;
                eyeR.GetComponent<Renderer>().material = MakeMat(Color.black);
                DestroyCollider(eyeR);
            }

            // Accent spikes/crest
            if (def.isBoss)
            {
                var crown = GameObject.CreatePrimitive(PrimitiveType.Cube);
                crown.name = "BossCrown";
                crown.transform.SetParent(root.transform, false);
                crown.transform.localPosition = Vector3.up * (def.shape == EnemyShape.Humanoid ? 2.3f : 1.6f);
                crown.transform.localScale = new Vector3(0.8f, 0.3f, 0.8f);
                crown.GetComponent<Renderer>().material = MakeMat(def.accentColor);
                DestroyCollider(crown);
            }
            else if (def.shape == EnemyShape.Humanoid)
            {
                var crest = GameObject.CreatePrimitive(PrimitiveType.Cube);
                crest.name = "Crest";
                crest.transform.SetParent(root.transform, false);
                crest.transform.localPosition = Vector3.up * 1.9f;
                crest.transform.localScale = new Vector3(0.25f, 0.3f, 0.25f);
                crest.GetComponent<Renderer>().material = MakeMat(def.accentColor);
                DestroyCollider(crest);
            }

            return root;
        }
    }
}
