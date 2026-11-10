# ⚡ token-maxxing (`token-maxxing` / `tmx`)

[![npm version](https://img.shields.io/npm/v/token-maxxing.svg?color=cb3837&style=flat-square)](https://www.npmjs.com/package/token-maxxing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Companion: +62 Mode](https://img.shields.io/badge/Companion-%2B62%20Mode-ff6b2c?style=flat-square)](https://github.com/humanoiseLABS/hahahah)
[![Website: HUMANOISE](https://img.shields.io/badge/Website-HUMANOISE-ffd23f?style=flat-square)](https://hahahah-web.vercel.app)

> **Stop yapping. Start token-maxxing.**  
> Min-maxing your AI coding context. Persistent Second Brain memory, surgical code diffs, input token shields, and real-time 3D neural telemetry for AI coding agents (Claude Code, Google Antigravity, OpenCode, Cursor, Codex, Qoder, Copilot).

---

## ⚡ 3 Pilar Utama Token-Maxxing

Kebanyakan coding agent punya penyakit kritis: **boros token, gampang amnesia konteks, dan suka nulis ulang 500 baris file cuma buat benerin 1 typo.**

`token-maxxing` memangkas pemborosan itu lewat 3 pilar:

1. **🧠 Second Brain (`.hahahah/graph/INDEX.md` & `memory.md`)**:
   Peta arsitektur codebase lokal di luar context window. Agen langsung tahu rute file dan simbol AST via `[[wikilinks]]` tanpa perlu membaca puluhan file berulang kali. **Hemat input token 60–80%.**
2. **⚡ Smart Surgical Diffs**:
   Operasi kode presisi level dokter bedah. Agen hanya mengeluarkan diff baris yang berubah (`Function:Line`) tanpa me-rewrite file utuh. **Hemat output token hingga 80%.**
3. **🔴 3D Neural Telemetry HUD (`--live`)**:
   Visualizer 3D real-time 60 FPS HTML5 Canvas di port `4949`. Memantau ritme kognitif AI (*Cognitive Wave Dynamics*), semburan laser crimson saat berpikir, dan aliran token delta (`Δ+18 tok`, throughput `154 tok/s`).

---

## 🚀 Quick Start

### 1. Pasang Global (Rekomendasi)
```bash
npm install -g token-maxxing
# atau gunakan alias cepat: tmx
```

### 2. Pasang ke Proyek Coding
Jalankan di folder proyek yang sedang dikerjakan:

```bash
# Untuk Claude Code
tmx install --adapter claude-code

# Untuk Google Antigravity
tmx install --adapter antigravity --scope global

# Untuk Cursor / OpenCode / Windsurf
tmx install --adapter agents-md
```

*(Catatan: command legacy `npx anti-yapping install` tetap didukung penuh untuk backward compatibility).*

---

## 🛠️ Perintah & Lifecycle

```bash
# 🔥 3D Neural Second Brain Telemetry HUD (Real-time di http://127.0.0.1:4949)
tmx graph --live

# Bangun / refresh peta visualisasi Code Graph statis
tmx graph --target . --view

# Pasang ignore rules hemat token (.agentignore / .claudeignore)
tmx ignore --target .

# Cek kesehatan instalasi
tmx doctor --target .

# Update ke versi terbaru
tmx update --target .

# Copot bersih tanpa sisa
tmx uninstall --target .
```

---

## 🧠 3D Neural Second Brain (`--live`)

Visualizer 3D real-time berkecepatan 60 FPS murni HTML5 Canvas tanpa dependency berat:
* **`memory.md` Nucleus:** Inti hijau emerald berdenyut di tengah bola ($r \approx 0.18$), menyimpan memori stateful permanen lintas sesi (~68 token).
* **360° Global Cortex Lattice:** Ratusan benang halus keperakan (*trans-spherical chords*) yang menusuk silang-menyilang di dalam ruang 3D.
* **Cognitive Wave Dynamics:** Ritme bernapas organik—tenang saat idle, dan **meledak mendadak (15–25 laser crimson)** saat token diproses atau file disentuh AI.
* **Live SSE Telemetry:** Terkoneksi langsung ke file-watcher lokal untuk mengukur delta token (`Δ+18 tok`), throughput (`154 tok/s`), dan penelusuran AST symbol.
* **Interactive Terminal Console:** Dilengkapi prompt pencarian AST simbol, memory inspection, dan stream pemikiran typewriter.

---

## ⚡ Smart Surgical Diffs & AST Precision Anchoring

* **Line 1 Telegraphic Answers:** Langsung solusi di baris 1 tanpa salam, sapaan pembuka, atau basa-basi korporat.
* **Precision AST Anchors:** Mengunci baris operasi menggunakan simbol (`Function:Line`) agar operasi hanya menyentuh bagian yang perlu diubah.
* **Zero Full-File Dumps:** Dilarang me-reprint file utuh; hanya mengeluarkan diff bersih (+/- baris).
* **Input Token Saver:** Otomatis memasang aturan `.agentignore` untuk memblokir lockfiles, sourcemaps, dan build artifacts agar tidak membengkakkan context window. Hemat **70–80% token** total.

---

## 📊 Perbandingan Arsitektur

| Aspek | Base Coding Agent | +62 Mode (`hahahah-ai`) | Token-Maxxing (`token-maxxing` / `tmx`) |
| :--- | :--- | :--- | :--- |
| **Fokus Utama** | Standard assistant | Personality & Roasting | **Context & Token Optimization (Zero Yap)** |
| **Gaya Bicara** | Korporat, formal, sopan | `lu/gw`, barbar, roasting, `WKWKWK` | **Flat & telegrafis (1 kalimat, tanpa basa-basi)** |
| **Output Kode** | File dump panjang | Lengkap & runnable | **Surgical Diffs (hanya diff/blok + anchor)** |
| **Penyimpanan Memori**| Context window fana | Context window fana | **Second Brain Stateful (`memory.md` & `INDEX.md`)** |
| **Visualisasi** | Teks biasa | Teks biasa | **3D Real-time Neural Sphere HUD (Port 4949)** |

---

## 🛡️ Core Safety & Integrity

Meskipun ringkas dan savage, Token-Maxxing tetap memegang standar teknis ketat dari HUMANOISE Core:
- **No Lazy Ellipses**: Haram menggunakan `// ... rest of code` di tengah blok pengganti yang bikin syntax rusak.
- **Preserve All Defenses**: Tidak pernah menghapus `try/catch`, validasi input, atau security check demi alasan hemat baris.
- **Truth Over Scope**: Tidak pernah mengarang fiksi atau mengklaim test lulus tanpa menjalankannya.

---

## Lisensi

MIT © [humanoiseLABS](https://github.com/humanoiseLABS)
