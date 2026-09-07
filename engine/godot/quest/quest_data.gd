## Chronicles of the Fallen Crown - Quest Data
## Godot 4.x Quest system with objectives, rewards, and prerequisites

class_name QuestData
extends Resource

@export var quest_id: String = ""
@export var quest_name: String = ""
@export var description: String = ""
@export var type: QuestType = QuestType.SIDE_QUEST
var status: ChroniclesEnums.QuestStatus = ChroniclesEnums.QuestStatus.NOT_STARTED

@export_group("Prerequisites")
@export var required_completed_quests: Array[String] = []
@export var required_flags: Array[String] = []

@export_group("Objectives")
@export var objectives: Array[QuestObjective] = []

@export_group("Rewards")
@export var exp_reward: int = 0
@export var gold_reward: int = 0
@export var item_rewards: Array[String] = []
@export var unlock_flags: Array[String] = []

@export_group("Dialog")
@export var start_dialog_id: String = ""
@export var complete_dialog_id: String = ""


enum QuestType { MAIN_STORY, SIDE_QUEST, BOUNTY_HUNT, EXPLORATION, RELATIONSHIP }


class QuestObjective:
	var description: String
	var type: ObjectiveType
	var target_id: String
	var required_count: int = 1
	var current_count: int = 0

	func is_complete() -> bool:
		return current_count >= required_count

	enum ObjectiveType { KILL, COLLECT, TALK, EXPLORE, CRAFT, ESCORT }


class QuestTracker extends Node:
	var all_quests: Dictionary = {}  # quest_id -> QuestData

	func _ready():
		for child in get_children():
			if child is QuestData:
				all_quests[child.quest_id] = child

	func start_quest(quest_id: String) -> void:
		if not all_quests.has(quest_id):
			return
		var quest: QuestData = all_quests[quest_id]
		if quest.status == ChroniclesEnums.QuestStatus.COMPLETED:
			return
		if not _prerequisites_met(quest):
			return

		quest.status = ChroniclesEnums.QuestStatus.ACTIVE
		print("Quest started: %s" % quest.quest_name)

	func report_progress(type: QuestData.QuestObjective.ObjectiveType, target_id: String, count: int = 1) -> void:
		for quest in all_quests.values():
			if quest.status != ChroniclesEnums.QuestStatus.ACTIVE:
				continue
			for obj in quest.objectives:
				if obj.type == type and obj.target_id == target_id and not obj.is_complete():
					obj.current_count = mini(obj.current_count + count, obj.required_count)
					print("Quest [%s] objective: %s (%d/%d)" % [quest.quest_name, obj.description, obj.current_count, obj.required_count])
					if _all_objectives_complete(quest):
						_complete_quest(quest)

	func _all_objectives_complete(quest: QuestData) -> bool:
		for obj in quest.objectives:
			if not obj.is_complete():
				return false
		return true

	func _complete_quest(quest: QuestData) -> void:
		quest.status = ChroniclesEnums.QuestStatus.COMPLETED
		print("Quest completed: %s! Rewards: %d EXP, %d Gold" % [quest.quest_name, quest.exp_reward, quest.gold_reward])

		# Grant rewards via Game Manager (autoload)
		var gm = GameManager  # Autoload singleton
		gm.award_exp(quest.exp_reward)
		for item_id in quest.item_rewards:
			gm.add_item(item_id)
		for flag in quest.unlock_flags:
			gm.set_flag(flag)

	func _prerequisites_met(quest: QuestData) -> bool:
		var gm = GameManager
		for flag in quest.required_flags:
			if not gm.get_flag(flag):
				return false
		return true
