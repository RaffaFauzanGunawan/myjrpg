## Chronicles of the Fallen Crown - Skill Data
## Godot 4.x Resources for skills, skill trees, and equipment

class_name SkillData
extends Resource

@export var skill_id: String = ""
@export var skill_name: String = ""
@export var description: String = ""
@export var icon: Texture2D

@export_group("Combat")
@export var damage_type: ChroniclesEnums.DamageType = ChroniclesEnums.DamageType.PHYSICAL
@export var element: ChroniclesEnums.ElementType = ChroniclesEnums.ElementType.NONE
@export var mp_cost: int = 0
@export var power: float = 1.0
@export var target_type: TargetType = TargetType.SINGLE_ENEMY
@export var inflicts_status: ChroniclesEnums.StatusEffect = ChroniclesEnums.StatusEffect.NONE
@export var status_duration: int = 0

@export_group("Skill Tree")
@export var branch: String = ""
@export var required_level: int = 1

@export_group("Trinity Arts")
@export var is_trinity_art: bool = false
@export var trinity_partners: Array[String] = []


enum TargetType {
	SINGLE_ENEMY,
	ALL_ENEMIES,
	SINGLE_ALLY,
	ALL_ALLIES,
	SELF,
	DEAD_ALLY,
	PARTY
}


class SkillTreeData:
	var tree_id: String
	var tree_name: String
	var description: String
	var tree_color: Color
	var skills_in_branch: Array[SkillData] = []


class EquipmentData:
	var item_id: String
	var item_name: String
	var description: String
	var icon: Texture2D
	var slot: EquipSlot
	var element: ChroniclesEnums.ElementType = ChroniclesEnums.ElementType.NONE

	# Stat bonuses
	var atk_bonus: int = 0
	var def_bonus: int = 0
	var mag_bonus: int = 0
	var res_bonus: int = 0
	var spd_bonus: int = 0
	var hp_bonus: int = 0
	var mp_bonus: int = 0

	enum EquipSlot { WEAPON, ARMOR, ACCESSORY }
