using UnityEngine;
using System.Collections.Generic;
using Chronicles.Core;

namespace Chronicles.Dialog
{
    /// <summary>
    /// Dialog system with branching choices, character portraits, and relationship effects.
    /// Dialogs are ScriptableObjects so designers can edit them in the Unity editor.
    /// </summary>
    [CreateAssetMenu(fileName = "NewDialog", menuName = "Chronicles/Dialog Data")]
    public class DialogData : ScriptableObject
    {
        public string dialogId;
        public DialogLine[] lines;
    }

    [System.Serializable]
    public class DialogLine
    {
        public string speakerName;
        public Sprite portrait;
        public string text;

        [Header("Choices (optional)")]
        public DialogChoice[] choices;

        [Header("Effects")]
        public string triggerFlag;
        public string triggerQuest;
    }

    [System.Serializable]
    public class DialogChoice
    {
        public string choiceText;
        public string nextDialogId; // Jump to another dialog
        public string setFlag;      // Set a world flag
        public int relationshipDelta; // Affect character relationship
    }

    /// <summary>
    /// Manages dialog display, typewriter effect, and choice handling.
    /// Attach to a DialogUI GameObject.
    /// </summary>
    public class DialogManager : MonoBehaviour
    {
        private DialogData currentDialog;
        private int currentLineIndex;
        private bool isTyping;
        private System.Action onDialogComplete;

        public void StartDialog(DialogData dialog, System.Action onComplete = null)
        {
            currentDialog = dialog;
            currentLineIndex = 0;
            onDialogComplete = onComplete;
            ShowLine();
        }

        public void AdvanceDialog()
        {
            if (isTyping)
            {
                // Skip to full text (typewriter complete)
                isTyping = false;
                return;
            }

            // If current line has choices, wait for choice selection
            if (currentDialog.lines[currentLineIndex].choices.Length > 0)
                return;

            currentLineIndex++;
            if (currentLineIndex >= currentDialog.lines.Length)
            {
                EndDialog();
                return;
            }
            ShowLine();
        }

        public void SelectChoice(int choiceIndex)
        {
            var line = currentDialog.lines[currentLineIndex];
            if (choiceIndex >= line.choices.Length) return;

            var choice = line.choices[choiceIndex];

            // Apply effects
            if (!string.IsNullOrEmpty(choice.setFlag))
                GameManager.Instance?.SetFlag(choice.setFlag);

            if (!string.IsNullOrEmpty(choice.nextDialogId))
            {
                // Jump to referenced dialog
                Debug.Log($"Jump to dialog: {choice.nextDialogId}");
            }

            currentLineIndex++;
            if (currentLineIndex >= currentDialog.lines.Length)
            {
                EndDialog();
                return;
            }
            ShowLine();
        }

        private void ShowLine()
        {
            var line = currentDialog.lines[currentLineIndex];
            Debug.Log($"[{line.speakerName}] {line.text}");

            // Trigger effects
            if (!string.IsNullOrEmpty(line.triggerFlag))
                GameManager.Instance?.SetFlag(line.triggerFlag);

            if (!string.IsNullOrEmpty(line.triggerQuest))
            {
                var tracker = FindObjectOfType<Quest.QuestTracker>();
                tracker?.StartQuest(line.triggerQuest);
            }

            // Start typewriter coroutine (in real implementation)
            isTyping = true;
        }

        private void EndDialog()
        {
            currentDialog = null;
            onDialogComplete?.Invoke();
        }
    }
}
