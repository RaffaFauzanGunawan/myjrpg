## Chronicles of the Fallen Crown - Tile Map Generator
## Godot 4.x - Procedural world generation for all 8 areas

class_name TileMapGenerator
extends Node

# Tile IDs
enum Tile {
	GRASS, GRASS_DARK, FLOOR, WALL, DOOR, DOOR_LOCK, WATER,
	TREE, SNOW_TREE, CACTUS, ROCK, ICE, STAIRS_DOWN, STAIRS_UP,
	CHEST, NPC, SIGN, CAMPFIRE, SHOP, ANVIL, SAVE, WAYSTONE, BOSS
}

enum Biome { FOREST, DESERT, SNOW, TOWN, DUNGEON, RUINS, CASTLE, CAVE }


func generate_map(area_def: Dictionary) -> Array:
	var width: int = area_def.get("width", 40)
	var height: int = area_def.get("height", 30)
	var base_tile: int = area_def.get("base_tile", Tile.GRASS)
	var biome: Biome = area_def.get("biome", Biome.FOREST)

	var tiles: Array = []
	var seed_val: int = area_def.get("area_id", "default").hash()

	# Fill base terrain
	for y in height:
		var row := []
		for x in width:
			row.append(base_tile)
		tiles.append(row)

	# Add borders
	for x in width:
		tiles[0][x] = Tile.WALL
		tiles[height - 1][x] = Tile.WALL
	for y in height:
		tiles[y][0] = Tile.WALL
		tiles[y][width - 1] = Tile.WALL

	# Scatter biome-specific features
	_scatter_features(tiles, width, height, biome, seed_val)

	return tiles


func _scatter_features(tiles: Array, width: int, height: int, biome: Biome, seed_val: int) -> void:
	# Simple deterministic random
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_val

	for y in range(2, height - 2):
		for x in range(2, width - 2):
			var roll := rng.randf()

			match biome:
				Biome.FOREST:
					if roll < 0.08:
						tiles[y][x] = Tile.TREE
					elif roll < 0.15:
						tiles[y][x] = Tile.GRASS_DARK

				Biome.DESERT:
					if roll < 0.03:
						tiles[y][x] = Tile.CACTUS
					elif roll < 0.05:
						tiles[y][x] = Tile.ROCK

				Biome.SNOW:
					if roll < 0.06:
						tiles[y][x] = Tile.ICE
					elif roll < 0.05:
						tiles[y][x] = Tile.SNOW_TREE

				Biome.DUNGEON, Biome.RUINS:
					if y % 4 == 3 and x % 6 == 3 and roll < 0.3:
						tiles[y][x] = Tile.WALL

				Biome.TOWN:
					if roll < 0.04:
						_place_building(tiles, x, y, width, height, rng)


func _place_building(tiles: Array, sx: int, sy: int, w: int, h: int, rng: RandomNumberGenerator) -> void:
	for dy in range(3):
		for dx in range(3):
			var x := sx + dx
			var y := sy + dy
			if x < w - 1 and y < h - 1:
				if dx == 1 and dy == 2:
					tiles[y][x] = Tile.DOOR
				else:
					tiles[y][x] = Tile.WALL


func is_blocking(tile_id: int) -> bool:
	return tile_id in [Tile.WALL, Tile.WATER, Tile.TREE, Tile.SNOW_TREE, Tile.CACTUS, Tile.ROCK]


func is_interactable(tile_id: int) -> bool:
	return tile_id in [Tile.DOOR, Tile.DOOR_LOCK, Tile.CHEST, Tile.NPC, Tile.SIGN,
		Tile.STAIRS_DOWN, Tile.STAIRS_UP, Tile.ANVIL, Tile.SHOP, Tile.BOSS,
		Tile.WAYSTONE, Tile.SAVE]
