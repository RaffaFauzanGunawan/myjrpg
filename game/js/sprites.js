// ==========================================
// Chronicles of the Fallen Crown - Pixel Art Sprite System
// All characters, enemies, and tiles drawn as pixel grids
// ==========================================

// ---------- PALETTE ----------
const PALETTE = {
  '.': null,          // transparent
  'k': '#14141f',     // outline / near-black
  'n': '#1b2631',     // dark navy
  'd': '#3a3a4a',     // dark grey
  'g': '#7f8c8d',     // grey
  'm': '#aab2b5',     // light metal
  'w': '#eceff1',     // white
  's': '#f0c8a0',     // skin light
  'S': '#c98d5f',     // skin tan
  'h': '#5a3a22',     // brown hair
  'H': '#2e1f14',     // dark hair
  'r': '#c0392b',     // red
  'R': '#e74c3c',     // bright red
  'o': '#d35400',     // orange
  'O': '#e67e22',     // bright orange
  'y': '#e8c547',     // gold
  'Y': '#f5d76e',     // light gold
  'b': '#3d5a80',     // steel blue
  'B': '#2a4170',     // dark blue
  'c': '#1abc9c',     // cyan
  'C': '#16a085',     // teal
  'G': '#1e8a4a',     // green
  'L': '#3fae5f',     // light green
  'l': '#8bc34a',     // lime
  'p': '#8e44ad',     // purple
  'P': '#5b2c6f',     // dark purple
  'e': '#d9822b',     // enemy carapace orange
  'E': '#8a4a12',     // dark carapace
  'f': '#e8d5b0',     // cream / bone
  't': '#2c6e3f',     // tree dark green
  'T': '#3e8e4f',     // tree green
  'u': '#9b7653',     // wood brown
  'U': '#6f4e2e',     // dark wood
  'a': '#c9a86a',     // sand
  'i': '#2980b9',     // ice blue
  'q': '#2a4a8a',     // deep water
  'z': '#f39c12',     // bright amber
  'x': '#5d4037',     // brown
};

// ---------- HELPERS ----------
const _spriteCache = {};

function makeSprite(rows, scale) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const col = PALETTE[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c;
}

function getSprite(key, rows, scale) {
  if (!_spriteCache[key]) {
    _spriteCache[key] = makeSprite(rows, scale || 3);
  }
  return _spriteCache[key];
}

function drawSprite(ctx, canvas, x, y, w, h) {
  if (!canvas) return;
  if (w === undefined) { w = canvas.width; h = canvas.height; }
  ctx.drawImage(canvas, Math.round(x), Math.round(y), w, h);
}

// ---------- CHARACTER SPRITES (12 x 15, scale 3 = 36x45) ----------

const CHARACTER_SPRITE_ROWS = {
  cedric: [ // Blue knight with sword & shield
    '....kkkk....',
    '...khhhhk...',
    '...khhhhk...',
    '..kkkkkkkk..',
    '..kssssssk..',
    '..kskskssk..',
    '..kssssssk..',
    '...kkkkkk...',
    '..kbbbbbbk..',
    '.kbbbbbbbbk.',
    '.kbbbsbbbkm.',
    '.kbbbbbbbkm.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  lyra: [ // Purple mage with staff
    '....pppp....',
    '...pHHHHp...',
    '...pHHHHp...',
    '..pppppppp..',
    '..pssssssp..',
    '..pspspspp..',
    '..pssssssp..',
    '...pppppp...',
    '..kppppppk..',
    '.kppppppppk.',
    '.kpppppppkU.',
    '.kpppppppkU.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  aldous: [ // Cleric white/gold robes
    '....ykyk....',
    '...kwwwwk...',
    '...kwwwwk...',
    '..kywwwwyk..',
    '..yssssssy..',
    '..ysysysyy..',
    '..yssssssy..',
    '...yyyyyy...',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    '.kwwwwwkwwk.',
    '.kwwwwwwwww.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  rowan: [ // Green ranger with bow
    '....llll....',
    '...lHHHHl...',
    '...lHHHHl...',
    '..llllllll..',
    '..lssssssl..',
    '..lslslsll..',
    '..lssssssl..',
    '...llllll...',
    '..kLLLLLLk..',
    '.kLLLLLLLLk.',
    '.kLLLLLkku..',
    '.kLLLLLLku..',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  mira: [ // Dark assassin with twin daggers
    '....HHHH....',
    '...HrrrHH...',
    '...HrrrHH...',
    '..HHHHHHHH..',
    '..HssssssH..',
    '..HsrsrssH..',
    '..HssssssH..',
    '...HHHHHH...',
    '..knnnnnnk..',
    '.knnnnnnnnk.',
    '.knnsnnnmk..',
    '.knnnnnnmk..',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  dorin: [ // Dwarf blacksmith with hammer & beard
    '....oooo....',
    '...ohhhho...',
    '..koooook...',
    '..kSSSSSSk..',
    '..kSSSSSSk..',
    '..kSkSkSSk..',
    '..kSSSSSSk..',
    '..kkkSSkkk..',
    '.koooooooom.',
    '.kooooooomm.',
    '.koosooomk..',
    '.kooooomk...',
    '..kkkkkk....',
    '..kk..kk....',
    '..kk..kk....',
  ],
  seraphina: [ // Noble spellblade cyan/silver
    '....cccc....',
    '...cYYYYc...',
    '...cYYYYc...',
    '..cccccccc..',
    '..cssssssc..',
    '..cskskscc..',
    '..cssssssc..',
    '...cccccc...',
    '..kcccccck..',
    '.kccccccccc.',
    '.kcccwcccmm.',
    '.kcccccccmm.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
};

const CHARACTER_SPRITES = {};
function getCharacterSprite(id) {
  const rows = CHARACTER_SPRITE_ROWS[id];
  if (!rows) return getCharacterSprite('cedric');
  return getSprite('char_' + id, rows, 3);
}

// ---------- ENEMY SPRITES (12 x 12, scale 3 = 36x36) ----------

const ENEMY_SPRITE_ROWS = {
  slime: [ // Green blob
    '....GGGG....',
    '...GGGGGG...',
    '..GGGGGGGG..',
    '.GGGGGGGGGG.',
    '.GGGGGGGGGG.',
    'GGGGGGGGGGGG',
    'GGGGGGGGGGGG',
    'GGGkGGGGkGGG',
    'GGGGGGGGGGGG',
    '.GGGGGGGGGG.',
    '..GGGGGGGG..',
    '...GGGGGG...',
  ],
  goblin: [ // Small green goblin
    '....GGGG....',
    '...GGGGGG...',
    '...GssssG...',
    '..GsGsGsG...',
    '..GssssssG..',
    '...GGGGGG...',
    '..GkGGGGkG..',
    '.GGGGGGGGGG.',
    '.GGGGGGGGGG.',
    '..GGGGGGGG..',
    '...GG..GG...',
    '...GG..GG...',
  ],
  wolf: [ // Grey wolf
    '.....ggg....',
    '....ggggg...',
    '...gggggg...',
    '...gkgkg....',
    '..ggggggg...',
    '..gggggggg..',
    '.ggggggggg..',
    '.ggggggggg..',
    '..ggggggg...',
    '..gg.ggg....',
    '.gg..ggg....',
    'gg...gg.....',
  ],
  skeleton: [ // Bone warrior
    '....ffff....',
    '...ffffff...',
    '...fkfkf....',
    '..ffffffff..',
    '..ffffffff..',
    '...fffff....',
    '..fffffff...',
    '.fffffffff..',
    '.fffffffff..',
    '..fffffff...',
    '...fff.fff..',
    '...fff.fff..',
  ],
  fire_imp: [ // Red imp
    '....RRRR....',
    '...RRRRRR...',
    '...RssssR...',
    '..RsRsRsR...',
    '..RssssssR..',
    '...RRRRRR...',
    '..RkRRRRkR..',
    '.RRRRRRRRRR.',
    '.RRRRRRRRRR.',
    '..RRRRRRRR..',
    '...RR..RR...',
    '...RR..RR...',
  ],
  bandit: [ // Hooded bandit
    '....nnnn....',
    '...nnnnnn...',
    '...nssssn...',
    '..nsnsnsn...',
    '..nssssssn..',
    '...nnnnnn...',
    '..kkkkkkkk..',
    '.kxxxxxxkk..',
    '.kxxxxxxkk..',
    '.kxxxxxxxxk.',
    '..kkkkkkkk..',
    '..kk..kk....',
  ],
  golem: [ // Stone golem
    '...kkkkkk...',
    '..kggggggk..',
    '.kgggkgkggk.',
    '.kggggggggk.',
    '.kgggkgkggk.',
    '.kggggggggk.',
    '.kgkkkkkkgg.',
    '.kggggggggk.',
    '.kggggggggk.',
    '.kkkkkkkkkk.',
    '..kk....kk..',
    '..kk....kk..',
  ],
  mage_enemy: [ // Dark sorcerer
    '....PPPP....',
    '...PPPPPp...',
    '...pssssp...',
    '..pspspsp...',
    '..pssssssp..',
    '...PPPPPP...',
    '..kppppppk..',
    '.kppppppppk.',
    '.kpppppppkU.',
    '.kpppppppkU.',
    '..kkkkkkkk..',
    '..kk..kk....',
  ],
  wyvern: [ // Blue wyvern
    '....iiii....',
    '...iiiiii...',
    '..iiiiiiii..',
    '..ikikiii...',
    '.iiiiiiiiii.',
    '.iiiiiiiiii.',
    'i.iiiiiiii..',
    'i.iiiiiii...',
    '.iiiiiiii...',
    '..iiiiii....',
    '..i..iii....',
    'ii...ii.....',
  ],
  bug: [ // Insect creature (orange carapace) - like reference image
    '....eeee....',
    '...eeeeee...',
    '..eeEEEEee..',
    '.eeEEEEEEee.',
    '.eeEkkEEee..',
    'eeEEEEEEEEee',
    'eeEEEEEEEEee',
    'eeEkEEEEkEee',
    '.eeEEEEEEee.',
    '..eeeeeeee..',
    '..ee..ee..ee',
    '..ee..ee..ee',
  ],
  boss_shadow_knight: [ // Shadow Knight boss (bigger: 14x14)
    '....nnnnnn....',
    '...nnnnnnnn...',
    '...nnnnnnnn...',
    '..nnnnnnnnnn..',
    '..nkksssskkn..',
    '..nksksksksn..',
    '..nkksssskkn..',
    '...nnnnnnnn...',
    '..nnnnnnnnnn..',
    '.nnnnnnnnnnnn.',
    '.nnkknnnnnnnn.',
    '.nnnnnnnnnnnn.',
    '..nnnnnnnnnn..',
    '..nn..nn..nn..',
    '..nn..nn..nn..',
  ],
  boss_dragon_lord: [ // Dragon Lord boss
    '....tttttt....',
    '...tttttttt...',
    '...tYtYttt....',
    '..tttttttttt..',
    '.rrttttttttrr.',
    'r.rrttttttrr..',
    'rrrrttttttr...',
    '.rrtttttttt...',
    '..tttttttt....',
    '..ttttttttt...',
    '.ttttttttttt..',
    '.ttt.tt.ttt...',
    '..t..ttt..t...',
    '..tt....tt....',
  ],
  boss_tyrant: [ // Tyrant with crown
    '...yYyyYy...',
    '..ykkkkkky..',
    '..kxxxxxxk..',
    '..kxxxxxxk..',
    '..kssssssk..',
    '..kskskssk..',
    '..kssssssk..',
    '...kkkkkk...',
    '..kxxxxxxk..',
    '.kxxxxxxxxk.',
    '.kxxkxxkxxk.',
    '.kxxxxxxxxk.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
};

const ENEMY_SPRITES = {};
function getEnemySprite(id) {
  const rows = ENEMY_SPRITE_ROWS[id];
  if (!rows) return getEnemySprite('slime');
  const isBoss = id.indexOf('boss') === 0;
  return getSprite('enemy_' + id, rows, isBoss ? 4 : 3);
}

// ---------- NPC SPRITES (12 x 14) ----------
const NPC_SPRITE_ROWS = {
  elder: [ // Elder with beard & staff
    '....wwww....',
    '...wwwwww...',
    '...wssssw...',
    '..wswswsw...',
    '..wssssssw..',
    '...wwwwww...',
    '..kwwwwwwk..',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    '.kwwwwwwwww.',
    '.kwwwwwwwku.',
    '.kwwwwwwwku.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  guard: [ // Guard with helmet & spear
    '....kkkk....',
    '...kmmmmk...',
    '...kmmmmk...',
    '..kmmmmmmk..',
    '..kssssssk..',
    '..kskskssk..',
    '..kssssssk..',
    '...kkkkkk...',
    '..knnnnnnk..',
    '.knnnnnnnnk.',
    '.knnnnnnnnk.',
    '.knnnnnnnku.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  merchant: [ // Merchant with hat & coat
    '....uuuu....',
    '...uuuuuu...',
    '..uuuuuuuu..',
    '..kssssssk..',
    '..kskskssk..',
    '..kssssssk..',
    '...kkkkkk...',
    '..kxxxxxxk..',
    '.kxxxxxxxxk.',
    '.kxxkxxkxxk.',
    '.kxxxxxxxxk.',
    '..kxxxxxxk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  scholar: [ // Scholar with book & glasses
    '....HHHH....',
    '...HHHHHH...',
    '...kssssk...',
    '..ksksksk...',
    '..kssssssk..',
    '...kkkkkk...',
    '..kppppppk..',
    '.kppppppppk.',
    '.kpppppkppk.',
    '.kppppppppk.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  child: [ // Child
    '....HHHH....',
    '...HHHHHH...',
    '...ssssss...',
    '..ssssssss..',
    '..skskskss..',
    '..ssssssss..',
    '...kkkkkk...',
    '..krrrrrrk..',
    '.krrrrrrrrk.',
    '..krrrrrrk..',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
  villager: [ // Generic villager
    '....hhhh....',
    '...hhhhhh...',
    '...kssssk...',
    '..ksksksk...',
    '..kssssssk..',
    '...kkkkkk...',
    '..kggggggk..',
    '.kggggggggk.',
    '.kggkggkggk.',
    '.kggggggggk.',
    '..kkkkkkkk..',
    '..kk..kk....',
    '..kk..kk....',
  ],
};

const NPC_SPRITES = {};
function getNpcSprite(id) {
  let key = 'villager';
  if (id.indexOf('elder') === 0) key = 'elder';
  else if (id.indexOf('guard') === 0 || id.indexOf('captain') === 0) key = 'guard';
  else if (id.indexOf('merchant') === 0 || id.indexOf('herbalist') === 0) key = 'merchant';
  else if (id.indexOf('scholar') === 0 || id.indexOf('bard') === 0) key = 'scholar';
  else if (id.indexOf('orphan') === 0 || id.indexOf('refugee') === 0 || id.indexOf('miner') === 0) key = 'child';
  return getSprite('npc_' + key, NPC_SPRITE_ROWS[key], 3);
}

// ---------- UI / TITLE SPRITES ----------

const CROWN_SPRITE_ROWS = [
  '..y....y....y..',
  '.yYy..yYy..yYy.',
  'yYYYyyYYYyyYYYy',
  'yYYYYYYYYYYYYYy',
  'yYyYyyyyyyYyYyY',
  'yYyYYYyyYYYyYyY',
  'yyyyyyyyyyyyyyy',
  'kkkkkkkkkkkkkkk',
  'krrrrrrrrrrrrrk',
  'krryyrryyrryyrk',
  'krryyrryyrryyrk',
  'krrrrrrrrrrrrrk',
  'kkkkkkkkkkkkkkk',
];

function getCrownSprite() {
  return getSprite('ui_crown', CROWN_SPRITE_ROWS, 4);
}

// ---------- TILE SPRITES (16 x 16, drawn at TILE_SIZE=32 → scale 2) ----------

const TILE_SPRITE_ROWS = {
  grass: [
    'aaaaaaaaaaaaaaaa',
    'aaaaaGGaaaaaaaG',
    'aaGGaGGGGaaaaaa',
    'aaGGGGGaaaGGaaa',
    'aaaaGGGaaGGGGaa',
    'aaaaaaaGGGGGaaa',
    'aaGGGGGaaaaaaaG',
    'aGGGGGGGGGaaaaa',
    'aGaaaGGGGGGaaaG',
    'aaGGGGGGGaaaaaa',
    'aaaaGGGGGGGGaaa',
    'aaaGGGGaaaaGGaa',
    'aaaaGGGGGGGGGGa',
    'aaaaaaGGGGGGGaa',
    'aaGGGGGGGGaaaaa',
    'aaaGGGaaaaaaaGG',
  ],
  floor: [
    'dddddddddddddddd',
    'dggddggddggddggd',
    'dggddggddggddggd',
    'dddddddddddddddd',
    'ddggddggddggddgg',
    'ddggddggddggddgg',
    'dddddddddddddddd',
    'dggddggddggddggd',
    'dggddggddggddggd',
    'dddddddddddddddd',
    'ddggddggddggddgg',
    'ddggddggddggddgg',
    'dddddddddddddddd',
    'dggddggddggddggd',
    'dggddggddggddggd',
    'dddddddddddddddd',
  ],
  wall: [
    'kkkkkkkkkkkkkkkk',
    'kmmmmmmmmmmmmmmk',
    'kmmmmmmmmmmmmmmk',
    'kmmmmmmmmmmmmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmkkkkkkkkmmmk',
    'kmmmmmmmmmmmmmmk',
    'kmmmmmmmmmmmmmmk',
    'kkkkkkkkkkkkkkkk',
  ],
  water: [
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
  ],
  water_foam: [
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqwwqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqwwqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqwwqqqq',
    'qqqqqqqqqqqqqqqq',
    'qwwqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqwwqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
    'qqqwwqqqqqqqqqqq',
    'qqqqqqqqqqqqqqqq',
  ],
  tree: [
    '....tttttttt....',
    '..tttttttttttt..',
    '.ttttTTTTTTtttt.',
    'ttttTTTTTTTTttt.',
    'tttTTTTTTTTTTttt',
    'tttTTTTTTTTTTttt',
    'ttTTTTTTTTTTTTtt',
    'ttTTTTkTTTTTTTtt',
    'ttTTTTTTTTTTTTtt',
    '.tttTTTTTTTTttt.',
    '.ttttTTTTTTtttt.',
    '..ttttTTTTtttt..',
    '....uuuuuuuu....',
    '....uUUUUUUu....',
    '....uUUUUUUu....',
    '....uuuuuuuu....',
  ],
  flower: [
    'aaaaaaaaaaaaaaaa',
    'aaGGaaaGGGaaaaaa',
    'aGGGGaaGGGaaGGaa',
    'aaaaGGGGGGaGGGaa',
    'aaGGaaGGGGGGGGaa',
    'aGGGGGGGGGGGGGaa',
    'aaaaaGGGGGGGGaaa',
    'aaGGGGGGGGGGGaaa',
    'aGGGGGGGGGGGaaaa',
    'aaaaGGGGGGGGaaaa',
    'aaGGGGGGGGGGaaaa',
    'aGGGGGGGGGGaaaaa',
    'aaaaGGGGGGGaaaaa',
    'aaGGGGGGGGGGaaaa',
    'aGGGGGGGGGGaaaaa',
    'aaaaGGGGGGGaaaaa',
  ],
  rock: [
    '........kk......',
    '......kkkkkk....',
    '.....kgggggk....',
    '....kgggggggk...',
    '...kgggggggggk..',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '..kgggggggggggk.',
    '...kkkkkkkkkk...',
    '....kk....kk....',
    '................',
    '................',
  ],
  path: [
    'uuuuuuuuuuuuuuuu',
    'uuuuuuuuuuuuuuuu',
    'uuuuuuuuuuuuuuuu',
    'uuuUuuuuuuuuuuuu',
    'uuuuuuuuUuuuuuuu',
    'uuuuuuuuuuuuuuuu',
    'uuuuuuUuuuuuuuuu',
    'uUuuuuuuuuuuuuuu',
    'uuuuuuuuuuuuUuuu',
    'uuuuuuUuuuuuuuuu',
    'uuuuuuuuuuuuuuuu',
    'uuuuuuuuuuUuuuuu',
    'uuUuuuuuuuuuuuuu',
    'uuuuuuuuuuuuuuuu',
    'uuuuuuUuuuuuuuuu',
    'uuuuuuuuuuuuuuuu',
  ],
  bridge: [
    'kkkkkkkkkkkkkkkk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kUuUuUuUuUuUuUuk',
    'kuuuuuuuuuuuuuuk',
    'kkkkkkkkkkkkkkkk',
  ],
  door: [
    'kkkkkkkkkkkkkkkk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kyyyyyyyyyyyyyyk',
    'kkkkkkkkkkkkkkkk',
  ],
  chest: [
    '................',
    '..kkkkkkkkkkkk..',
    '.kYYYYYYYYYYYYk.',
    '.kYkkkkkkkkkkYk.',
    '.kYkxxxxxxxxkYk.',
    '.kYkxxxxxxxxkYk.',
    '.kYkxxxxxxxxkYk.',
    '.kYkxxxxxxxxkYk.',
    '.kYkkkkkkkkkkYk.',
    '.kYYYYYYYYYYYYk.',
    '.kyyyyyyyyyyyyk.',
    '.kkkkkkkkkkkkkk.',
    '..kkkkkkkkkkkk..',
    '..kk........kk..',
    '................',
    '................',
  ],
  sign: [
    '................',
    '......uuuu......',
    '.....uuuuuu.....',
    '.....uyyuUu.....',
    '.....uuyuUu.....',
    '.....uyyyUu.....',
    '.....uuuuuu.....',
    '......uuuu......',
    '.......uu.......',
    '.......uu.......',
    '.......uu.......',
    '.......uu.......',
    '.......uu.......',
    '................',
    '................',
    '................',
  ],
  craft: [
    '................',
    '.....kkkk.......',
    '....kggggk......',
    '...kggggggk.....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kggggggggk....',
    '..kkkkkkkkkk....',
    '..kk....kk......',
    '..kk....kk......',
    '................',
    '................',
  ],
  shop: [
    '................',
    '.kkkkkkkkkkkkk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuyyuUuuuk..',
    '.kuuuyyUuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kuuuuuuuuuuuk..',
    '.kkkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ],
  waystone: [
    '................',
    '......kkkk......',
    '.....kYYYYk.....',
    '....kYYYYYYk....',
    '....kYYkkYYk....',
    '....kYYkkYYk....',
    '....kYYYYYYk....',
    '.....kYYYYk.....',
    '......kkkk......',
    '......kqqk......',
    '......kqqk......',
    '......kqqk......',
    '......kqqk......',
    '......kqqk......',
    '......kkkk......',
    '................',
  ],
  save: [
    '................',
    '................',
    '..kkkkkkkkkk....',
    '..kYYYYYYYYk....',
    '..kYyYYYYYk.....',
    '..kYYyYYYk......',
    '..kYYYyYk.......',
    '..kYYYYYk.......',
    '..kYYYYYk.......',
    '..kYYYYYk.......',
    '..kYYYYYk.......',
    '..kYYYYYk.......',
    '..kkkkkkkk......',
    '................',
    '................',
    '................',
  ],
  stairs_down: [
    'kkkkkkkkkkkkkkkk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuUuk',
    'kuuuuuuuuuuUuuuk',
    'kuuuuuuuuUuuuuuk',
    'kuuuuuuUuuuuuuuk',
    'kuuuuUuuuuuuuuuk',
    'kuuUuuuuuuuuuuuk',
    'kUuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kuuuuuuuuuuuuuuk',
    'kyyyyyyyyyyyyyyk',
    'kkkkkkkkkkkkkkkk',
  ],
  boss: [
    '................',
    '................',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '..rrkkrrrrkkrr..',
    '..rrkrrrrrrkrr..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '...rrrrrrrrrr...',
    '....rrrrrrrr....',
    '.....rrrrrr.....',
    '................',
    '................',
    '................',
  ],
};

const TILE_SPRITES = {};
function getTileSprite(tileType) {
  const key = 'tile_' + tileType;
  if (!_spriteCache[key]) {
    // Water gets two frames for animation
    if (tileType === 'water') {
      const frameA = makeSprite(TILE_SPRITE_ROWS.water, 2);
      const frameB = makeSprite(TILE_SPRITE_ROWS.water_foam, 2);
      _spriteCache[key] = { a: frameA, b: frameB };
    } else {
      _spriteCache[key] = makeSprite(TILE_SPRITE_ROWS[tileType] || TILE_SPRITE_ROWS.grass, 2);
    }
  }
  return _spriteCache[key];
}

// Map tile enum -> sprite key
const TILE_SPRITE_MAP = {
  0: 'floor',       // FLOOR
  1: 'wall',        // WALL
  2: 'tree',        // TREE
  3: 'water',       // WATER
  4: 'door',        // DOOR
  5: 'chest',       // CHEST
  6: 'floor',       // NPC (drawn separately)
  7: 'sign',        // SIGN
  8: 'stairs_down', // STAIRS_DOWN
  9: 'floor',       // STAIRS_UP
  10: 'floor',      // CHEST_OPEN
  11: 'craft',      // CRAFT
  12: 'shop',       // SHOP
  13: 'boss',       // BOSS
  14: 'waystone',   // WAYSTONE
  15: 'save',       // SAVE
  16: 'grass',      // GRASS
  17: 'flower',     // FLOWER
  18: 'rock',       // ROCK
  19: 'bridge',     // BRIDGE
  20: 'path',       // PATH
  21: 'door',       // DOOR_LOCK
  22: 'floor',      // VOID
};