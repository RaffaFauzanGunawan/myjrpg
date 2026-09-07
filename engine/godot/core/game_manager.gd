## Chronicles of the Fallen Crown - Game Manager
## Godot 4.x - Central state manager (set as Autoload singleton)

extends Node

# ============ CONSTANTS ============
const MAX_PARTY_SIZE := 4
const MAX_INVENTORY_SLOTS := 36

# ============ GAME STATE ============
var current_screen: ChroniclesEnums.GameScreen = ChroniclesEnums.GameScreen.TITLE
var current_area_id: String = "verdant_woods"
var player_position: Vector2i = Vector2i(8, 8)
var player_direction: ChroniclesEnums.Direction = ChroniclesEnums.Direction.DOWN
var play_time: float = 0.0
var ending: ChroniclesEnums.EndingType = ChroniclesEnums.EndingType.HONOR

# ============ PARTY ============
var full_party: Array = []  # Array[CharacterInstance]
var active_party_indices: Array[int] = []  # Max 4 active

# ============ INVENTORY ============
var inventory: Dictionary = {}  # item_id -> quantity

# ============ QUESTS ============
var active_quests: Array = []  # Array[QuestData]
var completed_quest_ids: Array[String] = []

# ============ WORLD FLAGS ============
var world_flags: Dictionary = {}

# ============ NOTIFICATIONS ============
var notification_queue: Array[String] = []


func _process(delta: float) -> void:
	play_time += delta


# ============ PARTY MANAGEMENT ============

func recruit_character(data: CharacterData, level: int = 1) -> void:
	var instance := CharacterData.CharacterInstance.new()
	instance.data = data
	instance.level = level
	instance.initialize()
	full_party.append(instance)

	if active_party_indices.size() < MAX_PARTY_SIZE:
		active_party_indices.append(full_party.size() - 1)

	show_notification("%s joined the party!" % data.character_name)


func get_active_party() -> Array:
	var active := []
	for idx in active_party_indices:
		if idx < full_party.size():
			active.append(full_party[idx])
	return active


func award_exp(exp: int) -> void:
	for member in get_active_party():
		member.exp += exp
		var required := _get_required_exp(member.level)
		while member.exp >= required:
			member.exp -= required
			member.level_up()
			show_notification("%s reached Level %d!" % [member.data.character_name, member.level])
			required = _get_required_exp(member.level)


func _get_required_exp(level: int) -> int:
	return roundi(50.0 * pow(level, 1.5))


# ============ INVENTORY ============

func add_item(item_id: String, count: int = 1) -> void:
	if inventory.has(item_id):
		inventory[item_id] += count
	else:
		inventory[item_id] = count


func remove_item(item_id: String, count: int = 1) -> bool:
	if not inventory.has(item_id) or inventory[item_id] < count:
		return false
	inventory[item_id] -= count
	if inventory[item_id] <= 0:
		inventory.erase(item_id)
	return true


func has_item(item_id: String, count: int = 1) -> bool:
	return inventory.has(item_id) and inventory[item_id] >= count


# ============ WORLD FLAGS ============

func set_flag(flag: String, value: bool = true) -> void:
	world_flags[flag] = value


func get_flag(flag: String) -> bool:
	return world_flags.get(flag, false)


# ============ SCREEN TRANSITIONS ============

func change_screen(new_screen: ChroniclesEnums.GameScreen) -> void:
	current_screen = new_screen
	# In a real project, trigger scene transitions here
	print("Screen changed to: %s" % ChroniclesEnums.GameScreen.keys()[new_screen])


# ============ NOTIFICATIONS ============

func show_notification(text: String) -> void:
	notification_queue.append(text)
	print("[NOTIFICATION] %s" % text)


func dequeue_notification() -> String:
	if notification_queue.size() > 0:
		return notification_queue.pop_front()
	return ""


# ============ SAVE / LOAD ============

func create_save_data() -> Dictionary:
	return {
		"area_id": current_area_id,
		"player_x": player_position.x,
		"player_y": player_position.y,
		"play_time": play_time,
	}


func load_save_data(data: Dictionary) -> void:
	current_area_id = data.get("area_id", "verdant_woods")
	player_position = Vector2i(data.get("player_x", 8), data.get("player_y", 8))
	play_time = data.get("play_time", 0.0)
	change_screen(ChroniclesEnums.GameScreen.EXPLORING)
