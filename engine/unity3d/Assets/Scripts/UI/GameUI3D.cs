using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using Chronicles3D.Core;
using Chronicles3D.Data;

namespace Chronicles3D.UI
{
    /// <summary>
    /// Builds every UI element at runtime so the scene needs no canvas work.
    ///
    /// Exploration: party HP strip, gold counter and action buttons
    /// (Skill Tree / Quests / Save / Load) plus the quest journal and skill
    /// tree overlay panels.
    /// Battle: enemy HP list, dynamic command + skill menus (elemental tags,
    /// MP costs, heal / area handling), target picker, combat log and
    /// victory/defeat panels.
    /// </summary>
    public class GameUI3D : MonoBehaviour
    {
        GameManager3D game;
        Canvas canvas;

        // Exploration
        GameObject hudRoot;
        Text zoneText;
        Text goldText;
        RectTransform barParent;
        readonly List<RectTransform> hudBars = new List<RectTransform>();

        // Exploration overlays (rebuilt each time they open)
        GameObject questPanel;
        GameObject treePanel;
        int treeHeroIndex;
        string treeStatus = "";

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
        int pendingSkillIndex;

        // ---------- Boot ----------
        void Awake()
        {
            EnsureEventSystem();
            BuildCanvas();
            hudRoot = new GameObject("ExplorationHUD");
            hudRoot.transform.SetParent(canvas.transform, false);
            BuildTopBar();
            BuildExplorationButtons();
            BuildBattleUI();
            battleRoot.SetActive(false);
        }

        void Start()
        {
            BindGame();
        }

        void BindGame()
        {
            game = FindObjectOfType<GameManager3D>();
            if (game == null) return;
            game.OnBattleChanged += OnBattleChanged;
            game.OnGameLoaded += () =>
            {
                treeHeroIndex = 0;
                RefreshPartyBars();
            };
            RefreshPartyBars();
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

        // ==================== EXPLORATION HUD ====================
        void BuildTopBar()
        {
            var bg = new GameObject("TopBar");
            bg.transform.SetParent(hudRoot.transform, false);
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0, 0, 0, 0.6f);
            var bgRt = bg.GetComponent<RectTransform>();
            bgRt.anchorMin = new Vector2(0, 1);
            bgRt.anchorMax = new Vector2(1, 1);
            bgRt.pivot = new Vector2(0.5f, 1);
            bgRt.sizeDelta = new Vector2(0, 56);

            zoneText = MakeText("Zone", "Verdant Woods", 22, new Color(1f, 0.85f, 0.5f), TextAnchor.MiddleLeft);
            zoneText.transform.SetParent(hudRoot.transform, false);
            var zrt = zoneText.GetComponent<RectTransform>();
            zrt.anchorMin = new Vector2(0, 1);
            zrt.anchorMax = new Vector2(0, 1);
            zrt.pivot = new Vector2(0, 1);
            zrt.anchoredPosition = new Vector2(16, -10);
            zrt.sizeDelta = new Vector2(320, 36);

            goldText = MakeText("Gold", "Gold: 0", 20, new Color(1f, 0.9f, 0.45f), TextAnchor.MiddleRight);
            goldText.transform.SetParent(hudRoot.transform, false);
            var grt = goldText.GetComponent<RectTransform>();
            grt.anchorMin = new Vector2(1, 1);
            grt.anchorMax = new Vector2(1, 1);
            grt.pivot = new Vector2(1, 1);
            grt.anchoredPosition = new Vector2(-320, -14);
            grt.sizeDelta = new Vector2(280, 32);

            // Party bar area (populated on refresh)
            var barRoot = new GameObject("PartyBars");
            barRoot.transform.SetParent(hudRoot.transform, false);
            barParent = barRoot.AddComponent<RectTransform>();
            barParent.anchorMin = new Vector2(0.5f, 1);
            barParent.anchorMax = new Vector2(0.5f, 1);
            barParent.pivot = new Vector2(0.5f, 1);
            barParent.anchoredPosition = new Vector2(60, -12);
            barParent.sizeDelta = new Vector2(640, 40);
        }

        void BuildExplorationButtons()
        {
            MakeHudActionButton("Skill Tree", 0, OpenSkillTree);
            MakeHudActionButton("Quests", 1, OpenQuestPanel);
            MakeHudActionButton("Save", 2, () =>
            {
                if (game) game.SaveToDisk();
            });
            MakeHudActionButton("Load", 3, () =>
            {
                if (game) game.LoadFromDisk();
            });
        }

        void MakeHudActionButton(string label, int index, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject("Action_" + label);
            go.transform.SetParent(hudRoot.transform, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.3f, 0.85f);
            var b = go.AddComponent<Button>();
            b.targetGraphic = img;
            b.onClick.AddListener(onClick);
            go.AddComponent<Outline>().effectColor = new Color(0.8f, 0.65f, 0.25f);

            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(1, 1);
            rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(1, 1);
            rt.anchoredPosition = new Vector2(-16, -66 - index * 48);
            rt.sizeDelta = new Vector2(190, 40);

            var txt = MakeText("Txt", label, 18, new Color(1f, 0.9f, 0.65f), TextAnchor.MiddleCenter);
            txt.transform.SetParent(go.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        }

        void RefreshPartyBars()
        {
            foreach (Transform c in barParent) Destroy(c.gameObject);
            hudBars.Clear();
            if (game == null) return;
            var party = game.Party;
            float w = 210;
            for (int i = 0; i < party.Count; i++)
            {
                var hero = party[i];
                var col = new GameObject("Bar" + i);
                col.transform.SetParent(barParent, false);
                var crt = col.AddComponent<RectTransform>();
                crt.anchorMin = new Vector2(0, 0.5f);
                crt.anchorMax = new Vector2(0, 0.5f);
                crt.pivot = new Vector2(0, 0.5f);
                crt.anchoredPosition = new Vector2(i * (w + 12), 0);
                crt.sizeDelta = new Vector2(w, 26);

                var name = MakeText("name",
                    hero.definition.displayName + "  Lv." + hero.level, 15, Color.white, TextAnchor.MiddleLeft);
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
            if (game == null) return;

            // Party HP + level bars
            var party = game.Party;
            int shown = Mathf.Min(party.Count, hudBars.Count);
            for (int i = 0; i < shown; i++)
            {
                var hero = party[i];
                float pct = (float)hero.stats.currentHP / hero.stats.maxHP;
                hudBars[i].localScale = new Vector3(Mathf.Clamp01(pct), 1, 1);
            }
            goldText.text = "Gold: " + game.Gold;

            if (questPanel != null && questPanel.activeSelf) RefreshQuestPanelText();
        }

        // ==================== BATTLE UI ====================
        void BuildBattleUI()
        {
            battleRoot = new GameObject("BattleUI");
            battleRoot.transform.SetParent(canvas.transform, false);

            var vignette = new GameObject("Vignette");
            vignette.transform.SetParent(battleRoot.transform, false);
            var vimg = vignette.AddComponent<Image>();
            vimg.color = new Color(0, 0, 0, 0.25f);
            var vrt = vignette.GetComponent<RectTransform>();
            vrt.anchorMin = Vector2.zero;
            vrt.anchorMax = Vector2.one;
            vrt.sizeDelta = Vector2.zero;

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
            lrt.sizeDelta = new Vector2(620, 150);

            logText = MakeText("Log", "", 16, Color.white, TextAnchor.UpperLeft);
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

            AddCommandButton(commandPanel, "Attack", 0, () => StartTargeting("attack", 0));
            AddCommandButton(commandPanel, "Skills", 1, ShowSkillPanel);
            AddCommandButton(commandPanel, "Defend", 2, () => game.battle.PerformHeroAction("defend", 0));
            AddCommandButton(commandPanel, "Flee", 3, () =>
            {
                AppendLog("You flee from battle!");
                game.ForceEndBattle();
            });

            // Skill panel (rebuilt every player turn)
            skillPanel = new GameObject("SkillPanel");
            skillPanel.transform.SetParent(battleRoot.transform, false);
            var sprt = skillPanel.AddComponent<RectTransform>();
            sprt.anchorMin = sprt.anchorMax = new Vector2(1, 0);
            sprt.pivot = new Vector2(1, 0);
            sprt.anchoredPosition = new Vector2(-16, 20);
            sprt.sizeDelta = new Vector2(420, 210);
            skillPanel.SetActive(false);

            // Target picker
            targetPanel = new GameObject("TargetPanel");
            targetPanel.transform.SetParent(battleRoot.transform, false);
            var tprt = targetPanel.AddComponent<RectTransform>();
            tprt.anchorMin = tprt.anchorMax = new Vector2(0.5f, 0.5f);
            tprt.pivot = new Vector2(0.5f, 0.5f);
            tprt.anchoredPosition = Vector2.zero;
            tprt.sizeDelta = new Vector2(900, 150);
            targetPanel.SetActive(false);

            // Result overlay
            resultPanel = new GameObject("ResultPanel");
            resultPanel.transform.SetParent(battleRoot.transform, false);
            var resImg = resultPanel.AddComponent<Image>();
            resImg.color = new Color(0, 0, 0, 0.78f);
            var resRt = resultPanel.GetComponent<RectTransform>();
            resRt.anchorMin = Vector2.zero;
            resRt.anchorMax = Vector2.one;
            resRt.sizeDelta = Vector2.zero;
            resultPanel.SetActive(false);
        }

        void AddCommandButton(GameObject parent, string label, int index, UnityEngine.Events.UnityAction onClick)
        {
            var btn = new GameObject("Btn_" + label);
            btn.transform.SetParent(parent.transform, false);
            var img = btn.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.25f, 0.95f);
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

            var txt = MakeText("Txt", label, 19, new Color(1f, 0.88f, 0.6f), TextAnchor.MiddleCenter);
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

        void ShowSkillPanel()
        {
            commandPanel.SetActive(false);
            skillPanel.SetActive(true);
            targetPanel.SetActive(false);
        }

        void OnBattleChanged(bool inBattle)
        {
            hudRoot.SetActive(!inBattle);
            battleRoot.SetActive(inBattle);
            if (questPanel) questPanel.SetActive(false);
            if (treePanel) treePanel.SetActive(false);
            var bm = game != null ? game.battle : null;
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
            if (phase == Chronicles3D.Battle.BattleManager3D.Phase.PlayerTurn)
            {
                ShowCommandPanel(true);
                BuildSkillMenu();
                return;
            }

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
            var bigRt = big.GetComponent<RectTransform>();
            bigRt.anchorMin = new Vector2(0.5f, 0.55f);
            bigRt.anchorMax = new Vector2(0.5f, 0.55f);
            bigRt.anchoredPosition = Vector2.zero;
            bigRt.sizeDelta = new Vector2(800, 120);

            var msg = MakeText("Msg", game != null ? game.LastResultMessage : "", 24, Color.white, TextAnchor.MiddleCenter);
            msg.transform.SetParent(resultPanel.transform, false);
            var msgRt = msg.GetComponent<RectTransform>();
            msgRt.anchorMin = new Vector2(0.5f, 0.4f);
            msgRt.anchorMax = new Vector2(0.5f, 0.4f);
            msgRt.anchoredPosition = Vector2.zero;
            msgRt.sizeDelta = new Vector2(1000, 100);

            var cont = new GameObject("Continue");
            cont.transform.SetParent(resultPanel.transform, false);
            var img = cont.AddComponent<Image>();
            img.color = new Color(0.15f, 0.15f, 0.3f, 0.95f);
            var btn = cont.AddComponent<Button>();
            btn.targetGraphic = img;
            cont.AddComponent<Outline>().effectColor = new Color(0.8f, 0.65f, 0.25f);
            btn.onClick.AddListener(() =>
            {
                if (game) game.ForceEndBattle();
            });
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

        /// <summary>Rebuild the skill list for the hero whose turn it is.</summary>
        void BuildSkillMenu()
        {
            foreach (Transform c in skillPanel.transform) Destroy(c.gameObject);
            if (game == null || game.battle == null) return;

            var bm = game.battle;
            var hero = bm.CurrentHeroIndex >= 0 && bm.CurrentHeroIndex < game.Party.Count
                ? game.Party[bm.CurrentHeroIndex] : null;
            string heroName = hero != null ? hero.definition.displayName : "?";
            int mp = hero != null ? hero.stats.currentMP : 0;
            int maxMp = hero != null ? hero.stats.maxMP : 0;

            var heading = MakeText("Heading", heroName + " — Skills (" + mp + "/" + maxMp + " MP)", 15, new Color(0.8f, 0.9f, 1f), TextAnchor.MiddleLeft);
            heading.transform.SetParent(skillPanel.transform, false);
            var hrt = heading.GetComponent<RectTransform>();
            hrt.anchorMin = new Vector2(0, 1);
            hrt.anchorMax = new Vector2(0, 1);
            hrt.pivot = new Vector2(0, 1);
            hrt.anchoredPosition = new Vector2(8, -44);
            hrt.sizeDelta = new Vector2(404, 24);

            var ids = bm.UsableSkillIdsForCurrentHero();
            for (int i = 0; i < ids.Count; i++)
            {
                int definitionIndex = hero.definition.skillIds.IndexOf(ids[i]);
                int capture = definitionIndex;
                string label = bm.SkillLabel(definitionIndex);
                AddSkillButton(i, label, () =>
                {
                    if (bm.SkillNeedsTarget(capture))
                        StartTargeting("skill", capture);
                    else
                        bm.PerformHeroSkill(capture, -1);
                });
            }
            AddSkillButton(ids.Count, "← Back", ShowCommandPanelTrue);
        }

        void AddSkillButton(int index, string label, UnityEngine.Events.UnityAction onClick)
        {
            // Skill list layout starts below the heading (row 0 at y = -88)
            int row = index / 2;
            int col = index % 2;
            var go = new GameObject("Skill_" + index);
            go.transform.SetParent(skillPanel.transform, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.25f, 0.95f);
            var b = go.AddComponent<Button>();
            b.targetGraphic = img;
            b.onClick.AddListener(onClick);
            go.AddComponent<Outline>().effectColor = new Color(0.7f, 0.7f, 0.9f);

            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(0, 1);
            rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(4 + col * 210, -88 - row * 62);
            rt.sizeDelta = new Vector2(196, 54);

            var txt = MakeText("Txt", label, 15, new Color(1f, 0.9f, 0.75f), TextAnchor.MiddleCenter);
            txt.transform.SetParent(go.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        }

        void ShowCommandPanelTrue() { ShowCommandPanel(true); }

        void AppendLog(string msg)
        {
            logText.text += msg + "\n";
            var lines = logText.text.Split('\n');
            if (lines.Length > 9)
            {
                var keep = new List<string>(lines);
                keep.RemoveRange(0, lines.Length - 9);
                logText.text = string.Join("\n", keep.ToArray());
            }
        }

        void StartTargeting(string action, int skillIndex)
        {
            pendingAction = action;
            pendingSkillIndex = skillIndex;
            ShowCommandPanel(false);
            targetPanel.SetActive(true);

            foreach (var t in targetButtons)
            {
                if (t) Destroy(t.gameObject);
            }
            targetButtons.Clear();

            if (game == null || game.battle == null) return;
            var enemies = game.battle.Enemies;
            var hp = game.battle.EnemyHP;
            int alive = 0;
            for (int i = 0; i < enemies.Count; i++)
            {
                if (hp[i] <= 0) continue;
                var b = CreateTargetButton(enemies[i], hp[i], alive, i);
                targetButtons.Add(b);
                alive++;
            }
        }

        Button CreateTargetButton(EnemyDefinition3D enemy, int hp, int layoutIndex, int enemyIndex)
        {
            var go = new GameObject("Target_" + enemy.id);
            go.transform.SetParent(targetPanel.transform, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.35f, 0.1f, 0.1f, 0.95f);
            var b = go.AddComponent<Button>();
            b.targetGraphic = img;
            go.AddComponent<Outline>().effectColor = new Color(1f, 0.3f, 0.2f);

            int capture = enemyIndex;
            string action = pendingAction;
            int skill = pendingSkillIndex;
            b.onClick.AddListener(() =>
            {
                targetPanel.SetActive(false);
                if (action == "attack") game.battle.PerformHeroAction("attack", capture);
                else if (action == "skill") game.battle.PerformHeroSkill(skill, capture);
            });

            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 0.5f);
            rt.anchorMax = new Vector2(0, 0.5f);
            rt.pivot = new Vector2(0, 0.5f);
            rt.anchoredPosition = new Vector2(10 + layoutIndex * 210, 0);
            rt.sizeDelta = new Vector2(196, 130);

            // Element hint
            string elem = ElementSystem.DisplayName(enemy.element);
            string weak = "";
            var w = ElementSystem.WeaknessOf(enemy.element);
            if (w != ElementType.None) weak = "\nWeak: " + ElementSystem.DisplayName(w);
            var txt = MakeText("Txt",
                enemy.displayName + "\n" + elem + weak + "\nHP " + hp,
                16, Color.white, TextAnchor.MiddleCenter);
            txt.transform.SetParent(go.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
            return b;
        }

        // ==================== OVERLAY PANELS ====================
        /// <summary>Create a modal overlay (dim background + framed box). Returns the overlay root.</summary>
        GameObject BuildOverlayRoot(string name, float w, float h, string titleText)
        {
            var root = new GameObject(name);
            root.transform.SetParent(canvas.transform, false);
            var rrt = root.AddComponent<RectTransform>();
            rrt.anchorMin = Vector2.zero;
            rrt.anchorMax = Vector2.one;
            rrt.sizeDelta = Vector2.zero;

            var dim = new GameObject("Dim");
            dim.transform.SetParent(root.transform, false);
            var dimImg = dim.AddComponent<Image>();
            dimImg.color = new Color(0, 0, 0, 0.72f);
            var drt = dim.GetComponent<RectTransform>();
            drt.anchorMin = Vector2.zero;
            drt.anchorMax = Vector2.one;
            drt.sizeDelta = Vector2.zero;
            var closeOnDim = dim.AddComponent<Button>();
            closeOnDim.targetGraphic = dimImg;
            closeOnDim.onClick.AddListener(() => Destroy(root));

            var box = new GameObject("Box");
            box.transform.SetParent(root.transform, false);
            var boxImg = box.AddComponent<Image>();
            boxImg.color = new Color(0.08f, 0.08f, 0.16f, 0.97f);
            box.AddComponent<Outline>().effectColor = new Color(0.8f, 0.65f, 0.25f);
            var boxRt = box.GetComponent<RectTransform>();
            boxRt.anchorMin = boxRt.anchorMax = new Vector2(0.5f, 0.5f);
            boxRt.pivot = new Vector2(0.5f, 0.5f);
            boxRt.anchoredPosition = Vector2.zero;
            boxRt.sizeDelta = new Vector2(w, h);

            var title = MakeText("Title", titleText, 30, new Color(1f, 0.9f, 0.5f), TextAnchor.MiddleCenter);
            title.transform.SetParent(box.transform, false);
            var trt = title.GetComponent<RectTransform>();
            trt.anchorMin = new Vector2(0, 1);
            trt.anchorMax = new Vector2(0, 1);
            trt.pivot = new Vector2(0.5f, 1);
            trt.anchoredPosition = new Vector2(0, -8);
            trt.sizeDelta = new Vector2(w - 40, 44);

            var content = new GameObject("Content");
            content.transform.SetParent(box.transform, false);
            var crt = content.AddComponent<RectTransform>();
            crt.anchorMin = new Vector2(0, 0);
            crt.anchorMax = new Vector2(1, 1);
            crt.offsetMin = new Vector2(24, 70);
            crt.offsetMax = new Vector2(-24, -58);

            var close = new GameObject("Close");
            close.transform.SetParent(box.transform, false);
            var cImg = close.AddComponent<Image>();
            cImg.color = new Color(0.5f, 0.15f, 0.15f, 0.95f);
            var cBtn = close.AddComponent<Button>();
            cBtn.targetGraphic = cImg;
            close.AddComponent<Outline>().effectColor = new Color(1f, 0.4f, 0.3f);
            cBtn.onClick.AddListener(() => Destroy(root));
            var closeRt = close.GetComponent<RectTransform>();
            closeRt.anchorMin = new Vector2(0.5f, 0);
            closeRt.anchorMax = new Vector2(0.5f, 0);
            closeRt.anchoredPosition = Vector2.zero;
            closeRt.sizeDelta = new Vector2(180, 48);
            var ctxt = MakeText("Txt", "Close", 20, Color.white, TextAnchor.MiddleCenter);
            ctxt.transform.SetParent(close.transform, false);
            ctxt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            ctxt.GetComponent<RectTransform>().anchorMax = Vector2.one;
            return root;
        }

        // ---------- Quest journal ----------
        void OpenQuestPanel()
        {
            if (game == null || game.quests == null) return;
            if (questPanel) Destroy(questPanel);
            questPanel = BuildOverlayRoot("QuestJournal", 900, 640, "Quest Journal");
            questPanel.name = "QuestJournal";
            RefreshQuestPanelText();
        }

        void RefreshQuestPanelText()
        {
            if (questPanel == null || game == null || game.quests == null) return;
            var qs = game.quests;
            var content = questPanel.transform.Find("Box/Content");
            if (content == null) return;
            var text = content.GetComponentInChildren<Text>();
            if (text == null)
            {
                text = MakeText("Text", "", 18, Color.white, TextAnchor.UpperLeft);
                text.transform.SetParent(content, false);
                var trt = text.GetComponent<RectTransform>();
                trt.anchorMin = Vector2.zero;
                trt.anchorMax = Vector2.one;
                trt.offsetMin = Vector2.zero;
                trt.offsetMax = Vector2.zero;
            }

            string s = "";
            if (qs.Active.Count == 0) s = "(no active quests)\n\n";
            foreach (var q in qs.Active)
            {
                s += "◆ " + q.def.title + "  (" + q.def.giver + ")\n";
                s += "   " + q.def.description + "\n";
                foreach (var line in q.ObjectiveLines())
                    s += "      " + line + "\n";
                s += "\n";
            }
            s += "Completed: " + qs.Completed.Count + " quest(s).\n";
            text.text = s;
        }

        // ---------- Skill tree ----------
        void OpenSkillTree()
        {
            if (game == null || game.Party.Count == 0) return;
            if (treeHeroIndex >= game.Party.Count) treeHeroIndex = 0;
            if (treePanel) Destroy(treePanel);
            treeStatus = "";
            treePanel = BuildOverlayRoot("SkillTree", 940, 680, "Skill Tree");
            BuildTreeContent();
        }

        void BuildTreeContent()
        {
            if (treePanel == null || game == null) return;
            var content = treePanel.transform.Find("Box/Content");
            if (content == null) return;

            foreach (Transform c in content) Destroy(c.gameObject);
            var party = game.Party;
            if (treeHeroIndex >= party.Count) treeHeroIndex = 0;
            var hero = party[treeHeroIndex];

            // Header (centred) with clickable arrows either side
            var header = MakeText("Header",
                hero.definition.displayName + " — " + hero.definition.title +
                "    Lv." + hero.level + "   SP: " + hero.sp,
                20, new Color(1f, 0.9f, 0.6f), TextAnchor.MiddleCenter);
            header.transform.SetParent(content, false);
            var hrt = header.GetComponent<RectTransform>();
            hrt.anchorMin = hrt.anchorMax = new Vector2(0.5f, 1);
            hrt.pivot = new Vector2(0.5f, 1);
            hrt.anchoredPosition = new Vector2(0, -6);
            hrt.sizeDelta = new Vector2(760, 36);

            AddSmallIconButton(content, "PrevHero", "◀", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero,
                () => { treeHeroIndex = (treeHeroIndex - 1 + party.Count) % party.Count; BuildTreeContent(); });
            AddSmallIconButton(content, "NextHero", "▶", new Vector2(1, 1), new Vector2(1, 1), Vector2.zero,
                () => { treeHeroIndex = (treeHeroIndex + 1) % party.Count; BuildTreeContent(); });

            // Status line
            var status = MakeText("Status", treeStatus, 16, new Color(1f, 0.8f, 0.7f), TextAnchor.MiddleLeft);
            status.transform.SetParent(content, false);
            var srt = status.GetComponent<RectTransform>();
            srt.anchorMin = new Vector2(0, 1);
            srt.anchorMax = new Vector2(0, 1);
            srt.pivot = new Vector2(0, 1);
            srt.anchoredPosition = new Vector2(0, -52);
            srt.sizeDelta = new Vector2(880, 26);

            // Node rows
            var nodes = SkillTreeLibrary.Build(hero.definition);
            for (int i = 0; i < nodes.Count; i++)
            {
                var node = nodes[i];
                bool unlocked = hero.HasNode(node.id);
                bool prereqMet = node.prerequisiteId == null || hero.HasNode(node.prerequisiteId);
                bool affordable = hero.sp >= node.spCost;

                string glyph = unlocked ? "✓" : (prereqMet && affordable ? "+" : "🔒");
                string desc = node.description.Length > 0 ? "  —  " + node.description : "";
                string cost = node.spCost > 0 ? "  [" + node.spCost + " SP]" : "  [free]";
                string label = glyph + "  " + node.label + cost + desc;

                var row = new GameObject("Node_" + i);
                row.transform.SetParent(content, false);
                var rImg = row.AddComponent<Image>();
                rImg.color = unlocked ? new Color(0.12f, 0.28f, 0.14f, 0.9f)
                                      : (prereqMet ? new Color(0.18f, 0.18f, 0.32f, 0.9f)
                                                   : new Color(0.13f, 0.11f, 0.11f, 0.9f));
                var rBtn = row.AddComponent<Button>();
                rBtn.targetGraphic = rImg;
                var nodeCapture = node;
                int heroCapture = treeHeroIndex;
                rBtn.onClick.AddListener(() =>
                {
                    if (game == null) return;
                    var h = game.Party[heroCapture];
                    string err = h.TryUnlockNode(nodeCapture);
                    treeStatus = err == null ? "Learned: " + nodeCapture.label + "!" : err;
                    if (err == null && game.quests != null)
                        game.quests.RegisterSkillUnlock(QuestSystem3D.CountPartyUnlocks(game.Party));
                    BuildTreeContent();
                });

                var rrt = row.GetComponent<RectTransform>();
                rrt.anchorMin = new Vector2(0, 1);
                rrt.anchorMax = new Vector2(0, 1);
                rrt.pivot = new Vector2(0, 1);
                rrt.anchoredPosition = new Vector2(0, -88 - i * 62);
                rrt.sizeDelta = new Vector2(880, 54);

                var rowText = MakeText("Txt", label, 14,
                    unlocked ? new Color(0.55f, 0.95f, 0.55f) : Color.white,
                    TextAnchor.MiddleLeft);
                rowText.transform.SetParent(row.transform, false);
                rowText.GetComponent<RectTransform>().anchorMin = Vector2.zero;
                rowText.GetComponent<RectTransform>().anchorMax = Vector2.one;
                rowText.GetComponent<RectTransform>().offsetMin = new Vector2(12, 2);
                rowText.GetComponent<RectTransform>().offsetMax = new Vector2(-12, -2);
            }

            // Legend
            var legend = MakeText("Legend",
                "✓ learned    + affordable    🔒 locked (unlock the previous tier first)\nSP: earned by winning battles (+2 each) and levelling up (+1).",
                13, new Color(0.7f, 0.75f, 0.8f), TextAnchor.MiddleLeft);
            legend.transform.SetParent(content, false);
            var lrt = legend.GetComponent<RectTransform>();
            lrt.anchorMin = new Vector2(0, 0);
            lrt.anchorMax = new Vector2(0, 0);
            lrt.pivot = new Vector2(0, 0);
            lrt.anchoredPosition = new Vector2(0, 6);
            lrt.sizeDelta = new Vector2(880, 44);
        }

        void AddSmallIconButton(Transform parent, string name, string label, Vector2 anchor,
            Vector2 pivot, Vector2 pos, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var img = go.AddComponent<Image>();
            img.color = new Color(0.2f, 0.25f, 0.4f, 0.95f);
            var b = go.AddComponent<Button>();
            b.targetGraphic = img;
            b.onClick.AddListener(onClick);
            go.AddComponent<Outline>().effectColor = new Color(0.8f, 0.65f, 0.25f);

            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchor;
            rt.anchorMax = anchor;
            rt.pivot = pivot;
            rt.anchoredPosition = pos;
            rt.sizeDelta = new Vector2(46, 40);

            var txt = MakeText("Txt", label, 20, new Color(1f, 0.9f, 0.65f), TextAnchor.MiddleCenter);
            txt.transform.SetParent(go.transform, false);
            txt.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            txt.GetComponent<RectTransform>().anchorMax = Vector2.one;
        }
    }
}
