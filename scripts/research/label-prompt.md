# Prompt: label the auto-collected rows (for Codex, Claude or any agent)

Copy everything below the line into the agent, run from the project folder. Use **one agent at a time** on `pain-log.csv`.

---

You are labeling research evidence in `docs/research/pain-log.csv` (UTF-8 CSV with a BOM). Read `docs/research/README.md`, `docs/research/roles-and-tools.md` and `docs/research/synthesis.md` first for the meaning of each column, the role IDs, the tool IDs and the theme IDs.

For every row where `collected_by` is `auto` and `pain_summary` is empty:

1. **pain_summary**: one neutral line describing the underlying problem, not the tool's feature name. Example: "Agent forgets earlier decisions after the context is compacted".
2. **role**: a role ID **only if the quote clearly says or shows it** (e.g. "as a designer…", a Terraform file means `devops`/`cloud`). Otherwise keep `?`. Never guess from the tool alone.
3. **theme**: 1–2 theme IDs from synthesis.md, separated by `|`. If none fits, write a short new lowercase ID; the human decides later whether it's real.
4. **severity_1to5**: use the scale in README.md. Data loss, security risk, or money lost = 4–5. Annoyance = 1–2.
5. **workaround_they_use**: only if the quote states one. Otherwise leave it empty.
6. **netheron_idea**: optional. A short idea only if obvious; otherwise leave it empty.

Hard rules:
- **Never change** `id`, `date_found`, `tool`, `source_type`, `link`, `quote`, `agree_count`, `notes`, `collected_by`. A checker compares them with the raw GitHub copy and will flag any edit.
- **Never set `verified` to `yes`.** Only the human does that.
- Don't add or delete rows.
- If the quote isn't a real problem (spam, question already answered, pure feature idea with no pain), set `theme` to `not-a-pain` and severity to `1`.
- Work in batches of about 50 rows. After each batch, run `node scripts/research/check-log.mjs` and fix any errors it reports.

When finished, report: rows labeled, themes used (with counts), new theme IDs you created, and anything that looked strange.
