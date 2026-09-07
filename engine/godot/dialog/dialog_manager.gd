## Chronicles of the Fallen Crown - Dialog Manager
## Godot 4.x Dialog system with branching choices, typewriter effect

class_name DialogManager
extends Control

signal dialog_started
signal dialog_line(speaker: String, text: String)
signal dialog_choices(choices: Array)
signal dialog_completed

@export var typewriter_speed: float = 0.03  # seconds per character

var current_dialog: DialogData = null
var current_line_index: int = 0
var is_typing: bool = false
var full_text: String = ""

@onready var speaker_label: Label = $SpeakerLabel
@onready var text_label: Label = $TextLabel
@onready var choices_container: VBoxContainer = $ChoicesContainer
@onready var continue_indicator: Label = $ContinueIndicator
@onready var typewriter_timer: Timer = $TypewriterTimer


func _ready():
	visible = false
	choices_container.visible = false
	continue_indicator.visible = false
	typewriter_timer.wait_time = typewriter_speed
	typewriter_timer.timeout.connect(_on_typewriter_tick)


func start_dialog(dialog: DialogData) -> void:
	current_dialog = dialog
	current_line_index = 0
	visible = true
	dialog_started.emit()
	_show_line()


func advance_dialog() -> void:
	if is_typing:
		# Complete current text instantly
		_finish_typewriter()
		return

	# If choices are showing, wait for selection
	if choices_container.visible:
		return

	current_line_index += 1
	if current_line_index >= current_dialog.lines.size():
		_end_dialog()
		return
	_show_line()


func select_choice(choice_index: int) -> void:
	var line = current_dialog.lines[current_line_index]
	if choice_index >= line.choices.size():
		return

	var choice = line.choices[choice_index]

	# Apply effects
	if choice.set_flag != "":
		GameManager.set_flag(choice.set_flag)

	if choice.next_dialog_id != "":
		print("Jump to dialog: %s" % choice.next_dialog_id)

	choices_container.visible = false
	current_line_index += 1
	if current_line_index >= current_dialog.lines.size():
		_end_dialog()
		return
	_show_line()


func _show_line() -> void:
	var line = current_dialog.lines[current_line_index]
	speaker_label.text = line.speaker
	full_text = line.text
	text_label.text = ""

	# Trigger effects
	if line.trigger_flag != "":
		GameManager.set_flag(line.trigger_flag)

	if line.trigger_quest != "":
		var tracker = get_node_or_null("/root/QuestTracker")
		if tracker:
			tracker.start_quest(line.trigger_quest)

	# Start typewriter effect
	is_typing = true
	choices_container.visible = false
	continue_indicator.visible = false
	typewriter_timer.start()

	dialog_line.emit(line.speaker, line.text)


func _on_typewriter_tick() -> void:
	if text_label.text.length() < full_text.length():
		text_label.text = full_text.substr(0, text_label.text.length() + 1)
	else:
		_finish_typewriter()


func _finish_typewriter() -> void:
	typewriter_timer.stop()
	text_label.text = full_text
	is_typing = false

	var line = current_dialog.lines[current_line_index]
	if line.choices.size() > 0:
		_show_choices(line.choices)
	else:
		continue_indicator.visible = true


func _show_choices(choices: Array) -> void:
	# Clear old choices
	for child in choices_container.get_children():
		child.queue_free()

	for i in choices.size():
		var btn := Button.new()
		btn.text = choices[i].choice_text
		btn.pressed.connect(select_choice.bind(i))
		choices_container.add_child(btn)

	choices_container.visible = true
	continue_indicator.visible = false
	dialog_choices.emit(choices)


func _end_dialog() -> void:
	current_dialog = null
	visible = false
	dialog_completed.emit()
