## Chronicles of the Fallen Crown - Battle Manager
## Godot 4.x - Turn-based combat with Timing Ring, Stagger, and Trinity Arts

class_name BattleManager
extends Node

## Signals
signal battle_started
signal battle_victory(exp_reward: int, gold_reward: int)
signal battle_defeat
signal turn_started(actor_name: String, is_party: bool)
signal damage_dealt(target_name: String, damage: int, timing: ChroniclesEnums.TimingResult)
signal enemy_staggered(enemy_name: String)

@export var timing_ring: TimingRing
@export var enemy_action_delay: float = 1.0
@export var max_stagger: int = 100

# Constants
const STAGGER_WEAKNESS_BONUS: int = 25
const STAGGER_NORMAL_DAMAGE: int = 10
const STAGGER_DAMAGE_MULTIPLIER: float = 2.0
const STAGGER_FREE_TURNS: int = 2

# Battle state
enum Phase { PLAYER_TURN, ENEMY_TURN, ANIMATING, VICTORY, DEFEAT }
var current_phase: Phase = Phase.PLAYER_TURN

var party: Array = []  # Array[CharacterInstance]
var enemies: Array = []  # Array[EnemyInstance]
var turn_order: Array = []
var stagger_gauges: Dictionary = {}  # enemy_id -> int

var current_actor_index: int = 0
var waiting_for_input: bool = false
var pending_action: Dictionary = {}


## Start a battle
func start_battle(party_members: Array, enemy_data_list: Array) -> void:
	party = party_members
	enemies = []
	stagger_gauges = {}

	for ed in enemy_data_list:
		var enemy := EnemyInstance.new(ed)
		enemies.append(enemy)
		stagger_gauges[ed.enemy_id] = 0

	_calculate_turn_order()
	current_phase = Phase.PLAYER_TURN
	battle_started.emit()
	_process_next_turn()


func _process_next_turn() -> void:
	if _check_victory():
		return
	if _check_defeat():
		return

	if turn_order.is_empty():
		_calculate_turn_order()

	var action: Dictionary = turn_order.pop_front()

	if action.is_party_member:
		current_phase = Phase.PLAYER_TURN
		turn_started.emit(party[action.actor_index].data.character_name, true)
		waiting_for_input = true
		# Wait for UI input via on_player_select_action()
	else:
		current_phase = Phase.ENEMY_TURN
		turn_started.emit(enemies[action.actor_index].data.enemy_name, false)
		await get_tree().create_timer(enemy_action_delay).timeout
		_process_enemy_action(action)
		_process_next_turn()


## Called from UI when player selects an action
func on_player_select_action(type: String, skill: SkillData = null, target_idx: int = 0) -> void:
	if not waiting_for_input:
		return
	waiting_for_input = false

	pending_action = {
		"type": type,
		"skill": skill,
		"target_index": target_idx,
		"timing_multiplier": 1.0,
		"timing_result": ChroniclesEnums.TimingResult.GOOD
	}

	# Activate timing ring for attacks/skills
	if type in ["attack", "skill"] and timing_ring:
		timing_ring.activate_ring()
		var result_data = await timing_ring.timing_completed
		pending_action.timing_result = result_data[0]
		pending_action.timing_multiplier = result_data[1]

	current_phase = Phase.ANIMATING
	_process_player_action(pending_action)
	_process_next_turn()


func _process_player_action(action: Dictionary) -> void:
	var attacker = party[action.actor_index]

	if action.type in ["attack", "skill"]:
		var skill: SkillData = action.skill
		var target = enemies[action.target_index]

		# Calculate damage
		var damage := _calculate_damage(attacker, target, skill, action.timing_result, action.timing_multiplier)

		# Update stagger gauge
		if skill.element != ChroniclesEnums.ElementType.NONE:
			_update_stagger(target.data.enemy_id, skill.element, damage)

		# Apply damage
		target.stats.current_hp = maxi(0, target.stats.current_hp - damage)
		damage_dealt.emit(target.data.enemy_name, damage, action.timing_result)

		# Check stagger trigger
		if stagger_gauges[target.data.enemy_id] >= max_stagger:
			_on_enemy_staggered(target)


func _process_enemy_action(action: Dictionary) -> void:
	var enemy = enemies[action.actor_index]
	# Simple AI: target party member with lowest HP
	var weakest_idx := 0
	var lowest_hp := 999999
	for i in party.size():
		if party[i].stats.current_hp > 0 and party[i].stats.current_hp < lowest_hp:
			lowest_hp = party[i].stats.current_hp
			weakest_idx = i

	var target = party[weakest_idx]
	var damage := maxi(1, enemy.data.base_atk - target.stats.def / 2)
	target.stats.current_hp = maxi(0, target.stats.current_hp - damage)
	damage_dealt.emit(target.data.character_name, damage, ChroniclesEnums.TimingResult.GOOD)


func _calculate_damage(attacker, defender, skill, timing, multiplier) -> int:
	var base_power: float
	if skill.damage_type == ChroniclesEnums.DamageType.PHYSICAL:
		base_power = attacker.stats.atk
	else:
		base_power = attacker.stats.mag

	var damage := base_power * skill.power * multiplier

	var defense: float
	if skill.damage_type == ChroniclesEnums.DamageType.PHYSICAL:
		defense = defender.stats.def
	else:
		defense = defender.stats.res

	damage = maxf(1.0, damage - defense * 0.5)

	# Elemental multiplier
	var elemental_mult := ChroniclesEnums.get_multiplier(skill.element, ChroniclesEnums.ElementType.NONE)
	damage *= elemental_mult

	# Critical hit
	var crit_chance: float = attacker.stats.luk / 100.0
	if randf() < crit_chance:
		damage *= 1.5

	return roundi(damage)


func _update_stagger(enemy_id: String, element: ChroniclesEnums.ElementType, damage: int) -> void:
	var fill_amount: int = STAGGER_WEAKNESS_BONUS if ChroniclesEnums.is_weak_against(element, ChroniclesEnums.ElementType.NONE) else STAGGER_NORMAL_DAMAGE
	stagger_gauges[enemy_id] = mini(max_stagger, stagger_gauges[enemy_id] + fill_amount)


func _on_enemy_staggered(enemy) -> void:
	enemy_staggered.emit(enemy.data.enemy_name)
	stagger_gauges[enemy.data.enemy_id] = 0

	# Add free turns for all party members
	for i in party.size():
		if party[i].stats.current_hp > 0:
			for j in STAGGER_FREE_TURNS:
				turn_order.insert(0, {
					"is_party_member": true,
					"actor_index": i,
					"type": "attack",
					"timing_multiplier": STAGGER_DAMAGE_MULTIPLIER,
					"timing_result": ChroniclesEnums.TimingResult.PERFECT
				})


func _calculate_turn_order() -> void:
	turn_order = []

	for i in party.size():
		if party[i].stats.current_hp > 0:
			turn_order.append({
				"is_party_member": true,
				"actor_index": i,
				"speed": party[i].stats.spd
			})

	for i in enemies.size():
		if enemies[i].stats.current_hp > 0:
			turn_order.append({
				"is_party_member": false,
				"actor_index": i,
				"speed": enemies[i].stats.spd
			})

	turn_order.sort_custom(func(a, b): return a.speed > b.speed)


func _check_victory() -> bool:
	if enemies.all(func(e): return e.stats.current_hp <= 0):
		current_phase = Phase.VICTORY
		var total_exp := 0
		var total_gold := 0
		for e in enemies:
			total_exp += e.data.exp_reward
			total_gold += e.data.gold_reward
		battle_victory.emit(total_exp, total_gold)
		return true
	return false


func _check_defeat() -> bool:
	if party.all(func(c): return c.stats.current_hp <= 0):
		current_phase = Phase.DEFEAT
		battle_defeat.emit()
		return true
	return false
