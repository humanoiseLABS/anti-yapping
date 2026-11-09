# HUMANOISE — Anti-Yapping (`anti-yapping`)

[![npm version](https://img.shields.io/npm/v/anti-yapping.svg?color=cb3837&style=flat-square)](https://www.npmjs.com/package/anti-yapping)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Companion: +62 Mode](https://img.shields.io/badge/Companion-%2B62%20Mode-ff6b2c?style=flat-square)](https://github.com/humanoiseLABS/hahahah)
[![Website: HUMANOISE](https://img.shields.io/badge/Website-HUMANOISE-ffd23f?style=flat-square)](https://hahahah-web.vercel.app)

> **Stop AI yapping.** Direct answers on line 1, surgical diffs only, no full-file dumps, and authentic +62 developer communication for coding agents (Claude Code, Google Antigravity, OpenCode, Cursor, Codex, Qoder, Copilot).

---

## ⚡ Kenapa Butuh Anti-Yapping?

Kebanyakan coding agent saat ini punya 2 penyakit utama:
1. **Yapping & Fluff Berlebih**: Suka menyapa bertele-tele (*"Halo! Tentu, mari kita selesaikan..."*), mengulang-ulang pertanyaan user, dan minta maaf berulang kali kayak bot customer service.
2. **File Dump Raksasa**: Cuma ubah 2 baris logika, tapi nekat nge-print ulang 300 baris file utuh. Boros token output, lambat, dan capek di-scroll.

**Anti-Yapping memangkas dua-duanya:**
- **Chat Telegrafis**: Maksimal 1–2 kalimat pendek. Baris 1 wajib reaksi + akar masalah/solusi.
- **Ponytail Surgical Diffs**: Agen HANYA boleh mengeluarkan blok fungsi atau diff yang berubah + anchor `file:line`. Dilarang keras nge-dump file yang tidak berubah — **memangkas hingga ~80% output token** saat edit kode (output token harganya 3x–5x lebih mahal dari input token).

---

## 💬 Live Showcase (Uji Nyata Lapangan)

### 1. Anti-Bot & Tongkrongan +62 (Zero Pick-Me)
```text
User  : woy su
Agent : Woy. Mau ngapain? Spill error/kodenya.

User  : bayarin utang gw nih
Agent : Enak aja kocak, lu kira gw pinjol 💀

User  : jahat
Agent : Jahat itu gratis, utang lu yang gak 💀

User  : sekarang gw mau ngomong serius
Agent : Nah gitu. Mau bahas apa? Spill.
```

### 2. Kodingan: Direct Root Cause & Surgical Fix
```text
User  : bro fungsi syncUsers ini kenapa console.log udah muncul padahal DB belum selesai save?
Agent : forEach gak nunggu async callback — promise-nya dibuang, jadi console.log jalan duluan. 
        Pakai for...of (sekuensial) atau Promise.all(map) (paralel).

        Sekuensial (aman buat email):
        async function syncUsers(users) {
          for (const u of users) {
            await db.user.upsert({ where: { id: u.id }, create: u, update: u });
            await sendWelcomeEmail(u.email);
          }
          console.log("Semua user berhasil di-sync!");
        }

        Kalau mau paralel, Promise.all tapi email bisa kena rate-limit provider — 
        lebih baik sekuensial atau batasi concurrency.
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
# Cek kesehatan instalasi
npx anti-yapping doctor --target .

# Update ke versi terbaru
npx anti-yapping update --target .

# Copot bersih tanpa sisa
npx anti-yapping uninstall --target .
```

---

## 📊 Perbandingan Arsitektur

| Aspek | Base Coding Agent | +62 Mode (`hahahah-ai`) | Anti-Yapping (`anti-yapping`) |
| :--- | :--- | :--- | :--- |
| **Gaya Bicara** | Korporat, formal, sopan | `lu/gw`, barbar, roasting, `WKWKWK` | **`lu/gw` telegrafis (maks 1–2 kalimat, zero yapping)** |
| **Output Kode** | File dump panjang | Lengkap & runnable | **Ponytail Surgical Diffs (hanya diff/blok + anchor)** |
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
