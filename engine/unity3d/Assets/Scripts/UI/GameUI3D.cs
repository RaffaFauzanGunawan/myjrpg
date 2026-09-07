using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using Chronicles3D.Core;

namespace Chronicles3D.UI
{
    /// <summary>
    /// Builds every UI element at runtime so the scene needs no canvas work.
    /// Exploration: party HP bar strip + zone banner.
    /// Battle: enemy HP list, command buttons (Attack / Skill / Defend / Flee),
    /// enemy target picker, combat log, and victory/defeat panels.
    /// </summary>
    public class GameUI3D : MonoBehaviour
    {
        GameManager3D game;
        Canvas canvas;

        // Exploration
        GameObject hudRoot;
        Text zoneText;
        readonly List<RectTransform> hudBars = new List<RectTransform>();

        // Battle
        GameObject battleRoot;
        Text logText;
        GameObject commandPanel;
        GameObject skillPanel;
        GameObject targetPanel;
        GameObject resultPanel;
        readonly List<Text> enemyNameTexts = new List<Text>();
        readonly List<Image> enemyBarImages = new List<Image>();
        readonly List<Button> targetButtons = new List<Button>();
        List<string> enemyPool = new List<string>();
        string pendingAction;

        void Awake()
        {
            EnsureEventSystem();
            BuildCanvas();
            BuildHUD();
            BuildBattleUI();
            game = FindObjectOfType<GameManager3D>();
            if (game)
            {
                game.OnBattleChanged += OnBattleChanged;
            }
            battleRoot.SetActive(false);
        }

        /// <summary>uGUI buttons need an EventSystem; create one if the scene lacks it.</summary>
        void EnsureEventSystem()
        {
            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() != null) return;
            var esGo = new GameObject("EventSystem");
            esGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
            esGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        void BuildCanvas()
        {
            var canvasGo = new GameObject("UI Canvas");
            canvasGo.transform.SetParent(transform, false);
            canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
            canvasGo.AddComponent<GraphicRaycaster>();
        }

        static Text MakeText(string name, string initial, int size, Color color, TextAnchor anchor)
        {
            var go = new GameObject(name);
            var t = go.AddComponent<Text>();
            t.text = initial;
            t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (t.font == null) t.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            t.fontSize = size;
            t.color = color;
            t.alignment = anchor;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            return t;
        }

        void BuildHUD()
        {
            hudRoot = new GameObject("ExplorationHUD");
            hudRoot.transform.SetParent(canvas.transform, false);

            var bg = new GameObject("TopBar");
            bg.transform.SetParent(hudRoot.transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0, 0, 0, 0.6f);
            bg.GetComponent<RectTransform>().anchorMin = new Vector2(0, 1);
            bg.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);
            bg.GetComponent<RectTransform>().pivot = new Vector2(0.5f, 1);
            bg.GetComponent<RectTransform>().sizeDelta = new Vector2(0, 56);

            zoneText = MakeText("Zone", "Verdant Woods", 22, new Color(1f, 0.85f, 0.5f), TextAnchor.MiddleLeft);
            zoneText.transform.SetParent(hudRoot.transform, false);
            var zrt = zoneText.GetComponent<RectTransform>();
            zrt.anchorMin = new Vector2(0, 1);
            zrt.anchorMax = new Vector2(0, 1);
            zrt.pivot = new Vector2(0, 1);
            zrt.anchoredPosition = new Vector2(16, -10);
            zrt.sizeDelta = new Vector2(320, 36);

            // Party bar area (populated on refresh)
            var barRoot = new GameObject("PartyBars");
            barRoot.transform.SetParent(hudRoot.transform, false);
            var brt = barRoot.AddComponent<RectTransform>();
            brt.anchorMin = new Vector2(0.5f, 1);
            brt.anchorMax = new Vector2(0.5f, 1);
            brt.pivot = new Vector2(0.5f, 1);
            brt.anchoredPosition = new Vector2(0, -12);
            brt.sizeDelta = new Vector2(500, 40);

            RefreshPartyBars(barRoot.GetComponent<RectTransform>());
        }

        void RefreshPartyBars(RectTransform parent)
        {
            foreach (Transform c in parent) Destroy(c.gameObject);
            if (game == null) return;
            var party = game.Party;
            float w = 230;
            for (int i = 0; i < party.Count; i++)
            {
                var hero = party[i];
                var col = new GameObject("Bar" + i);
                col.transform.SetParent(parent, false);
                var crt = col.AddComponent<RectTransform>();
                crt.anchorMin = new Vector2(0, 0.5f);
                crt.anchorMax = new Vector2(0, 0.5f);
                crt.pivot = new Vector2(0, 0.5f);
                crt.anchoredPosition = new Vector2(i * (w + 12), 0);
                crt.sizeDelta = new Vector2(w, 26);

                var name = MakeText("name", hero.definition.displayName, 16, Color.white, TextAnchor.MiddleLeft);
                name.transform.SetParent(col.transform, false);
                var nrt = name.GetComponent<RectTransform>();
                nrt.anchorMin = nrt.anchorMax = new Vector2(0, 1);
                nrt.anchoredPosition = new Vector2(0, 0);
                nrt.sizeDelta = new Vector2(w, 20);

                var bar = new GameObject("hp");
                bar.transform.SetParent(col.transform, false);
                var barImg = bar.AddComponent<Image>();
                barImg.type = Image.Type.Filled;
                barImg.fillMethod = Image.FillMethod.Horizontal;
                barImg.color = new Color(0.9f, 0.25f, 0.25f);
                var brt2 = bar.GetComponent<RectTransform>();
                brt2.anchorMin = brt2.anchorMax = new Vector2(0, 0);
                brt2.anchoredPosition = new Vector2(0, 4);
                brt2.sizeDelta = new Vector2(w, 12);
                hudBars.Add(brt2);
            }
        }

        void Update()
        {
            // Keep HUD bars fresh
            if (game == null) return;
            var party = game.Party;
            for (int i = 0; i < party.Count && i < hudBars.Count; i++)
            {
                var hero = party[i];
                float pct = (float)hero.stats.currentHP / hero.stats.maxHP;
                hudBars[i].localScale = new Vector3(Mathf.Clamp01(pct), 1, 1);
            }
        }

        void BuildBattleUI()
        {
            battleRoot = new GameObject("BattleUI");
            battleRoot.transform.SetParent(canvas.transform, false);

            // Dark vignette
            var vignette = new GameObject("Vignette");
            vignette.transform.SetParent(battleRoot.transform, false);
            var vimg = vignette.AddComponent<Image>();
            vimg.color = new Color(0, 0, 0, 0.25f);
            vignette.GetComponent<RectTransform>().sizeDelta = new Vector2(0, 0);
            vignette.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            vignette.GetComponent<RectTransform>().anchorMax = Vector2.one;

            // Combat log (bottom-left)
            var logBox = new GameObject("LogBG");
            logBox.transform.SetParent(battleRoot.transform, false);
            var lbImg = logBox.AddComponent<Image>();
            lbImg.color = new Color(0, 0, 0, 0.7f);
            var lrt = logBox.GetComponent<RectTransform>();
            lrt.anchorMin = new Vector2(0, 0);
            lrt.anchorMax = new Vector2(0, 0);
            lrt.pivot = new Vector2(0, 0);
            lrt.anchoredPosition = new Vector2(16, 90);
            lrt.sizeDelta = new Vector2(560, 120);

            logText = MakeText("Log", "", 17, Color.white, TextAnchor.UpperLeft);
            logText.transform.SetParent(logBox.transform, false);
            logText.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            logText.GetComponent<RectTransform>().anchorMax = Vector2.one;
            logText.GetComponent<RectTransform>().offsetMin = new Vector2(8, 6);
            logText.GetComponent<RectTransform>().offsetMax = new Vector2(-8, -6);

            // Command panel (bottom right)
            commandPanel = new GameObject("CommandPanel");
            commandPanel.transform.SetParent(battleRoot.transform, false);
            var cprt = commandPanel.AddComponent<RectTransform>();
            cprt.anchorMin = cprt.anchorMax = new Vector2(1, 0);
            cprt.pivot = new Vector2(1, 0);
            cprt.anchoredPosition = new Vector2(-16, 20);
            cprt.sizeDelta = new Vector2(420, 190);

            AddCommandButton(commandPanel, "Attack", 0, () => StartTargeting("attack"));
            AddCommandButton(commandPanel, "Skill", 1, () => StartTargeting("skill"));
            AddCommandButton(commandPanel, "Defend", 2, () => ExecuteAction("defend", 0));
            AddCommandButton(commandPanel, "Flee", 3, () => ExecuteAction("flee", 0));

            // Skill panel (alternative actions)
            skillPanel = new GameObject("SkillPanel");
            skillPanel.transform.SetParent(battleRoot.transform, false);
            var sprt = skillPanel.AddComponent<RectTransform>();
            sprt.anchorMin = sprt.anchorMax = new Vector2(1, 0);
            sprt.pivot = new Vector2(1, 0);
            sprt.anchoredPosition = new Vector2(-16, 20);
            sprt.sizeDelta = new Vector2(420, 190);
            AddCommandButton(skillPanel, "Shield Bash", 0, () => ExecuteAction("skill", 0));
            AddCommandButton(skillPanel, "Holy Strike", 1, () => ExecuteAction("skill", 1));
            AddCommandButton(skillPanel, "Back", 2, () => ShowCommandPanel(true));
            skillPanel.SetActive(false);

            // Target picker
            targetPanel = new GameObject("TargetPanel");
            targetPanel.transform.SetParent(battleRoot.transform, false);
            var tprt = targetPanel.AddComponent<RectTransform>();
            tprt.anchorMin = tprt.anchorMax = new Vector2(0.5f, 0.5f);
            tprt.pivot = new Vector2(0.5f, 0.5f);
            tprt.anchoredPosition = Vector2.zero;
            tprt.sizeDelta = new Vector2(600, 120);
            targetPanel.SetActive(false);

            // Result overlay
            resultPanel = new GameObject("ResultPanel");
            resultPanel.transform.SetParent(battleRoot.transform, false);
            var resImg = resultPanel.AddComponent<Image>();
            resImg.color = new Color(0, 0, 0, 0.75f);
            resultPanel.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            resultPanel.GetComponent<RectTransform>().anchorMax = Vector2.one;
            resultPanel.SetActive(false);
        }

        void AddCommandButton(GameObject parent, string label, int index, UnityEngine.Events.UnityAction onClick)
        {
            var btn = new GameObject("Btn_" + label);
            btn.transform.SetParent(parent.transform, false);
            var img = btn.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.25f, 0.9f);
            var b = btn.AddComponent<Button>();
            b.targetGraphic = img;
            b.onClick.AddListener(onClick);

            var border = btn.AddComponent<Outline>();
            border.effectColor = new Color(0.8f, 0.65f, 0.25f);

            var rt = btn.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(0, 1);
            rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(4 + (index % 2) * 210, -4 - (index / 2) * 62);
            rt.sizeDelta = new Vector2(196, 54);

            var txt = MakeText("Txt", label, 20, new Color(1f, 0.88f, 0.6f), TextAnchor.MiddleCenter);
            txt.transform.SetParent(btn.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        }

        // ---------- State switches ----------
        void ShowCommandPanel(bool show)
        {
            commandPanel.SetActive(show);
            skillPanel.SetActive(false);
            targetPanel.SetActive(false);
        }

        void OnBattleChanged(bool inBattle)
        {
            hudRoot.SetActive(!inBattle);
            battleRoot.SetActive(inBattle);
            var bm = game.battle;
            if (inBattle)
            {
                ShowCommandPanel(true);
                logText.text = "The battle begins!\n";
                resultPanel.SetActive(false);
                bm.OnLog += AppendLog;
                bm.OnPhaseChanged += HandlePhase;
            }
            else
            {
                if (bm != null)
                {
                    bm.OnLog -= AppendLog;
                    bm.OnPhaseChanged -= HandlePhase;
                }
            }
        }

        void HandlePhase(Chronicles3D.Battle.BattleManager3D.Phase phase)
        {
            bool win = phase == Chronicles3D.Battle.BattleManager3D.Phase.Victory;
            bool lose = phase == Chronicles3D.Battle.BattleManager3D.Phase.Defeat;
            if (!win && !lose) return;

            ShowCommandPanel(false);
            resultPanel.SetActive(true);

            foreach (Transform c in resultPanel.transform) Destroy(c.gameObject);

            string title = win ? "VICTORY!" : "DEFEAT";
            Color color = win ? new Color(1f, 0.9f, 0.3f) : new Color(0.9f, 0.25f, 0.25f);
            var big = MakeText("Title", title, 90, color, TextAnchor.MiddleCenter);
            big.transform.SetParent(resultPanel.transform, false);
            big.GetComponent<RectTransform>().anchorMin = new Vector2(0.5f, 0.55f);
            big.GetComponent<RectTransform>().anchorMax = new Vector2(0.5f, 0.55f);
            big.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
            big.GetComponent<RectTransform>().sizeDelta = new Vector2(800, 120);

            var msg = MakeText("Msg", game.LastResultMessage, 24, Color.white, TextAnchor.MiddleCenter);
            msg.transform.SetParent(resultPanel.transform, false);
            msg.GetComponent<RectTransform>().anchorMin = new Vector2(0.5f, 0.4f);
            msg.GetComponent<RectTransform>().anchorMax = new Vector2(0.5f, 0.4f);
            msg.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
            msg.GetComponent<RectTransform>().sizeDelta = new Vector2(900, 80);

            var cont = new GameObject("Continue");
            cont.transform.SetParent(resultPanel.transform, false);
            var img = cont.AddComponent<Image>();
            img.color = new Color(0.15f, 0.15f, 0.3f, 0.95f);
            var btn = cont.AddComponent<Button>();
            btn.targetGraphic = img;
            cont.AddComponent<Outline>().effectColor = new Color(0.8f, 0.65f, 0.25f);
            btn.onClick.AddListener(() => game.ForceEndBattle());
            var crt = cont.GetComponent<RectTransform>();
            crt.anchorMin = new Vector2(0.5f, 0.2f);
            crt.anchorMax = new Vector2(0.5f, 0.2f);
            crt.anchoredPosition = Vector2.zero;
            crt.sizeDelta = new Vector2(300, 64);
            var ctxt = MakeText("Txt", "Continue", 26, new Color(1f, 0.88f, 0.6f), TextAnchor.MiddleCenter);
            ctxt.transform.SetParent(cont.transform, false);
            ctxt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            ctxt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        }

        void AppendLog(string msg)
        {
            logText.text += msg + "\n";
            // Keep last ~6 lines
            var lines = logText.text.Split('\n');
            if (lines.Length > 8)
            {
                var keep = new List<string>(lines);
                keep.RemoveRange(0, lines.Length - 8);
                logText.text = string.Join("\n", keep.ToArray());
            }
        }

        void StartTargeting(string action)
        {
            pendingAction = action;
            ShowCommandPanel(false);
            targetPanel.SetActive(true);

            foreach (var t in targetButtons)
            {
                if (t) Destroy(t.gameObject);
            }
            targetButtons.Clear();

            var enemies = game.battle.Enemies;
            var hp = game.battle.EnemyHP;
            int alive = 0;
            for (int i = 0; i < enemies.Count; i++)
            {
                if (hp[i] <= 0) continue;
                var b = CreateTargetButton(enemies[i].displayName, hp[i], alive, i);
                targetButtons.Add(b);
                alive++;
            }
        }

        Button CreateTargetButton(string name, int hp, int layoutIndex, int enemyIndex)
        {
            var go = new GameObject("Target_" + name);
            go.transform.SetParent(targetPanel.transform, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.35f, 0.1f, 0.1f, 0.95f);
            var b = go.AddComponent<Button>();
            b.targetGraphic = img;
            go.AddComponent<Outline>().effectColor = new Color(1f, 0.3f, 0.2f);

            int capture = enemyIndex;
            b.onClick.AddListener(() =>
            {
                targetPanel.SetActive(false);
                ExecuteAction(pendingAction, capture);
            });

            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(0, 1);
            rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(layoutIndex * 210, 0);
            rt.sizeDelta = new Vector2(196, 60);

            var txt = MakeText("Txt", name + "\n" + hp + " HP", 17, Color.white, TextAnchor.MiddleCenter);
            txt.transform.SetParent(go.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
            return b;
        }

        void ExecuteAction(string action, int targetIndex)
        {
            var bm = game.battle;
            if (action == "attack") bm.PerformHeroAction("attack", targetIndex);
            else if (action == "skill") bm.PerformHeroSkill(0, targetIndex);
            else if (action == "defend") bm.PerformHeroAction("defend", targetIndex);
            else if (action == "flee")
            {
                AppendLog("You flee from battle!");
                game.ForceEndBattle();
            }
        }
    }
}
