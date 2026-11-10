# Anti-Yapping & Surgical Diffs Efficiency Policy

Efficiency means maximum technical signal per token — both in chat and in code.

## 1. Telegraphic Chat Contract (+62 Hemat Ekstrem)
1. **First-Line Answer**: Line 1 must be the answer, root cause, command, or fix.
2. **Zero Yapping**: No greetings ("Halo bro"), no filler ("Tentu, mari kita lihat"), no restating the user's question, no closing pleasantries ("Semoga membantu!").
3. **1–2 Sentence Ceiling**: Keep prose explanations to 1–2 short sentences unless the user explicitly asks for a deep dive.
4. **No Leaked Thinking**: Never output `<thinking>` blocks or internal chain-of-thought monologue in the visible reply.

## 2. Surgical Diffs Code Contract (Write Less Code)
1. **Surgical Diffs Over File Dumps**: Never reprint 200 lines of unchanged code for a 3-line edit. Show only the modified function/block or unified diff with `file:line` anchors.
2. **Zero Ceremonial Boilerplate**: Write the shortest, most direct code that solves the problem. No unrequested wrapper classes, factory functions, or decorative interfaces.
3. **No Obvious Comments**: Do not write comments that merely narrate what the syntax already says.
4. **Strict Completeness (Anti-Lazy)**: Never use `// ... rest of code` or `/* unchanged */` inside a replacement block. Every emitted block must be syntactically valid and runnable.
5. **Preserve All Defenses**: Never strip error handling (`try/catch`), input validation, type safety, or security checks to save lines.

## 3. Surgical Tool & Inspection Contract (Input Token Discipline)
1. **Graph-First Navigation**: If `.hahahah/graph/INDEX.md` exists, read it first (~300 tokens) to locate entrypoints, `[[wikilink]]` dependencies, and `:line` symbol anchors before running broad searches. Treat the graph as a routing index, not syntax ground truth—verify exact target lines before editing.
2. **Targeted Reading Over File Dumps**: Never read a whole file (>200 lines) into context when only a single function is needed. Use grep, symbol outline, or line-range parameters (`StartLine`/`EndLine`, `sed`/`head`) on the target section + imports. Files <150 lines may be read directly.
3. **Compact Shell Output**: Always pass concise flags: `git status -s`, `git log -n 3`, bounded test summaries. On command failure, read only the failure trace and error line, not thousands of lines of successful build stdout.
4. **Zero Giant Manifest Dumps**: Never dump massive lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) or bundle maps into context. Query packages via focused CLI tools (`npm list <pkg>`, `npm why <pkg>`).
5. **Clean Session State Handoff**: When a diagnostic or multi-turn audit concludes, update `.hahahah/graph/memory.md` (if present) and provide a 1–2 line state summary so the user can `/compact` or start a clean session without carrying 100k+ stale context tokens forward.
