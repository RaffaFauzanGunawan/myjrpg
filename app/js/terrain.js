// ============================================================
// terrain.js — dunia voxel open-world
//   * peta bioma + heightmap deterministik (seed)
//   * meshing per-chunk dengan face culling
//   * chunk streaming: hanya render chunk dekat pemain
// ============================================================
import * as THREE from 'three';
import { CFG, BIOME, TILE_PALETTES, makeNoise } from './config.js';

const S = CFG.WORLD_SIZE;
const CS = CFG.CHUNK_SIZE;
const SEED = 1337;

export class World {
  constructor(engine, opts = {}) {
    this.engine = engine;
    this.size = S; // ukuran dunia (publik)
    this.protected = opts.protected || []; // titik yang harus bebas pohon/bangunan
    this.n1 = makeNoise(SEED + 1);
    this.n2 = makeNoise(SEED + 2);
    this.n3 = makeNoise(SEED + 3);

    // data dunia
    this.height = new Uint8Array(S * S);      // tinggi blok solid teratas
    this.biome = new Uint8Array(S * S);       // bioma per tile
    this.block = new Uint8Array(S * S * (CFG.MAX_HEIGHT + 2)); // isi blok (0 = kosong, 1..n = tipe)
    this.decorations = [];                    // hiasan dunia (batu, semak, bunga)

    // cache warna per-vertex
    this.chunks = new Map();   // key -> THREE.Mesh
    this.chunkGeo = new Map(); // key -> BufferGeometry (untuk dispose)

    this._generate();
    this._populate();
  }

  idx(x, z) { return z * S + x; }
  bIdx(x, y, z) { return (z * S + x) * (CFG.MAX_HEIGHT + 2) + y; }

  // ================= GENERASI =================
  _generate() {
    const cx = S / 2, cz = S / 2; // pusat kota
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const dx = (x - cx) / S, dz = (z - cz) / S;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // noise kontinental
        const cont = this.n1(x * 0.03, z * 0.03);
        const mount = this.n2(x * 0.05, z * 0.05);

        // bioma
        let bio;
        const inCity = Math.abs(x - cx) < 20 && Math.abs(z - cz) < 20;
        const southBeach = z > S - 14 && Math.abs(x - cx) > 24;
        const northSnow = z < S * 0.32 && x > cx;
        const eastAsh = x > S * 0.78 && z > S * 0.55;
        const westLake = x < S * 0.24 && z < S * 0.6;

        if (inCity) bio = BIOME.CITY;
        else if (southBeach) bio = BIOME.BEACH;
        else if (westLake && cont < 0.42) bio = BIOME.LAKE;
        else if (northSnow && mount > 0.45) bio = BIOME.SNOW;
        else if (eastAsh) bio = BIOME.ASH;
        else bio = BIOME.FOREST;

        // tinggi dasar
        let h;
        if (bio === BIOME.LAKE) h = CFG.SEA_LEVEL - 1;
        else if (bio === BIOME.SNOW) h = 7 + Math.round(mount * 4 + cont * 2);
        else if (bio === BIOME.ASH) h = 8 + Math.round(cont * 4 + Math.max(0, mount - 0.3) * 5);
        else if (bio === BIOME.BEACH) h = CFG.SEA_LEVEL + 1;
        else h = 6 + Math.round(cont * 3 + mount * 2);

        // kota diratakan
        if (bio === BIOME.CITY) h = 7;

        this.height[this.idx(x, z)] = Math.min(h, CFG.MAX_HEIGHT);
        this.biome[this.idx(x, z)] = bio;
      }
    }
  }

  // isi blok dunia: tanah, pohon, kristal, air, jalan, bangunan kota
  _populate() {
    const rng = makeNoise(SEED + 7); // reuse noise sebagai rng deterministik
    const pos = this.biome;

    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const i = this.idx(x, z);
        const bio = pos[i];
        const h = this.height[i];
        const top = bio === BIOME.LAKE ? CFG.SEA_LEVEL : h;

        // kolom blok
        for (let y = 0; y <= top; y++) {
          let t;
          const depth = top - y;
          if (bio === BIOME.SNOW && y > h - 2) t = 6;        // salju
          else if (bio === BIOME.ASH && y > h - 2) t = 7;    // abu
          else if (bio === BIOME.BEACH && y > h - 2) t = 8;  // pasir
          else if (bio === BIOME.LAKE && y < CFG.SEA_LEVEL) t = 10; // lumpur dasar danau
          else if (y === top) t = 1;                          // rumput
          else if (y > top - 4) t = 2;                        // tanah
          else t = 3;                                         // batu
          this.block[this.bIdx(x, y, z)] = t;
        }

        // air
        if (bio === BIOME.LAKE && h < CFG.SEA_LEVEL) {
          for (let y = h + 1; y <= CFG.SEA_LEVEL; y++) this.block[this.bIdx(x, y, z)] = 4; // air
        }

        // ---------- pohon & tumbuhan per bioma ----------
        const p = rng(x * 0.5, z * 0.5);
        const free = this._clearOfProtected(x, z, 3);
        if (bio === BIOME.FOREST && p > 0.76 && free) {
          this._addTree(x, z, top, 3 + Math.floor(p * 5), 9, 5); // pohon daun rimbun
        } else if (bio === BIOME.SNOW && p > 0.78 && free) {
          this._addPine(x, z, top);
        } else if (bio === BIOME.BEACH && p > 0.85 && free) {
          this._addPalm(x, z, top);
        } else if (bio === BIOME.ASH && p > 0.84 && free) {
          this._addDeadTree(x, z, top, p);
        }

        // kristal di pegunungan salju & batu di ashlands
        if (bio === BIOME.SNOW && p > 0.9) this.block[this.bIdx(x, top + 1, z)] = 11;
        if (bio === BIOME.ASH && p > 0.87) this.block[this.bIdx(x, top + 1, z)] = 3;
      }
    }

    // jalan utama (menghapus pohon di atasnya)
    this._buildRoads();
    // kota: kastil, rumah, tembok keliling, plaza
    this._buildCity();

    // hiasan dunia (dipakai mesin entitas) — batu/semak/bunga
    for (let z = 0; z < S; z++) {
      for (let x = 0; x < S; x++) {
        const i = this.idx(x, z);
        const bio = pos[i];
        const h = this.height[i];
        if (bio === BIOME.LAKE || bio === BIOME.CITY) continue;
        const top = bio === BIOME.LAKE ? CFG.SEA_LEVEL : h;
        if (this.block[this.bIdx(x, top, z)] === 14) continue; // jangan di jalan
        const dy = rng(x * 3.7, z * 3.7);
        const decY = bio === BIOME.LAKE ? CFG.SEA_LEVEL : h;
        if (dy > 0.93) this.decorations.push({ x, z, y: decY + 1, type: 'rock' });
        else if (dy > 0.86) this.decorations.push({ x, z, y: decY + 1, type: 'bush' });
        else if (dy > 0.79) this.decorations.push({ x, z, y: decY + 1, type: rng(x, z) > 0.5 ? 'flower1' : 'flower2' });
      }
    }
  }

  // ================= BANGUNAN & JALAN =================
  _set(x, y, z, t) { if (y <= CFG.MAX_HEIGHT && x >= 0 && z >= 0 && x < S && z < S) this.block[this.bIdx(x, y, z)] = t; }

  _clearOfProtected(x, z, r) {
    for (const pt of this.protected) {
      if (Math.abs(pt.x - x) <= r && Math.abs(pt.z - z) <= r) return false;
    }
    return true;
  }

  // pohon daun (hutan)
  _addTree(x, z, top, treeH, leafType, trunkType) {
    if (x < 2 || z < 2 || x > S - 3 || z > S - 3) return;
    const canopyY = top + treeH - 1;
    if (canopyY + 1 > CFG.MAX_HEIGHT) return;
    for (let y = top + 1; y <= top + treeH - 2; y++) this._set(x, y, z, trunkType);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue;
          const lx = x + dx, ly = canopyY + dy, lz = z + dz;
          if (ly > CFG.MAX_HEIGHT) continue;
          if (!this.block[this.bIdx(lx, ly, lz)]) this._set(lx, ly, lz, leafType);
        }
      }
    }
  }

  // pohon pinus (pegunungan salju) — tinggi adaptif agar muat di puncak
  _addPine(x, z, top) {
    if (x < 2 || z < 2 || x > S - 3 || z > S - 3) return;
    const trunkMax = Math.min(top + 3, CFG.MAX_HEIGHT);
    if (trunkMax <= top) return;
    for (let y = top + 1; y <= trunkMax; y++) this._set(x, y, z, 5);
    const f1 = trunkMax + 1;
    if (f1 <= CFG.MAX_HEIGHT) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (!this.block[this.bIdx(x + dx, f1, z + dz)]) this._set(x + dx, f1, z + dz, 15);
        }
      }
    }
    if (f1 + 1 <= CFG.MAX_HEIGHT) this._set(x, f1 + 1, z, 15);
  }

  // pohon kelapa (pantai)
  _addPalm(x, z, top) {
    if (x < 2 || z < 2 || x > S - 3 || z > S - 3) return;
    if (top + 4 > CFG.MAX_HEIGHT) return;
    for (let y = top + 1; y <= top + 2; y++) this._set(x, y, z, 5);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) + Math.abs(dz) === 2) continue;
        if (!this.block[this.bIdx(x + dx, top + 3, z + dz)]) this._set(x + dx, top + 3, z + dz, 9);
      }
    }
    this._set(x, top + 4, z, 9);
  }

  // pohon mati (ashlands)
  _addDeadTree(x, z, top, p) {
    if (x < 2 || z < 2 || x > S - 3 || z > S - 3) return;
    const h2 = 2 + Math.floor(p * 10) % 3;
    if (top + h2 + 1 > CFG.MAX_HEIGHT) return;
    for (let y = top + 1; y <= top + h2; y++) this._set(x, y, z, 16);
    const by = top + h2 - 1;
    if (!this.block[this.bIdx(x + 1, by, z)]) this._set(x + 1, by, z, 16);
    if (!this.block[this.bIdx(x - 1, by, z)]) this._set(x - 1, by, z, 16);
  }

  // jalan batu: warna permukaan jadi path, bersihkan blok di atasnya
  _stampPath(x, z) {
    if (x < 1 || z < 1 || x >= S - 1 || z >= S - 1) return;
    if (this.biome[this.idx(x, z)] === BIOME.LAKE) return;
    const h = this.height[this.idx(x, z)];
    for (let y = h + 1; y <= CFG.MAX_HEIGHT; y++) this.block[this.bIdx(x, y, z)] = 0;
    this.block[this.bIdx(x, h, z)] = 14;
    // tebangi pohon di sekitar jalan supaya koridor terlihat jelas
    this._clearVeg(x, z);
  }

  // hapus pohon/semak (blok vegetasi) di tile dan 4 tetangganya, di atas tanah
  _clearVeg(x, z) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const nx = x + dx, nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= S || nz >= S) continue;
        const h = this.height[this.idx(nx, nz)];
        for (let y = h + 1; y <= CFG.MAX_HEIGHT; y++) {
          const i = this.bIdx(nx, y, nz);
          const t = this.block[i];
          if (t === 5 || t === 9 || t === 15 || t === 16) this.block[i] = 0;
        }
      }
    }
  }

  // jalan utama kota + menuju pantai
  _buildRoads() {
    const c = S / 2; // 96
    for (let z = 78; z <= 182; z++) { this._stampPath(c - 1, z); this._stampPath(c, z); this._stampPath(c + 1, z); }
    for (let x = 64; x <= 130; x++) { this._stampPath(x, c - 1); this._stampPath(x, c); this._stampPath(x, c + 1); }
    // plaza waystone di pusat kota
    for (let x = 90; x <= 102; x++) {
      for (let z = 90; z <= 102; z++) {
        if (Math.abs(x - c) <= 2 || Math.abs(z - c) <= 2) this._stampPath(x, z);
      }
    }
  }

  // kota: kastil + tembok keliling + rumah-rumah
  _buildCity() {
    const C0 = 77, C1 = 115, H = 7;
    // kastil di selatan-tengah (gerbang selatan di jalan utama)
    this._buildCastle(89, 102, 102, 113, H);
    // tembok keliling kota dengan 4 gerbang di jalan
    for (let x = C0; x <= C1; x++) {
      for (let z = C0; z <= C1; z++) {
        const edge = x === C0 || x === C1 || z === C0 || z === C1;
        if (!edge) continue;
        const gate = (Math.abs(x - 96) <= 1 && (z === C0 || z === C1)) || (Math.abs(z - 96) <= 1 && (x === C0 || x === C1));
        if (gate) continue;
        for (let y = H + 1; y <= H + 2; y++) this._set(x, y, z, 12);
        if ((x + z) % 2 === 0) this._set(x, H + 3, z, 12); // krenelasi
      }
    }
    // rumah-rumah di kisi, hindari NPC/peti/jalan/kastil
    const placed = [];
    for (let hx = C0 + 4; hx <= C1 - 4; hx += 7) {
      for (let hz = C0 + 4; hz <= C1 - 4; hz += 7) {
        if (placed.length >= 12) break;
        if (Math.abs(hx - 96) <= 4 || Math.abs(hz - 96) <= 4) continue;         // jalan
        if (hx >= 86 && hx <= 105 && hz >= 99 && hz <= 116) continue;           // kastil
        if (!this._clearOfProtected(hx, hz, 3)) continue;                       // NPC/peti/waystone
        if (placed.some(([px, pz]) => Math.abs(px - hx) <= 5 && Math.abs(pz - hz) <= 4)) continue; // bertumpuk
        this._buildHouse(hx, hz, H);
        placed.push([hx, hz]);
      }
    }
  }

  // rumah: 5x4, dinding 3 blok, pintu selatan, atap pelana
  _buildHouse(hx, hz, H) {
    const x0 = hx - 2, x1 = hx + 2, z0 = hz - 1, z1 = hz + 2;
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const edge = x === x0 || x === x1 || z === z0 || z === z1;
        if (!edge) continue;
        const door = z === z1 && x === hx;
        for (let y = H + 1; y <= H + 3; y++) if (!door) this._set(x, y, z, 12);
      }
    }
    // lantai dalam & atap
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      for (let z = z0 + 1; z <= z1 - 1; z++) this._set(x, H, z, 14);
    }
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) this._set(x, H + 4, z, 13);
      this._set(x, H + 5, z0 + 1, 13); // bubungan
    }
  }

  // kastil: dinding luar + menara sudut + benteng dalam + gerbang
  _buildCastle(x0, x1, z0, z1, H) {
    // halaman
    for (let x = x0 + 1; x < x1; x++) {
      for (let z = z0 + 1; z < z1; z++) this._set(x, H, z, 14);
    }
    // dinding luar 4 blok + krenelasi, gerbang di selatan (jalan utama)
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const edge = x === x0 || x === x1 || z === z0 || z === z1;
        if (!edge) continue;
        const gate = z === z1 && Math.abs(x - 96) <= 1;
        for (let y = H + 1; y <= H + 4; y++) if (!gate) this._set(x, y, z, 12);
        if (!gate && (x + z) % 2 === 0) this._set(x, H + 5, z, 12);
      }
    }
    // menara sudut
    for (const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (let y = H + 1; y <= H + 5; y++) this._set(tx + dx, y, tz + dz, 12);
        }
      }
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) this._set(tx + dx, H + 6, tz + dz, 13);
      this._set(tx, H + 7, tz, 13);
    }
    // benteng dalam
    const kx0 = x0 + 4, kx1 = x1 - 4, kz0 = z0 + 3, kz1 = z1 - 3;
    for (let x = kx0; x <= kx1; x++) {
      for (let z = kz0; z <= kz1; z++) {
        const edge = x === kx0 || x === kx1 || z === kz0 || z === kz1;
        if (!edge) continue;
        const door = z === kz0 && (x === 95 || x === 96);
        for (let y = H + 1; y <= H + 4; y++) if (!door) this._set(x, y, z, 12);
        if (!door && (x + z) % 2 === 0) this._set(x, H + 5, z, 12);
      }
    }
    // atap benteng
    for (let x = kx0 - 1; x <= kx1 + 1; x++) {
      for (let z = kz0 - 1; z <= kz1 + 1; z++) this._set(x, H + 5, z, 13);
    }
    for (let x = kx0; x <= kx1; x++) {
      for (let z = kz0; z <= kz1; z++) this._set(x, H + 6, z, 13);
    }
  }

  // ================= QUERIES =================
  heightAt(x, z) {
    x = Math.max(0, Math.min(S - 1, Math.round(x)));
    z = Math.max(0, Math.min(S - 1, Math.round(z)));
    return this.height[this.idx(x, z)];
  }

  solidAt(x, y, z) {
    if (y < 0) return true;
    if (x < 0 || z < 0 || x >= S || z >= S) return true;
    if (y > CFG.MAX_HEIGHT) return false;
    return this.block[this.bIdx(x, y, z)] !== 0;
  }

  // isi blok di satu titik (untuk tabrakan entitas)
  blockAt(x, y, z) {
    if (y < 0) return 1;
    if (x < 0 || z < 0 || x >= S || z >= S) return 1;
    if (y > CFG.MAX_HEIGHT) return 0;
    return this.block[this.bIdx(x, y, z)];
  }

  walkableAt(x, y, z) {
    // untuk player: berdiri di atas blok, tidak boleh masuk air dalam
    if (this.solidAt(x, y + 1, z)) return false;   // kepala kena blok
    const below = this.solidAt(x, y - 1, z) || this.solidAt(x, y - 2, z);
    return below;
  }

  // tinggi lantai pertama yang solid dari atas (untuk spawn entity)
  groundY(x, z) {
    const h = this.heightAt(x, z);
    const bio = this.biome[this.idx(Math.round(x), Math.round(z))];
    if (bio === BIOME.LAKE) return h + 1; // jangan spawn di danau
    return h + 1;
  }

  biomeAt(x, z) {
    x = Math.max(0, Math.min(S - 1, Math.round(x)));
    z = Math.max(0, Math.min(S - 1, Math.round(z)));
    return this.biome[this.idx(x, z)];
  }

  // ================= MESHING =================
  // warna blok dengan variasi acak deterministik
  _blockColor(t, x, y, z) {
    const palettes = {
      1: TILE_PALETTES.grass, 2: TILE_PALETTES.dirt, 3: TILE_PALETTES.stone,
      4: TILE_PALETTES.water, 5: TILE_PALETTES.wood, 6: TILE_PALETTES.snow,
      7: TILE_PALETTES.ash, 8: TILE_PALETTES.sand, 9: TILE_PALETTES.leaf,
      10: TILE_PALETTES.dirt, 11: TILE_PALETTES.crystal,
      12: TILE_PALETTES.wall, 13: TILE_PALETTES.roof, 14: TILE_PALETTES.path,
      15: TILE_PALETTES.snowLeaf, 16: TILE_PALETTES.dirt,
    };
    const pal = palettes[t] || TILE_PALETTES.stone;
    // variasi halus berdasarkan posisi (deterministik)
    const v = ((x * 7 + z * 13 + y * 3) % pal.length + pal.length) % pal.length;
    return new THREE.Color(pal[v]);
  }

  // buat mesh untuk satu chunk
  _buildChunk(cx, cz) {
    const key = cx + ',' + cz;
    const x0 = cx * CS, z0 = cz * CS;
    const positions = [], colors = [], normals = [], indices = [];
    let vertCount = 0;
    const dirs = [
      { d: [1, 0, 0], n: [1, 0, 0] }, { d: [-1, 0, 0], n: [-1, 0, 0] },
      { d: [0, 1, 0], n: [0, 1, 0] }, { d: [0, -1, 0], n: [0, -1, 0] },
      { d: [0, 0, 1], n: [0, 0, 1] }, { d: [0, 0, -1], n: [0, 0, -1] },
    ];

    for (let x = x0; x < x0 + CS; x++) {
      for (let z = z0; z < z0 + CS; z++) {
        for (let y = 0; y <= CFG.MAX_HEIGHT; y++) {
          const t = this.block[this.bIdx(x, y, z)];
          if (!t) continue;
          const c = this._blockColor(t, x, y, z);

          for (const { d, n } of dirs) {
            const nx = x + d[0], ny = y + d[1], nz = z + d[2];
            if (!this.solidAt(nx, ny, nz)) {
              // air: hanya tampilkan sisi atas (semi-transparan ditangani renderer? kita buat warna solid)
              const base = positions.length / 3;
              const s = 1;
              // empat sudut kubus pada sisi d
              let corners;
              if (d[0] !== 0) {
                const px = x + (d[0] > 0 ? s : 0);
                corners = [
                  [px, y, z], [px, y, z + s], [px, y + s, z + s], [px, y + s, z],
                ];
              } else if (d[1] !== 0) {
                const py = y + (d[1] > 0 ? s : 0);
                corners = [
                  [x, py, z], [x + s, py, z], [x + s, py, z + s], [x, py, z + s],
                ];
              } else {
                const pz = z + (d[2] > 0 ? s : 0);
                corners = [
                  [x, y, pz], [x + s, y, pz], [x + s, y + s, pz], [x, y + s, pz],
                ];
              }
              // pastikan orientasi CCW menghadap keluar (normal poligon searah n),
              // kalau tidak, balik urutan sudut supaya sisi tidak ter-cull.
              const p0 = corners[0], p1 = corners[1], p2 = corners[2];
              const wx = (p1[1] - p0[1]) * (p2[2] - p0[2]) - (p1[2] - p0[2]) * (p2[1] - p0[1]);
              const wy = (p1[2] - p0[2]) * (p2[0] - p0[0]) - (p1[0] - p0[0]) * (p2[2] - p0[2]);
              const wz = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
              if (wx * n[0] + wy * n[1] + wz * n[2] < 0) corners.reverse();
              for (const cc of corners) {
                positions.push(cc[0], cc[1], cc[2]);
                colors.push(c.r, c.g, c.b);
                normals.push(n[0], n[1], n[2]);
              }
              // dua segitiga
              const a = base;
              indices.push(a, a + 1, a + 2, a, a + 2, a + 3);
              vertCount += 4;
            }
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    // vertex memakai koordinat dunia absolut; mesh di origin
    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return { mesh, geo };
  }

  // ================= CHUNK STREAMING =================
  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / CS), pcz = Math.floor(playerZ / CS);
    const r = CFG.RENDER_RADIUS;
    const want = new Set();
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (cx < 0 || cz < 0 || cx >= S / CS || cz >= S / CS) continue;
        const key = cx + ',' + cz;
        want.add(key);
        if (!this.chunks.has(key)) {
          const { mesh, geo } = this._buildChunk(cx, cz);
          this.engine.scene.add(mesh);
          this.chunks.set(key, mesh);
          this.chunkGeo.set(key, geo);
        }
      }
    }
    // buang chunk jauh
    for (const [key, mesh] of this.chunks) {
      if (!want.has(key)) {
        this.engine.scene.remove(mesh);
        this.chunkGeo.get(key).dispose();
        this.chunkGeo.delete(key);
        this.chunks.delete(key);
      }
    }
  }
}