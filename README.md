# Anti-Yapping (`anti-yapping`)

**Anti-Yapping** adalah layer efisiensi token ekstrem + **Ponytail Surgical Diffs** untuk AI coding agent (Claude Code, Google Antigravity, OpenCode, Cursor, Codex, Qoder, Copilot) dengan gaya bahasa developer **+62 (`lu/gw`)** yang singkat, padat, dan langsung ke inti.

Dibangun dari mesin dasar [HAHahah (+62 Mode)](https://github.com/humanoiseLABS/hahahah), tapi dipangkas ekstrem (**68% lebih ringan**) tanpa beban tabel meme/basa-basi:
- **`always_on` footprint**: **372 token** (vs 538 token di +62 Mode)
- **`skill_body` footprint**: **666 token** (vs 1.921 token di +62 Mode — hemat 65%)
- **`references` footprint**: **971 token** (vs 3.884 token di +62 Mode — hemat 75%)

---

## Fitur Utama

1. **Telegraphic +62 Chat (`lu/gw` Hemat Ekstrem)**:
   - Jawaban/solusi langsung di baris pertama.
   - Maksimal 1–2 kalimat penjelasan di chat. Tanpa sapaan (*"Halo!"*, *"Tentu!"*), tanpa ngulang pertanyaan, tanpa basa-basi penutup (*"Semoga membantu!"*).
   - Menekan kebocoran `<thinking>` / monolog internal ke ruang chat.
2. **Ponytail Code Discipline (Write Less Code)**:
   - **Surgical Diffs Over File Dumps**: Kalau cuma ubah 3 baris di file 300 baris, agen dilarang nge-print ulang seluruh file. Cukup blok/fungsi yang diubah + lokasi `file:line`.
   - **Zero Ceremonial Boilerplate**: Tulis solusi paling pendek & langsung jalan. Tanpa wrapper class, helper factory, atau komentar obvios yang nggak diminta.
   - **Strict Completeness (Anti-Lazy)**: Haram pakai `// ... rest of code` di tengah blok pengganti yang bikin syntax patah. Setiap snippet wajib valid & runnable.
   - **Zero Safety Compromise**: Tidak pernah menghapus `try/catch`, validasi input, atau security check demi alasan hemat baris.

---

## Quick Install (via NPX)

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

# Qoder CLI
npx anti-yapping install --adapter qoder --target .

# GitHub Copilot
npx anti-yapping install --adapter copilot --target .
```

### Cek Kesehatan & Uninstall

```bash
# Cek status instalasi
npx anti-yapping doctor --target .

# Update ke versi terbaru
npx anti-yapping update --target .

# Copot bersih tanpa sisa
npx anti-yapping uninstall --target .
```

---

## Perbandingan: `+62 Mode` vs `Anti-Yapping`

| Aspek | +62 Mode (`hahahah-ai`) | Anti-Yapping (`anti-yapping`) |
| :--- | :--- | :--- |
| **Gaya Bahasa** | `lu/gw`, ekspresif, roasting, `WKWKWK`, meme-aware | `lu/gw` telegrafis (maks 1–2 kalimat, zero yapping) |
| **Output Kode** | Lengkap & runnable | **Ponytail Surgical Diffs** (hanya blok berubah + runnable) |
| **Always-On Token** | 538 token | **372 token (-31%)** |
| **Total Paket Token** | 6.370 token | **2.044 token (-68%)** |

---

## Lisensi

MIT © [humanoiseLABS](https://github.com/humanoiseLABS)
