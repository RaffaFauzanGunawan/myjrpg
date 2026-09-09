// ============================================================
// worldfx.js — hiasan dunia (batu/semak/bunga) + partikel ambience
//   supaya dunia terasa hidup, tidak kosong & kaku
//   Hiasan di-merge jadi SATU geometry (vertex colors) agar
//   ribuan objek tidak membunuh FPS.
// ============================================================
import * as THREE from 'three';
import { BIOME } from './config.js';

const T = THREE;

// ---------- hiasan dunia (satu draw call) ----------
export function buildDecorations(world, engine) {
  const positions = [], colors = [], normals = [], indices = [];
  let base = 0;

  const pushBox = (w, h, d, colorHex, x, y, z, ry) => {
    const g = new T.BoxGeometry(w, h, d);
    const c = new T.Color(colorHex);
    const q = new T.Quaternion().setFromEuler(new T.Euler(0, ry || 0, 0));
    g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), q, new T.Vector3(1, 1, 1)));
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      positions.push(p[i], p[i + 1], p[i + 2]);
      colors.push(c.r, c.g, c.b);
      normals.push(n[i], n[i + 1], n[i + 2]);
    }
    const ind = g.index.array;
    for (let i = 0; i < ind.length; i++) indices.push(ind[i] + base);
    base += p.length / 3;
    g.dispose();
  };

  for (const d of world.decorations) {
    const rot = (d.x * 11 + d.z * 3) % 6;
    if (d.type === 'rock') {
      pushBox(0.9, 0.55, 0.8, '#9aa0aa', d.x, d.y + 0.1, d.z, (d.x * 7 + d.z * 13) % 3);
      pushBox(0.6, 0.35, 0.5, '#8a909a', d.x + 0.25, d.y + 0.28, d.z - 0.15, rot);
    } else if (d.type === 'bush') {
      pushBox(1.0, 0.7, 1.0, '#2f6b2f', d.x, d.y + 0.35, d.z, 0);
      pushBox(0.7, 0.55, 0.7, '#3a7a35', d.x + 0.3, d.y + 0.62, d.z + 0.1, rot * 0.5);
    } else if (d.type === 'flower1' || d.type === 'flower2') {
      pushBox(0.08, 0.5, 0.08, '#3a7a2f', d.x, d.y + 0.25, d.z, 0);
      pushBox(0.3, 0.3, 0.08, d.type === 'flower1' ? '#e74c8b' : '#f1c40f', d.x, d.y + 0.55, d.z, rot);
    }
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();

  const mesh = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true }));
  mesh.castShadow = true;
  engine.scene.add(mesh);
  return mesh;
}

// ---------- partikel ambience ----------
// Daun gugur di hutan, salju di gunung, abu di ashlands, kunang-kunang malam
export class AmbientFX {
  constructor(engine, count = 140) {
    this.engine = engine;
    this.N = count;
    this.pos = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.seed = new Float32Array(count);
    for (let i = 0; i < count; i++) this.seed[i] = Math.random();

    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(this.pos, 3));
    const mat = new T.PointsMaterial({
      color: 0x3a7a2f, size: 0.22, transparent: true, opacity: 0.85,
      depthWrite: false, sizeAttenuation: true,
    });
    this.points = new T.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene = engine.scene;
    this.scene.add(this.points);
  }

  _reset(i, px, py, pz) {
    const r = 13;
    this.pos[i * 3] = px + (this.seed[i] * 2 - 1) * r;
    this.pos[i * 3 + 1] = py + 3 + this.seed[(i + 2) % this.N] * 8;
    this.pos[i * 3 + 2] = pz + (this.seed[(i + 1) % this.N] * 2 - 1) * r;
    this.life[i] = 3 + this.seed[i] * 5;
  }

  update(dt, biome, playerPos) {
    if (!playerPos) return;
    const px = playerPos.x, py = playerPos.y + 2, pz = playerPos.z;

    const isSnow = biome === BIOME.SNOW;
    const isAsh = biome === BIOME.ASH;
    const isLake = biome === BIOME.LAKE;
    const night = this.engine.scene.background.getHex() < 0x404060;

    let color = isSnow ? 0xf0f6ff : isAsh ? 0x5a4a42 : 0x3a7a2f;
    let fall = 2.2, drift = 1.2, sway = 0.4;
    if (isAsh) { color = 0x6a5a4a; fall = 1.0; drift = 2.2; }
    if (isLake) { color = 0x8fd0e8; fall = 0; drift = 0.8; }
    if (night && !isSnow && !isAsh) { color = 0xffe08a; fall = 0.15; drift = 0.5; }
    this.points.material.color.setHex(color);

    for (let i = 0; i < this.N; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this._reset(i, px, py, pz); continue; }
      const i3 = i * 3;
      this.pos[i3] += (Math.sin(this.seed[i] * 40 + this.life[i] * 2) * sway + (this.seed[i] - 0.5) * drift) * dt;
      this.pos[i3 + 1] -= fall * dt;
      this.pos[i3 + 2] += (Math.cos(this.seed[i] * 30 + this.life[i] * 2) * sway + (this.seed[i] - 0.5) * drift) * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}