using UnityEngine;

namespace Chronicles3D.Player
{
    /// <summary>
    /// Third-person character controller for overworld exploration.
    /// Attach to the player capsule. Press E to open menu, walk into
    /// wild grass to trigger random encounters.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController3D : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 6f;
        public float turnSmoothTime = 0.12f;

        [Header("Model References (built by CharacterBuilder3D)")]
        public Transform modelRoot;
        public float encounterCheckInterval = 0.4f;
        public float encounterChance = 0.18f;

        CharacterController controller;
        float turnSmoothVelocity;
        float animTime;
        float nextEncounterCheck;

        public bool IsMoving { get; private set; }
        public Vector3 MoveDirection => controller.velocity;

        public event System.Action<Vector3> OnEncounter;

        void Awake()
        {
            controller = GetComponent<CharacterController>();
            // Build a visible body if none attached yet
            if (modelRoot == null)
            {
                modelRoot = BuildBody();
            }
        }

        /// <summary>Build a simple capsule + head character from primitives.</summary>
        Transform BuildBody()
        {
            var body = new GameObject("PlayerModel").transform;
            body.SetParent(transform, false);

            var capsule = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            capsule.name = "Body";
            capsule.transform.SetParent(body, false);
            capsule.transform.localPosition = Vector3.up * 0.9f;
            capsule.transform.localScale = new Vector3(1, 1.25f, 1);
            capsule.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.25f, 0.5f, 0.9f) };
            capsule.GetComponent<Collider>().enabled = false;

            var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.transform.SetParent(body, false);
            head.transform.localPosition = Vector3.up * 1.75f;
            head.transform.localScale = Vector3.one * 0.55f;
            head.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.95f, 0.78f, 0.6f) };
            Destroy(head.GetComponent<Collider>());

            var sword = GameObject.CreatePrimitive(PrimitiveType.Cube);
            sword.name = "Sword";
            sword.transform.SetParent(body, false);
            sword.transform.localPosition = new Vector3(0.55f, 1.1f, 0f);
            sword.transform.localScale = new Vector3(0.12f, 0.9f, 0.12f);
            sword.GetComponent<Renderer>().material = new Material(Shader.Find("Standard")) { color = new Color(0.8f, 0.8f, 0.85f) };
            Destroy(sword.GetComponent<Collider>());

            return body;
        }

        void Update()
        {
            // Simple idle bob so movement feels alive
            animTime += Time.deltaTime * 3f;

            // Look direction from camera (kept on same plane)
            var cam = Camera.main;
            Vector3 forward = cam ? cam.transform.forward : Vector3.forward;
            forward.y = 0;
            forward.Normalize();

            float h = Input.GetAxisRaw("Horizontal");
            float v = Input.GetAxisRaw("Vertical");

            Vector3 dir = forward * v + (cam ? cam.transform.right : Vector3.right) * h;
            IsMoving = dir.sqrMagnitude > 0.01f;

            if (IsMoving)
            {
                dir.Normalize();
                float targetAngle = Mathf.Atan2(dir.x, dir.z) * Mathf.Rad2Deg;
                float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref turnSmoothVelocity, turnSmoothTime);
                transform.rotation = Quaternion.Euler(0, angle, 0);

                controller.Move(dir * moveSpeed * Time.deltaTime);

                // Bob model slightly while walking
                if (modelRoot)
                {
                    modelRoot.localPosition = Vector3.up * Mathf.Abs(Mathf.Sin(animTime)) * 0.08f;
                }
            }
            else if (modelRoot)
            {
                modelRoot.localPosition = Vector3.zero;
            }

            // Gravity
            if (!controller.isGrounded)
            {
                controller.Move(Vector3.down * 9.8f * Time.deltaTime);
            }

            // Random encounters while moving
            if (IsMoving)
            {
                nextEncounterCheck -= Time.deltaTime;
                if (nextEncounterCheck <= 0)
                {
                    nextEncounterCheck = encounterCheckInterval;
                    if (Random.value < encounterChance && IsInWildGrass())
                    {
                        OnEncounter?.Invoke(transform.position);
                    }
                }
            }
        }

        bool IsInWildGrass()
        {
            // Battle triggers only OUTSIDE the safe village center.
            // The village plaza is built at the world middle by EnvironmentBuilder.
            var env = FindObjectOfType<World.EnvironmentBuilder>();
            if (!env) return true;
            float half = (env.width * env.tileSize) * 0.5f;
            Vector3 pos = transform.position;
            return Mathf.Abs(pos.x - half) > 10f || Mathf.Abs(pos.z - half) > 9f;
        }

        public void TeleportTo(Vector3 pos)
        {
            controller.enabled = false;
            transform.position = pos;
            controller.enabled = true;
        }
    }
}
