# 👑 Chronicles of the Fallen Crown

A **JRPG Medieval Fantasy** game with deep narrative, **turn-based tactical combat**, and an **open voxel world**.

## 🎮 Versi Utama: 3D Pixel (app/)

Game dunia terbuka **voxel 3D pixel-art** (Three.js + JavaScript ES modules) — karakter, musuh, dan terrain dibangun dari kubus pixel, dengan siklus siang-malam, minimap, quest, toko, peti harta, dan battle JRPG turn-based.

```
app/
├── index.html          → kerangka UI
├── css/style.css       → gaya pixel-JRPG
└── js/
    ├── config.js       → SEMUA konstanta & palet warna
    ├── data.js         → karakter/musuh/item/quest/NPC
    ├── engine.js       → renderer Three.js, kamera, siang-malam, input, SFX
    ├── terrain.js      → dunia voxel, bioma, chunk streaming
    ├── entities.js     → player/NPC/musuh voxel + AI
    ├── battle.js       → battle turn-based
    ├── ui.js           → HUD, minimap, dialog, toko, quest tracker
    └── main.js         → game loop, save/load, quest logic
```

### 🚀 Cara menjalankan

File memakai ES modules, jadi butuh server statis kecil (bukan double-click):

```bash
# Opsi 1 — Python
cd app && python -m http.server 8000

# Opsi 2 — Node
cd app && npx serve . -l 8000
```

Lalu buka `http://localhost:8000`. (Versi **index.html** di root tetap bisa dibuka langsung tanpa server — prototipe 2D lama.)

### 🎮 Kontrol

| Tombol | Aksi |
|---|---|
| **WASD / Panah** | Gerak di dunia terbuka |
| **Space** | Lompat |
| **E** | Interaksi: bicara NPC, buka peti, belanja, hadapi boss, waystone |
| **Esc** | Tutup jeda / toko / dialog |
| **F5** | Simpan game (localStorage) |
| **Klik** | Pilih aksi & target battle |

### 🌍 Fitur

- **Dunia voxel 192×192 seamless** — 6 bioma: Kota Valdria, Hutan Verdant, Pegunungan Kristal bersalju, Ashlands, Danau, Pantai
- **Chunk streaming** — hanya render area di sekitar pemain
- **Siklus siang-malam** + awan & bintang bergerak
- **Turn-based battle** — Attack / Skill / Defend / Item / Flee, kritikal & kelemahan elemen, poison
- **7 karakter** bisa direkrut di dunia, **4 di party**
- **Quest chain utama** (Escape → Allies → Dragon → Tyrant) + side quest, **3 ending**
- **Toko, peti harta, waystone simpan-pulih**, musuh & boss voxel beranimasi

## 📁 Struktur Repo

```
├── app/                    # ⭐ Versi 3D pixel (utama, maintenable)
├── index.html              # Prototipe 2D self-contained (referensi desain)
├── game/                   # Source modular prototipe 2D
├── engine/
│   ├── README.md
│   ├── unity/              # Unity C# starter
│   ├── godot/              # Godot 4.x GDScript starter
│   └── unity3d/            # Unity 3D C# (runtime-built scene)
├── railway.json            # Konfigurasi deploy Railway
├── Procfile
└── package.json
```

## ⚙️ Versi Produksi (Engine)

- **Unity (C#)**: `engine/unity/` & `engine/unity3d/`
- **Godot 4.x (GDScript)**: `engine/godot/`

Lihat `engine/README.md` untuk panduan migrasi.

---
*Built with 🤖 Codebuff*
