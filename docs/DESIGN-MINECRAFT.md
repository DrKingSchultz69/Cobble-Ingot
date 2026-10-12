# Netheron: page-by-page design, Minecraft-inspired theme

This is the detailed spec behind the Stitch screens. The goal is **calm for an ADHD brain** (rules in [DESIGN-PROMPT.md](DESIGN-PROMPT.md)), wearing a **blocky, pixel, survival-game look**. It is *inspired by* Minecraft: original pixel art only, with no Mojang logos, textures or fonts copied.

**Theme rule:** the theme decorates, it never replaces words. Every button still says what it does in plain English ("Review", not "Mine it").

---

## 0. Theme kit (used on every page)

### Colours (blocks → meaning)
| Token | Block | Hex | Used for |
|---|---|---|---|
| `bg` | Deepslate | `#1e1e24` | page background |
| `panel` | Stone (dark) | `#2c2c33` | cards and panels |
| `panel-2` | Cobblestone | `#3a3a42` | inputs, rows |
| `bevel-hi` / `bevel-lo` | light / dark edge | `#5a5a64` / `#111114` | 3-D block edges |
| `text` | Snow | `#f2f2f2` | text |
| `muted` | Gravel | `#a0a0a8` | secondary text |
| `primary` | Grass green | `#5fa83a` | the ONE main button per screen |
| `accent` | Diamond | `#4ad9d9` | links, focus, selected tab |
| `ok` | Emerald | `#17c45a` | done |
| `warn` | Gold | `#f5c518` | needs you |
| `bad` | Redstone | `#d93a2b` | failed / stuck |
| `idle` | Amethyst | `#a86ee8` | waiting for your reply |
| `dirt` | Dirt | `#7a5434` | the grass-block strip under the top bar |

### Type
- **Headings:** a pixel font (Press Start 2P / "Pixelify Sans" style), used only for page titles and big numbers so it stays readable.
- **Body:** a clean sans (Lexend: easy to read and ADHD-friendly). **Code and terminals:** JetBrains Mono.

### Shapes
- Square corners, 0–2 px radius.
- Each panel is a "block": a 2 px bevel (light top-left edge, dark bottom-right edge), like an inventory window.
- Buttons are raised stone buttons. They press down 2 px when clicked, and their border turns diamond-cyan on hover.

### Pixel icons (16 px, original art)
| Meaning | Icon |
|---|---|
| needs you in the browser | compass |
| stuck | cobweb |
| failed | redstone torch, off |
| budget reached | gold ingot |
| paused by a limit | clock |
| waiting for your reply | book & quill |
| done | emerald |
| running | lit furnace |
| scheduled | bed / moon |
| remote worker | minecart |
| memory | bookshelf |
| research | spyglass |
| learn | enchanting table |
| usage | chest |
| notifications | bell |

### Components
- **Inventory slot:** a 40 px square sunken box. Used for agent pickers, badges and the item count in a corner (Home tab count).
- **XP bar:** a segmented green bar. Used for every progress/meter: cost so far vs budget, tokens, pipeline step.
- **Hearts / hunger row:** optional, only for budget. 10 gold-ingot pips; each one empty = 10% of the budget used.
- **Sign:** a wooden plank card. Used only for the empty state ("All quiet…").
- **Advancement toast:** top-right, framed, with an icon and two lines ("Task done! / Fix login crash"). Toasts disappear after 6 s.
- **Tooltip:** the dark purple-bordered "item tooltip" style.

### Calm rules in theme form
- No moving textures. The page background is flat deepslate with a very faint 16 px block grid at 4% opacity.
- At most one gold or redstone element per row. The animated "pulse" is only on the Home count when it goes up.
- Agents are shown as **villager-style professions** for fast recognition, by colour and icon only:
  - Claude: librarian (purple robe)
  - Codex: toolsmith (black apron)
  - OpenCode: cartographer (white)
  - Pi: farmer (straw hat)
  - Oh My Pi: fletcher (green)
  - Shell: a plain command block

---

## 1. App frame (every page)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [N] NETHERON   🏠Home(2)  ⛏Workspace  🔭Research  📖Learn  📚Memory  🗃Usage │
│                                   [📁 my-app ▾ ⎇ main]  [👤] [🔔] ● online   │
├▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ grass-block strip (green on top, dirt below, 6 px) ▓▓▓▓▓┤
```
- **Logo:** a pixel "N" block with nether-portal purple sparkles, plus the word NETHERON in the pixel font.
- **View tabs:** hotbar-style slots. The active slot has a thick white frame (like the selected hotbar slot). Home carries a gold item-count number.
- **Right side:**
  - Project picker: a signpost-style dropdown showing the branch.
  - 👤 Accounts, 🔔 bell, and a connection dot (emerald when online, redstone when offline).
- **Phone:** a ☰ button. The tabs become a bottom **hotbar** of 6 slots, which is easier for thumbs.

## 2. Home: "Base camp" (opens first)

**Main action:** ＋ New task (the grass-green button).

```
            NEEDS YOU (3)                         ← pixel font, 24 px
 ┌──────────────────────────────────────────────────────────┐
 │ 🧭  Buy red shoes                              [ Help ]   │ gold edge
 │     Asks for you in the browser: please sign in          │
 ├──────────────────────────────────────────────────────────┤
 │ 🕸  Refactor auth                               [ Fix ]   │ redstone edge
 │     Looks stuck. Hand it off or stop it.                 │
 ├──────────────────────────────────────────────────────────┤
 │ 💎  Fix login crash                           [ Review ]  │ emerald edge
 │     Done. Review the changes.                            │
 └──────────────────────────────────────────────────────────┘
  🔥 3 running · 🛏 1 scheduled · 9 tasks                     ← muted
  ▸ Morning brief (5 things happened overnight)            ← closed
  ▸ Recent alerts (2)                                       ← closed

           [ ＋ NEW TASK ]                                   ← big, grass green
```
- One centred column, max 640 px wide. Plenty of empty deepslate around it is intentional.
- **Rows:**
  - Each row is a stone slab with a 4 px coloured left edge (gold, redstone, emerald or amethyst), a pixel icon, a bold title, one plain sentence and one button.
  - Urgent rows (browser, stuck, failed, budget) get a green primary button; the others get stone buttons.
  - The whole row is clickable.
- **Empty state:** a wooden **sign**: "All quiet. Agents show up here when they need a decision from you." Under it, a tiny pixel campfire. This is the only decoration on the page.
- **Phone:** the same column, full width with 16 px gutters. New task becomes a sticky bottom button above the hotbar.

## 3. New task: "Crafting table" (3-step wizard)

**Main action:** ▶ Start, present on every step.

A modal panel styled like a crafting window (beveled stone, 520 px wide on desktop, a bottom sheet on the phone). On top are 3 **step slots** joined by an arrow, like a crafting recipe:

```
 [ 1 What ✓ ] ──▶ [ 2 Who: Librarian(Claude) · 🧭 ] ──▶ [ 3 Extras: ⏰👥 ]
```
- **Step 1, What:**
  - A big book-and-quill text area: "What should an agent do?"
  - Project picker.
  - Router hint in muted text: "→ Claude Opus · architecture work".
- **Step 2, Who:**
  - Agent picker as a row of 7 **inventory slots**: Auto (an ender-eye "router" icon), then the profession icons; the selected slot is framed in white. Under each slot is a plain-English name. Pi, Oh My Pi and Shell show a small "no browser" mark.
  - Model text field.
  - Account dropdown (only when there are several logins).
  - **Limits:** max $ shown as a row of gold-ingot pips with an editable number, and max minutes as a clock.
  - 🧭 **Browser** toggle, styled like a lever (off/on).
- **Step 3, Extras:** 4 closed **chests**; each opens on click and shows its contents as a mini inventory:
  - ⏰ **When:** now / at a time / after the limit resets; every day.
  - 👥 **Teamwork:** Race & Judge, auto hand-off, Pipeline (Plan → Build → Review).
  - ✅ **Checks:** do nothing / run checks / Budget Dial.
  - ⚙ **Machine & worktree:** own worktree, lean, run on a remote worker (minecart), worktree setup.
  - A closed chest with something switched on shows a small gold number on its lid.
- **Bottom bar:** ← Back · Next → · **▶ START** (green, widest). The button reads **▶ Schedule** when When isn't "now".

## 4. Workspace: "The mine"

**Main action:** depends on the selected task. If it needs you, the banner's button; otherwise none (calm).

```
┌ board 280px ┐┌ terminals ─────────────────────────────┐┌ right panel 380px ┐
│ NEEDS YOU 2 ││ [Fix login ×][Refactor auth ×]  ⊞ split ││ Info Diff Preview🧭│
│ ▢ card      ││ ┌ Fix login · Librarian · XP▰▰▰▱▱ $0.42 ┐││ banner (max 1)    │
│ RUNNING 3   ││ │ terminal (mono, deepslate)            │││ facts (2 columns) │
│ ▢ card      ││ │                                      │││ ▸ Checkpoints     │
│ DONE 4      ││ └──────────────────────────────────────┘││ ▸ Queue           │
│ ▸ more…     ││                                         ││ ▸ Receipt         │
└─────────────┘└─────────────────────────────────────────┘└───────────────────┘
```
- **Board (left):**
  - Columns are section headers with counts, styled like inventory section labels.
  - Each **card** is a stone slab: title, a profession icon with the model, a status icon (furnace, book, emerald, redstone torch), and at most 1 badge.
  - At most 5 cards per column, then "▸ 4 more".
- **Terminals (centre):**
  - Each tab has a profession icon.
  - Each pane header has an **XP bar** that fills with spend vs budget, plus "$0.42 · 12k tok · 6 min".
  - The terminal itself is plain deepslate and monospace; there's no theme inside it, for readability.
- **Code mode:** a toggle "Terminal | Code" (two hotbar slots).
  - Explorer tree: folders shown as chests, files as paper.
  - Editor tabs, Save (book icon), Check code.
  - The conflict bar is a gold sign: "An agent changed this file. [Use theirs] [Keep mine]".
- **Right panel tabs:** Info / Diff / Preview / 🧭 Browser.
  - **Info:**
    - At most **1 banner**, the most urgent. Kinds: compass "needs you in the browser", clock "usage limit, resumes 14:30" [Don't resume][Hand off], cobweb "stuck" [Hand off][Stop], gold ingot "budget reached", TNT-warning "agent deleted 30 lines" [Restore file].
    - Then a 2-column facts list.
    - Actions row: Continue · Hand off · Stop · Remove (Remove is red text only).
    - Then closed sections: Checkpoints (a list of turns with "Restore"), Message queue, Race (contender slots with scores, "Keep winner"), Pipeline (Plan → Build → Review shown as XP segments), Budget Dial ladder, Rules given, Receipt.
  - **Diff:** green and red line backgrounds (emerald / redstone tint), a "● live 14:02" stamp, click-a-line to comment (a sign pops up).
  - **Preview:** port field plus a framed iframe.
  - **🧭 Browser:** see section 5.
- **Phone:**
  - The board is a slide-in sheet (☰); the right panel is a full-screen sheet.
  - The terminal fills the screen, with a **key hotbar** at the bottom: Enter, y, n, Esc, Ctrl+C, ↑, ↓, Tab, Type….

## 5. Browser tab: "Spyglass view"
- **State line:**
  - "Agent is driving" (muted, villager icon), or
  - "**You have control**" (gold), together with [Show window] [Take over] [**Resume**]. Resume is the main action while you drive.
- Address line in mono, muted.
- **Live picture:**
  - Framed like a map item: parchment-coloured border 4 px.
  - While **you** drive, the frame turns gold and gets a small "YOU" tag at the top-left.
- **Phone:** under the picture, a "Type into the page" field + [Send] [Enter].

## 6. Research: "Library"

**Main action:** Ask (or Search in Papers mode).
- Left (stone panel): [New thread], **Threads** list, **Spaces**, styled like bookshelves (one line each).
- **Main:**
  - Mode switch: 2 hotbar slots, **Answers | Papers**.
  - Big search field with a spyglass icon.
  - Answers mode:
    - The question in the pixel font.
    - The answer in readable body text, with small square **citation chips** [1][2] styled as tiny item slots.
    - Below it, **source cards** in a grid (title, domain).
    - Then "Follow up" suggestions as quiet stone buttons.
    - Actions: Send to agent · Save to space.
  - **Papers:** result cards like enchanted books (title, authors · year · citations, abstract in a details element). A top toolbar has the Consensus meter (an XP-bar split yes/mixed/no), and Export BibTeX / RIS / CSV and Save to space in an "Export ▾" menu, so the toolbar stays at 2 buttons.

## 7. Learn: "Enchanting room"

**Main action:** depends on the mode (Ask / Solve / Make quiz).
- Left: **Add documents** (path + Ingest) and **Your documents** as a list of book icons.
- Mode switch with 4 slots: Chat with docs | Solve | Quiz | Question bank.
  - **Chat:** chat bubbles. Yours is a stone slab, the answer is a parchment page.
  - **Solve:** paste a problem; the answer is a numbered list of steps, each with a ✓ when checked.
  - **Quiz:** one question at a time on a parchment card; 4 answer buttons. A right answer flashes emerald, a wrong one redstone, and a small XP bar shows the score.
  - **Question bank:** a table of saved questions with a "Practice" button.

## 8. Memory: "Bookshelf"

**Main action:** Search.
- Left:
  - **Project memory** stats (files, symbols, decisions).
  - [Re-index project].
  - **Add to memory** (title + why + Save).
- **Main:**
  - One big search field: "Search everything agents know: files, symbols, decisions, research…".
  - Mode slots: Recent | Results | Tree | Agent context.
    - **Recent / Results:** rows with a kind icon (paper = file, redstone dust = symbol, book = decision, spyglass = research), title, and source agent profession.
    - **Tree:** chests and paper, foldable.
    - **Agent context:** a mono preview of exactly what an agent receives at start, with a token count on an XP bar.

## 9. Usage: "Chest room" (calmest page)

**Main action:** none. It's a look-only page, plus "Run quality watch" inside its section.
- **Top row:**
  - A time range picker (24 h / 7 d / 30 d slots).
  - **3 big numbers** in the pixel font, each in its own beveled block: spent ($, gold ingot), tokens (XP bottle), tasks (furnace).
- Then **closed chests** (only **Brief** starts open):
  1. **Brief:** what happened, one line per task, with links.
  2. **Alerts:** one row each, with a kind badge as an item slot (gold = limit/budget/billing/cache, redstone = drain/guard/stuck, others muted).
  3. **Spend:** tabs By task / By agent / By login / By model; each is a table with a small XP-bar meter per row.
  4. **Quality watch:** your evals (name, prompt, check command), [Add eval], [**Run quality watch**], and a scores table (models × evals, with emerald/redstone cells).
  5. **Remote workers:** connected Netherons shown as minecart cards (online emerald dot / offline redstone), and a "Connect by link" form.

## 10. Dialogs and menus
- **Project picker** (map-style window):
  - "Clone from GitHub" URL field + [Clone].
  - Or a folder browser: folders are chests; git repos get an emerald "git" tag.
  - [Use this folder] is the main action.
- **Worktree setup:** 4 labelled fields (files to copy, folders to link, setup command, checks command) + Save.
- **Accounts** (👤):
  - Agents grouped as profession rows, each with logins (work / personal) and the project default marked with a star.
  - [Add] and Sign in through a terminal.
- **🔔 Notifications:**
  - A small framed menu: the state (on / muted / blocked) with a bell icon, [Turn on]/[Mute], [Send test], and "Also when Netheron is closed (push)" as a lever.
  - One plain sentence on when notifications appear.

## 11. Screens generated in Stitch
1. Home (desktop): 3 waiting rows.
2. New task wizard, step 2 (desktop).
3. Workspace with a stuck banner (desktop).
4. Browser tab while you drive (desktop).
5. Research: Answers (desktop).
6. Learn: Quiz (desktop).
7. Memory: Recent (desktop).
8. Usage (desktop).
9. Home (phone).

**Stitch project:** https://stitch.withgoogle.com/projects/8708496472629317423 (design system "Netheron Blocks", 9 screens, generated 2026-10-11).
Drift from this spec, to fix before building: Home's button says "New Block" (must say "New task"); Home shows 3 green buttons (spec: Review stays stone, only urgent rows green, New task the main one); every screen got an extra footer bar (not in the spec, remove).
