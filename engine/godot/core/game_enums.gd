## Chronicles of the Fallen Crown - Core Enums
## Godot 4.x GDScript

class_name ChroniclesEnums

# Element system with weakness chart
enum ElementType { NONE, FIRE, ICE, LIGHTNING, HOLY, DARK }
enum DamageType { PHYSICAL, MAGIC, HEAL, BUFF, DEBUFF, SUMMON }
enum GameScreen { TITLE, PROLOGUE, EXPLORING, BATTLE, DIALOG, MENU, CRAFTING, SHOP, GAMEOVER, VICTORY }
enum Direction { UP, DOWN, LEFT, RIGHT }
enum TimingResult { PERFECT, GREAT, GOOD, MISS }
enum StatusEffect { NONE, POISON, REGEN, DEF_UP, DEF_DOWN, ATK_UP, ATK_DOWN, SLOW, STAGGER }
enum QuestStatus { NOT_STARTED, ACTIVE, COMPLETED }
enum EndingType { HONOR, SACRIFICE, DARKNESS }

# Elemental weakness chart
static func is_weak_against(attack: ElementType, defense: ElementType) -> bool:
	match [attack, defense]:
		[ElementType.FIRE, ElementType.ICE]: return true
		[ElementType.ICE, ElementType.FIRE]: return true
		[ElementType.LIGHTNING, ElementType.ICE]: return true
		[ElementType.HOLY, ElementType.DARK]: return true
		[ElementType.DARK, ElementType.HOLY]: return true
		_: return false

static func get_multiplier(attack: ElementType, defense: ElementType) -> float:
	if attack == ElementType.NONE or defense == ElementType.NONE:
		return 1.0
	return 1.5 if is_weak_against(attack, defense) else 1.0
