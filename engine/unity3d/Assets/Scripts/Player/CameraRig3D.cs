using UnityEngine;

namespace Chronicles3D.Player
{
    /// <summary>
    /// Third-person orbiting camera that follows the player.
    /// Hold right mouse and drag to orbit; mouse wheel zooms.
    /// </summary>
    public class CameraRig3D : MonoBehaviour
    {
        public Transform target;
        public float distance = 8f;
        public float minDistance = 3f;
        public float maxDistance = 16f;
        public float sensitivityX = 3f;
        public float sensitivityY = 2f;
        public float smoothTime = 0.15f;

        float yaw;
        float pitch = 25f;
        Vector3 velocity = Vector3.zero;

        void LateUpdate()
        {
            if (target == null)
            {
                var pc = FindObjectOfType<PlayerController3D>();
                if (pc) target = pc.transform;
                if (target == null) return;
            }

            if (Input.GetMouseButton(1))
            {
                yaw += Input.GetAxis("Mouse X") * sensitivityX;
                pitch -= Input.GetAxis("Mouse Y") * sensitivityY;
                pitch = Mathf.Clamp(pitch, -25f, 75f);
            }

            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f)
            {
                distance = Mathf.Clamp(distance - scroll * 4f, minDistance, maxDistance);
            }

            Quaternion rotation = Quaternion.Euler(pitch, yaw, 0);
            Vector3 targetPos = target.position + Vector3.up * 1.6f;
            Vector3 desired = targetPos - rotation * Vector3.forward * distance;

            // Keep camera above ground
            desired.y = Mathf.Max(desired.y, 0.4f);

            transform.position = Vector3.SmoothDamp(transform.position, desired, ref velocity, smoothTime);
            transform.rotation = rotation;
        }
    }
}
