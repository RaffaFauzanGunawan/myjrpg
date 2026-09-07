## Chronicles of the Fallen Crown - Timing Ring System
## Godot 4.x - The signature combat mechanic

class_name TimingRing
extends Control

## Emits when the player presses the action button during ring spin.
signal timing_completed(result: ChroniclesEnums.TimingResult, multiplier: float)

@export var spin_speed: float = 360.0  # degrees per second
@export var perfect_zone_angle: float = 30.0
@export var great_zone_angle: float = 60.0
@export var good_zone_angle: float = 100.0

@export var perfect_multiplier: float = 1.5
@export var great_multiplier: float = 1.25
@export var good_multiplier: float = 1.0
@export var miss_multiplier: float = 0.0

var current_angle: float = 0.0
var target_angle: float = 0.0
var is_spinning: bool = false
var damage_multiplier: float = 1.0

# Combo tracking for Trinity Arts
var combo_hits: int = 0
const MAX_COMBO: int = 3

@onready var pointer: Control = $Pointer
@onready var perfect_zone: Control = $PerfectZone
@onready var great_zone: Control = $GreatZone
@onready var result_label: Label = $ResultLabel


func _ready():
	visible = false


func _process(delta: float) -> void:
	if not is_spinning:
		return

	current_angle += spin_speed * delta
	if current_angle >= 360.0:
		current_angle -= 360.0

	# Rotate pointer
	pointer.rotation = deg_to_rad(-current_angle)


## Activate the timing ring. Call when player selects an attack.
func activate_ring() -> void:
	is_spinning = true
	current_angle = 0.0
	target_angle = randf_range(0.0, 360.0)
	visible = true
	result_label.text = ""
	_update_zone_visuals()


## Called when player presses the action button.
func on_player_action() -> void:
	if not is_spinning:
		return

	is_spinning = false

	var angle_diff: float = absf(rad_to_deg(atan2(
		sin(deg_to_rad(current_angle - target_angle)),
		cos(deg_to_rad(current_angle - target_angle))
	)))

	var result: ChroniclesEnums.TimingResult

	if angle_diff <= perfect_zone_angle / 2.0:
		result = ChroniclesEnums.TimingResult.PERFECT
		damage_multiplier = perfect_multiplier
		combo_hits += 1
	elif angle_diff <= great_zone_angle / 2.0:
		result = ChroniclesEnums.TimingResult.GREAT
		damage_multiplier = great_multiplier
		combo_hits += 1
	elif angle_diff <= good_zone_angle / 2.0:
		result = ChroniclesEnums.TimingResult.GOOD
		damage_multiplier = good_multiplier
		combo_hits = 0
	else:
		result = ChroniclesEnums.TimingResult.MISS
		damage_multiplier = miss_multiplier
		combo_hits = 0

	_show_result(result)
	timing_completed.emit(result, damage_multiplier)


func is_combo_active() -> bool:
	return combo_hits >= 2


func get_combo_count() -> int:
	return combo_hits


func _show_result(result: ChroniclesEnums.TimingResult) -> void:
	var text: String
	var color: Color

	match result:
		ChroniclesEnums.TimingResult.PERFECT:
			text = "PERFECT!"
			color = Color(0.95, 0.77, 0.06)  # Gold
		ChroniclesEnums.TimingResult.GREAT:
			text = "GREAT!"
			color = Color(0.18, 0.8, 0.44)   # Green
		ChroniclesEnums.TimingResult.GOOD:
			text = "GOOD"
			color = Color(0.2, 0.6, 0.86)    # Blue
		ChroniclesEnums.TimingResult.MISS:
			text = "MISS"
			color = Color(0.91, 0.3, 0.24)   # Red

	result_label.text = text
	result_label.add_theme_color_override("font_color", color)

	# Fade out after 0.5s
	var tween := create_tween()
	tween.tween_interval(0.5)
	tween.tween_property(result_label, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): visible = false)


func _update_zone_visuals() -> void:
	# Perfect zone: golden arc at target_angle
	# Great zone: green arc wider than perfect
	# Good zone: blue arc widest
	# Implementation depends on your visual approach (TextureRect, draw_arc, etc.)
	pass
