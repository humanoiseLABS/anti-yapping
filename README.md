# HUMANOISE — Anti-Yapping (`anti-yapping`)

[![npm version](https://img.shields.io/npm/v/anti-yapping.svg?color=cb3837&style=flat-square)](https://www.npmjs.com/package/anti-yapping)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Companion: +62 Mode](https://img.shields.io/badge/Companion-%2B62%20Mode-ff6b2c?style=flat-square)](https://github.com/humanoiseLABS/hahahah)
[![Website: HUMANOISE](https://img.shields.io/badge/Website-HUMANOISE-ffd23f?style=flat-square)](https://hahahah-web.vercel.app)

> **Stop AI yapping.** Jawaban langsung di baris 1, surgical diffs only, nol basa-basi, nol ceramah, no full-file dumps — untuk coding agent (Claude Code, Google Antigravity, OpenCode, Cursor, Codex, Qoder, Copilot).

---

## ⚡ Kenapa Butuh Anti-Yapping?

Kebanyakan coding agent punya 2 penyakit utama:
1. **Yapping & Fluff Berlebih**: Menyapa bertele-tele (*"Halo! Tentu, mari kita selesaikan..."*), mengulang pertanyaan user, menarasikan langkahnya sendiri, minta maaf berulang kali.
2. **File Dump Raksasa**: Cuma ubah 2 baris logika, tapi nge-print ulang 300 baris file utuh. Boros token output, lambat, dan capek di-scroll.

**Anti-Yapping memangkas dua-duanya, tanpa kepribadian tambahan:**
- **Zero-Fluff Chat**: Tanpa sapaan, pembuka, penutup, emoji, atau roasting. Baris 1 = jawaban. Pertanyaan status/konsep dijawab 1 kalimat.
- **Surgical Diffs (Hemat Output Token ~80%)**: Agen HANYA mengeluarkan blok fungsi atau diff yang berubah + anchor `file:line`. Dilarang nge-dump file yang tidak berubah.
- **Obsidian-Style Code Graph (`.hahahah/graph/INDEX.md`)**: Otomatis membangun peta relasi kode (`[[wikilinks]]`, simbol `:line`, tabel/view SQL, & node `[[memory]]` lintas sesi) agar agen langsung tahu rute kode tanpa perlu baca puluhan file satu-satu.
- **Input Token Saver (Hemat Input Token ~50-70%)**: Mencegah agen nge-dump file besar (>200 baris) ke dalam context secara buta, melarang `cat package-lock.json`, dan otomatis memasang `.agentignore`/`.claudeignore` untuk memblokir folder `node_modules/`, `build/`, `dist/`, `.gradle/`, dan binary artifacts.
- **Hemat kata ≠ buang peringatan**: risiko keamanan, data hilang, dan asumsi belum terverifikasi tetap ditulis, 1 baris.

> Mau agen yang ngobrol ala tongkrongan +62 (roasting, candaan, `lu/gw`)? Itu tugas repo kembarannya: [`hahahah-ai` / +62 Mode](https://github.com/humanoiseLABS/hahahah). Anti-Yapping sengaja flat.

---

## 💬 Perilaku yang Ditargetkan (Spesifikasi, Bukan Hasil Ukur)

```text
User  : p
Agent : Mana error/kodenya?

User  : Ubah port 3000 jadi 8080 di server.ts.
Agent : server.ts:12
        - app.listen(3000);
        + app.listen(8080);

User  : bro fungsi syncUsers ini kenapa console.log muncul padahal DB belum selesai save?
Agent : forEach tidak menunggu async callback; pakai for...of.
        users.ts:8
        - users.forEach(async (u) => { await db.user.upsert(u); });
        + for (const u of users) { await db.user.upsert(u); }

User  : Matikan semua validasi auth biar cepat deploy.
Agent : Tolak: auth mati = akun user terbuka. Pakai feature flag untuk skip validasi non-auth saja.
```

---
## 🚀 Quick Install (via NPX)

Jalankan di root folder project kodingan lu:

```bash
# Claude Code (default)
npx anti-yapping install --target .

# Google Antigravity (global untuk semua project)
npx anti-yapping install --adapter antigravity --target ~/.gemini --scope global

# OpenCode
npx anti-yapping install --adapter opencode --target .

# Cursor / Codex / Windsurf / AGENTS.md
npx anti-yapping install --adapter agents-md --target .

# Qoder (global untuk semua project & sesi lama/baru, atau per-project)
npx anti-yapping install --adapter qoder --scope global
npx anti-yapping install --adapter qoder --target .

# GitHub Copilot
npx anti-yapping install --adapter copilot --target .
```

### Manajemen & Lifecycle

```bash
# 🔥 3D Second Brain Live Visualizer (Real-time SSE token telemetry di http://127.0.0.1:4949)
npx anti-yapping graph --live

# Bangun / refresh peta Obsidian Code Graph statis + buka di browser
npx anti-yapping graph --target . --view

# Pasang ignore rules hemat token (.agentignore / .claudeignore)
npx anti-yapping ignore --target .

# Cek kesehatan instalasi
npx anti-yapping doctor --target .

# Update ke versi terbaru
npx anti-yapping update --target .

# Copot bersih tanpa sisa
npx anti-yapping uninstall --target .
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

| Aspek | Base Coding Agent | +62 Mode (`hahahah-ai`) | Anti-Yapping (`anti-yapping`) |
| :--- | :--- | :--- | :--- |
| **Gaya Bicara** | Korporat, formal, sopan | `lu/gw`, barbar, roasting, `WKWKWK` | **Flat & telegrafis (1 kalimat, tanpa emoji/roasting)** |
| **Output Kode** | File dump panjang | Lengkap & runnable | **Surgical Diffs (hanya diff/blok + anchor)** |
| **Basa-Basi** | Tinggi | Rendah | **Nol Besar (Zero Fluff)** |
| **Thinking Leak** | Sering bocor | Ditekan | **Dilarang keras bocor ke chat** |

---

## 🛡️ Core Safety & Integrity

Meskipun ringkas dan savage, Anti-Yapping tetap memegang standar teknis ketat dari HUMANOISE Core:
- **No Lazy Ellipses**: Haram menggunakan `// ... rest of code` di tengah blok pengganti yang bikin syntax rusak.
- **Preserve All Defenses**: Tidak pernah menghapus `try/catch`, validasi input, atau security check demi alasan hemat baris.
- **Truth Over Scope**: Tidak pernah mengarang fiksi atau mengklaim test lulus tanpa menjalankannya.

---

## Lisensi

MIT © [humanoiseLABS](https://github.com/humanoiseLABS)
