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
  constructor(engine) {
    this.engine = engine;
    this.size = S; // ukuran dunia (publik)
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
        else if (bio === BIOME.SNOW) h = 9 + Math.round(mount * 7 + cont * 3);
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

  // isi blok dunia: tanah, pohon, kristal, air
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

        // pohon di hutan (jarang)
        const p = rng(x * 0.5, z * 0.5);
        if (bio === BIOME.FOREST && p > 0.78 && x > 2 && z > 2 && x < S - 3 && z < S - 3) {
          const treeH = 4 + Math.floor(p * 10);
          const canopyY = top + treeH - 1;
          if (canopyY <= CFG.MAX_HEIGHT) {
            for (let y = top + 1; y <= top + treeH - 2; y++) this.block[this.bIdx(x, y, z)] = 5; // batang kayu
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                  if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 2) continue;
                  const lx = x + dx, ly = canopyY + dy, lz = z + dz;
                  if (lx > 0 && lz > 0 && lx < S - 1 && lz < S - 1 && ly <= CFG.MAX_HEIGHT
                      && !this.block[this.bIdx(lx, ly, lz)]) {
                    this.block[this.bIdx(lx, ly, lz)] = 9; // daun
                  }
                }
              }
            }
          }
        }

        // kristal di pegunungan salju
        if (bio === BIOME.SNOW && p > 0.9) this.block[this.bIdx(x, top + 1, z)] = 11;
        // batu di ashlands
        if (bio === BIOME.ASH && p > 0.87) this.block[this.bIdx(x, top + 1, z)] = 3;

        // hiasan dunia (dipakai mesin entitas) — batu/semak/bunga
        if (bio !== BIOME.LAKE && bio !== BIOME.CITY) {
          const dy = rng(x * 3.7, z * 3.7);
          const decY = bio === BIOME.LAKE ? CFG.SEA_LEVEL : h;
          if (dy > 0.93) this.decorations.push({ x, z, y: decY + 1, type: 'rock' });
          else if (dy > 0.86) this.decorations.push({ x, z, y: decY + 1, type: 'bush' });
          else if (dy > 0.79) this.decorations.push({ x, z, y: decY + 1, type: rng(x, z) > 0.5 ? 'flower1' : 'flower2' });
        }
      }
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