using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Chronicles3D.Core;
using Chronicles3D.UI;

namespace Chronicles3D.EditorTools
{
    /// <summary>
    /// One-click scene bootstrap:
    ///   Chronicles > Build & Open 3D Scene
    /// Creates a new scene containing a GameManager3D + GameUI3D, adds
    /// lighting and a camera if needed, then saves it to Assets/Scenes.
    /// </summary>
    public static class ChroniclesSceneWizard
    {
        [MenuItem("Chronicles/Build & Open 3D Scene", false, 0)]
        public static void BuildScene()
        {
            // New empty scene
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            EnsureDirectory("Assets/Scenes");
            EnsureLighting();

            // Root objects
            var gameRoot = new GameObject("ChroniclesGame");
            gameRoot.AddComponent<GameManager3D>();
            gameRoot.AddComponent<GameUI3D>();

            // Optional: nicer fog + skybox tint
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.6f, 0.75f, 0.85f);
            RenderSettings.fogDensity = 0.006f;

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/Main.unity");

            // Switch play instantly if user wants
            if (EditorUtility.DisplayDialog("Chronicles of the Fallen Crown 3D",
                "Scene created and saved to Assets/Scenes/Main.unity.\n\nEnter Play Mode to explore the 3D world now?", "Play Now", "Later"))
            {
                EditorApplication.isPlaying = true;
            }
        }

        static void EnsureDirectory(string path)
        {
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder("Assets", "Scenes");
            }
        }

        static void EnsureLighting()
        {
            if (Object.FindObjectOfType<Light>() == null)
            {
                var sun = new GameObject("Directional Light");
                var light = sun.AddComponent<Light>();
                light.type = LightType.Directional;
                sun.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
                light.intensity = 1.15f;
                light.color = new Color(1f, 0.96f, 0.88f);
            }
        }

    }
}
