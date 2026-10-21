# Manual check: 2026-10-20 (overnight work)

Tick each box as you go. If something is wrong, write what you saw next to it.

**Start:** double-click `dist\Netheron\Netheron.exe` (or `npm run serve` and open the `workspace` link).

## 1. Boxy skin (B-046, B-048)
- [ ] ⚙ (bottom of the sidebar) opens the Look menu **fully**, not cut off
- [ ] Skin → **Boxy**: square corners, solid panels, no glow; network and embers still move
- [ ] Skin → **Relay**: rounded and glassy again (your old look)
- [ ] Reload the page: the skin you picked stays, no flash of the other one
- [ ] Colours → Light and Dark both readable in Boxy
- [ ] Phone (or a narrow window): ⚙ menu opens **above** the page, not behind it

## 2. + terminals (B-047)
- [ ] Workspace → open a task → **+** right after the tabs → menu says "in <folder>"
- [ ] **cmd** opens in that task's folder (type `cd` to see it)
- [ ] **PowerShell** opens; `Write-Host hi -ForegroundColor Green` shows Netheron's green
- [ ] **Claude Code**, **Codex**, **OpenCode** start signed in as you (only the ones you have installed)
- [ ] The network shows faintly behind the terminal; text easy to read
- [ ] Open 4–5 tabs: **+** and Terminal / Code / Split stay visible
- [ ] Close a terminal's tab (×): it ends and doesn't come back after a reload
- [ ] With no task open, + uses the project folder from the sidebar

## 3. Make it a task (B-047, defaults picked overnight)
- [ ] Click a + terminal's tab → Info → name it → **Make it a task**
- [ ] Same program keeps running, earlier output still there
- [ ] It now shows on Home / Board
- [ ] Decide: keep these defaults? (same folder, no new worktree; no shared memory for a terminal started bare)

## 4. Still yours to decide (not built)
- Council of agents · all-agent sessions hub · phone access · task rename · mobile app (try the phone web app first)

Automated, already run overnight: `npm test` 121/121 · `node scripts/check-all.ts` 51/51.
