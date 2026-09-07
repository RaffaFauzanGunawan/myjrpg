## Chronicles of the Fallen Crown - Enemy Data
## Godot 4.x Resource-based enemy definitions

class_name EnemyData
extends Resource

@export var enemy_id: String = ""
@export var enemy_name: String = ""
@export var battle_sprite: Texture2D
@export var weakness: ChroniclesEnums.ElementType = ChroniclesEnums.ElementType.NONE

@export_group("Stats")
@export var hp: int = 50
@export var mp: int = 10
@export var base_atk: int = 12
@export var base_def: int = 8
@export var base_mag: int = 6
@export var base_res: int = 6
@export var spd: int = 8
@export var luk: int = 5

@export_group("Rewards")
@export var exp_reward: int = 20
@export var gold_reward: int = 15
@export var drop_table: Array[String] = []

@export var is_boss: bool = false


## Runtime enemy instance
class EnemyInstance:
	var data: EnemyData
	var stats: CharacterData.CharacterStats

	func _init(ed: EnemyData):
		data = ed
		stats = CharacterData.CharacterStats.new()
		stats.max_hp = ed.hp
		stats.current_hp = ed.hp
		stats.max_mp = ed.mp
		stats.current_mp = ed.mp
		stats.atk = ed.base_atk
		stats.def = ed.base_def
		stats.mag = ed.base_mag
		stats.res = ed.base_res
		stats.spd = ed.spd
		stats.luk = ed.luk
