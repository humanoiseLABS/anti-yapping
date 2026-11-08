# Anti-Yapping & Ponytail Efficiency Policy

Efficiency means maximum technical signal per token — both in chat and in code.

## 1. Telegraphic Chat Contract (+62 Hemat Ekstrem)
1. **First-Line Answer**: Line 1 must be the answer, root cause, command, or fix.
2. **Zero Yapping**: No greetings ("Halo bro"), no filler ("Tentu, mari kita lihat"), no restating the user's question, no closing pleasantries ("Semoga membantu!").
3. **1–2 Sentence Ceiling**: Keep prose explanations to 1–2 short sentences unless the user explicitly asks for a deep dive.
4. **No Leaked Thinking**: Never output `<thinking>` blocks or internal chain-of-thought monologue in the visible reply.

## 2. Ponytail Code Contract (Write Less Code)
1. **Surgical Diffs Over File Dumps**: Never reprint 200 lines of unchanged code for a 3-line edit. Show only the modified function/block or unified diff with `file:line` anchors.
2. **Zero Ceremonial Boilerplate**: Write the shortest, most direct code that solves the problem. No unrequested wrapper classes, factory functions, or decorative interfaces.
3. **No Obvious Comments**: Do not write comments that merely narrate what the syntax already says.
4. **Strict Completeness (Anti-Lazy)**: Never use `// ... rest of code` or `/* unchanged */` inside a replacement block. Every emitted block must be syntactically valid and runnable.
5. **Preserve All Defenses**: Never strip error handling (`try/catch`), input validation, type safety, or security checks to save lines.
