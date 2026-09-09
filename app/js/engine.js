// ============================================================
// engine.js — renderer Three.js, kamera, siklus siang-malam,
//             input keyboard/mouse, efek suara WebAudio
// ============================================================
import * as THREE from 'three';
import { CFG } from './config.js';
const SKY_DAY = CFG.SKY_DAY, SKY_DUSK = CFG.SKY_DUSK, SKY_NIGHT = CFG.SKY_NIGHT;
const FOG_DAY = CFG.FOG_DAY, FOG_NIGHT = CFG.FOG_NIGHT;

export class Engine {
  constructor(container) {
    this.container = container;

    // ---- renderer ----
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // ---- scene & kamera ----
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY_DAY);
    this.scene.fog = new THREE.Fog(FOG_DAY, 40, 120);
    this.camera = new THREE.PerspectiveCamera(58, container.clientWidth / container.clientHeight, 0.1, 400);

    // ---- lights ----
    this.sun = new THREE.DirectionalLight(0xfff2d9, 1.25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 2;
    this.sun.shadow.camera.far = 60;
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -28; sc.right = sc.top = 28;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.ambient = new THREE.AmbientLight(0x8899bb, 0.55);
    this.scene.add(this.ambient);

    // ---- langit: matahari / bulan / bintang ----
    this.sky = new THREE.Group();
    this.scene.add(this.sky);
    this.sunSprite = this._makeGlowSprite(0xffe9a8, 2.2);
    this.moonSprite = this._makeGlowSprite(0xd8e8ff, 1.6);
    this.sky.add(this.sunSprite, this.moonSprite);
    this.stars = this._makeStars(220);
    this.sky.add(this.stars);
    this.clouds = this._makeClouds(14);
    this.scene.add(this.clouds);

    // ---- input ----
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, lastX: 0, lastY: 0 };

    // ---- kamera orbit ----
    this.camYawOffset = 0;     // geser kamera oleh drag mouse (kembali pelan ke 0)
    this.camPitch = 1.02;      // tilt (rad), besar = lebih top-down
    this.camDist = CFG.CAMERA_DIST;
    this._bindInput();

    // ---- audio ----
    this.audio = this._makeAudio();

    // ---- resize ----
    window.addEventListener('resize', () => this.resize());
  }

  // ---------- langit ----------
  _makeGlowSprite(colorHex, scale) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#' + colorHex.toString(16).padStart(6, '0'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false }));
    s.scale.set(scale * 4, scale * 4, 1);
    return s;
  }

  _makeStars(count) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 1.4 - 0.4);
      const r = 160;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false, transparent: true, opacity: 0 });
    return new THREE.Points(geo, m);
  }

  _makeClouds(n) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, fog: false });
    for (let i = 0; i < n; i++) {
      const cloud = new THREE.Group();
      const k = 2 + Math.random() * 3;
      for (let j = 0; j < k; j++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random() * 3, 1, 2 + Math.random() * 2), mat);
        b.position.set(j * 2.6 - k * 1.3 + Math.random(), Math.random() * 0.5, Math.random() * 2);
        cloud.add(b);
      }
      cloud.position.set(Math.random() * 200 - 100, 24 + Math.random() * 6, Math.random() * 200 - 100);
      cloud.userData.speed = 0.35 + Math.random() * 0.4;
      group.add(cloud);
    }
    return group;
  }

  // ---------- siklus siang-malam ----------
  // t = 0..1 (0 = tengah malam, 0.25 = subuh, 0.5 = siang, 0.75 = senja)
  updateSky(t) {
    const day = t;
    // posisi matahari & bulan
    const sunAngle = (day - 0.25) * Math.PI * 2;
    const moonAngle = (day - 0.75) * Math.PI * 2;
    this.sunSprite.position.set(Math.cos(sunAngle) * 70, Math.sin(sunAngle) * 70, -20);
    this.moonSprite.position.set(Math.cos(moonAngle) * 70, Math.sin(moonAngle) * 70, 20);

    // warna langit: lerp antara malam / subuh / siang / senja
    const c = new THREE.Color();
    const dayC = new THREE.Color(SKY_DAY);
    const duskC = new THREE.Color(SKY_DUSK);
    const nightC = new THREE.Color(SKY_NIGHT);
    if (day < 0.25) c.lerpColors(nightC, duskC, day / 0.25);
    else if (day < 0.5) c.lerpColors(duskC, dayC, (day - 0.25) / 0.25);
    else if (day < 0.75) c.lerpColors(dayC, duskC, (day - 0.5) / 0.25);
    else c.lerpColors(duskC, nightC, (day - 0.75) / 0.25);
    this.scene.background.copy(c);
    const fogC = day > 0.3 && day < 0.72 ? FOG_DAY : FOG_NIGHT;
    this.scene.fog.color.setHex(fogC);

    // intensitas cahaya
    const dayLight = Math.max(0, Math.sin(sunAngle));
    const moonLight = Math.max(0, Math.sin(moonAngle)) * 0.25;
    this.sun.intensity = 0.35 + dayLight * 1.1;
    this.ambient.intensity = 0.25 + (dayLight + moonLight) * 0.5;
    this.sun.color.setHex(dayLight > 0.1 ? 0xfff2d9 : 0x8899bb);

    // bintang
    this.stars.material.opacity = Math.max(0, 1 - dayLight * 2.2);
    // matahari/bulan nyala
    this.sunSprite.material.opacity = Math.max(0.15, dayLight);
    this.moonSprite.material.opacity = Math.max(0.12, moonLight * 3);
    this.sunSprite.material.visible = true;
    this.moonSprite.material.visible = true;

    // cahaya matahari mengikuti kamera (untuk shadow dekat player)
    const cam = this.camera.position;
    this.sun.position.set(cam.x + Math.cos(sunAngle) * 40, cam.y + Math.sin(sunAngle) * 40 + 15, cam.z);
    this.sun.target.position.copy(cam);
  }

  // ---------- kamera mengikuti target ----------
  // yaw = arah hadap pemain (rad). Kamera otomatis di belakang pemain,
  // dengan geser manual (camYawOffset) + zoom (camDist) + tilt (camPitch).
  follow(target, dt, yaw) {
    const yawCam = (yaw != null ? yaw : 0) + Math.PI + this.camYawOffset;
    // sinyal balik lembut agar kamera tidak kaku saat pemain diam
    this.camYawOffset *= Math.pow(0.35, dt);
    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
    const ax = Math.sin(yawCam) * cp;
    const ay = sp;
    const az = Math.cos(yawCam) * cp;
    const dist = this.camDist;
    const py = target.y + 1.0;
    const want = new THREE.Vector3(
      target.x + ax * dist,
      py + ay * dist,
      target.z + az * dist
    );
    // cegah kamera masuk ke bawah tanah
    want.y = Math.max(want.y, target.y + 1.2);
    this.camera.position.lerp(want, 1 - Math.pow(0.0001, dt));
    this.camera.lookAt(target.x, py, target.z);
  }

  // putar kamera (drag mouse): dx/dy dalam pixel
  orbit(dx, dy) {
    this.camYawOffset -= dx * 0.006;
    this.camPitch = Math.max(0.35, Math.min(1.35, this.camPitch + dy * 0.004));
  }

  // zoom (scroll): d > 0 mendekat
  zoom(d) {
    this.camDist = Math.max(5, Math.min(18, this.camDist + d));
  }

  // ---------- input ----------
  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      // jangan scroll halaman dengan spasi/panah
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    this.container.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.x = e.clientX; this.mouse.y = e.clientY;
        this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY;
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.mouse.down) {
        this.orbit(e.clientX - this.mouse.lastX, e.clientY - this.mouse.lastY);
        this.mouse.lastX = e.clientX; this.mouse.lastY = e.clientY;
      }
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    window.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY > 0 ? 1.2 : -1.2); }, { passive: false });
    window.addEventListener('blur', () => this.keys.clear());
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() { this.renderer.render(this.scene, this.camera); }

  // ---------- audio (WebAudio sederhana) ----------
  _makeAudio() {
    let ctx = null;
    const ensure = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const tone = (freq, dur, type = 'square', vol = 0.14, slide = 0) => {
      try {
        const ac = ensure();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
        g.gain.setValueAtTime(vol, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
        o.connect(g).connect(ac.destination);
        o.start(); o.stop(ac.currentTime + dur);
      } catch { /* audio butuh interaksi user — abaikan */ }
    };
    return {
      blip: () => tone(660, 0.08, 'square', 0.08),
      encounter: () => { tone(220, 0.18, 'sawtooth', 0.14, -90); setTimeout(() => tone(180, 0.2, 'sawtooth', 0.12, -70), 140); },
      hit: () => tone(140, 0.12, 'square', 0.16, -60),
      crit: () => { tone(500, 0.1, 'square', 0.14, 300); setTimeout(() => tone(760, 0.12, 'square', 0.12, 200), 70); },
      hurt: () => tone(120, 0.2, 'sawtooth', 0.16, -40),
      heal: () => { tone(520, 0.12, 'sine', 0.12); setTimeout(() => tone(700, 0.14, 'sine', 0.11), 90); },
      victory: () => { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'square', 0.12), i * 120)); },
      levelup: () => { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 90)); },
      open: () => tone(880, 0.09, 'square', 0.1, 200),
    };
  }
}