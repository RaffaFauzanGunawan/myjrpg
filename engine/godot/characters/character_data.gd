## Chronicles of the Fallen Crown - Character Data
## Godot 4.x Resource-based character definitions

class_name CharacterData
extends Resource

@export_group("Identity")
@export var character_id: String = ""
@export var character_name: String = ""
@export var title: String = ""
@export var class_name_str: String = ""  # "class_name" is reserved in GDScript
@export var portrait: Texture2D
@export var battle_sprite: Texture2D
@export var theme_color: Color = Color.WHITE
@export var is_protagonist: bool = false

@export_group("Base Stats")
@export var base_hp: int = 100
@export var base_mp: int = 30
@export var base_atk: int = 15
@export var base_def: int = 15
@export var base_mag: int = 10
@export var base_res: int = 10
@export var base_spd: int = 10
@export var base_luk: int = 10

@export_group("Growth Rates (per level)")
@export var hp_growth: int = 10
@export var mp_growth: int = 2
@export var atk_growth: int = 2
@export var def_growth: int = 2
@export var mag_growth: int = 1
@export var res_growth: int = 1
@export var spd_growth: int = 1
@export var luk_growth: int = 1

@export_group("Skills")
@export var skills: Array[SkillData] = []
@export var skill_trees: Array[SkillTreeData] = []


func get_stats_at_level(level: int) -> CharacterStats:
	var lvl: int = maxi(1, level) - 1
	var stats := CharacterStats.new()
	stats.max_hp = base_hp + hp_growth * lvl
	stats.max_mp = base_mp + mp_growth * lvl
	stats.atk = base_atk + atk_growth * lvl
	stats.def = base_def + def_growth * lvl
	stats.mag = base_mag + mag_growth * lvl
	stats.res = base_res + res_growth * lvl
	stats.spd = base_spd + spd_growth * lvl
	stats.luk = base_luk + luk_growth * lvl
	return stats


## Runtime character instance (mutable stats, equipment, etc.)
class CharacterInstance:
	var data: CharacterData
	var level: int = 1
	var exp: int = 0
	var stats: CharacterStats
	var unlocked_skills: Array[SkillData] = []
	var equipment: Array = [null, null, null]  # [weapon, armor, accessory]

	func initialize():
		stats = data.get_stats_at_level(level)
		stats.current_hp = stats.max_hp
		stats.current_mp = stats.max_mp
		# Start with base branch skills
		unlocked_skills = data.skills.filter(func(s): return s.branch == data.skill_trees[0].branch_id)

	func level_up():
		level += 1
		var old_stats := stats
		stats = data.get_stats_at_level(level)
		# Preserve proportional HP/MP
		var hp_ratio := float(old_stats.current_hp) / maxf(1.0, old_stats.max_hp - data.hp_growth)
		var mp_ratio := float(old_stats.current_mp) / maxf(1.0, old_stats.max_mp - data.mp_growth)
		stats.current_hp = roundi(stats.max_hp * clampf(hp_ratio, 0.0, 1.0))
		stats.current_mp = roundi(stats.max_mp * clampf(mp_ratio, 0.0, 1.0))


class CharacterStats:
	var max_hp: int
	var max_mp: int
	var atk: int
	var def: int
	var mag: int
	var res: int
	var spd: int
	var luk: int
	var current_hp: int
	var current_mp: int
