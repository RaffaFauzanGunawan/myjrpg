// ==========================================
// Chronicles of the Fallen Crown - World System
// ==========================================

import { AREAS, T, TILE_COLORS, TILE_EMOJIS, BLOCKING_TILES, INTERACTABLE_TILES } from './data/areas.js';

const TILE_SIZE = 32;
const VIEWPORT_W = 960;
const VIEWPORT_H = 640;

// Pseudorandom seeded generator
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class World {
  constructor() {
    this.tileMaps = {};
    this.animTime = 0;
    this.particleEffects = [];
  }

  getTileMap(areaId) {
    if (this.tileMaps[areaId]) return this.tileMaps[areaId];
    const area = AREAS[areaId];
    if (!area) return null;
    if (area.generated) {
      this.tileMaps[areaId] = this.generateMap(area);
    }
    return this.tileMaps[areaId];
  }

  generateMap(area) {
    const w = area.width;
    const h = area.height;
    const tiles = [];
    const seed = this.hashCode(areaId);
    const rng = seededRandom(Math.abs(seed) + 1);

    // Fill base tiles based on area type
    for (let y = 0; y < h; y++) {
      tiles[y] = [];
      for (let x = 0; x < w; x++) {
        if (area.type === 'outdoor') {
          tiles[y][x] = T.GRASS;
        } else if (area.type === 'town') {
          tiles[y][x] = T.FLOOR;
        } else {
          tiles[y][x] = T.FLOOR;
        }
      }
    }

    // Add borders/walls
    for (let x = 0; x < w; x++) {
      tiles[0][x] = T.WALL;
      tiles[h - 1][x] = T.WALL;
    }
    for (let y = 0; y < h; y++) {
      tiles[y][0] = T.WALL;
      tiles[y][w - 1] = T.WALL;
    }

    // Add natural features based on area type
    if (area.type === 'outdoor') {
      // Trees
      for (let i = 0; i < w * h * 0.15; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS && !this.isNearPlayerStart(x, y, area)) {
          tiles[y][x] = T.TREE;
        }
      }
      // Rocks
      for (let i = 0; i < w * h * 0.03; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS && !this.isNearPlayerStart(x, y, area)) {
          tiles[y][x] = T.ROCK;
        }
      }
      // Flowers
      for (let i = 0; i < w * h * 0.05; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS) {
          tiles[y][x] = T.FLOWER;
        }
      }
      // Water patches
      for (let i = 0; i < 3; i++) {
        const cx = Math.floor(rng() * (w - 6)) + 3;
        const cy = Math.floor(rng() * (h - 6)) + 3;
        const size = Math.floor(rng() * 2) + 1;
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              if (dx * dx + dy * dy <= size * size) {
                tiles[ny][nx] = T.WATER;
              }
            }
          }
        }
      }
    } else if (area.type === 'dungeon') {
      // Add walls to create corridors
      const rooms = [];
      for (let i = 0; i < 6; i++) {
        const rx = Math.floor(rng() * (w - 10)) + 3;
        const ry = Math.floor(rng() * (h - 10)) + 3;
        const rw = Math.floor(rng() * 5) + 4;
        const rh = Math.floor(rng() * 4) + 3;
        rooms.push({ x: rx, y: ry, w: rw, h: rh });

        // Carve room
        for (let dy = 0; dy < rh; dy++) {
          for (let dx = 0; dx < rw; dx++) {
            const nx = rx + dx, ny = ry + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              tiles[ny][nx] = T.FLOOR;
            }
          }
        }
      }

      // Fill unused space with walls
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (tiles[y][x] === T.FLOOR) continue;
          tiles[y][x] = T.WALL;
        }
      }

      // Connect rooms with corridors
      for (let i = 0; i < rooms.length - 1; i++) {
        const a = rooms[i], b = rooms[i + 1];
        const ax = Math.floor(a.x + a.w / 2);
        const ay = Math.floor(a.y + a.h / 2);
        const bx = Math.floor(b.x + b.w / 2);
        const by = Math.floor(b.y + b.h / 2);

        // Horizontal then vertical
        let cx = ax;
        while (cx !== bx) {
          if (ay > 0 && ay < h - 1 && cx > 0 && cx < w - 1) {
            tiles[ay][cx] = T.FLOOR;
          }
          cx += cx < bx ? 1 : -1;
        }
        let cy = ay;
        while (cy !== by) {
          if (cy > 0 && cy < h - 1 && bx > 0 && bx < w - 1) {
            tiles[cy][bx] = T.FLOOR;
          }
          cy += cy < by ? 1 : -1;
        }
      }
    } else if (area.type === 'town') {
      // Add buildings (walls) with doors
      const buildings = [];
      for (let i = 0; i < 5; i++) {
        const bx = Math.floor(rng() * (w - 8)) + 2;
        const by = Math.floor(rng() * (h - 8)) + 2;
        const bw = Math.floor(rng() * 3) + 3;
        const bh = Math.floor(rng() * 2) + 3;
        buildings.push({ x: bx, y: by, w: bw, h: bh });

        // Building walls
        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bw; dx++) {
            const nx = bx + dx, ny = by + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              if (dy === 0 || dy === bh - 1 || dx === 0 || dx === bw - 1) {
                tiles[ny][nx] = T.WALL;
              } else {
                tiles[ny][nx] = T.FLOOR;
              }
            }
          }
        }

        // Door
        const doorX = bx + Math.floor(bw / 2);
        const doorY = by + bh - 1;
        if (doorY < h - 1 && doorX > 0 && doorX < w - 1) {
          tiles[doorY][doorX] = T.DOOR;
        }
      }

      // Paths
      for (let x = 1; x < w - 1; x++) {
        if (tiles[Math.floor(h / 2)][x] === T.GRASS || tiles[Math.floor(h / 2)][x] === T.FLOWER) {
          tiles[Math.floor(h / 2)][x] = T.PATH;
        }
      }
      for (let y = 1; y < h - 1; y++) {
        if (tiles[y][Math.floor(w / 2)] === T.GRASS || tiles[y][Math.floor(w / 2)] === T.FLOWER) {
          tiles[y][Math.floor(w / 2)] = T.PATH;
        }
      }
    }

    // Clear around player start
    const px = area.playerStart.x;
    const py = area.playerStart.y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          if (tiles[ny][nx] !== T.FLOOR && tiles[ny][nx] !== T.PATH) {
            tiles[ny][nx] = area.type === 'outdoor' ? T.GRASS : T.FLOOR;
          }
        }
      }
    }

    // Place special tiles
    // Exits
    for (const exit of (area.exits || [])) {
      if (exit.x >= 0 && exit.x < w && exit.y >= 0 && exit.y < h) {
        tiles[exit.y][exit.x] = T.DOOR;
      }
    }

    // Chests
    for (const chest of (area.chests || [])) {
      if (chest.x >= 0 && chest.x < w && chest.y >= 0 && chest.y < h) {
        tiles[chest.y][chest.x] = T.CHEST;
      }
    }

    // NPCs
    for (const npc of (area.npcs || [])) {
      if (npc.x >= 0 && npc.x < w && npc.y >= 0 && npc.y < h) {
        tiles[npc.y][npc.x] = T.NPC;
      }
    }

    // Signs
    for (const sign of (area.signs || [])) {
      if (sign.x >= 0 && sign.x < w && sign.y >= 0 && sign.y < h) {
        tiles[sign.y][sign.x] = T.SIGN;
      }
    }

    // Waystones
    for (const ws of (area.waystones || [])) {
      if (ws.x >= 0 && ws.x < w && ws.y >= 0 && ws.y < h) {
        tiles[ws.y][ws.x] = T.WAYSTONE;
      }
    }

    // Crafting benches
    for (const cb of (area.craftingBenches || [])) {
      if (cb.x >= 0 && cb.x < w && cb.y >= 0 && cb.y < h) {
        tiles[cb.y][cb.x] = T.CRAFT;
      }
    }

    // Shops
    for (const shop of (area.shops || [])) {
      if (shop.x >= 0 && shop.x < w && shop.y >= 0 && shop.y < h) {
        tiles[shop.y][shop.x] = T.SHOP;
      }
    }

    // Boss
    if (area.bossEncounter) {
      const be = area.bossEncounter;
      if (be.x >= 0 && be.x < w && be.y >= 0 && be.y < h) {
        tiles[be.y][be.x] = T.BOSS;
      }
    }

    // Save points (always near waystones)
    for (const ws of (area.waystones || [])) {
      if (ws.x > 0 && ws.x < w - 1) {
        tiles[ws.y][ws.x + 1] = T.SAVE;
      }
    }

    return tiles;
  }

  isNearPlayerStart(x, y, area) {
    const dx = Math.abs(x - area.playerStart.x);
    const dy = Math.abs(y - area.playerStart.y);
    return dx < 3 && dy < 3;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  isBlocking(tiles, x, y) {
    if (!tiles || y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return true;
    return BLOCKING_TILES.has(tiles[y][x]);
  }

  isInteractable(tiles, x, y) {
    if (!tiles || y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return false;
    return INTERACTABLE_TILES.has(tiles[y][x]);
  }

  render(ctx, state, cameraX, cameraY) {
    const area = AREAS[state.currentArea];
    const tiles = this.getTileMap(state.currentArea);
    if (!area || !tiles) return;

    this.animTime += 0.02;

    const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endTileX = Math.min(area.width, Math.ceil((cameraX + VIEWPORT_W) / TILE_SIZE) + 1);
    const endTileY = Math.min(area.height, Math.ceil((cameraY + VIEWPORT_H) / TILE_SIZE) + 1);

    // Render tiles
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = tiles[y][x];
        const screenX = x * TILE_SIZE - cameraX;
        const screenY = y * TILE_SIZE - cameraY;

        // Base color
        let color = TILE_COLORS[tile] || '#333';

        // Animate certain tiles
        if (tile === T.WATER) {
          const wave = Math.sin(this.animTime * 2 + x * 0.5 + y * 0.3) * 20;
          color = this.adjustColor(color, wave);
        } else if (tile === T.FLOWER) {
          const bright = Math.sin(this.animTime * 3 + x + y) * 10;
          color = this.adjustColor(color, bright);
        } else if (tile === T.WAYSTONE) {
          const glow = Math.sin(this.animTime * 4) * 30 + 20;
          color = this.adjustColor('#3a5a9a', glow);
        } else if (tile === T.SAVE) {
          const glow = Math.sin(this.animTime * 3 + 1) * 20 + 10;
          color = this.adjustColor('#2a6a4a', glow);
        } else if (tile === T.CHEST) {
          color = '#c0a030';
        } else if (tile === T.CHEST_OPEN) {
          color = '#6a6a30';
        } else if (tile === T.BOSS) {
          const pulse = Math.sin(this.animTime * 3) * 30;
          color = this.adjustColor('#8a1a1a', pulse);
        }

        // Draw tile
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Add subtle grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw special tile indicators
        const emoji = TILE_EMOJIS[tile];
        if (emoji) {
          ctx.font = '18px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }
    }

    // Render NPCs with names
    for (const npc of (area.npcs || [])) {
      const screenX = npc.x * TILE_SIZE - cameraX;
      const screenY = npc.y * TILE_SIZE - cameraY;
      if (screenX > -TILE_SIZE && screenX < VIEWPORT_W + TILE_SIZE &&
        screenY > -TILE_SIZE && screenY < VIEWPORT_H + TILE_SIZE) {
        // NPC body
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.emoji, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

        // Name label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX + TILE_SIZE / 2, screenY - 6);

        // Interaction hint
        const dx = Math.abs(state.playerPos.x - npc.x);
        const dy = Math.abs(state.playerPos.y - npc.y);
        if (dx + dy <= 2) {
          ctx.fillStyle = 'rgba(212,175,55,0.9)';
          ctx.fillText('[E] Talk', screenX + TILE_SIZE / 2, screenY + TILE_SIZE + 10);
        }
      }
    }

    // Render player
    const playerScreenX = state.playerPos.x * TILE_SIZE - cameraX;
    const playerScreenY = state.playerPos.y * TILE_SIZE - cameraY;
    const bobY = Math.sin(this.animTime * 5) * 1.5;

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player emoji
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚔️', playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2 + bobY);

    // Direction indicator
    const dirOffsets = { up: [0, -10], down: [0, 10], left: [-10, 0], right: [10, 0] };
    const [dx, dy] = dirOffsets[state.playerDir];
    ctx.fillStyle = 'rgba(212,175,55,0.6)';
    ctx.beginPath();
    ctx.moveTo(playerScreenX + TILE_SIZE / 2 + dx * 0.3, playerScreenY + TILE_SIZE / 2 + dy * 0.3);
    ctx.lineTo(playerScreenX + TILE_SIZE / 2 + dx * 0.8, playerScreenY + TILE_SIZE / 2 + dy * 0.8);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // Render minimap
    this.renderMinimap(ctx, area, tiles, state);

    // Render area name (fade in/out)
    this.renderAreaLabel(ctx, area);

    // Render particles
    this.updateParticles(ctx, cameraX, cameraY);
  }

  renderMinimap(ctx, area, tiles, state) {
    const mmX = VIEWPORT_W - 160;
    const mmY = VIEWPORT_H - 120;
    const mmW = 148;
    const mmH = 108;
    const scale = Math.min(mmW / area.width, mmH / area.height);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = '#c0a050';
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Title
    ctx.fillStyle = '#c0a050';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mmX + 4, mmY - 4);

    // Tiles (simplified)
    for (let y = 0; y < area.height; y++) {
      for (let x = 0; x < area.width; x++) {
        const tile = tiles[y][x];
        let color;
        if (tile === T.WALL || tile === T.TREE || tile === T.ROCK) color = '#555';
        else if (tile === T.WATER) color = '#2a4a8a';
        else if (tile === T.DOOR || tile === T.EXIT) color = '#c0a030';
        else if (tile === T.BOSS) color = '#ff0000';
        else if (tile === T.CHEST) color = '#ffd700';
        else color = '#3a5a3a';

        ctx.fillStyle = color;
        ctx.fillRect(
          mmX + x * scale,
          mmY + y * scale,
          Math.max(1, scale),
          Math.max(1, scale)
        );
      }
    }

    // Player position
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      mmX + state.playerPos.x * scale - 1,
      mmY + state.playerPos.y * scale - 1,
      3, 3
    );
  }

  _areaNameAlpha = 1;
  _lastArea = '';
  renderAreaLabel(ctx, area) {
    if (this._lastArea !== area.id) {
      this._lastArea = area.id;
      this._areaNameAlpha = 1;
    }
    if (this._areaNameAlpha > 0) {
      ctx.globalAlpha = Math.min(1, this._areaNameAlpha);
      ctx.fillStyle = '#c0a050';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(area.name, VIEWPORT_W / 2, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(area.description, VIEWPORT_W / 2, 102);
      ctx.globalAlpha = 1;
      this._areaNameAlpha -= 0.005;
    }
  }

  addParticle(x, y, color, life = 60) {
    this.particleEffects.push({ x, y, color, life, maxLife: life, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2 });
  }

  updateParticles(ctx, cameraX, cameraY) {
    this.particleEffects = this.particleEffects.filter(p => {
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX, p.y - cameraY, 3, 3);
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }

  adjustColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
